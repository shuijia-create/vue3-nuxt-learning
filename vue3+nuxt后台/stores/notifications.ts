import { defineStore } from 'pinia'
import type { Notification as SystemNotification } from '~/types/notification'

type NotificationsResponse = {
  list: SystemNotification[]
  unreadCount: number
}

type ReadNotificationResponse = {
  code: number
  data: SystemNotification
}

// 通知 store 管理前端全局通知状态。
// 放在 Pinia 里后，后台 header、通知下拉框、通知列表页面都可以复用同一份数据。
export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<SystemNotification[]>([])
  const pending = ref(false)

  // readAt 为空表示未读，所以未读数量可以直接从列表里计算出来。
  const unreadCount = computed(() => notifications.value.filter(item => !item.readAt).length)
  const hasUnread = computed(() => unreadCount.value > 0)

  // 拉取通知列表。
  // SSR 阶段要用 useRequestFetch() 转发 cookie，否则服务端请求 /api/notifications 会丢登录态。
  async function fetchNotifications() {
    pending.value = true

    try {
      const requestFetch = import.meta.server ? useRequestFetch() : $fetch
      const result = await requestFetch<NotificationsResponse>('/api/notifications')
      notifications.value = result.list
      return result
    } finally {
      pending.value = false
    }
  }

  // 标记单条通知为已读。
  // 成功后同步更新本地列表，避免用户还要等下一次轮询才看到状态变化。
  async function markAsRead(id: string) {
    const current = notifications.value.find(item => item.id === id)

    if (current?.readAt) {
      return current
    }

    const result = await $fetch<ReadNotificationResponse>('/api/notifications/read', {
      method: 'POST',
      body: {
        id
      }
    })

    const index = notifications.value.findIndex(item => item.id === id)

    if (index !== -1) {
      notifications.value[index] = result.data
    }

    return result.data
  }

  return {
    notifications,
    pending,
    unreadCount,
    hasUnread,
    fetchNotifications,
    markAsRead
  }
})
