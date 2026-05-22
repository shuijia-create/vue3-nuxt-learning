# Nuxt SSR 后台学习项目

这是一个用于学习 Nuxt 4、Vue 3、TypeScript、Element Plus、文件路由、layout、middleware、`server/api` 和登录鉴权的小型后台项目。

项目目标不是做复杂后台模板，而是用尽量少的代码把“登录后才能看到后台首页”的完整链路跑通。

## 启动项目

```bash
npm install
npm run dev
```

访问登录页：

```text
http://localhost:3000/login?redirect=/dashboard
```

默认账号：

```text
admin / 123456
```

## 页面结构

```text
app.vue
├─ layouts/auth.vue
│  └─ pages/login.vue
└─ layouts/admin.vue
   ├─ pages/dashboard.vue
   ├─ pages/work-orders/index.vue
   ├─ pages/work-orders/[id].vue
   ├─ pages/ai/work-order-draft.vue
   └─ pages/ai/knowledge.vue
```

- `pages/login.vue`：登录页，使用 `auth` 布局。
- `layouts/admin.vue`：后台主布局，左侧是菜单，右侧是 header 和 content。
- `pages/dashboard.vue`：登录成功后默认进入的工作台。
- `pages/work-orders/index.vue`：工单列表页面，通过 mock API 渲染表格。
- `pages/work-orders/[id].vue`：工单详情页面，通过动态路由 id 查询单条工单。
- `pages/ai/work-order-draft.vue`：AI 工单草稿助手占位页面。
- `pages/ai/knowledge.vue`：企业文档问答占位页面。

后台左侧菜单写在：

```text
components/SidebarMenu.vue
```

顶部页面标签写在：

```text
components/PageTabs.vue
stores/page-tabs.ts
utils/admin-page-title.ts
```

当前菜单包含：

```text
/dashboard              工作台
/work-orders            工单列表
/ai/work-order-draft    工单草稿助手
/ai/knowledge           企业文档问答
```

`el-menu` 上开启了 `router`，所以 `el-menu-item` 的 `index` 会被 Element Plus 当成路由地址处理。

### 顶部页面标签栏

后台布局里现在有一个页面标签栏：

```text
layouts/admin.vue
  ├─ SidebarMenu
  ├─ PageTabs
  └─ 页面内容 slot
```

每次进入后台页面时，`PageTabs` 会监听当前路由：

```ts
watch(
  () => route.fullPath,
  () => addCurrentRouteTab(),
  { immediate: true }
)
```

然后把当前页面加入 Pinia store：

```ts
tabsStore.addTab({
  title: getAdminPageTitle(route.path),
  path: route.path,
  fullPath: route.fullPath
})
```

这里分清两个值：

```text
route.path      不带 query，用来判断是不是同一个 tag，比如 /work-orders
route.fullPath  带 query，用来保存真实跳转地址，比如 /work-orders?status=待处理
```

如果某个页面本身带 query，地址可能是：

```text
/work-orders?type=设备故障&status=待处理
```

顶部 tag 仍然应该只有一个“工单列表”。因为标签栏用 `route.path` 去重，只把 `route.fullPath` 更新成最新跳转地址。

标签数据存在：

```text
stores/page-tabs.ts
```

页面标题映射存在：

```text
utils/admin-page-title.ts
```

点击标签时执行：

```ts
navigateTo(tab.path)
```

所以点击顶部 tag 可以回到对应页面。关闭当前激活 tag 时，会自动跳到相邻的 tag。

### 页面标签持久化

页面标签现在会存到浏览器本地：

```text
localStorage
  key: nuxt-admin-page-tabs
```

项目已经安装了 Pinia：

```json
"pinia": "^3.0.4",
"@pinia/nuxt": "^0.11.2"
```

所以这里没有额外安装持久化插件，而是在 `stores/page-tabs.ts` 里手写了保存和恢复逻辑。

