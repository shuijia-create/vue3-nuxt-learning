<template>
  <section class="content">
    <h1>Nuxt 和 Vite 的关系</h1>

    <p>
      Nuxt 是基于 Vue 3 的全栈框架，负责路由、服务端渲染、静态生成、数据获取、自动导入和项目约定。
    </p>

    <p>
      Vite 是 Nuxt 默认使用的开发与构建工具，负责快速启动开发服务器、热更新、模块解析和生产构建优化。
    </p>

    <h2>你应该先理解这些目录</h2>
    <ul>
      <li><code>pages/</code>：页面文件会自动变成路由。</li>
      <li><code>components/</code>：组件会被 Nuxt 自动导入。</li>
      <li><code>composables/</code>：可复用的组合式逻辑。</li>
      <li><code>server/api/</code>：服务端 API 路由。</li>
      <li><code>assets/</code>：需要被构建工具处理的样式、图片等资源。</li>
      <li><code>nuxt.config.ts</code>：Nuxt、Vite、运行时配置的入口。</li>
    </ul>
  </section>
</template>
