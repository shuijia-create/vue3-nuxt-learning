<template>
  <!--
    layouts/default.vue 是默认布局。
    所有没有显式指定 layout 的页面，都会被包在这个布局里。
  -->
  <div class="app-shell">
    <header class="site-header">
      <NuxtLink class="brand" to="/">Nuxt Vite Study</NuxtLink>

      <nav class="site-nav" aria-label="主导航">
        <NuxtLink to="/">首页</NuxtLink>
        <NuxtLink to="/about">关于 Nuxt</NuxtLink>
        <NuxtLink to="/login">登录</NuxtLink>
        <NuxtLink to="/dashboard">控制台</NuxtLink>
        <NuxtLink to="/admin">权限页</NuxtLink>
        <NuxtLink to="/test">练习页</NuxtLink>
        <NuxtLink to="/element-plus">Element Plus</NuxtLink>
      </nav>
    </header>

    <main>
      <!-- slot 是当前页面内容。Nuxt 会把 pages 里的页面注入到这里。 -->
      <slot />
    </main>
  </div>
</template>
