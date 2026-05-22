<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { user } = useAuth()
const adminStats = await useApiFetch<{
  stats: {
    users: number
    protectedPages: number
    authMode: string
  }
}>('/api/admin/stats')
</script>

<template>
  <section class="admin-page">
    <p class="eyebrow">Permission</p>
    <h1>权限页面</h1>

    <p>
      这个页面同时使用 <code>auth</code> 和 <code>admin</code> 两个 middleware。
      普通用户登录后能进入后台，但不能进入这个管理员页面。
    </p>

    <div class="notice">
      当前登录用户：{{ user?.name }}，角色：{{ user?.role }}
    </div>

    <div class="profile-box">
      <p><strong>用户数量：</strong>{{ adminStats.stats.users }}</p>
      <p><strong>受保护页面：</strong>{{ adminStats.stats.protectedPages }}</p>
      <p><strong>认证方式：</strong>{{ adminStats.stats.authMode }}</p>
    </div>
  </section>
</template>
