# 工单模块全栈学习链路

这份文档解释当前工单模块为什么这样分层。目标不是把学习项目做复杂，而是让你能顺着一条线看懂前端、后端和数据库怎么配合。

## 一句话总览

```text
页面 -> composable -> API client -> server/api -> service -> Prisma DB
```

工单模块现在不再从 `server/data/work-orders.ts` 的内存数组读写数据。列表、新增、详情、状态流转都会进入 MySQL 的 `work_orders` 表；通知进入 `notifications` 表；操作日志进入 `operation_logs` 表。

## 每层负责什么

### 页面

位置：

```text
pages/work-orders/index.vue
pages/work-orders/[id].vue
pages/ai/work-order-draft.vue
pages/dashboard.vue
```

页面只负责用户界面：

- 表单、弹窗、按钮、表格。
- 调用 `useWorkOrders()`。
- 成功或失败时显示 Element Plus 提示。

页面不直接写：

```ts
$fetch('/api/work-orders/add')
```

这样做的好处是：页面不用知道接口地址和返回结构细节。

### Composable

位置：

```text
composables/use-work-orders.ts
```

它负责页面业务动作：

- `listWorkOrders()`：查询工单列表。
- `fetchWorkOrderDetail()`：查询工单详情。
- `createWorkOrder()`：创建工单。
- `changeWorkOrderStatus()`：状态流转。
- `generateDraft()`：生成 AI 工单草稿。

这里可以理解成前端的“业务入口”。页面有动作时先找 composable。

### API client

位置：

```text
utils/api/work-orders.ts
```

它只负责 HTTP 请求：

- 请求哪个地址。
- 用什么 method。
- body/query 长什么样。
- 返回类型是什么。

后面如果接口从 `/api/work-orders/add` 改成 `/api/work-orders`，优先改这里，而不是全项目搜索页面。

### Server API

位置：

```text
server/api/work-orders/index.get.ts
server/api/work-orders/add/index.post.ts
server/api/work-orders/detail/[id].get.ts
server/api/work-orders/status/index.post.ts
```

这些文件现在只做三件事：

- 读取 query、body 或路由 id。
- 从 `event.context.currentUser` 拿当前登录用户。
- 调用 `server/services/work-orders.ts`。

它们不再直接操作 mock 数组，也不直接写复杂业务规则。

### Service

位置：

```text
server/services/work-orders.ts
server/services/notifications.ts
server/services/operation-logs.ts
```

service 是后端业务逻辑层：

- 工单类型、状态、来源的数字枚举和中文文案互转。
- 生成工单编号。
- 校验状态流转规则：`待处理 -> 处理中 -> 待确认`。
- 写入工单后创建通知和操作日志。
- 从操作日志派生详情页的处理记录。

这层不关心页面怎么展示，也不关心 Element Plus。

### Prisma DB

位置：

```text
prisma/schema.prisma
server/utils/prisma.ts
```

Prisma 负责真正读写 MySQL：

- `work_orders`：工单主数据。
- `notifications`：站内通知。
- `operation_logs`：操作日志和工单处理记录来源。

Redis 不保存这些主业务数据。Redis 只保存登录 session。

## 当前读取顺序

学习时建议按这个顺序看代码：

```text
pages/work-orders/index.vue
composables/use-work-orders.ts
utils/api/work-orders.ts
server/api/work-orders/index.get.ts
server/services/work-orders.ts
prisma/schema.prisma
```

看完列表，再用同样方式看新增、详情和状态流转。

## 为什么 store 不放请求

Pinia store 在这个项目里只做状态管理：

```text
stores/auth.ts
stores/notifications.ts
```

例如登录用户、通知列表、未读数量可以放 store。请求接口、处理服务端返回、刷新数据这些动作放在 composable 和 API client。

这样你调试时能很快判断：

- 状态不对：先看 store。
- 请求不对：先看 `utils/api`。
- 页面交互不对：先看 page 和 composable。
- 数据库不对：先看 server service 和 Prisma。
