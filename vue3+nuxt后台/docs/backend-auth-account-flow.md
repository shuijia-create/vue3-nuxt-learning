# 后端登录、Token 和账号创建逻辑

这份文档只解释当前项目后端里和“登录、token、账号创建、权限”有关的文件。你以后忘了项目逻辑，可以先看这里，再回代码里看注释。

## 一句话总览

当前项目的后端逻辑是：

1. 前端调用 `POST /api/login`，提交用户名和密码。
2. 后端去 MySQL 的 `users` 表查用户，用 bcrypt 校验密码。
3. 校验成功后，后端生成一个随机 token，写入 cookie，并返回给前端。
4. 浏览器后续请求接口时自动带上 cookie。
5. `server/middleware/auth.ts` 先用 token 找到当前用户名，再查数据库得到当前用户。
6. 创建账号时，只有 `super_admin` 可以调用 `POST /api/users`。
7. 新账号密码写入数据库前会先变成 bcrypt 哈希，不会保存明文密码。

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

### `server/utils/password.ts`

这是密码处理工具。

里面有两个方法：

- `hashPassword(password)`：创建账号时，把明文密码变成 bcrypt 哈希。
- `verifyPassword(password, passwordHash)`：登录时，比较用户输入的明文密码和数据库里的哈希是否匹配。

真实项目里不要存“可解密密码”，而是存单向哈希。也就是说，数据库里的 `password_hash` 不能还原成原密码，只能用来校验。

### `server/services/users.ts`

这是用户业务逻辑层。它不直接处理 HTTP 请求，而是提供给接口调用。

主要方法：

- `findUserByCredentials(username, password)`：登录用，按用户名查用户，再校验密码。
- `findAuthUserByUsername(username)`：鉴权用，根据用户名重新查当前用户。
- `listUsers()`：账号管理页面用，返回用户列表，但不返回 `passwordHash`。
- `createUserAccount(input)`：创建账号用，先 hash 密码，再写入 `users` 表。
- `isSuperAdmin(user)`：判断当前用户是不是超级管理员。
- `isUserRole(role)`：判断前端传来的角色是不是合法角色。

### `server/data/auth.ts`

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

它做四件事：

1. 用 `readBody()` 读取前端传来的 `username` 和 `password`。
2. 调用 `findUserByCredentials()` 查数据库并校验密码。
3. 登录成功后调用 `await createAuthSession()` 生成 token，并保存服务端 session。
4. 用 `setCookie()` 把 token 写入浏览器 cookie，并把 token 和用户信息返回给前端。

返回格式大概是：

```json
{
  "token": "随机生成的 token",
  "user": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "roles": ["super_admin"]
  }
}
```

注意：返回的 `user` 里没有 `passwordHash`。

### `server/middleware/auth.ts`

这是服务端 API 鉴权中间件。

只要请求路径是 `/api` 开头，并且不是 `/api/login`，都会先经过这里。

它的流程是：

1. 从 cookie 读取 `nuxt-admin-token`。
2. 用 token 去 `server/data/auth.ts` 里找 username。
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

只有 `super_admin` 可以访问。普通管理员即使手动请求这个接口，也会被服务端返回 403。

### `server/api/users/index.post.ts`

这是创建账号接口：

```http
POST /api/users
```

只有 `super_admin` 可以创建账号。

它会校验：

- 用户名格式是否合法。
- 密码是否至少 6 位。
- 昵称是否为空。
- 角色是否只能是 `admin` 或 `super_admin`。
- 用户名是否已经存在。

校验通过后，调用 `createUserAccount()` 写入数据库。真正写入前，密码会先变成 bcrypt 哈希。

## 登录返回 token 的完整流程

```text
浏览器登录页
  |
  | POST /api/login
  | body: { username: "admin", password: "123456" }
  v
server/api/login.post.ts
  |
  | 调用 findUserByCredentials()
  v
server/services/users.ts
  |
  | prisma.user.findUnique({ username })
  | verifyPassword(password, user.passwordHash)
  v
MySQL users 表
  |
  | 密码匹配成功
  v
server/data/auth.ts
  |
  | createAuthSession(username)
  | 生成 token，并保存 token -> username 到 Redis
  v
server/api/login.post.ts
  |
  | setCookie("nuxt-admin-token", token)
  | return { token, user }
  v
浏览器保存 cookie，前端保存 user
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
  | getCookie(event, "nuxt-admin-token")
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
  | POST /api/users
  | body: { username, password, nickname, role }
  v
server/middleware/auth.ts
  |
  | 先确认这个请求已经登录
  | 写入 event.context.currentUser
  v
server/api/users/index.post.ts
  |
  | isSuperAdmin(currentUser)
  | 校验 username/password/nickname/role
  | 查询 username 是否已存在
  v
server/services/users.ts
  |
  | hashPassword(password)
  | prisma.user.create({ passwordHash, ... })
  v
MySQL users 表
```

## 为什么前端隐藏菜单还不够

账号管理菜单只给超级管理员显示，这是前端体验。

但是安全不能靠前端，因为普通用户可以自己用工具请求：

```http
POST /api/users
```

所以真正的权限判断必须写在后端接口里：

```ts
if (!isSuperAdmin(event.context.currentUser)) {
  throw createError({ statusCode: 403 })
}
```

这就是“前端控制显示，后端控制安全”。

## 当前学习版和真实项目的区别

当前项目已经做到：

- 密码用 bcrypt 哈希保存。
- token 是随机生成的。
- token 会写入 cookie。
- 后端接口会统一鉴权。
- 创建账号需要超级管理员。

但它仍然可以继续升级：

- 没有做 token 过期清理。
- 没有做账号禁用、重置密码、删除账号。
- 角色还是单字段字符串，没有拆成角色表和权限表。

后续如果按真实企业项目继续升级，可以做：

- 登录日志。
- 修改密码。
- 重置密码。
- 用户禁用。
- 角色表 `roles` 和权限表 `permissions`。
