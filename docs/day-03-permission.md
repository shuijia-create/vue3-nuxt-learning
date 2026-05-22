# Day 3：Nuxt Middleware、页面权限与服务端权限边界

今天学 Nuxt 权限。你会 Vue 的路由守卫，所以可以把 Nuxt middleware 理解成 Nuxt 版路由守卫，但它同时要考虑 SSR。

## 今日目标

- 手敲 `middleware/auth.ts`。
- 手敲 `middleware/admin.ts`。
- 理解页面权限和接口权限的区别。
- 知道 Nuxt 权限代码在服务端渲染时也会执行。

## 第 1 步：理解 Nuxt middleware 类型

Nuxt 常见 middleware 有两种：

```text
middleware/auth.ts       # 命名中间件，页面声明后才使用
middleware/global.ts     # 全局中间件，每次路由都会执行
```

本项目用命名中间件，因为权限逻辑只应该作用于需要保护的页面。

## 第 2 步：手敲登录保护中间件

创建 `middleware/auth.ts`：

```ts
export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchUser } = useAuth()

  if (!user.value) {
    await fetchUser()
  }

  if (!user.value) {
    return navigateTo('/login')
  }
})
```

重点：

- `defineNuxtRouteMiddleware` 定义路由中间件。
- `navigateTo('/login')` 做重定向。
- 先 `fetchUser()` 是为了处理刷新页面后内存状态丢失的问题。

## 第 3 步：在页面使用 middleware

打开 `pages/dashboard.vue`：

```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user, logout } = useAuth()
</script>
```

重点：

- `definePageMeta` 是 Nuxt 页面元信息。
- `middleware: 'auth'` 对应 `middleware/auth.ts`。
- 未登录访问 `/dashboard` 会跳转到 `/login`。

## 第 4 步：手敲管理员中间件

创建 `middleware/admin.ts`：

```ts
export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchUser } = useAuth()

  if (!user.value) {
    await fetchUser()
  }

  if (user.value?.role !== 'admin') {
    return navigateTo('/dashboard')
  }
})
```

普通登录保护只判断“有没有登录”。管理员权限要继续判断 `role`。

## 第 5 步：页面叠加多个中间件

打开 `pages/admin.vue`：

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})

const { user } = useAuth()
</script>
```

重点：

- 可以给一个页面配置多个 middleware。
- `auth` 负责登录态。
- `admin` 负责角色。

## 第 6 步：验收权限

普通用户：

```text
student@example.com
123456
```

访问 `/admin`，应该回到 `/dashboard`。

管理员：

```text
admin@example.com
123456
```

访问 `/admin`，应该看到管理员权限页。

## 第 7 步：前端权限和服务端权限边界

你要记住这条：

```text
页面 middleware 只负责用户体验，真正的数据权限必须在 server/api 再判断一次。
```

比如真实项目中，下面这种接口也要做权限判断：

```text
POST /api/admin/users/delete
```

不能因为前端隐藏了按钮，就认为普通用户无法调用接口。

服务端接口里通常会这样做：

```ts
const token = getCookie(event, 'study_token')
const userId = token?.replace('demo-token:', '')
const user = userId ? findUserById(userId) : null

if (user?.role !== 'admin') {
  throw createError({
    statusCode: 403,
    statusMessage: '没有权限'
  })
}
```

## 今日作业

- 新增 `server/api/admin/stats.get.ts`。
- 只有管理员能访问这个接口。
- 普通用户访问时返回 403。
- 在 `/admin` 页面用 `useFetch('/api/admin/stats')` 显示统计数据。

## 你现在应该掌握的 Nuxt 点

- 文件路由：`pages/`
- 布局：`layouts/`
- 服务端 API：`server/api/`
- 全局状态：`useState`
- 数据请求：`useFetch`、`$fetch`
- 路由中间件：`middleware/`
- 页面元信息：`definePageMeta`
- SSR cookie 转发：`useRequestHeaders(['cookie'])`