添加标签时会保存：

```ts
function addTab(tab: PageTab) {
  const exists = tabs.value.some((item) => item.path === tab.path)

  if (!exists) {
    tabs.value.push(tab)
    persistTabs()
  }
}
```

页面刷新后，`PageTabs` 会在客户端恢复标签：

```ts
onMounted(() => {
  tabsStore.restoreTabs()
  addCurrentRouteTab()
})
```

这里要注意 SSR：

```text
localStorage 只存在浏览器里
服务端渲染阶段不能读取 localStorage
```

所以恢复标签必须放在 `onMounted()` 里执行。`onMounted()` 只会在浏览器端执行，不会在服务端执行。

阅读标签栏代码时，建议按这个顺序看：

```text
stores/page-tabs.ts
  先看 tabs 数据、restoreTabs、persistTabs
components/PageTabs.vue
  再看 route 监听、addCurrentRouteTab、closeTab
layouts/admin.vue
  最后看 PageTabs 放在后台布局的哪个位置
```

代码里已经补了学习注释，重点看三件事：

- 为什么恢复标签要放在 `onMounted()`。
- 为什么用 `route.path` 去重，用 `route.fullPath` 跳转。
- 关闭当前 tag 后，为什么要找右侧或左侧相邻 tag 跳转。

### 本节学习：defineStore 逻辑

Pinia 的 `defineStore()` 可以先理解成：

```text
创建一个可以被多个组件共用的响应式数据仓库
```

当前页面标签栏的 store 在：

```text
stores/page-tabs.ts
```

核心结构是：

```ts
export const usePageTabsStore = defineStore('page-tabs', () => {
  const tabs = ref<PageTab[]>([])

  function addTab(tab: PageTab) {}
  function removeTab(path: string) {}

  return {
    tabs,
    addTab,
    removeTab
  }
})
```

拆开看：

```ts
defineStore('page-tabs', () => {})
```

`page-tabs` 是这个 store 的名字。Pinia 用它区分不同 store，比如：

```text
auth       登录状态 store
page-tabs  页面标签 store
```

```ts
const tabs = ref<PageTab[]>([])
```

这是 store 里的状态。它不是某个组件自己的数据，而是所有使用这个 store 的组件都能访问的数据。

```ts
function addTab(tab: PageTab) {}
function removeTab(path: string) {}
```

这是修改状态的方法。组件不要到处直接乱改 `tabs`，而是通过这些方法表达业务动作：

```text
进入页面  -> addTab
关闭标签  -> removeTab
刷新恢复  -> restoreTabs
```

最后的 `return` 很重要：

```ts
return {
  tabs,
  restoreTabs,
  addTab,
  removeTab
}
```

只有 return 出去的内容，组件里才能用。

组件里这样拿 store：

```ts
const tabsStore = usePageTabsStore()
```

然后使用状态：

```vue
<el-tag v-for="tab in tabsStore.tabs" :key="tab.path">
  {{ tab.title }}
</el-tag>
```

调用方法：

```ts
tabsStore.addTab({
  title: '工单列表',
  path: '/work-orders',
  fullPath: '/work-orders?status=待处理'
})
```

所以这条线要记住：

```text
defineStore 创建 store
  ↓
ref 定义状态
  ↓
function 定义修改状态的方法
  ↓
return 暴露给组件
  ↓
组件 usePageTabsStore() 使用
```

对比普通组件里的 `ref`：

```text
组件里的 ref        只给当前组件用
defineStore 里的 ref  可以给多个组件共用
```

## 今日新增：工单列表 v1 闭环

这一版先不接数据库，也不接真实 AI，目标是跑通最小链路：

```text
页面 /work-orders
  ↓ useFetch('/api/work-orders')
server/api/work-orders/index.get.ts
  ↓ 读取 mock 数据
server/data/work-orders.ts
  ↓ 返回 list
BaseTable 渲染表格
```

