import type { Notification as SystemNotification } from '~/types/notification'

type ApiFetch = <T>(request: string, options?: Parameters<typeof $fetch>[1]) => Promise<T>

export type NotificationsResponse = {
  list: SystemNotification[]
  unreadCount: number
}

export type ReadNotificationResponse = {
  code: number
  data: SystemNotification
}

function getApiFetch() {
  return (import.meta.server ? useRequestFetch() : $fetch) as ApiFetch
}

export function listNotificationsApi(fetcher?: ApiFetch) {
  const requestFetch = fetcher ?? getApiFetch()

  return requestFetch<NotificationsResponse>('/api/notifications')
}

export function markNotificationReadApi(id: string) {
  return $fetch<ReadNotificationResponse>('/api/notifications/read', {
    method: 'POST',
    body: {
      id
    }
  })
}
