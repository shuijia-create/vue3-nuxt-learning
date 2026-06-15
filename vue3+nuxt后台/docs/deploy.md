# 线上部署说明

这份文档说明如何把当前 Nuxt 全栈后台发布到一台 Linux 服务器，并通过线上域名访问。

## 部署结构

```text
浏览器
  -> 域名 HTTPS
  -> Caddy 反向代理
  -> Nuxt SSR 服务
  -> MySQL 保存业务数据
  -> Redis 保存登录 session
```

当前项目不是纯前端页面，不能只上传静态文件。`pages/`、`server/api/`、Prisma、Redis session 都运行在同一个 Nuxt Node 服务里。

## 服务器准备

需要一台 Linux 服务器，建议 Ubuntu 22.04 或 24.04。

服务器需要安装：

```bash
docker --version
docker compose version
```

域名需要先解析到服务器公网 IP：

```text
A 记录：你的域名 -> 服务器公网 IP
```

服务器安全组或防火墙需要放行：

```text
22   SSH
80   HTTP，用于 Caddy 申请证书
443  HTTPS，用于线上访问
```

## 准备环境变量

把示例文件复制成真实生产配置：

```bash
cp .env.production.example .env.production
```

编辑 `.env.production`：

```bash
nano .env.production
```

必须修改：

```text
APP_DOMAIN=你的域名
MYSQL_ROOT_PASSWORD=强密码
MYSQL_PASSWORD=强密码
DATABASE_URL=mysql://nuxt_app:同一个 MYSQL_PASSWORD@mysql:3306/nuxt_admin_learning
NUXT_AI_API_KEY=你的 AI API Key
```

如果域名还没解析好，只想先用服务器 IP 测试，可以临时写：

```text
APP_DOMAIN=:80
```

这时只能走 HTTP，等域名解析完成后再改回真实域名并重启。

## 首次启动

在服务器项目目录执行：

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

这个命令会完成：

- 构建 Nuxt 生产镜像。
- 启动 MySQL 和 Redis。
- 执行 `npx prisma migrate deploy`。
- 启动 Nuxt SSR 服务。
- 启动 Caddy，并在域名可访问时自动申请 HTTPS 证书。

查看服务状态：

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

查看日志：

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f app
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f caddy
```

## 创建第一个管理员

数据库第一次部署后没有用户，需要创建一个管理员账号。

```bash
ADMIN_USERNAME=admin \
ADMIN_PASSWORD='换成你的强密码' \
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm app npm run seed:admin
```

脚本只会在用户不存在时创建账号。如果要重置这个账号密码：

```bash
ADMIN_USERNAME=admin \
ADMIN_PASSWORD='新的强密码' \
ADMIN_RESET_PASSWORD=true \
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm app npm run seed:admin
```

## 访问线上地址

域名解析生效后访问：

```text
https://你的域名/login
```

用刚才创建的管理员账号登录。

## 后续更新代码

服务器拉取新代码后执行：

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

如果这次代码包含 Prisma migration，`migrate` 服务会在 app 启动前执行 `prisma migrate deploy`。

## 常见问题

### 访问域名没有 HTTPS

检查：

- 域名 A 记录是否已经指向服务器公网 IP。
- 服务器 80 和 443 端口是否放行。
- `APP_DOMAIN` 是否是纯域名，不要写 `https://`。
- `docker compose logs -f caddy` 里是否有证书申请错误。

### 登录时报 Redis 错误

检查 Redis 容器：

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps redis
docker compose --env-file .env.production -f docker-compose.prod.yml logs redis
```

生产环境里 Nuxt 应该使用：

```text
REDIS_URL=redis://redis:6379
```

### 数据库连接失败

检查 `.env.production` 里 `DATABASE_URL` 的密码是否和 `MYSQL_PASSWORD` 一致。

生产环境里 Nuxt 应该使用 Docker Compose 内部服务名：

```text
DATABASE_URL=mysql://nuxt_app:密码@mysql:3306/nuxt_admin_learning
```

不是 `localhost`。