### mock 工单数据

数据文件：

```text
server/data/work-orders.ts
```

当前包含 3 条 mock 工单：

- 设备故障：`2 号线混料设备温度偏高`
- IT 问题：`质检电脑无法连接内网`
- 质量异常：`包装批次标签信息不一致`

### 工单列表接口

接口文件：

```text
server/api/work-orders/index.get.ts
```

访问地址：

```text
GET /api/work-orders
```

返回结构：

```ts
{
  list: WorkOrder[]
}
```

### 工单列表页面

页面文件：

```text
pages/work-orders/index.vue
```

页面用 `useFetch` 获取数据：

```ts
const { data, pending, error } = await useFetch<{ list: WorkOrder[] }>('/api/work-orders')
```

然后把数据交给 `BaseTable`：

```vue
<BaseTable
  :model-value="tableData"
  :columns="columns"
  :loading="pending"
  row-key="id"
/>
```

这里的 `columns` 决定表格显示哪些列，`tableData` 是接口返回的工单数组。

### 本节学习：server/api 参数

Nuxt 的 `server/api` 可以直接写后端接口。当前工单模块里已经有三种常见写法：

```text
GET  /api/work-orders?type=设备故障&status=待处理
POST /api/work-orders/add
GET  /api/work-orders/detail/:id
```

#### 1. 列表接口：不需要参数

接口文件：

```text
server/api/work-orders/index.get.ts
```

文件名里的 `index.get.ts` 表示：

```text
GET /api/work-orders
```

这个接口只是读取 mock 数据并返回：

```ts
export default defineEventHandler(() => {
  return {
    list: workOrders
  }
})
```

列表接口现在也支持 query 筛选：

```text
GET /api/work-orders?type=设备故障&status=待处理
```

服务端用 `getQuery(event)` 获取 URL 上的 query：

```ts
const query = getQuery(event)
const type = isWorkOrderType(query.type) ? query.type : undefined
const status = isWorkOrderStatus(query.status) ? query.status : undefined
```

然后根据 query 过滤 mock 数据：

```ts
const list = workOrders.filter((item) => {
  const matchedType = type ? item.type === type : true
  const matchedStatus = status ? item.status === status : true

  return matchedType && matchedStatus
})
```

这里要注意：URL query 是用户可以随便改的，所以服务端不要直接相信它。代码里用 `isWorkOrderType()` 和 `isWorkOrderStatus()` 做了一次合法值判断。

#### 2. 新增接口：读取 body

接口文件：

```text
server/api/work-orders/add/index.post.ts
```

文件路径对应：

```text
POST /api/work-orders/add
```

前端提交时用 `$fetch`：

```ts
await $fetch('/api/work-orders/add', {
  method: 'POST',
  body: {
    title: createForm.title,
    type: createForm.type,
    submitter: createForm.submitter,
    description: createForm.description
  }
})
```

服务端用 `readBody(event)` 接收前端传过来的数据：

```ts
const body = await readBody<CreateWorkOrderBody>(event)
```

注意：前端做了表单校验，服务端仍然要校验。因为用户可以绕过页面，直接用接口工具请求后端接口。

#### 3. 详情接口：读取动态路由参数

接口文件：

```text
server/api/work-orders/detail/[id].get.ts
```

`[id].get.ts` 表示这里的 `id` 是动态参数：

```text
GET /api/work-orders/detail/1
GET /api/work-orders/detail/2
```

服务端用 `getRouterParam(event, 'id')` 获取这个参数：

```ts
const id = getRouterParam(event, 'id')
```

然后根据 id 从 mock 数据里查找工单：

```ts
const workOrder = workOrders.find(workOrder => workOrder.id === id)
```

如果查不到，使用 `createError()` 返回错误：

```ts
throw createError({
  statusCode: 404,
  statusMessage: '工单不存在'
})
```

#### 4. useFetch 和 refresh

列表页现在这样写：

