# Day 1：Vue 开发者上手 Nuxt 约定

你已经会 Vue，所以今天不讲 `ref`、`computed`、组件通信这些基础。今天只关注 Nuxt 和普通 Vue 项目的区别。

## 今日目标

- 理解 Nuxt 的文件约定。
- 手敲 `app.vue`、`layouts/default.vue`、`pages/`。
- 理解 Nuxt 自动路由、默认布局、全局配置。
- 知道 Nuxt 里的 Vite 配置写在哪里。

## 第 1 步：启动项目

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

## 第 2 步：先看 Nuxt 项目目录

重点看这些目录：

```text
app.vue                 # 应用最外层入口
layouts/default.vue     # 默认布局
pages/index.vue         # / 路由
pages/about.vue         # /about 路由
pages/login.vue         # /login 路由
middleware/             # 路由中间件
server/api/             # 服务端 API
composables/            # 自动导入组合式函数
nuxt.config.ts          # Nuxt 配置，也能写 Vite 配置
```

Vue 项目通常要你自己配 `vue-router`。Nuxt 的核心差异是：文件结构就是框架约定。

## 第 3 步：跟敲 app.vue

把 `app.vue` 理解成 Nuxt 的全局入口：

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

重点：

- `NuxtLayout` 渲染当前页面使用的布局。
- `NuxtPage` 渲染当前路由匹配到的页面。
- Vue 里你常写 `<RouterView />`，Nuxt 里对应的是 `<NuxtPage />`。

## 第 4 步：跟敲默认布局

创建 `layouts/default.vue`：

```vue
<template>
  <div class="app-shell">
    <header class="site-header">
      <NuxtLink class="brand" to="/">Nuxt Vite Study</NuxtLink>

      <nav class="site-nav" aria-label="主导航">
        <NuxtLink to="/">首页</NuxtLink>
        <NuxtLink to="/about">关于 Nuxt</NuxtLink>
        <NuxtLink to="/login">登录</NuxtLink>
        <NuxtLink to="/dashboard">控制台</NuxtLink>
        <NuxtLink to="/admin">权限页</NuxtLink>
      </nav>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>
```

重点：

- `layouts/default.vue` 是默认布局。
- 页面内容会通过 `<slot />` 注入布局。
- 多数真实 Nuxt 项目会把导航、侧边栏、页面外壳放在 layout，而不是放在每个页面里。

## 第 5 步：理解 pages 自动路由

Nuxt 根据 `pages/` 自动生成路由：

```text
pages/index.vue       -> /
pages/about.vue       -> /about
pages/login.vue       -> /login
pages/admin.vue       -> /admin
pages/posts/[id].vue  -> /posts/:id
```

你不用手写 `createRouter`。

练习：新增文件 `pages/posts/[id].vue`：

```vue
<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <section class="content">
    <h1>文章详情</h1>
    <p>当前文章 ID：{{ route.params.id }}</p>
  </section>
</template>
```

访问：

```text
http://localhost:3000/posts/100
```

## 第 6 步：看 nuxt.config.ts

Nuxt 项目没有单独的 `vite.config.ts` 也正常，因为 Nuxt 默认使用 Vite。Vite 配置写在：

```ts
export default defineNuxtConfig({
  vite: {
    server: {
      host: '0.0.0.0'
    }
  }
})
```

重点：

- Nuxt 负责应用约定、SSR、路由、server API。
- Vite 负责开发服务器、热更新、构建。
- 在 Nuxt 项目里，先改 `nuxt.config.ts`，不要急着新建 `vite.config.ts`。

## 今日验收

你要能说清楚：

- `app.vue` 和 `layouts/default.vue` 的区别。
- `NuxtPage` 和 Vue Router 的 `RouterView` 有什么关系。
- 为什么新建 `pages/about.vue` 后自动有 `/about`。
- Nuxt 项目里 Vite 配置写在哪里。

## 今日作业

- 新增 `pages/posts/[id].vue`。
- 新增 `layouts/admin.vue`。
- 让 `pages/admin.vue` 使用 `admin` layout。
- 把导航里的“权限页”改成只有管理员登录后才显示。
