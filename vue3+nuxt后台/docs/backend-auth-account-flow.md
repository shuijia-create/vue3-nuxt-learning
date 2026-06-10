# 后端登录、Token 和账号创建逻辑

这份文档只解释当前项目后端里和“登录、token、账号创建、权限”有关的文件。你以后忘了项目逻辑，可以先看这里，再回代码里看注释。

## 一句话总览

当前项目的后端逻辑是：

1. 前端先调用 `GET /api/auth/password-key` 获取 RSA 公钥。
2. 前端用公钥把密码加密成 `encryptedPassword`，再调用 `POST /api/login`。
3. 后端用私钥解密密码，再去 MySQL 的 `users` 表查用户，用 bcrypt 校验密码。
4. 校验成功后，后端生成一个随机 token，登录接口把 token 返回给前端。
5. 当前 Nuxt SSR 学习项目也会把 token 写入 `httpOnly` cookie，方便刷新页面时服务端恢复登录态。
6. 浏览器后续请求接口时自动带上 cookie。
7. 只有 `GET /api/me` 返回 getInfo：`user`、`routes`、`buttons`。
8. `server/middleware/auth.ts` 先从 Bearer token 或 cookie 里取 token，找到当前用户名，再查数据库得到当前用户。
9. 创建账号时，服务端会校验当前用户是否拥有 `accounts.create` 按钮权限。
10. 创建账号时，前端同样只提交 `encryptedPassword`；后端解密后再写入 bcrypt 哈希，不会保存明文密码。

## 后端文件分别是干嘛的

### `prisma/schema.prisma`

这是 Prisma 的数据库模型文件。现在里面的 `User` 模型对应 MySQL 的 `users` 表。

重要字段：

- `id`：用户主键，自增。
- `username`：登录用户名，`@unique` 表示不能重复。
- `passwordHash`：密码哈希，对应数据库字段 `password_hash`，不能保存明文密码。
- `nickname`：页面显示的昵称。
- `role`：当前用户角色，`admin` 是普通管理员，`super_admin` 是超级管理员。
- `createdAt` / `updatedAt`：创建时间和更新时间。

### `server/utils/prisma.ts`

这是 Nuxt 后端连接 MySQL 的统一入口。

后端代码不直接写连接数据库的代码，而是统一引入：

```ts
import { prisma } from '~/server/utils/prisma'
```

然后通过 `prisma.user.findUnique()`、`prisma.user.create()` 这类方法操作数据库。

### `server/services/users.ts` 里的 bcrypt 调用

当前项目不再单独封装 `server/utils/password.ts`。用户 service 直接引入 `bcryptjs`，在真实调用位置完成密码处理：

- 登录时直接用 `bcrypt.compare(password, user.passwordHash)` 比较用户输入的密码和数据库里的哈希是否匹配。
- 创建账号时直接用 `bcrypt.hash(password, bcryptSaltRounds)` 把解密后的密码变成 bcrypt 哈希。

真实项目里不要存“可解密密码”，而是存单向哈希。也就是说，数据库里的 `password_hash` 不能还原成原密码，只能用来校验。

当前项目的请求体不会直接传 `password`，而是传 `encryptedPassword`。后端解密后得到的原始密码只存在于本次请求内存里，用完就结束；数据库仍然只保存 bcrypt 哈希。

### `server/utils/password-encryption.ts`

这是密码传输加密工具。

- `getPasswordPublicKey()`：返回前端加密用的 RSA 公钥。
- `decryptPassword(encryptedPassword)`：后端用私钥解密前端提交的密文。

本地学习时，如果没有配置密钥，服务端会自动生成内存里的 RSA 密钥对。生产环境应该通过 `PASSWORD_PUBLIC_KEY` 和 `PASSWORD_PRIVATE_KEY` 配置固定密钥，避免多实例或重启后密钥不一致。

### `server/services/users.ts`

这是用户业务逻辑层。它不直接处理 HTTP 请求，而是提供给接口调用。

主要方法：