```ts
const { data, pending, error, refresh } = await useFetch<{ list: WorkOrder[] }>('/api/work-orders', {
  query: requestQuery,
  watch: false
})
```

这行代码在页面进入时会自动请求一次 `GET /api/work-orders`。

- `data`：接口返回的数据。
- `pending`：请求是否还在加载中。
- `error`：请求失败时的错误信息。
- `refresh`：重新请求同一个接口。

当前列表页把“真正提交给接口的查询参数”单独存在 `requestQuery` 里：

```ts
const requestQuery = ref({
  type: undefined,
  status: undefined
})
```

点击查询时，不跳转页面，也不靠 `computed` 自动计算，而是在按钮事件里组装本次请求参数：

```ts
requestQuery.value = {
  type: filterForm.type || undefined,
  status: filterForm.status || undefined
}

await refresh()
```

这里加 `watch: false` 是为了避免选择下拉框时自动请求。只有点击“查询”按钮时，才通过 `refresh()` 重新请求列表接口。

新增工单成功后调用：

```ts
await refresh()
```

它不会创建新接口，只是重新请求当前这条 `GET /api/work-orders`，所以表格能看到最新数据。

当前新增工单的完整链路是：

```text
点击“提交”
  ↓ handleCreateSubmit()
POST /api/work-orders/add
  ↓ 服务端 readBody(event)
  ↓ 服务端校验并写入 mock 数组
await refresh()
  ↓ 重新请求 GET /api/work-orders
BaseTable 重新渲染列表
```

### 本节补课：返回错误、useAsyncData、defineNuxtConfig

这三个知识点属于 Nuxt 的不同层：

```text
defineNuxtConfig  项目配置层
useFetch/useAsyncData  页面取数据层
createError       服务端接口错误层
```

#### 1. 服务端怎么返回错误

在 `server/api` 里，接口不能只返回成功数据，也要能返回失败原因。

比如工单详情接口：

```text
server/api/work-orders/detail/[id].get.ts
```

如果传进来的 id 找不到工单，服务端应该返回 404：

```ts
throw createError({
  statusCode: 404,
  statusMessage: '工单不存在'
})
```

这里的意思是：

- `throw`：中断当前接口，不继续往下执行。
- `createError()`：创建一个 Nuxt/Nitro 能识别的接口错误。
- `statusCode: 404`：告诉前端这是“资源不存在”。
- `statusMessage`：给前端或调试时看的错误信息。

前端用 `useFetch` 请求时，错误会进入 `error`：

```ts
const { data, error } = await useFetch('/api/work-orders/detail/不存在的id')
```

所以页面里可以根据 `error` 显示错误提示。

#### 2. useFetch 和 useAsyncData 的关系

你现在主要用的是 `useFetch`：

```ts
const { data } = await useFetch('/api/work-orders')
```

它适合直接请求一个接口地址。

`useAsyncData` 更底层一点，适合你自己包一段异步逻辑：

```ts
const { data } = await useAsyncData('work-orders', () => {
  return $fetch('/api/work-orders')
})
```

可以先这样理解：

```text
useFetch('/api/work-orders')
≈
useAsyncData('某个key', () => $fetch('/api/work-orders'))
```

所以当前阶段先掌握 `useFetch` 就够了。等后面需要“一个页面里组合多个接口数据”，再重点学 `useAsyncData`。

#### 3. defineNuxtConfig 是什么

项目根目录有：

```text
nuxt.config.ts
```

里面第一行就是：

```ts
export default defineNuxtConfig({
  // Nuxt 项目配置
})
```

`defineNuxtConfig()` 是 Nuxt 提供的配置函数。它不是页面代码，也不是接口代码，而是整个项目的总配置入口。

当前项目里主要配置了这些内容：

```ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css', 'element-plus/dist/index.css'],
  typescript: {
    strict: true,
    typeCheck: true
  },
  app: {
    head: {
      title: 'Nuxt 后台学习项目'
    }
  }
})
```

