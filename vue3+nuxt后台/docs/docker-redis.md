# Docker Redis 对接项目

这份文档只说明一件事：用 Docker 启动 Redis，并让当前 Nuxt 项目连接它。

## 当前连接方式

项目里的登录 token 保存在 Redis。核心代码在：

```text
server/services/auth.ts
```

代码读取环境变量：

```env
REDIS_URL="redis://localhost:6379"
```

现在 Nuxt 是直接在 Windows 宿主机上运行，Redis 在 Docker 容器里运行，所以 Docker 需要把容器的 `6379` 映射到宿主机的 `6379`。

## 启动 Redis

在项目根目录执行：

```bash
npm run redis:up
```

这个命令会优先启动已有的 `redis-dev` 容器。

如果本机还没有这个容器，脚本会创建一个 Redis 容器：

```text
容器名：redis-dev
镜像：redis:7-alpine
宿主机端口：6379
容器端口：6379
```

## 检查 Redis 是否可用

```bash
npm run redis:ping
```

如果返回：

```text
PONG
```

说明 Docker 里的 Redis 已经可以被项目访问。

## 项目环境变量

确认本地 `.env` 里有：

```env
REDIS_URL="redis://localhost:6379"
```

改完 `.env` 后需要重启 Nuxt：

```bash
npm run dev
```

## 验证登录 token 写入 Redis

1. 启动 Redis：`npm run redis:up`
2. 启动 Nuxt：`npm run dev`
3. 在浏览器登录：`admin / 123456`
4. 进入 Redis 命令行：

```bash
npm run redis:cli
```

5. 查看 session key：

```redis
KEYS nuxt-admin:session:*
```

能看到 `nuxt-admin:session:<token>`，就说明项目已经把登录态写进 Docker Redis。

## 停止 Redis

```bash
npm run redis:down
```

注意：这个命令只是停止容器，不会删除容器里的 Redis 数据。

## 容器网络说明

现在的项目结构是：

```text
Nuxt dev server：Windows 宿主机
Redis：Docker 容器
```

所以连接地址是：

```env
REDIS_URL="redis://localhost:6379"
```

如果以后把 Nuxt 也放进同一个 Docker Compose 网络，连接地址才需要改成：

```env
REDIS_URL="redis://redis:6379"
```
