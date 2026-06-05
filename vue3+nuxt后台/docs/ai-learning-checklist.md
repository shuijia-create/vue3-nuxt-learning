# AI 企业工单后台学习清单

这个文件是项目的长期学习路线。每次开始学习或让 AI 继续开发前，先读这个文件。

使用方式：

- 未开始：`[ ]`
- 已完成：`[x]`
- 每完成一节，就把对应任务打勾。
- 每次改完代码，都在“学习记录”里补一句做了什么、验证了什么。

## 当前目标

把这个 Nuxt 学习项目做成一个可以展示给制造企业 IT/数字化部门看的作品：

```text
企业工单后台
  + AI 工单草稿
  + 后端接口
  + 数据库
  + 通知
  + 移动端处理页
  + 企业知识库问答
```

求职定位：

```text
会前端的企业数字化应用开发
Nuxt 全栈后台 + AI 应用落地
```

## 阶段 1：Nuxt 后台基础

- [x] 创建 Nuxt 4 项目
- [x] 接入 Vue 3、TypeScript、Element Plus
- [x] 创建登录页
- [x] 创建后台布局 `layouts/admin.vue`
- [x] 创建左侧菜单 `components/SidebarMenu.vue`
- [x] 创建工作台页面 `/dashboard`
- [x] 创建工单列表页面 `/work-orders`
- [x] 创建工单详情页面 `/work-orders/[id]`
- [x] 创建 AI 占位页 `/ai/work-order-draft`
- [x] 创建企业知识库占位页 `/ai/knowledge`

## 阶段 2：登录、鉴权、SSR

- [x] 实现 `POST /api/login`
- [x] 实现 `GET /api/me`
- [x] 实现 `POST /api/logout`
- [x] 使用 cookie 保存登录态
- [x] 使用 `middleware/auth.global.ts` 做页面访问拦截
- [x] 后台布局读取当前用户
- [x] 理解 SSR 阶段为什么要用 `useRequestFetch()` 转发 cookie
- [x] 给关键接口补服务端鉴权说明或工具函数

## 阶段 3：工单模块

- [x] 使用 mock 数据创建工单列表
- [x] 实现 `GET /api/work-orders`
- [x] 实现工单类型、状态筛选
- [x] 实现 `POST /api/work-orders/add`
- [x] 实现 `GET /api/work-orders/detail/:id`
- [x] 工单列表支持新增后刷新
- [x] 工单详情页增加“状态流转”按钮
- [x] 增加工单处理记录
- [x] 增加操作日志

## 阶段 4：AI 工单草稿

- [x] 创建 `POST /api/ai/work-order-draft`
- [x] 前端调用后端 AI 草稿接口
- [x] AI 草稿返回结构化字段：标题、类型、优先级、影响范围、处理建议、补充信息
- [x] AI 草稿支持保存为正式工单
- [x] 保存工单时标记来源为 AI 草稿
- [x] 工单详情页展示 AI 建议和人工处理结果的区别
- [x] 把 mock AI 接口替换成真实 AI API 调用
- [x] 学会让 AI 稳定返回 JSON

## 阶段 5：通知闭环

- [x] 设计通知类型 `Notification`
- [x] 创建 mock 通知数据
- [x] 创建 `GET /api/notifications`
- [x] 创建 `POST /api/notifications/read`
- [x] 工单创建后生成站内通知
- [x] 后台 header 显示未读通知数量
- [x] 通知列表支持标记已读

## 阶段 6：移动端处理页

先不做移动端 H5，不急着做小程序。

- [ ] 创建 `/mobile/work-orders`
- [ ] 创建 `/mobile/work-orders/[id]`
- [ ] 移动端显示“我的待处理工单”
- [ ] 移动端提交处理结果
- [ ] 移动端支持上传现场照片的占位流程
- [ ] 理解这一步如何迁移到钉钉小程序或企业微信

## 阶段 7：数据库

目标是把 mock 数据换成真实数据库。

- [ ] 学 MySQL 基础
- [x] 安装并配置 Prisma
- [x] 设计 `users` 表
- [x] 设计 `work_orders` 表
- [ ] 设计 `notifications` 表
- [ ] 设计 `operation_logs` 表
- [ ] 工单列表从数据库读取
- [ ] 新增工单写入数据库
- [ ] 工单详情从数据库读取

## 阶段 8：企业知识库问答

- [ ] 整理 mock 企业制度文档
- [ ] 创建知识库数据结构
- [ ] 创建 `POST /api/ai/knowledge-answer`
- [ ] 前端提问后返回答案
- [ ] 返回引用来源
- [ ] 明确提示“AI 回答不能替代制度原文”
- [ ] 后续升级为 RAG：文档切分、向量检索、引用片段

