# 登录前后端链路阅读指南

这份文档只讲当前项目的登录、鉴权、退出登录逻辑。以后想看登录逻辑，先看这份，再按下面的文件顺序回到代码里跟。

## 先看哪里

推荐阅读顺序：

1. `pages/login.vue`：登录页面，表单提交入口。
2. `composables/use-auth.ts`：登录、获取当前用户、退出登录这些认证用例。
3. `utils/api/auth.ts`：前端认证 API 层，负责发登录、getInfo、退出请求。
4. `server/api/login.post.ts`：后端登录接口，读取密码并创建 session。
5. `server/services/users.ts`：查询 MySQL 用户，用 bcrypt 校验密码。
6. `server/services/auth.ts`：Redis session、cookie 名、公开 API 白名单。
7. `server/middleware/auth.ts`：服务端 API 真实鉴权。
8. `middleware/auth.global.ts`：前端页面访问拦截，并用本地权限快照校验页面。

## 当前架构决策

- 项目结构：沿用当前 Nuxt 学习项目的分层，不额外抽复杂模块。
- API client：前端使用 `utils/api/*` 封装 `$fetch`，页面不直接拼接口细节。
- 登录态：`POST /api/login` 返回 token；当前 Nuxt SSR 学习项目同时写入 `httpOnly cookie`，方便刷新页面时服务端恢复登录态。
- 密码传输：依赖 HTTPS；前端提交 `password`，后端只用 bcrypt 校验数据库里的哈希。
- getInfo：只有 `/api/me` 返回 `user`、`routes`、`buttons`；路由和按钮权限都来自后端权限表。
- 权限边界：页面 middleware 负责跳转体验，服务端 middleware 和接口判断负责真正安全。

## 登录完整流程

```text
pages/login.vue
  用户填写 username/password，点击登录
  |
  | authActions.login(form)
  v
composables/use-auth.ts
  组织登录用例，调用 loginApi()
  |
  v
utils/api/auth.ts
  组装 { username, password }
  |
  v
POST /api/login
  body: { username, password }
  |
  v
server/api/login.post.ts
  findUserByCredentials(username, password)
  |
  v
server/services/users.ts
  prisma.user.findUnique({ username })
  bcrypt.compare(password, user.passwordHash)
  |
  v
server/services/auth.ts
  createAuthSession(username)
  Redis 写入 nuxt-admin:session:<token>
  |
  v
server/api/login.post.ts
  setCookie("nuxt-admin-token", token, { httpOnly: true })
  return { code: 200, message, data: { token } }
  |
  v
composables/use-auth.ts
  fetchCurrentUser({ force: true, token })
  GET /api/me
  authStore.setAuthInfo(getInfo)
  |
  v
pages/login.vue
  navigateTo(redirect 或 /dashboard)
```

重点记住：

- 请求体直接提交 `password`，传输安全交给 HTTPS。
- 后端拿到的密码只在本次请求内存里使用。
- 数据库里的 `users.password_hash` 仍然是 bcrypt 哈希。
- token 由登录接口返回；为了 SSR 刷新恢复登录态，也会写入 `httpOnly cookie`。
- 菜单、页面路由和按钮权限只从 getInfo 返回，登录成功后要带 login 返回的 token 再请求 `/api/me`。

## 登录页负责什么

文件：`pages/login.vue`

它只做页面相关的事：

- 显示用户名和密码输入框。
- 做基础表单校验。
- 调用 `authActions.login(form)`。
- 登录成功后跳转到 `redirect`，没有 `redirect` 就跳 `/dashboard`。
- 登录失败时显示错误提示。

它不负责：

- 不直接 `$fetch('/api/login')`。
- 不加密密码。
- 不保存 token。
- 不直接写 Redis 或 cookie。

## useAuth 负责什么

文件：`composables/use-auth.ts`

它是认证用例层：

- `login(form)`：调用 `loginApi(form)` 拿 token，成功后带 token 强制调用 `/api/me`，把 getInfo 写入 Pinia。
- `fetchCurrentUser()`：调用 `/api/me`，成功后更新用户和权限快照；401 时清空用户。
- `logout()`：调用后端退出接口，清空用户和页面标签，跳回登录页。