- `findUserByCredentials(username, password)`：登录用，按用户名查用户，再校验密码。
- `findAuthUserByUsername(username)`：鉴权用，根据用户名重新查当前用户。
- `listUsers()`：账号管理页面用，返回用户列表，但不返回 `passwordHash`。
- `createUserAccount(input)`：创建账号用，先 hash 密码，再写入 `users` 表。
- `requirePermissionCode(user, code)`：按后端权限表校验当前用户是否拥有某个页面或按钮权限。
- `roleExists(role)`：判断前端传来的角色是否存在于角色表。

### `server/services/auth.ts`

这是登录 token 和 session 的存储文件。

现在只保留 Redis 存储：

```text
token -> session 存在 Redis
```

登录成功时：

```text
await createAuthSession(username)
```

会生成一个随机 token，并把它和用户名绑定起来。

Redis 里会写入：

```text
key:   nuxt-admin:session:<token>
value: {"username":"admin","createdAt":...}
ttl:   24 小时
```

后续接口请求时：

```text
await getAuthSessionUsername(token)
```

会用 cookie 里的 token 找回 username。

注意：现在没有内存兜底。Redis 没启动时，登录态就无法保存和读取。

### `server/api/login.post.ts`

这是登录接口，对应：

```http
POST /api/login
```

它做六件事：

1. 用 `readBody()` 读取前端传来的 `username` 和 `encryptedPassword`。
2. 用服务端私钥解密出本次登录密码。
3. 调用 `findUserByCredentials()` 查数据库并校验密码。
4. 登录成功后调用 `await createAuthSession()` 生成 token，并保存服务端 session。
5. 用 `setCookie()` 把 token 写入 `httpOnly` cookie。
6. 返回本次登录生成的 token；用户信息和权限不从登录接口返回。

返回格式大概是：

```json
{
  "token": "a-random-login-token"
}
```

注意：登录接口只证明账号密码正确并创建登录态。前端要拿用户信息、菜单路由和按钮权限，继续请求 `GET /api/me`。

### `server/middleware/auth.ts`

这是服务端 API 鉴权中间件。

只要请求路径是 `/api` 开头，并且不是 `/api/login`，都会先经过这里。

它的流程是：

1. 优先从 `Authorization: Bearer <token>` 读取 token，没有时再从 cookie 读取 `nuxt-admin-token`。
2. 用 token 去 `server/services/auth.ts` 里找 username。
3. 找不到 username，说明没登录，返回 401。
4. 找到 username 后，调用 `findAuthUserByUsername()` 重新查数据库。
5. 把查到的用户写入 `event.context.currentUser`。

后面的接口就可以这样拿当前用户：

```ts
event.context.currentUser
```

### `server/api/me.get.ts`

这是获取当前登录用户的接口：

```http
GET /api/me
```

它不自己查 token，因为 `server/middleware/auth.ts` 已经提前鉴权并把用户放到了 `event.context.currentUser`。

它现在也是前端刷新页面时的 getInfo 接口，会返回：

```text
user
routes
buttons
```

### `server/api/logout.post.ts`

这是退出登录接口：

```http
POST /api/logout
```

它做两件事：

1. 删除 Redis 里的 session key，让旧 token 失效。
2. 删除浏览器 cookie。

### `server/api/users/index.get.ts`

这是账号列表接口：

```http
GET /api/users
```

必须拥有 `accounts.page` 页面权限。即使前端页面被隐藏，手动请求接口也会在服务端被 403 拦截。

### `server/api/users/index.post.ts`

这是创建账号接口：

```http
POST /api/users
```

必须拥有 `accounts.create` 按钮权限。

它会校验：

- 用户名格式是否合法。
- `encryptedPassword` 是否能被服务端私钥解密。
- 解密后的密码是否至少 6 位。
- 昵称是否为空。
- 角色是否存在于 `roles` 表。
- 用户名是否已经存在。

校验通过后，调用 `createUserAccount()` 写入数据库。真正写入前，解密后的密码会先变成 bcrypt 哈希。

## 登录写入 httpOnly cookie 的完整流程

