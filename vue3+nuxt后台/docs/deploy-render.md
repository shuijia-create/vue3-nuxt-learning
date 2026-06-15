# Render 免费演示部署

这份文档用于把当前 Nuxt 全栈后台部署到 Render Web Service，并使用 Render 免费提供的 `onrender.com` 二级域名访问。

## 部署结构

```text
浏览器
  -> https://你的服务名.onrender.com
  -> Render Web Service: Nuxt SSR + server/api
  -> TiDB Cloud Starter: MySQL 兼容数据库
  -> Upstash Redis Free: 登录 session
  -> 通义千问 OpenAI 兼容接口: AI 工单草稿/知识库问答
```

## 准备账号

1. GitHub：保存项目代码。
2. Render：创建 Web Service。
3. TiDB Cloud：创建 MySQL 兼容数据库，复制连接串作为 `DATABASE_URL`。
4. Upstash：创建 Redis Free 数据库，复制连接串作为 `REDIS_URL`。

## 安全要求

- 不要提交 `.env`。
- 不要把 `NUXT_AI_API_KEY` 写进 GitHub、`render.yaml`、README 或截图。
- `NUXT_AI_API_KEY` 只在 Render Dashboard 的 Environment Variables 里填写。
- `render.yaml` 里使用 `sync: false` 的变量都需要在 Render 控制台手动填写。

## 方式一：使用 render.yaml

1. 把代码推到 GitHub。
2. 登录 Render Dashboard。
3. 选择 New -> Blueprint。
4. 连接这个 GitHub 仓库。
5. Render 会读取根目录的 `render.yaml`。
6. 按页面提示填写这些敏感变量：

```text
DATABASE_URL=TiDB Cloud 的 MySQL 兼容连接串
REDIS_URL=Upstash Redis 连接串
NUXT_AI_API_KEY=你的 AI API Key
ADMIN_PASSWORD=演示管理员密码
```

7. 创建服务并等待部署完成。
8. 打开 Render 分配的地址：

```text
https://你的服务名.onrender.com/login
```

## 方式二：手动创建 Web Service

如果不使用 Blueprint，也可以手动配置：

```text
Runtime: Node
Plan: Free
Region: Singapore
Build Command: npm ci && npm run render:build
Pre-Deploy Command: npm run render:predeploy
Start Command: npm run start
Health Check Path: /login
```

环境变量：

```text
NODE_ENV=production
HOST=0.0.0.0
DATABASE_URL=TiDB Cloud 的 MySQL 兼容连接串
REDIS_URL=Upstash Redis 连接串
NUXT_AI_API_KEY=你的 AI API Key
NUXT_AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
NUXT_AI_MODEL=qwen-plus
ADMIN_USERNAME=admin
ADMIN_PASSWORD=演示管理员密码
ADMIN_NICKNAME=超级管理员
ADMIN_ROLE=super_admin
ADMIN_DEPARTMENT_NAME=IT部
```

## 部署会执行什么

构建阶段：

```bash
npm ci && npm run render:build
```

预部署阶段：

```bash
npm run render:predeploy
```

运行阶段：

```bash
npm run start
```

其中 `render:predeploy` 会执行 Prisma 生产迁移，并确保演示管理员账号存在。

## 免费版限制

- Render Free Web Service 空闲后会休眠，第一次访问可能需要等待。
- Render 免费域名是 `*.onrender.com`，不是自定义域名。
- TiDB 和 Upstash 的免费额度适合演示，不适合正式生产。
- Upstash Redis Free 有命令数和容量限制，登录 session 够演示使用。

## 常见问题

### 打开页面很慢

免费服务休眠后第一次访问需要唤醒，这是平台限制。唤醒后再次访问会快很多。

### 登录失败

检查：

1. `REDIS_URL` 是否填写正确。
2. `DATABASE_URL` 是否填写正确。
3. Render Deploy Logs 里 `npm run render:predeploy` 是否成功。
4. `ADMIN_PASSWORD` 是否和登录时输入的一致。

### AI 功能失败

检查：

1. Render 环境变量里是否填写了 `NUXT_AI_API_KEY`。
2. 不要把 key 写进仓库文件。
3. `NUXT_AI_BASE_URL` 和 `NUXT_AI_MODEL` 是否正确。
