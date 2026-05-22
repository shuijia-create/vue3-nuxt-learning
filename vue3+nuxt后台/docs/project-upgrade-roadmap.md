# 项目升级路线：制造企业内部工单与知识助手

## 1. 项目定位

当前项目还是 Nuxt 学习项目，不要马上升级成完整企业后台。

5 个月内的目标是把它逐步升级成一个可以演示的作品：

```text
制造企业内部工单与知识助手
```

它不是通用后台模板，也不是 AI 聊天玩具，而是一个贴近制造企业内部开发场景的系统：

- 员工可以提交设备、IT、质量类问题
- AI 帮忙生成规范工单草稿
- 员工人工确认后形成工单
- 员工可以查询企业内部制度、手册和流程
- 系统保留操作记录，后续可以接数据库、权限和真实知识库

## 2. 为什么做这个方向

制造企业的开发需求通常不是单纯写页面，而是围绕内部流程做系统：

- 工单流转
- 设备维护
- IT 运维
- 质量异常记录
- 制度和手册查询
- 操作记录
- 权限和审计

这个作品能体现三类能力：

1. 前端能力：Vue3、TypeScript、Element Plus、后台页面
2. Nuxt 全栈能力：`server/api`、登录、权限、cookie token、SSR
3. AI 应用能力：结构化输出、知识库问答、工单草稿生成

## 3. 当前阶段不要做什么

现在不要一上来做这些：

- 完整 MySQL 表设计
- 复杂 RBAC 权限系统
- LangChain / LangGraph
- 向量数据库
- 多 Agent
- 真正 OA / ERP / MES 集成
- 安全生产最终决策

第一版要先证明业务流程成立。

## 4. 最终演示流程

5 个月后的演示目标：

1. 登录系统
2. 进入后台工作台
3. 打开“AI 工单草稿助手”
4. 输入问题描述：

```text
2 号线混料设备温度偏高，现场已暂停投料，设备有报警但不清楚代码。
```

5. AI 生成结构化工单草稿：

```text
工单标题
问题描述
影响范围
建议补充信息
需要人工确认的事项
```

6. 点击“确认生成工单”
7. 在工单列表看到新工单
8. 打开“企业文档问答”
9. 提问：

```text
设备故障工单需要填写哪些信息？
```

10. AI 基于模拟文档回答，并显示引用来源

## 5. 页面规划

第一阶段页面只做这些：

```text
/login                    登录页
/dashboard                工作台
/ai/work-order-draft      AI 工单草稿助手
/ai/knowledge             企业文档问答
/work-orders              工单列表
/work-orders/[id]         工单详情
```

后台菜单规划：

```text
工作台
  - 数据概览

AI 助手
  - 工单草稿助手
  - 企业文档问答

工单管理
  - 工单列表

系统学习
  - 权限页面
  - Element Plus 示例
```

## 6. 第一版数据先不用数据库

你现在还不熟数据库，所以第一版先用 mock 数据。

建议目录：

```text
server/data/factory-docs.ts
server/data/work-orders.ts
server/types/work-order.ts
server/types/ai.ts
```

第一版数据存在内存里即可：

```ts
export const workOrders = []
```

文档也先写成数组：

```ts
export const factoryDocs = [
  {
    id: 'work-order-standard',
    title: '工单填写规范',
    content: '设备故障工单需要包含设备名称、故障现象、报警信息、影响范围和现场处理情况。'
  }
]
```

## 7. 第一版 API 规划

先做这些 Nuxt Server API：

```text
POST /api/ai/work-order-draft
POST /api/ai/knowledge
GET  /api/work-orders
POST /api/work-orders
GET  /api/work-orders/:id
```

### POST /api/ai/work-order-draft

输入：

```ts
{
  description: string
}
```

输出：

```ts
{
  title: string
  description: string
  impact: string
  missingInfo: string[]
  humanReviewRequired: boolean
  disclaimer: string
}
```

### POST /api/ai/knowledge

输入：

```ts
{
  question: string
}
```

输出：

```ts
{
  answer: string
  sources: Array<{
    title: string
    excerpt: string
  }>
}
```

## 8. AI 边界

系统不能让 AI 做最终安全、质量或生产决策。

AI 只做：

- 查询资料
- 整理信息
- 生成草稿
- 提醒缺失信息
- 标记需要人工确认

AI 不做：

- 最终事故原因判断
- 最终安全风险等级判定
- 是否停机的强制决定
- 责任归属判断
- 替代审批和签字

页面和接口都要体现这句话：

```text
AI 输出仅用于资料检索和记录草稿，不作为最终安全、质量或生产处置结论。
```

## 9. 5 个月学习计划

### 第 1 个月：Nuxt 后台基础

目标：能独立写一个小后台。

学习：

- `layouts/admin.vue`
- 登录页和后台布局
- `middleware`
- `server/api`
- Element Plus 表单和表格
- mock 数据 CRUD

交付：

```text
登录 + 后台布局 + 工单列表 + 新建工单表单
```

### 第 2 个月：AI 工单草稿助手

目标：让 AI 参与一个具体业务动作。

学习：

- Nuxt 服务端调用 AI API
- prompt 设计
- JSON 结构化输出
- loading、错误处理
- 人工确认流程

交付：

```text
输入问题描述 -> AI 生成工单草稿 -> 人工确认 -> 进入工单列表
```

### 第 3 个月：企业文档问答

目标：让 AI 基于资料回答。

学习：

- 上下文
- mock 文档
- 简单关键词检索
- 引用来源
- 无依据拒答

交付：

```text
企业文档问答 v1
```

### 第 4 个月：数据库持久化

目标：让系统像真实应用。

学习：

- Prisma
- SQLite
- 基础表设计
- CRUD
- seed 数据

优先表：

```text
User
WorkOrder
FactoryDocument
AiRecord
```

交付：

```text
工单、文档、AI 记录持久化
```

### 第 5 个月：打磨和展示

目标：能带出去演示。

学习：

- README
- 演示脚本
- 简历项目描述
- 部署
- 记录和权限边界说明

交付：

```text
可演示作品 + 项目文档 + 5 分钟讲解稿
```

## 10. 当前最近两周任务

最近两周只做这些，不要扩散：

1. 整理后台菜单
2. 新建工单列表页
3. 新建工单表单页
4. 用 mock API 返回工单数据
5. 写一个 AI 工单草稿页面，但先返回 mock 草稿

不要现在学 MySQL。
不要现在学 LangChain。
不要现在做复杂权限。

## 11. 你对外怎么介绍这个项目

可以这样说：

```text
我用 Nuxt 做了一个制造企业内部工单与知识助手 Demo。
它不是普通后台模板，而是模拟企业员工提交设备、IT、质量类问题时，
由 AI 先生成规范工单草稿，再由人工确认提交。

系统还支持企业文档问答，AI 只能基于提供的制度和手册回答，
并显示引用来源。后续可以接入 OA、ERP、MES、PDM 或企业知识库。
```

## 12. 判断项目是否合格

第一版达到这些就合格：

- 能登录
- 能进后台
- 有清晰菜单
- 能提交工单
- 能看到工单列表
- AI 能生成结构化工单草稿
- AI 回答有资料来源
- 明确提示人工确认
- README 能讲清楚项目价值

达到这些后，再考虑数据库和真实 RAG。