这个文件连接“页面”和“API client”，但不关心后端怎么查数据库。

## 前端 API 层负责什么

文件：`utils/api/auth.ts`

它是前端请求封装层：

- `loginApi(form)`：把页面表单转换成接口请求体。
- 最终提交的是 `{ username, password }`。
- 后端统一返回 `{ code, message, data }`，API client 会解包 `data`，所以 `loginApi(form)` 对外仍然返回 `{ token }`。
- `fetchMeApi()`：请求 `/api/me`，登录后可带 `Authorization: Bearer <token>`；SSR 刷新时通过 `useRequestFetch()` 转发 cookie。
- `logoutApi()`：请求 `/api/logout`。
- `isUnauthorizedError()`：统一判断 401，给 middleware 和 composable 使用。

这里是前端登录请求的关键边界：页面和请求层只负责提交登录信息，不保存 token，不碰数据库。

## 密码校验怎么走

传输层依赖 HTTPS，应用层不再做前端 RSA 加密：

```text
前端 POST /api/login { username, password }
  |
server/api/login.post.ts
  |
server/services/users.ts
  |
  | bcrypt.compare(password, user.passwordHash)
  v
返回 { code: 200, message, data: { token } }
```

数据库仍然只保存 `password_hash`，不能保存明文密码。

## 后端登录接口负责什么

文件：`server/api/login.post.ts`

它是登录接口入口：

1. `readBody()` 读取 `username` 和 `password`。
2. 调用 `findUserByCredentials()` 查询用户并校验密码。
3. 调用 `createAuthSession()` 创建 Redis session。
4. `setCookie()` 写入 `httpOnly cookie`。
5. 返回本次登录生成的 `token`。

它不做：

- 不返回 `user`、`routes`、`buttons`，这些只由 `/api/me` 返回。
- 不返回 `passwordHash`。
- 不把请求里的密码写入数据库。

## 用户校验负责什么

文件：`server/services/users.ts`

登录时用的是：

```ts
findUserByCredentials(username, password)
```

它做两件事：

- 用 Prisma 从 MySQL `users` 表按 `username` 查用户。
- 用 `bcrypt.compare(password, user.passwordHash)` 做 bcrypt 比较。

这里的 `password` 是本次 HTTPS 请求里的密码。数据库里保存的是 `passwordHash`，不是明文密码。

## Redis session 负责什么

文件：`server/services/auth.ts`

登录成功后：

```text
createAuthSession(username)
  -> 生成随机 token
  -> Redis 保存 token -> { username, createdAt }
  -> 返回 token 给 login.post.ts 写入 cookie
```

Redis key 大概长这样：

```text
nuxt-admin:session:<token>
```

浏览器 cookie 里只保存 token：

```text
nuxt-admin-token=<token>
```

前端 JavaScript 不能读取这个 cookie，因为它是 `httpOnly`。

## 服务端 API 鉴权负责什么

文件：`server/middleware/auth.ts`

它保护所有 `/api` 接口，除了白名单：

```text
/api/login
/api/logout
```

每次请求后端接口时：

1. 优先从 `Authorization: Bearer <token>` 取 token，没有时再从 cookie 取 `nuxt-admin-token`。
2. 用 token 去 Redis 查 username。
3. 查不到就返回 401。
4. 查到 username 后，再去 MySQL 查当前用户。
5. 用户存在，就写入 `event.context.currentUser`。
6. 后面的 API 可以直接用 `event.context.currentUser` 判断权限或写业务数据。

这是服务端真实安全边界。不能只靠前端隐藏菜单。

## 页面 middleware 负责什么

文件：`middleware/auth.global.ts`

它负责页面跳转体验：

- 未登录访问后台页面，跳到 `/login?redirect=原页面`。
- 已登录访问 `/login`，跳到 `/dashboard` 或 redirect。
- 已登录访问后台页面时，用 `/api/me` 返回并缓存在 `stores/auth.ts` 里的 `routes` 做本地页面权限校验。
- SSR 阶段请求 `/api/me` 时使用 `useRequestFetch()` 转发 cookie。

