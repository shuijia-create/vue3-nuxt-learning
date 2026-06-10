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
    <el-aside class="admin-sidebar" width="228px">
      <div class="brand">
        <div class="brand-mark">W</div>
        <div>
          <div class="brand-title">工单后台</div>
          <div class="brand-subtitle">Work Order Admin</div>
        </div>
      </div>

      <SidebarMenu />
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div>
          <div class="header-title">企业工单后台</div>
          <div class="header-subtitle">
            工单、通知、账号和权限统一管理
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
                <div>
                  <div class="notification-head-title">站内通知</div>
                  <div class="notification-head-meta">
                    {{ notificationsStore.unreadCount }} 条未读
                  </div>
                </div>
                <el-button
                  :icon="Refresh"
                  circle
                  plain
                  :loading="notificationsStore.pending"
                  aria-label="刷新通知"
                  @click="notificationActions.fetchNotifications()"
                />
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
                  <span class="notification-state" />
                  <div class="notification-title-row">
                    <span class="notification-title">{{ notification.title }}</span>
                  </div>
                  <div class="notification-content">
                    {{ notification.content }}
                  </div>
                  <div class="notification-meta-row">
                    <span>{{ notification.createdAt }}</span>
                    <span class="notification-read-state">
                      {{ notification.readAt ? '已读' : '未读' }}
                    </span>
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
  background:
    linear-gradient(180deg, rgb(37 99 235 / 14%) 0, transparent 220px),
    var(--admin-sidebar);
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  height: 72px;
  padding: 0 18px;
  color: #ffffff;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
}

.brand-mark {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  font-size: 18px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--admin-primary), var(--admin-accent));
  border-radius: 8px;
  box-shadow: 0 10px 24px rgb(37 99 235 / 24%);
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
  height: 70px;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid var(--admin-border);
}

.header-title {
  color: var(--admin-text);
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
  gap: 14px;
  align-items: center;
}

.notification-trigger {
  position: relative;
}

.notification-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--admin-text-secondary);
  cursor: pointer;
  background: var(--admin-surface-subtle);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
}

.notification-button:hover {
  color: var(--admin-primary);
  background: var(--admin-primary-soft);
  border-color: #bfdbfe;
}

.notification-panel {
  position: absolute;
  top: 46px;
  right: 0;
  z-index: 20;
  width: 390px;
  max-height: 480px;
  padding: 14px;
  background: #ffffff;
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  box-shadow: var(--admin-shadow-md);
}

.notification-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.notification-head-title {
  color: var(--admin-text);
  font-size: 15px;
  font-weight: 800;
}

.notification-head-meta {
  margin-top: 4px;
  color: var(--admin-muted);
  font-size: 12px;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 386px;
  overflow-y: auto;
}

.notification-item {
  position: relative;
  width: 100%;
  padding: 12px 12px 12px 16px;
  color: var(--admin-text);
  text-align: left;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
}

.notification-item:hover {
  background: #f8fbff;
  border-color: #bfdbfe;
}

.notification-item.unread {
  background: var(--admin-primary-soft);
  border-color: #bfdbfe;
}

.notification-state {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 0;
  width: 3px;
  background: var(--admin-border-strong);
  border-radius: 999px;
}

.notification-item.unread .notification-state {
  background: var(--admin-primary);
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

.notification-content {
  margin-top: 6px;
  color: var(--admin-muted);
  font-size: 13px;
  line-height: 1.5;
}

.notification-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--admin-text-weak);
  font-size: 12px;
}

.notification-read-state {
  color: var(--admin-muted);
  font-weight: 600;
}

.notification-item.unread .notification-read-state {
  color: var(--admin-primary);
}

.user-name {
  color: var(--admin-muted);
  font-size: 14px;
}

.admin-content {
  min-height: calc(100vh - 112px);
  padding: 22px 24px 24px;
  background: var(--admin-bg);
}
</style>
