<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})

const { user } = useAuth()
</script>

<template>
  <section class="content">
    <p class="eyebrow">Day 3</p>
    <h1>管理员权限页</h1>

    <p>
      这个页面同时使用 <code>auth</code> 和 <code>admin</code> 两个中间件。只有
      <code>role === 'admin'</code> 的用户可以进入。
    </p>

    <div class="notice">
      当前登录用户：{{ user?.name }}，角色：{{ user?.role }}
    </div>
  </section>
</template>
