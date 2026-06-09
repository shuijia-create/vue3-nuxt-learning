import { defineStore } from 'pinia'
import type { Notification as SystemNotification } from '~/types/notification'

// 通知 store 管理前端全局通知状态。
// 放在 Pinia 里后，后台 header、通知下拉框、通知列表页面都可以复用同一份数据。
export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<SystemNotification[]>([])
  const pending = ref(false)

  // readAt 为空表示未读，所以未读数量可以直接从列表里计算出来。
  const unreadCount = computed(() => notifications.value.filter(item => !item.readAt).length)
  const hasUnread = computed(() => unreadCount.value > 0)

  function setPending(value: boolean) {
    pending.value = value
  }

  function setNotifications(nextNotifications: SystemNotification[]) {
    notifications.value = nextNotifications
  }

  function getNotificationById(id: string) {
    return notifications.value.find(item => item.id === id)
  }

  function updateNotification(nextNotification: SystemNotification) {
    const index = notifications.value.findIndex(item => item.id === nextNotification.id)

    if (index !== -1) {
      notifications.value[index] = nextNotification
    }
  }

  return {
    notifications,
    pending,
    unreadCount,
    hasUnread,
    setPending,
    setNotifications,
    getNotificationById,
    updateNotification
  }
})