对应含义：

- `modules`：启用 Nuxt 模块，这里启用了 Pinia。
- `css`：全局样式入口。
- `typescript`：TypeScript 检查配置。
- `app.head`：页面默认标题、meta 信息。

后面接 AI 时，还会在这里学 `runtimeConfig`，用来放接口密钥和后端环境变量。

### 本节学习：页面标题 useHead

Nuxt 里页面标题分两层：

```text
nuxt.config.ts       全站默认标题
pages/*.vue useHead  当前页面标题
```

项目默认标题写在：

```text
nuxt.config.ts
```

```ts
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Nuxt 后台学习项目'
    }
  }
})
```

单个页面要改浏览器 tab 标题，用 `useHead()`：

```ts
useHead({
  title: '工单列表 - Nuxt 后台学习项目'
})
```

当前项目已经给这些页面加了标题：

```text
pages/login.vue
pages/dashboard.vue
pages/work-orders/index.vue
pages/work-orders/[id].vue
pages/ai/work-order-draft.vue
pages/ai/knowledge.vue
```

普通页面标题是固定的，比如：

```ts
useHead({
  title: '工作台 - Nuxt 后台学习项目'
})
```

详情页标题可以依赖接口数据：

```ts
useHead(() => ({
  title: workOrder.value
    ? `${workOrder.value.title} - 工单详情`
    : '工单详情 - Nuxt 后台学习项目'
}))
```

这里传给 `useHead` 的是一个函数，所以当 `workOrder.value` 变化时，页面标题也可以跟着更新。

`definePageMeta()` 和 `useHead()` 不一样：

```text
definePageMeta  配置 Nuxt 页面规则，比如 layout、middleware
useHead         配置 HTML head，比如 title、meta
```

### AI 页面当前状态

这两个页面现在是占位版，不调用真实 AI：

```text
pages/ai/work-order-draft.vue
pages/ai/knowledge.vue
```

- 工单草稿助手：展示问题输入框和 mock 结构化草稿。
- 企业文档问答：展示问题输入框、mock 回答和引用来源。

页面里保留了 AI 边界提示：

```text
AI 输出仅用于资料检索和记录草稿，不作为最终安全、质量或生产处置结论。
```

## 登录鉴权逻辑

### 1. 未登录访问后台页面

用户访问：

```text
/work-orders
```

会先进入全局路由中间件：

```text
middleware/auth.global.ts
```

中间件读取 cookie：

```ts
const token = useCookie<string | null>('nuxt-admin-token')
```

如果没有 token，并且访问的不是 `/login`，就跳转到登录页：

```text
/login?redirect=/work-orders
```

这里的 `redirect` 用来记录“登录成功后应该回到哪里”。

### 2. 登录页提交账号密码

登录页调用 Pinia store：

```text
pages/login.vue
stores/auth.ts
```

`auth.login()` 请求服务端接口：

```text
POST /api/login
```

接口文件：

```text
server/api/login.post.ts
```

当前 mock 规则是：

- 用户名：`admin`
- 密码：`123456`

账号密码正确时，服务端写入 cookie：

```ts
setCookie(event, 'nuxt-admin-token', demoToken, {
  path: '/',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24
})
```

然后返回 token 和用户信息。

### 3. 登录成功后进入后台

登录成功后，前端读取 URL 里的 `redirect`：

```text
/login?redirect=/work-orders
```

然后跳转到：

```text
/work-orders
```

如果 URL 没有带 `redirect`，默认进入：

```text
/dashboard
```

### 4. 后台布局读取当前用户

后台页面使用：

```text
layouts/admin.vue
```

布局中会调用：

```ts
await callOnce('current-user', () => auth.fetchMe())
```

`auth.fetchMe()` 请求：

```text
GET /api/me
```

接口文件：

```text
server/api/me.get.ts
```

