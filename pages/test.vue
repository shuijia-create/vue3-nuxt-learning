<script setup lang="ts">
const route = useRoute()
const todayTask = [
  '确认 pages 目录会自动生成路由',
  '确认 components 目录里的组件可以直接使用',
  '理解 app.vue、layout、page 三层分工'
]
</script>

<template>
  <section class="content">
    <p class="eyebrow">Practice</p>
    <h1>Nuxt 最小练习页</h1>
    <p>
      这个页面文件是 <code>pages/test.vue</code>，所以你可以直接访问
      <code>/test</code>。
    </p>

    <InfoBox title="当前路由信息">
      <p>当前路径：{{ route.path }}</p>
      <p>当前页面文件：<code>pages/test.vue</code></p>
    </InfoBox>

    <InfoBox title="今天的练习任务">
      <ul>
        <li v-for="item in todayTask" :key="item">{{ item }}</li>
      </ul>
    </InfoBox>

    <InfoBox title="动态路由练习">
      <p>
        下面两个链接都会进入同一个页面文件 <code>pages/posts/[id].vue</code>，
        只是参数不同。
      </p>
      <div class="actions">
        <NuxtLink class="button-link" to="/posts/100">打开 /posts/100</NuxtLink>
        <NuxtLink class="button-link" to="/posts/200">打开 /posts/200</NuxtLink>
      </div>
    </InfoBox>
  </section>
</template>
