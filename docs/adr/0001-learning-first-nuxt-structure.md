# ADR-0001：保持单一 Nuxt 学习应用结构

## 状态

已接受

## 背景

这个仓库的目标是教会一个已经掌握 Vue 的前端开发者理解 Nuxt。学习者需要在一个连续、完整的项目里看到：

- 文件路由
- 动态路由
- middleware
- 登录和权限
- `server/api`
- 共享状态

如果过早把仓库拆成多个应用、多个包或者复杂的基础设施结构，学习路径会被打断，示例也不再容易从头到尾追踪。

## 决策

保持当前仓库为一个单一的 Nuxt 应用，围绕教学目标组织页面、composable、middleware 和服务端接口。

优先使用简单、可运行、适合讲解的本地示例：

- 本地登录示例
- 本地 Markdown 工作流
- 小而完整的页面和接口

同时用 `CONTEXT.md`、`AGENTS.md` 和 `docs/agents/` 记录项目上下文与 Agent 工作方式。

## 影响

- Skills 和 Agent 可以把仓库当成一个单上下文项目理解
- 学习示例可以从页面一路追到 composable、middleware、server handler
- 在接入真实远程 issue 流程之前，`.scratch/` 下的本地 Markdown 足够使用
- 后续扩展应优先保持可读性，除非某个复杂度提升本身就是教学目标
