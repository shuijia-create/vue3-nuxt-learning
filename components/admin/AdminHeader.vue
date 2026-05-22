<script setup lang="ts">
import { SwitchButton } from '@element-plus/icons-vue'

const { user, logout } = useAuth()
</script>

<template>
  <el-header class="admin-header">
    <div>
      <div class="header-title">管理控制台</div>
      <div class="header-subtitle">
        页面 middleware 负责跳转，server/api 负责真实接口鉴权。
      </div>
    </div>

    <div class="header-actions">
      <span class="user-name">{{ user?.name || '未登录' }}</span>
      <span class="admin-role">{{ user?.role || 'guest' }}</span>
      <el-button :icon="SwitchButton" plain @click="logout">
        退出登录
      </el-button>
    </div>
  </el-header>
</template>
