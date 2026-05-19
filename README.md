# Nuxt 学习项目

这是一个面向 **已掌握 Vue、正在学习 Nuxt** 的练习项目。

项目目标不是做复杂业务，而是把 Nuxt 里最常见、最关键的能力用一个小型可运行项目串起来：

- 文件路由
- 动态路由
- `layouts`
- `components` 自动导入
- `composables`
- `useState`
- `useFetch` / `$fetch`
- `server/api`
- 登录鉴权
- `middleware`
- SSR 下的 cookie 处理

## 技术栈

- Nuxt 4
- Vue 3
- TypeScript
- Vite
- Element Plus

## 适合谁

适合这类开发者：

- 已经会 Vue 3
- 想系统学习 Nuxt
- 想理解 Nuxt 和普通 Vue SPA 的区别
- 想顺手补上 SSR、登录态、服务端接口这部分能力

## 本项目学什么

你可以通过这个项目学到：

1. Nuxt 的目录约定为什么能代替很多手写配置
2. `pages/` 为什么自动生成路由
3. `components/` 和 `composables/` 为什么可以自动导入
4. `params` 和 `query` 在 Nuxt 里怎么用
5. `middleware` 怎么做登录拦截和管理员权限控制
6. `server/api` 怎么写接口
7. cookie 登录态在 Nuxt SSR 下怎么处理
8. 为什么 Nuxt 里很多场景优先用 `$fetch` / `useFetch`，而不是先上 axios

## 启动方式

```bash
npm install
npm run dev
```

浏览器访问：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run dev
npm run build
npm run preview
npm run generate
```

## 学习顺序

建议按下面顺序学习：

1. [Day 1：Vue 开发者上手 Nuxt 约定](./docs/day-01.md)
2. [Day 2：Nuxt 数据获取、Server API 与登录会话](./docs/day-02-login.md)
3. [Day 3：Nuxt Middleware、页面权限与服务端权限边界](./docs/day-03-permission.md)
4. [Nuxt 学习计划](./LEARNING_PLAN.md)
5. [Agent 开发学习方向](./AGENT_DEVELOPMENT_LEARNING.md)

## 项目结构

```text
app.vue                     # Nuxt 应用入口
layouts/default.vue         # 默认布局
nuxt.config.ts              # Nuxt 总配置，也包含 Vite 配置入口
pages/                      # 页面路由
components/                 # 自动导入组件
composables/                # 自动导入组合式函数
middleware/                 # 路由中间件
server/api/                 # 服务端接口
server/utils/               # 服务端工具函数
assets/css/main.css         # 全局样式
docs/                       # 学习文档
docs/agents/                # Codex / mattpocock skills 仓库级说明
.scratch/                   # 本地 Markdown 任务区
```

## 当前示例功能

项目里已经有这些可运行示例：

- 首页学习卡片
- About 页面
- `InfoBox` 组件练习
- `test` 页面
- 动态路由：`/posts/[id]`
- 登录页：`/login`
- 用户页：`/dashboard`
- 管理员页：`/admin`
- Element Plus 示例页：`/element-plus`

## 登录测试账号

普通用户：

```text
student@example.com
123456
```

管理员：

```text
admin@example.com
123456
```

## 登录态说明

当前项目使用一个学习型的 cookie 登录示例：

- 登录接口在服务端设置 `study_session`
- 前端不能直接读取这个 cookie，因为它是 `httpOnly`
- 前端通过 `/api/auth/me` 获取当前用户信息
- SSR 场景下通过统一封装的 `useApiFetch()` 转发 cookie 请求头

对应文件：

- [composables/useAuth.ts](./composables/useAuth.ts)
- [composables/useApiFetch.ts](./composables/useApiFetch.ts)
- [server/api/auth/login.post.ts](./server/api/auth/login.post.ts)
- [server/api/auth/me.get.ts](./server/api/auth/me.get.ts)
- [server/api/auth/logout.post.ts](./server/api/auth/logout.post.ts)

## 这个项目不是做什么的

这个仓库不是：

- 企业级脚手架
- 通用后台模板
- 完整生产系统

它首先是一个 **Nuxt 学习项目**，所以代码会优先追求：

- 容易读懂
- 容易跟敲
- 容易讲解
- 能展示 Nuxt 关键机制

## 后续方向

如果你学完这套内容，下一步可以继续走两条线：

1. 深入 Nuxt 全栈能力
2. 继续转向 Agent 开发、RAG、工具调用、MCP 工作流
