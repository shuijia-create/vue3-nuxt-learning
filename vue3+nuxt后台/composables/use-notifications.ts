import { listNotificationsApi, markNotificationReadApi } from '~/utils/api/notifications'
import { useNotificationsStore } from '~/stores/notifications'

export function useNotifications() {
  const notificationsStore = useNotificationsStore()

  async function fetchNotifications() {
    notificationsStore.setPending(true)

    try {
      const result = await listNotificationsApi()

      notificationsStore.setNotifications(result.list)

      return result
    } finally {
      notificationsStore.setPending(false)
    }
  }

  async function markAsRead(id: string) {
    const current = notificationsStore.getNotificationById(id)

    if (current?.readAt) {
      return current
    }

    const result = await markNotificationReadApi(id)

    notificationsStore.updateNotification(result.data)

    return result.data
  }

  return {
    fetchNotifications,
    markAsRead
  }
}
