<script setup lang="ts">
import { Bell, Refresh, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'
import { useAuth } from '~/composables/use-auth'
import { useNotifications } from '~/composables/use-notifications'
import type { Notification as SystemNotification } from '~/types/notification'

const auth = useAuthStore()
const notificationsStore = useNotificationsStore()
const authActions = useAuth()
const notificationActions = useNotifications()
const route = useRoute()
const notificationPanelVisible = ref(false)
const notificationRef = ref<HTMLElement>()

await callOnce('current-user', () => authActions.fetchCurrentUser())
await callOnce('current-notifications', () => notificationActions.fetchNotifications())

async function handleNotificationClick(notification: SystemNotification) {
  try {
    await notificationActions.markAsRead(notification.id)
    notificationPanelVisible.value = false

    if (notification.targetPath) {
      await navigateTo(notification.targetPath)
    }
  } catch {
    ElMessage.error('通知状态更新失败')
  }
}

function toggleNotificationPanel() {
  notificationPanelVisible.value = !notificationPanelVisible.value
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target

  if (!(target instanceof Node)) {
    return
  }

  if (!notificationRef.value?.contains(target)) {
    notificationPanelVisible.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    notificationPanelVisible.value = false
  }
)

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
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
          <div ref="notificationRef" class="notification-trigger">
            <button
              type="button"
              class="notification-button"
              aria-label="站内通知"
              @click.stop="toggleNotificationPanel"
            >
              <el-badge
                :value="notificationsStore.unreadCount"
                :hidden="!notificationsStore.hasUnread"
                :max="99"
              >
                <el-icon>
                  <Bell />
                </el-icon>
              </el-badge>
            </button>

            <div
              v-if="notificationPanelVisible"
              class="notification-panel"
              @click.stop
            >
              <div class="notification-head">
                <span>站内通知</span>
                <el-button
                  :icon="Refresh"
                  link
                  :loading="notificationsStore.pending"
                  @click="notificationActions.fetchNotifications()"
                >
                  刷新
                </el-button>
              </div>

              <el-empty
                v-if="notificationsStore.notifications.length === 0"
                description="暂无通知"
                :image-size="64"
              />

              <div v-else class="notification-list">
                <button
                  v-for="notification in notificationsStore.notifications"
                  :key="notification.id"
                  type="button"
                  class="notification-item"
                  :class="{ unread: !notification.readAt }"
                  @click="handleNotificationClick(notification)"
                >
                  <div class="notification-title-row">
                    <span class="notification-title">{{ notification.title }}</span>
                    <span v-if="!notification.readAt" class="unread-dot" />
                  </div>
                  <div class="notification-content">
                    {{ notification.content }}
                  </div>
                  <div class="notification-time">
                    {{ notification.createdAt }}
                  </div>
                </button>
              </div>
            </div>
          </div>

          <span class="user-name">{{ auth.user?.nickname || '管理员' }}</span>
          <el-button :icon="SwitchButton" plain @click="authActions.logout">
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

.notification-trigger {
  position: relative;
}

.notification-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #606266;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
}

.notification-button:hover {
  color: var(--admin-primary);
  border-color: var(--admin-primary);
}

.notification-panel {
  position: absolute;
  top: 42px;
  right: 0;
  z-index: 20;
  width: 360px;
  max-height: 420px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 16%);
}

.notification-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 700;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 340px;
  overflow-y: auto;
}

.notification-item {
  width: 100%;
  padding: 10px 12px;
  color: var(--admin-text);
  text-align: left;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
}

.notification-item:hover {
  border-color: var(--admin-primary);
}

.notification-item.unread {
  background: #eff6ff;
}

.notification-title-row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.notification-title {
  font-size: 14px;
  font-weight: 700;
}

.unread-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  background: var(--admin-primary);
  border-radius: 50%;
}

.notification-content {
  margin-top: 6px;
  color: var(--admin-muted);
  font-size: 13px;
  line-height: 1.5;
}

.notification-time {
  margin-top: 8px;
  color: #94a3b8;
  font-size: 12px;
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
