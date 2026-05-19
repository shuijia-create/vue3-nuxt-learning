<script setup lang="ts">
// useRuntimeConfig 是 Nuxt 提供的组合式 API，用来读取 nuxt.config.ts 中的 runtimeConfig。
const config = useRuntimeConfig()

// useCounter 来自 composables/useCounter.ts。
// Nuxt 会自动导入 composables 目录中的组合式函数，不需要手动 import。
const { count, increase, reset } = useCounter(1)

// useFetch 是 Nuxt 对 fetch 的增强版。
// 在服务端渲染和客户端导航时都能工作，并且会处理数据缓存与响应式状态。
const { data, pending, error, refresh } = await useFetch('/api/hello')
</script>

<template>
  <section class="hero">
    <p class="eyebrow">{{ config.public.appName }}</p>
    <h1>Vue 3 + Nuxt + Vite 学习起点</h1>
    <p class="hero-copy">
      这个项目把 Nuxt 的核心目录、自动导入、页面路由、服务端 API、组合式函数和 Vite 配置放在一起，适合边看代码边练习。
    </p>
  </section>

  <section class="grid">
    <LearningCard title="约定式路由" badge="pages">
      在 <code>pages</code> 目录中创建 Vue 文件，Nuxt 会自动生成路由。
    </LearningCard>

    <LearningCard title="自动导入" badge="imports">
      <code>components</code>、<code>composables</code> 和 Nuxt 内置 API 可以直接使用。
    </LearningCard>

    <LearningCard title="Vite 开发体验" badge="vite">
      Nuxt 默认使用 Vite，支持快速冷启动、热更新和现代前端构建能力。
    </LearningCard>

    <LearningCard title="登录与权限" badge="auth">
      使用服务端 API、httpOnly cookie 和路由中间件实现登录保护与管理员权限页。
    </LearningCard>
  </section>

  <section class="panel">
    <div>
      <h2>组合式函数示例</h2>
      <p>当前计数：{{ count }}</p>
    </div>

    <div class="actions">
      <button type="button" @click="increase">增加</button>
      <button type="button" class="secondary" @click="reset">重置</button>
    </div>
  </section>

  <section class="panel">
    <div>
      <h2>服务端 API 示例</h2>
      <p v-if="pending">正在请求 /api/hello ...</p>
      <p v-else-if="error">请求失败：{{ error.message }}</p>
      <p v-else>{{ data?.message }}</p>
    </div>

    <button type="button" @click="refresh()">重新请求</button>
  </section>
</template>
