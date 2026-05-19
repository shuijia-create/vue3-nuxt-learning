<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user, logout } = useAuth()
</script>

<template>
  <section class="content">
    <p class="eyebrow">Day 2</p>
    <h1>用户控制台</h1>

    <p>
      这个页面受 <code>middleware/auth.ts</code> 保护。没有登录时访问，会自动跳转到登录页。
    </p>

    <div class="profile-box">
      <p><strong>姓名：</strong>{{ user?.name }}</p>
      <p><strong>邮箱：</strong>{{ user?.email }}</p>
      <p><strong>角色：</strong>{{ user?.role }}</p>
    </div>

    <div class="actions">
      <NuxtLink class="button-link" to="/admin">访问权限页</NuxtLink>
      <button type="button" class="secondary" @click="logout">退出登录</button>
    </div>
  </section>
</template>
