# Redis 安装和 Navicat Premium 17 连接教程

这份文档只解决两个问题：

1. 怎么在本机启动一个 Redis 服务。
2. 怎么用 Navicat Premium 17 连上 Redis，并看到项目登录 token。

## 先分清楚三个东西

```text
Redis：
真正的服务端软件，负责保存 token、验证码、缓存等临时数据。

Navicat Premium 17：
图形化客户端工具，只负责连接 Redis、查看 Redis 里的 key。

Nuxt 项目：
你的后端代码，登录成功后把 token 写进 Redis。
```

所以顺序一定是：

```text
先启动 Redis 服务
再用 Navicat 连接 Redis
最后启动 Nuxt 项目测试登录
```

## 推荐安装方式：WSL Ubuntu 安装 Redis

你当前电脑没有 `docker` 命令，所以先用 WSL Ubuntu 方式比较合适。

### 第一步：安装 WSL Ubuntu

用管理员身份打开 PowerShell，执行：

```powershell
wsl --install -d Ubuntu
```

安装完成后，按提示重启电脑。

重启后打开 Ubuntu，第一次进入会让你创建 Linux 用户名和密码。这个密码不是 Windows 密码，也不是 MySQL 密码，是 Ubuntu 自己的 sudo 密码。

### 第二步：在 Ubuntu 里安装 Redis

打开 Ubuntu 终端，执行：

```bash
sudo apt update
sudo apt install redis-server -y
```

### 第三步：启动 Redis

在 Ubuntu 终端执行：

```bash
sudo service redis-server start
```

### 第四步：检查 Redis 是否启动成功

继续在 Ubuntu 终端执行：

```bash
redis-cli ping
```

如果看到：

```text
PONG
```

说明 Redis 已经启动成功。

## Redis 默认连接信息

本地学习时，默认连接信息通常是：

```text
主机：localhost
端口：6379
用户名：不填
密码：不填
数据库：0
```

Redis 默认有多个数据库，编号通常是 `0` 到 `15`。我们项目默认看 `0` 就行。

## Navicat Premium 17 连接 Redis

打开 Navicat Premium 17 后：

1. 点击左上角“连接”。
2. 选择 `Redis`。
3. 填写连接信息：

```text
连接名称：nuxt-admin-redis
主机：localhost
端口：6379
用户名：不填
密码：不填
数据库：0
```

4. 点击“测试连接”。
5. 测试成功后点击“保存”。

如果测试失败，先回 Ubuntu 执行：

```bash
redis-cli ping
```

如果 `redis-cli ping` 都不是 `PONG`，说明 Redis 服务本身没启动。

## 项目里开启 Redis 保存 token

打开项目根目录的本地 `.env` 文件，加入：

```env
SESSION_STORE=redis
REDIS_URL="redis://localhost:6379"
```

然后重启 Nuxt：

```bash
npm run dev
```

注意：改 `.env` 后必须重启项目，因为 Nuxt 启动时才读取环境变量。

## 怎么在 Navicat 里看到登录 token

1. 确保 Redis 已启动。
2. 确保 `.env` 已配置：

```env
SESSION_STORE=redis
REDIS_URL="redis://localhost:6379"
```

3. 启动项目：

```bash
npm run dev
```

4. 浏览器登录：

```text
admin / 123456
```

5. 回到 Navicat，刷新 Redis 连接。
6. 打开数据库 `0`。
7. 找 key：

```text
nuxt-admin:session:<一串 token>
```

这个 key 就是项目写进 Redis 的登录 session。

里面的 value 类似：

```json
{"username":"admin","createdAt":1780600000000}
```

意思是：

```text
这个 token 对应 admin 这个用户
```

## 退出登录后会发生什么

点击项目里的“退出登录”后，后端会执行：

```text
DEL nuxt-admin:session:<token>
```

然后 Navicat 里刷新 Redis，你会发现这个 session key 没了。

这说明：

```text
旧 token 已经失效
```

## 常见问题

### Navicat 连接失败

先检查 Redis 是否真的启动：

```bash
redis-cli ping
```

如果没有 `PONG`，执行：

```bash
sudo service redis-server start
```

### Navicat 连上了，但看不到 token

检查这几件事：

1. `.env` 里有没有：

```env
SESSION_STORE=redis
```

2. 改完 `.env` 后有没有重启 `npm run dev`。
3. 有没有重新登录项目。
4. Navicat 有没有刷新 Redis 连接。
5. 看的是不是数据库 `0`。

### 为什么不是创建表

Redis 和 MySQL 不一样。

MySQL 里是：

```text
database -> table -> row
```

Redis 里主要是：

```text
database -> key -> value
```

所以你在 Navicat 里不会看到 `users` 那样的表，而是看到一堆 key。

当前项目的 key 长这样：

```text
nuxt-admin:session:<token>
```

## 当前项目相关文件

```text
server/data/auth.ts
  Redis 连接和 session 读写逻辑

server/api/login.post.ts
  登录成功后创建 session，并把 token 写入 cookie

server/middleware/auth.ts
  后续接口从 cookie 取 token，再去 Redis 查 username

server/api/logout.post.ts
  退出登录时删除 Redis 里的 session key

docs/redis-session-learning.md
  Redis 在项目登录流程里的作用说明
```
