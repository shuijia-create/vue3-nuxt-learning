<script setup lang="ts">
import { SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

await callOnce('current-user', () => auth.fetchMe())
</script>

<template>
  <el-container class="admin-layout">
    <el-aside class="admin-sidebar" width="220px">
      <div class="brand">
        <div class="brand-mark">N</div>
        <div>
          <div class="brand-title">Nuxt 后台</div>
          <div class="brand-subtitle">SSR 学习项目</div>
        </div>
      </div>

      <SidebarMenu />
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div>
          <div class="header-title">管理控制台</div>
          <div class="header-subtitle">
            页面 middleware 负责跳转，server/api 负责真实接口鉴权。
          </div>
        </div>

        <div class="header-actions">
          <span class="user-name">{{ auth.user?.nickname || '管理员' }}</span>
          <el-button :icon="SwitchButton" plain @click="auth.logout">
            退出登录
          </el-button>
        </div>
      </el-header>

      <PageTabs />

      <el-main class="admin-content">
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.admin-sidebar {
  overflow: hidden;
  background: var(--admin-sidebar);
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  height: 72px;
  padding: 0 20px;
  color: #ffffff;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
}

.brand-mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  font-size: 18px;
  font-weight: 800;
  background: var(--admin-primary);
  border-radius: 8px;
}

.brand-title {
  font-size: 16px;
  font-weight: 700;
}

.brand-subtitle {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid var(--admin-border);
}

.header-title {
  font-size: 18px;
  font-weight: 700;
}

.header-subtitle {
  margin-top: 6px;
  color: var(--admin-muted);
  font-size: 13px;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.user-name {
  color: var(--admin-muted);
  font-size: 14px;
}

.admin-content {
  min-height: calc(100vh - 116px);
  padding: 24px;
  background: var(--admin-bg);
}
</style>
