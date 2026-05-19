<script setup lang="ts">
// defineProps 是 Vue 3 <script setup> 的编译宏。
// 这里定义组件接收的参数类型，父组件传错类型时 TypeScript 会提醒。
defineProps<{
  title: string
  badge: string
}>()
</script>

<template>
  <article class="learning-card">
    <span class="badge">{{ badge }}</span>
    <h2>{{ title }}</h2>

    <!-- slot 用来接收父组件传进来的自定义内容。 -->
    <p>
      <slot />
    </p>
  </article>
</template>