```text
浏览器登录页
  |
  | GET /api/auth/password-key
  | 返回 RSA publicKey
  v
utils/password-encryption.ts
  |
  | encryptPasswordForRequest("123456")
  v
浏览器登录页
  |
  | POST /api/login
  | body: { username: "admin", encryptedPassword: "..." }
  v
server/api/login.post.ts
  |
  | decryptPassword(encryptedPassword)
  | 调用 findUserByCredentials()
  v
server/services/users.ts
  |
  | prisma.user.findUnique({ username })
  | bcrypt.compare(password, user.passwordHash)
  v
MySQL users 表
  |
  | 密码匹配成功
  v
server/services/auth.ts
  |
  | createAuthSession(username)
  | 生成 token，并保存 token -> username 到 Redis
  v
server/api/login.post.ts
  |
  | setCookie("nuxt-admin-token", token, { httpOnly: true })
  | return { token }
  v
浏览器自动保存 httpOnly cookie，前端带 Bearer token 继续请求 GET /api/me 保存 user 和权限快照
```

## 后续接口怎么知道你是谁

登录以后，浏览器请求接口时会自动带上 cookie：

```text
Cookie: nuxt-admin-token=xxxx
```

然后：

```text
server/middleware/auth.ts
  |
  | getHeader(event, "authorization") 或 getCookie(event, "nuxt-admin-token")
  | getAuthSessionUsername(token)
  | findAuthUserByUsername(username)
  v
event.context.currentUser = 当前用户
```

所以业务接口不需要自己再解析 cookie，只要读：

```ts
event.context.currentUser
```

## 创建账号的完整流程

```text
超级管理员打开 /accounts
  |
  | GET /api/auth/password-key
  | 用 publicKey 加密初始密码
  v
账号管理页
  |
  | POST /api/users
  | body: { username, encryptedPassword, nickname, role }
  v
server/middleware/auth.ts
  |
  | 先确认这个请求已经登录
  | 写入 event.context.currentUser
  v
server/api/users/index.post.ts
  |
  | requirePermissionCode(currentUser, 'accounts.create')
  | decryptPassword(encryptedPassword)
  | 校验 username/解密后的密码长度/nickname/role
  | 查询 username 是否已存在
  v
server/services/users.ts
  |
  | bcrypt.hash(password, bcryptSaltRounds)
  | prisma.user.create({ passwordHash, ... })
  v
MySQL users 表
```

## 为什么前端隐藏菜单还不够

账号管理菜单只给有页面权限的角色显示，这是前端体验。

但是安全不能靠前端，因为普通用户可以自己用工具请求：

```http
POST /api/users
```

所以真正的权限判断必须写在后端接口里，也必须以数据库权限表为准。

当前页面访问链路是：

```text
登录或刷新页面
  -> GET /api/me
  -> 返回 user、routes、buttons
  -> stores/auth.ts 缓存权限快照
middleware/auth.global.ts
  -> auth.canAccessPage('/accounts')
  -> 前端本地判断是否允许进入页面
```

这样页面跳转时不用每次再请求权限接口。

接口访问还要继续在 API 层兜底：

```ts
await requirePermissionCode(event.context.currentUser, 'accounts.create')
```

这就是“前端控制显示，后端控制安全”。

## 当前学习版和真实项目的区别

当前项目已经做到：

- 密码用 bcrypt 哈希保存。
- 除登录校验外，服务端查询用户时不再读取 `passwordHash`。
- token 是随机生成的。
- token 会由登录接口返回，并写入 SSR 刷新需要的 cookie。
- 后端接口会统一鉴权。
- 创建账号需要 `accounts.create` 按钮权限。
- 角色和权限已经落到 `roles`、`permissions`、`role_permissions` 表。
- 登录成功后和刷新页面时会请求 `/api/me`，通过后端读取权限表，返回后端路由配置和按钮权限；页面跳转时前端用本地权限快照判断。

但它仍然可以继续升级：

- 没有做 token 过期清理。
- 没有做账号禁用、重置密码、删除账号。
- 还没有把所有按钮操作都做成统一的权限码校验。

后续如果按真实企业项目继续升级，可以做：

- 登录日志。
- 修改密码。
- 重置密码。
- 用户禁用。
- 按 `permission.code` 给每个高风险按钮和接口补统一授权校验。
