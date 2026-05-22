# Day 2：Nuxt 数据获取、Server API 与登录会话

你已经会 Vue 的表单和状态管理，今天重点学 Nuxt 的服务端能力：`server/api`、`useFetch`、`$fetch`、cookie 会话。

## 今日目标

- 理解 Nuxt 的 `server/api` 是什么。
- 手敲登录接口、当前用户接口、退出接口。
- 理解 SSR 场景下为什么要转发 cookie。
- 用 `useAuth` 管理登录状态。

## 第 1 步：理解 server/api

Nuxt 里这个文件：

```text
server/api/hello.get.ts
```

会自动变成：

```text
GET /api/hello
```

规则示例：

```text
server/api/auth/login.post.ts   -> POST /api/auth/login
server/api/auth/me.get.ts       -> GET /api/auth/me
server/api/auth/logout.post.ts  -> POST /api/auth/logout
```

这就是 Nuxt 和普通 Vue SPA 的关键区别：Nuxt 可以同时写前端页面和后端接口。

## 第 2 步：手敲用户数据

创建 `server/utils/users.ts`：

```ts
export type UserRole = 'admin' | 'user'

export interface DemoUser {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
}

export interface PublicUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export const demoUsers: DemoUser[] = [
  {
    id: 'u_1001',
    name: '学习用户',
    email: 'student@example.com',
    password: '123456',
    role: 'user'
  },
  {
    id: 'u_1002',
    name: '管理员',
    email: 'admin@example.com',
    password: '123456',
    role: 'admin'
  }
]

export function toPublicUser(user: DemoUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  }
}

export function findUserByEmail(email: string) {
  return demoUsers.find((user) => user.email === email)
}

export function findUserById(id: string) {
  return demoUsers.find((user) => user.id === id)
}
```

重点：`DemoUser` 有密码，`PublicUser` 没有密码。接口返回给前端时必须脱敏。

## 第 3 步：手敲登录接口

创建 `server/api/auth/login.post.ts`：

```ts
import { findUserByEmail, toPublicUser } from '../../utils/users'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)

  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: '请输入邮箱和密码'
    })
  }

  const user = findUserByEmail(body.email)

  if (!user || user.password !== body.password) {
    throw createError({
      statusCode: 401,
      statusMessage: '邮箱或密码错误'
    })
  }

  setCookie(event, 'study_token', `demo-token:${user.id}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24
  })

  return {
    user: toPublicUser(user)
  }
})
```

Nuxt API 里常用这些函数：

- `defineEventHandler`：定义接口处理函数。
- `readBody`：读取 POST body。
- `createError`：抛出 HTTP 错误。
- `setCookie`：写 cookie。
- `getCookie`：读 cookie。

## 第 4 步：手敲当前用户接口

创建 `server/api/auth/me.get.ts`：

```ts
import { findUserById, toPublicUser } from '../../utils/users'

export default defineEventHandler((event) => {
  const token = getCookie(event, 'study_token')
  const userId = token?.replace('demo-token:', '')

  if (!userId) {
    return {
      user: null
    }
  }

  const user = findUserById(userId)

  return {
    user: user ? toPublicUser(user) : null
  }
})
```

这个接口的作用：刷新页面后，前端可以问服务端“我是谁”。

## 第 5 步：手敲 useAuth

创建 `composables/useAuth.ts`：

```ts
import type { PublicUser } from '~/server/utils/users'

export function useAuth() {
  const user = useState<PublicUser | null>('auth:user', () => null)
  const loading = useState('auth:loading', () => false)

  const isLoggedIn = computed(() => Boolean(user.value))
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function fetchUser() {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
    const data = await $fetch<{ user: PublicUser | null }>('/api/auth/me', {
      headers
    })

    user.value = data.user
    return user.value
  }

  async function login(email: string, password: string) {
    loading.value = true

    try {
      const data = await $fetch<{ user: PublicUser }>('/api/auth/login', {
        method: 'POST',
        body: {
          email,
          password
        }
      })

      user.value = data.user
      return data.user
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })

    user.value = null
    await navigateTo('/login')
  }

  return {
    user,
    loading,
    isLoggedIn,
    isAdmin,
    fetchUser,
    login,
    logout
  }
}
```

重点理解这一行：

```ts
const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
```

SSR 时，代码跑在服务端。服务端调用 `/api/auth/me` 时不会自动带上浏览器 cookie，所以要手动把当前请求里的 cookie 转发过去。

## 第 6 步：useFetch 和 $fetch 的区别

简单记：

- 页面初始化拿数据：优先 `useFetch` 或 `useAsyncData`。
- 事件里发请求，比如点击登录：用 `$fetch`。

例子：

```ts
const { data, pending, error } = await useFetch('/api/hello')
```

```ts
await $fetch('/api/auth/login', {
  method: 'POST',
  body: {
    email,
    password
  }
})
```

## 今日验收

你要能完成：

- 访问 `/login`。
- 用 `student@example.com / 123456` 登录。
- 登录后跳转到 `/dashboard`。
- 刷新页面后仍然能看到当前用户。
- 调用 `/api/auth/me` 能返回当前登录用户。

## 今日作业

- 给登录接口加最简单的邮箱格式校验。
- 把登录失败的错误信息显示到页面上。
- 新增 `server/api/auth/register.post.ts`，模拟注册接口。
- 思考：为什么真实项目不能明文保存密码？