注意：这里不再每次页面跳转都请求页面权限接口。页面路由配置和按钮权限都来自 `/api/me`；登录成功后带 login token 请求一次，刷新页面时 store 重新初始化并通过 cookie 重新请求 getInfo，因此权限表变更后刷新即可生效。

它和 `server/middleware/auth.ts` 的区别：

```text
middleware/auth.global.ts
  页面层：负责跳转、体验、页面权限提示

server/middleware/auth.ts
  服务端接口层：负责真正保护 API 和解析 currentUser
```

## 获取当前用户流程

页面刷新、直接访问后台页面、后台布局读取用户时，会走：

```text
middleware/auth.global.ts 或 layouts/admin.vue
  |
  | authActions.fetchCurrentUser()
  v
composables/use-auth.ts
  |
  | fetchMeApi()
  v
utils/api/auth.ts
  |
  | GET /api/me
  v
server/middleware/auth.ts
  |
  | cookie token -> Redis username -> MySQL user
  v
server/api/me.get.ts
  |
  | return { user, routes, buttons }
  v
authStore.setAuthInfo(result)
```

如果 `/api/me` 返回 401：

- `fetchCurrentUser()` 会清空 Pinia 用户。
- 页面 middleware 会跳回登录页。

## 退出登录流程

```text
layouts/admin.vue
  点击退出
  |
  | authActions.logout()
  v
composables/use-auth.ts
  |
  | logoutApi()
  v
POST /api/logout
  |
  v
server/api/logout.post.ts
  |
  | getCookie("nuxt-admin-token")
  | deleteAuthSession(token)
  | deleteCookie("nuxt-admin-token")
  v
composables/use-auth.ts
  |
  | authStore.clearUser()
  | pageTabsStore.clearTabs()
  | navigateTo('/login')
```

退出登录会同时清理两边：

- 服务端：Redis session 删除。
- 浏览器：cookie 删除。
- 前端状态：Pinia 用户和页面标签清空。

## 最容易混淆的点

### 1. HTTPS 和密码哈希不是一回事

```text
HTTPS
  解决：传输过程不被明文窃听

后端 bcrypt 哈希
  解决：数据库不要保存明文密码
```

当前项目采用标准后台链路：HTTPS 负责传输安全，bcrypt 负责落库安全。

### 2. cookie 和 Redis session 是一组

浏览器只保存 token，Redis 保存 token 对应的 username。

```text
cookie: nuxt-admin-token=<token>
Redis:  nuxt-admin:session:<token> -> { username, createdAt }
```

### 3. 前端 store 不发请求

`stores/auth.ts` 只保存状态。

真正请求在：

```text
composables/use-auth.ts
utils/api/auth.ts
```

### 4. 页面拦截不是服务端鉴权

页面 middleware 只能改善体验。真正安全必须在服务端接口里做。

当前项目已经用 `server/middleware/auth.ts` 统一保护 `/api`。

## 调试时从哪里下手

登录失败时，按这个顺序查：

1. `pages/login.vue`：表单有没有触发 `handleLogin()`。
2. `utils/api/auth.ts`：请求 body 是否是 `{ username, password }`。
3. `server/api/login.post.ts`：是否正确读取 username/password。
4. `server/services/users.ts`：数据库里有没有这个用户，bcrypt 是否匹配。
5. `server/services/auth.ts`：Redis 是否启动，session 是否写入。
6. 浏览器开发者工具：响应头里是否有 `Set-Cookie`。
7. `server/middleware/auth.ts`：后续 `/api/me` 能不能从 Redis 解析出用户。

## 当前你最该看的代码

如果只想快速掌握一遍，不要从所有文件开始，按这个最短路径看：

```text
pages/login.vue
  -> composables/use-auth.ts
  -> utils/api/auth.ts
  -> server/api/login.post.ts
  -> server/services/users.ts
  -> server/services/auth.ts
  -> server/middleware/auth.ts
```

看完这条线，就能理解当前项目登录的主链路。
