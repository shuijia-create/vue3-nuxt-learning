import type { Notification as SystemNotification } from '~/types/notification'
import { fetchApiData, getApiFetch, type ApiFetch } from '~/utils/api/response'

export type NotificationsResponse = {
  list: SystemNotification[]
  unreadCount: number
}

export type ReadNotificationResponse = SystemNotification

export function listNotificationsApi(fetcher?: ApiFetch) {
  const requestFetch = fetcher ?? getApiFetch()

  return fetchApiData<NotificationsResponse>('/api/notifications', undefined, requestFetch)
}

export function markNotificationReadApi(id: string) {
  return fetchApiData<ReadNotificationResponse>('/api/notifications/read', {
    method: 'POST',
    body: {
      id
    }
  })
}
