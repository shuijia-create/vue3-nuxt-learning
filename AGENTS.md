# Nuxt 学习仓库 Agent 说明

这个仓库是一个 Nuxt 学习项目，面向已经会 Vue、正在学习 Nuxt、SSR 和 Agent 开发方式的前端开发者。

## 项目定位

- 技术栈：Nuxt 4、Vue 3、TypeScript、Vite、Element Plus
- 学习方式：边看代码边跟敲，而不是只看文档
- 核心主题：文件路由、布局、middleware、`server/api`、登录鉴权、SSR 数据流
- 目标：示例尽量小、清晰、可运行，适合学习和讲解

## 协作规则

- 优先保留“适合学习”的代码结构，不要为了抽象而抽象。
- 修改尽量围绕当前学习主题，不做无关重构。
- 写注释时，重点解释 Nuxt 特有机制，不重复基础 Vue 语法。
- 处理权限时，明确区分“页面 middleware 拦截”和“服务端真实鉴权”。
- 更新学习资料时，保持 `docs/day-01.md`、`docs/day-02-login.md`、`docs/day-03-permission.md`、`LEARNING_PLAN.md` 一致。

## Agent 技能配置

### 问题跟踪

需求、PRD、任务单统一使用 `.scratch/` 下的本地 Markdown 文件。详见 `docs/agents/issue-tracker.md`。

### Triage 状态标签

`mattpocock/skills` 的标准状态映射到本仓库中文标签。详见 `docs/agents/triage-labels.md`。

### 项目上下文文档

本仓库是单上下文结构，根目录使用一个 `CONTEXT.md`，架构决策放在 `docs/adr/`。详见 `docs/agents/domain.md`。

## 推荐使用顺序

1. `/grill-with-docs`：需求不清、术语不清、上下文不足时先用
2. `/triage`：管理任务状态，整理 Agent 可接手的问题
3. `/to-prd`：把想法整理成清晰的实现说明
4. `/diagnose`：定位 Nuxt 页面、数据流、权限相关问题
5. `/tdd`：需要测试驱动时使用
6. `/zoom-out`：从整体结构看项目设计