服务端会检查 cookie 里的 `nuxt-admin-token`。如果 token 不正确，返回 401；如果正确，返回当前用户信息。

这里有一个 Nuxt SSR 重点：

```ts
const requestFetch = import.meta.server ? useRequestFetch() : $fetch
```

SSR 阶段在服务端内部请求 `/api/me` 时，需要用 `useRequestFetch()` 转发当前浏览器请求里的 cookie。否则服务端内部请求拿不到登录态，会误判为未登录。

### 5. 退出登录

点击 header 里的“退出登录”按钮，会调用：

```text
POST /api/logout
```

接口文件：

```text
server/api/logout.post.ts
```

服务端删除 cookie，前端清空 store，然后跳回 `/login`。

## SSR 在这里的作用

SSR 是 Server-Side Rendering，服务端渲染。

在这个项目里，SSR 主要用于学习：

- 页面首次进入时，服务端也会执行路由中间件。
- 登录状态不能只存在浏览器内存里，需要放在 cookie 中。
- 服务端接口可以通过 cookie 判断用户是否真的登录。
- 服务端渲染后台页面时，内部请求 `/api/me` 要转发 cookie。

所以这个项目不使用 hash 路由，而是使用 Nuxt 标准路由：

```text
/login?redirect=/dashboard
```

## 文件职责

```text
nuxt.config.ts
```

配置 Nuxt、Pinia、Element Plus 样式和 TypeScript。

```text
plugins/element-plus.ts
```

注册 Element Plus 和 Element Plus 图标。

```text
middleware/auth.global.ts
```

页面访问拦截：未登录跳登录页，已登录访问登录页则跳后台页。

```text
stores/auth.ts
```

管理登录状态，封装登录、获取当前用户、退出登录。

```text
server/api/login.post.ts
```

mock 登录接口，校验账号密码并写入 cookie。

```text
server/api/me.get.ts
```

mock 当前用户接口，校验 cookie 后返回用户信息。

```text
server/api/logout.post.ts
```

mock 退出接口，删除登录 cookie。

```text
server/data/work-orders.ts
server/api/work-orders/index.get.ts
server/api/work-orders/add/index.post.ts
server/api/work-orders/detail/[id].get.ts
```

mock 工单数据、工单列表接口、新增接口和详情接口。页面通过 `GET /api/work-orders` 获取列表，通过 `POST /api/work-orders/add` 新增工单，通过 `GET /api/work-orders/detail/:id` 获取详情。

## 推荐学习顺序

1. 先看 `pages/login.vue`，理解登录表单如何提交。
2. 再看 `server/api/login.post.ts`，理解服务端如何写 cookie。
3. 再看 `middleware/auth.global.ts`，理解页面跳转拦截。
4. 再看 `layouts/admin.vue`，理解登录后后台布局如何读取用户信息。
5. 再看 `pages/work-orders/index.vue`，理解页面如何用 `useFetch` 调接口并交给 `BaseTable` 渲染。
6. 再看 `server/api/work-orders/add/index.post.ts`，理解 `readBody(event)` 如何接收 POST 参数。
7. 再看 `server/api/work-orders/detail/[id].get.ts`，理解 `getRouterParam(event, 'id')` 如何接收动态路由参数。
8. 最后看 `stores/auth.ts`，理解 Pinia 如何连接页面和接口。

## 验证命令

```bash
npm run typecheck
npm run build
```

已验证的核心场景：

- 未登录访问 `/work-orders` 会跳转到 `/login?redirect=/work-orders`。
- 输入错误密码，`POST /api/login` 返回 401。
- 输入 `admin / 123456`，登录成功并写入 cookie。
- 登录后访问 `/work-orders` 可以看到后台布局和工单列表内容。
- 登录后刷新页面，SSR 仍能通过 cookie 获取当前用户。
- 退出登录后 cookie 被清除，并返回登录页。
