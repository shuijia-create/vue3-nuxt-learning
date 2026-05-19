<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <section class="info-box">
    <h2>{{ title }}</h2>
    <div class="info-box__content">
      <slot />
    </div>
  </section>
</template>
