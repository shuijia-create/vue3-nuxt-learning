<script setup lang="ts">
const route = useRoute()

const currentId = computed(() => String(route.params.id || ''))
</script>

<template>
  <section class="content">
    <p class="eyebrow">Dynamic Route</p>
    <h1>文章详情页</h1>
    <p>
      这个页面文件是 <code>pages/posts/[id].vue</code>，所以
      <code>[id]</code> 会变成动态路由参数。
    </p>

    <InfoBox title="当前参数">
      <p>当前路径：{{ route.path }}</p>
      <p>当前 id：{{ currentId }}</p>
    </InfoBox>

    <InfoBox title="切换不同文章">
      <div class="actions">
        <NuxtLink class="button-link" to="/posts/100">查看 100</NuxtLink>
        <NuxtLink class="button-link" to="/posts/200">查看 200</NuxtLink>
        <NuxtLink class="button-link" to="/posts/abc">查看 abc</NuxtLink>
      </div>
    </InfoBox>
  </section>
</template>
