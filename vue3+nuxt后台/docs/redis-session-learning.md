# Redis 保存登录 Token 学习笔记

这份文档对应当前项目里的登录功能。目标不是单独背 Redis 概念，而是看清楚 Redis 在项目里负责哪一步。

如果你要先安装 Redis，并用 Navicat Premium 17 连接 Redis，先看：

```text
docs/redis-install-navicat.md
```

## Redis 在这个项目里负责什么

当前登录链路里有两类数据：

```text
MySQL：长期业务数据
- users 表
- 用户名
- 密码哈希
- 昵称
- 角色

Redis：临时登录状态
- token 对应哪个用户
- token 什么时候过期
```

也就是说：

```text
账号本身存在 MySQL
登录态存在 Redis
```

## session 不是 sessionStorage

这两个名字像，但不是一回事。

```text
sessionStorage：
浏览器里的存储，前端 JS 可以读写，不可信。

session：
后端保存的登录状态，表示某个 token 对应哪个用户，服务端可信。
```

当前项目里说的 session，是后端 session，不是浏览器的 `sessionStorage`。

## 当前代码里 Redis 在哪里用

核心文件是：

```text
server/data/auth.ts
```

这里现在只做一件事：

```text
token -> session 存到 Redis
```

登录成功后：

```text
createAuthSession(username)
```

会生成 token。

它会写入 Redis：

```text
key:   nuxt-admin:session:<token>
value: {"username":"admin","createdAt":...}
ttl:   24 小时
```

## 本地启动 Redis

最简单的学习方式是用 Docker 跑 Redis：

```bash
docker run --name nuxt-admin-redis -p 6379:6379 -d redis:7-alpine
```

检查 Redis 是否启动成功：

```bash
docker exec -it nuxt-admin-redis redis-cli ping
```

如果返回：

```text
PONG
```

说明 Redis 正常。

停止 Redis：

```bash
docker stop nuxt-admin-redis
```

再次启动：

```bash
docker start nuxt-admin-redis
```

如果你电脑没装 Docker，也可以用 WSL 安装 Redis。先学项目时，Docker 方式更省事。

## 项目里怎么配置 Redis

打开本地 `.env`，加上或修改：

```env
REDIS_URL="redis://localhost:6379"
```

然后重启 Nuxt：

```bash
npm run dev
```

注意：`.env` 只在服务启动时读取，所以改完必须重启项目。

## 怎么验证 token 真的存进 Redis

1. 启动 Redis。
2. `.env` 设置 `REDIS_URL="redis://localhost:6379"`。
3. 启动项目。
4. 浏览器登录 `admin / 123456`。
5. 查看 Redis 里的 session key。

如果用 Docker：

```bash
docker exec -it nuxt-admin-redis redis-cli
```

进入 Redis 命令行后执行：

```redis
KEYS nuxt-admin:session:*
```

会看到类似：

```text
1) "nuxt-admin:session:xxxx-token"
```

查看内容：

```redis
GET nuxt-admin:session:xxxx-token
```

会看到类似：

```json
{"username":"admin","createdAt":1780600000000}
```

查看剩余过期时间：

```redis
TTL nuxt-admin:session:xxxx-token
```

返回的是秒数。比如 `86320` 表示大约还有 86320 秒过期。

## 登录时发生了什么

```text
POST /api/login
  |
  | 1. MySQL users 表校验账号密码
  v
findUserByCredentials()
  |
  | 2. bcrypt.compare 校验密码哈希
  v
createAuthSession(username)
  |
  | 3. 生成 token
  | 4. Redis SET nuxt-admin:session:<token> value EX 86400
  v
setCookie("nuxt-admin-token", token)
```

浏览器只保存 token，不保存用户角色。

## 访问接口时发生了什么

```text
浏览器请求 /api/me
  |
  | Cookie: nuxt-admin-token=<token>
  v
server/middleware/auth.ts
  |
  | 1. 从 cookie 取 token
  | 2. 去 Redis GET nuxt-admin:session:<token>
  | 3. 拿到 username
  | 4. 再查 MySQL users 表
  v
event.context.currentUser
```

为什么还要再查 MySQL？

因为用户角色、昵称这些长期数据在 MySQL。Redis 只保存临时登录态。这样如果你把某个用户的角色从 `super_admin` 改成 `admin`，下次请求会重新从 MySQL 读到新角色。

## 退出登录时发生了什么

```text
POST /api/logout
  |
  | 1. 从 cookie 取 token
  | 2. Redis DEL nuxt-admin:session:<token>
  | 3. 删除浏览器 cookie
```

删除 Redis key 后，旧 token 立刻失效。

## Redis 没启动会发生什么

现在项目只保留 Redis token 逻辑。

所以 Redis 没启动时：

```text
登录接口会连不上 Redis
/api/me 也没法通过 token 找到用户
```

这不是接口消失了，而是登录态必须依赖 Redis。

先在 Ubuntu 里确认：

```bash
redis-cli ping
```

看到：

```text
PONG
```

再启动 Nuxt 项目。

## 你现在要记住的重点

```text
MySQL 存用户长期数据
Redis 存登录 token 这种临时状态
cookie 只保存 token
后端用 token 去 Redis 查 session
后端再用 username 去 MySQL 查用户和权限
```
