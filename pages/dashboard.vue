<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const { user } = useAuth()
</script>

<template>
  <section class="admin-page">
    <p class="eyebrow">Dashboard</p>
    <h1>控制台</h1>

    <p>
      这个页面必须登录后才能访问。它使用 <code>layouts/admin.vue</code>，
      所以会显示顶部 header、左侧二级菜单和右侧内容区。
    </p>

    <div class="profile-box">
      <p><strong>姓名：</strong>{{ user?.name }}</p>
      <p><strong>邮箱：</strong>{{ user?.email }}</p>
      <p><strong>角色：</strong>{{ user?.role }}</p>
    </div>
  </section>
</template>
