# Nuxt 学习项目

这是一个面向 **已掌握 Vue、正在学习 Nuxt** 的练习项目。

项目当前目标不是直接做完整企业后台，而是先把 Nuxt 里最常见、最关键的能力用一个小型可运行项目串起来。等基础能力稳定后，再逐步扩展成带菜单、页面权限、按钮权限和服务端权限的后台系统。

## 技术栈

- Nuxt 4
- Vue 3
- TypeScript
- Vite
- Element Plus

## 当前学习重点

这个项目现阶段重点学习：

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
- SSR 下的 cookie / token 处理

## 适合谁

适合这类开发者：

- 已经会 Vue 3
- 想系统学习 Nuxt
- 想理解 Nuxt 和普通 Vue SPA 的区别
- 想补上 SSR、登录态、服务端接口、权限控制这些能力
- 未来想继续转向企业后台或 Agent 应用开发

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

## 当前已经包含的内容

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
- 服务端认证接口：`/api/auth/login`、`/api/auth/me`、`/api/auth/logout`
- 管理员接口示例：`/api/admin/stats`

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

当前项目使用学习型的 cookie token 登录示例：

- 登录接口在服务端设置 `study_token`
- `study_token` 存在浏览器 cookie 中
- cookie 使用 `httpOnly`，所以前端 JS 不能直接读取
- 前端通过 `/api/auth/me` 获取当前用户信息
- SSR 场景下通过 `useApiFetch()` 转发 cookie 请求头
- 服务端通过 `server/utils/auth.ts` 封装当前用户和权限判断

对应文件：

- [composables/useAuth.ts](./composables/useAuth.ts)
- [composables/useApiFetch.ts](./composables/useApiFetch.ts)
- [server/api/auth/login.post.ts](./server/api/auth/login.post.ts)
- [server/api/auth/me.get.ts](./server/api/auth/me.get.ts)
- [server/api/auth/logout.post.ts](./server/api/auth/logout.post.ts)
- [server/utils/auth.ts](./server/utils/auth.ts)

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

## 学习顺序

建议按下面顺序学习：

1. [Day 1：Vue 开发者上手 Nuxt 约定](./docs/day-01.md)
2. [Day 2：Nuxt 数据获取、Server API 与登录会话](./docs/day-02-login.md)
3. [Day 3：Nuxt Middleware、页面权限与服务端权限边界](./docs/day-03-permission.md)
4. [Agent 开发学习方向](./AGENT_DEVELOPMENT_LEARNING.md)

## 长期目标：后台权限系统

这个项目的长期目标，是逐步扩展成一个小型后台系统。目标形态如下：

```text
登录页
登录后进入后台
顶部 header
左侧二级菜单
右侧内容区
页面权限
按钮权限
服务端 API 权限
```

最终后台结构可以设计成：

```text
/admin
├─ Header
│  ├─ 系统名称
│  ├─ 当前用户
│  └─ 退出登录
├─ Sidebar
│  ├─ 工作台
│  └─ 系统管理
│     ├─ 用户管理
│     └─ 角色管理
└─ Main
   └─ 当前页面内容
```

权限模型建议采用权限码：

```text
页面权限：system:user:view
按钮权限：system:user:create / system:user:delete
接口权限：server/api 中 requirePermission(...)
```

## 为什么现在不直接做完整后台

当前项目仍然是 Nuxt 学习项目，不是完整企业后台。

完整后台权限系统会同时涉及：

- 前端布局
- 二级菜单
- 页面权限
- 按钮权限
- 服务端 API 权限
- 数据库
- 用户表
- 角色表
- 菜单表
- 权限表
- session / token 表

这些内容不能一次性堆上来，否则很容易变成只会复制代码，但不理解 Nuxt 的运行机制。

所以当前阶段的策略是：

```text
先学 Nuxt 基础
再学后台结构
再学前端权限
再学服务端权限
最后接数据库权限系统
```

## 分阶段实现路线

### 阶段一：Nuxt 基础

先掌握当前项目已有内容：

- 路由
- layout
- middleware
- `server/api`
- cookie / token 登录
- `useFetch` / `$fetch`
- SSR 请求头转发

### 阶段二：后台页面结构

目标是搭出后台外壳：

- `layouts/admin.vue`
- 顶部 header
- 左侧菜单
- 右侧内容区
- 二级菜单渲染

### 阶段三：前端权限

目标是控制页面和按钮显示：

- 页面权限
- 按钮权限
- `definePageMeta`
- `usePermission`
- 根据权限码显示或隐藏按钮

### 阶段四：服务端权限

目标是保证数据安全：

- `requireUser`
- `requirePermission`
- `requireAdmin`
- 所有敏感 API 必须在服务端再次校验

前端隐藏按钮只负责体验，不能作为安全边界。

### 阶段五：数据库权限系统

目标是把模拟数据升级成真实权限模型：

- Prisma + SQLite
- 用户表
- 角色表
- 菜单表
- 权限表
- session / token 表

这个阶段完成后，项目才真正接近一个后台权限系统。

## 这个项目不是做什么的

这个仓库现在不是：

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
