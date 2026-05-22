<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
</script>

<template>
  <section>
    <h1 class="page-title">系统设置</h1>

    <el-card shadow="never">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="项目类型">
          Nuxt SSR 后台学习项目
        </el-descriptions-item>
        <el-descriptions-item label="登录账号">
          admin
        </el-descriptions-item>
        <el-descriptions-item label="鉴权方式">
          页面 middleware + server/api cookie 校验
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </section>
</template>