## 阶段 9：AI 日报总结

- [ ] 创建 `/reports/daily`
- [ ] 统计今日工单数量
- [ ] 统计待处理、处理中、待确认数量
- [ ] 创建 `POST /api/ai/daily-summary`
- [ ] 根据工单数据生成日报总结
- [ ] 展示“AI 总结 + 原始数据”

## 阶段 10：求职作品包装

- [ ] 更新 README，写清楚项目定位
- [ ] 写项目亮点：Nuxt 全栈、AI 工单、登录鉴权、通知、移动端
- [ ] 写演示账号
- [ ] 写本地启动步骤
- [ ] 写部署说明
- [ ] 录制 2 分钟演示视频脚本
- [ ] 准备面试讲解词

## 每次学习固定流程

1. 读这个文件。
2. 找到第一个未完成任务。
3. 只围绕这个任务改代码。
4. 改完运行：

```bash
npm run typecheck
npm run build
```

5. 通过后把任务打勾。
6. 在“学习记录”里写一句。

## 学习记录

- 2026-05-22：创建 AI 工单草稿接口，前端可以调用后端生成结构化草稿。
- 2026-05-22：AI 草稿支持一键保存为正式工单，形成“AI 草稿 -> 工单列表”的业务闭环。
- 2026-05-22：简化 `work-order-draft.post.ts`，去掉无用推断逻辑，保留最小后端接口示例。
- 2026-05-22：新增本学习清单，并在 `AGENTS.md` 中要求每次开始前先读取。
- 2026-05-22：学习 Nuxt `server/middleware`，新增服务端 API 鉴权中间件，统一保护除 `/api/login` 之外的接口。
- 2026-05-22：整理服务端鉴权结构，把 mock 用户、token、cookie 名和 API 白名单集中到 `server/data/auth.ts`，middleware 负责统一鉴权并写入 `event.context.currentUser`。
- 2026-05-22：完成工单详情页状态流转，支持“待处理 -> 处理中 -> 待确认”，并补充服务端状态参数校验。
- 2026-05-22：增加工单处理记录，创建工单和状态流转都会写入记录，详情页用时间线展示处理过程。
- 2026-05-22：增加系统操作日志，创建工单和状态流转会写入日志，并在系统日志页面展示。
- 2026-05-22：给工单增加来源字段，普通创建标记为“手动创建”，AI 草稿保存标记为“AI 草稿”，列表和详情页均可展示来源。
- 2026-05-22：把 AI 草稿建议从工单描述中拆出为结构化 `aiSuggestion`，详情页单独展示 AI 建议和人工处理记录。
- 2026-05-25：接入 Vercel AI SDK，通过阿里百炼 OpenAI 兼容接口调用通义千问，并使用 `zod` 约束 AI 稳定返回工单草稿 JSON。
- 2026-05-26：完成站内通知闭环，新增通知类型、mock 数据、查询/已读接口，并在工单创建和状态流转后生成 header 未读通知。
- 2026-06-04：安装并初始化 Prisma，配置 MySQL 数据源读取 `DATABASE_URL`，并通过 `npx prisma validate` 校验。
- 2026-06-04：通过 Prisma migration 创建 MySQL `users` 表，包含用户名、密码哈希、昵称、角色和创建/更新时间字段。
- 2026-06-04：向 `users` 表写入 `admin` 演示账号，并把登录接口改为通过 Prisma 查询 MySQL 用户和校验密码哈希。
- 2026-06-04：将登录密码校验从简单演示哈希升级为 bcrypt 单向哈希，并更新 `admin` 账号的 `password_hash`。
- 2026-06-04：新增账号管理页面和 `/api/users` 接口，只有 `super_admin` 可以创建账号，新账号密码继续写入 bcrypt 哈希。
- 2026-06-04：新增后端登录、token、账号创建流程说明文档，并给关键后端文件补充学习注释。
- 2026-06-05：安装 Redis 客户端依赖，给登录 session 增加 Redis 存储模式，并新增 Redis 保存 token 的项目学习文档。
- 2026-06-05：新增 Redis 安装和 Navicat Premium 17 连接教程，说明本地启动 Redis、配置 `.env`、查看登录 session key 的步骤。
- 2026-06-05：清理登录 session 的内存存储分支，只保留 Redis 保存 token，降低学习成本。
- 2026-06-05：设计 `work_orders` 表的 Prisma 模型，明确 type、status、priority、source 使用数字值保存，前端负责翻译中文。
