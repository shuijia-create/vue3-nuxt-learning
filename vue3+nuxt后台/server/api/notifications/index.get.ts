import { getUserNotifications } from '~/server/services/notifications'

type CurrentUser = {
  id?: number
}

export default defineEventHandler((event) => {
  // server/middleware/auth.ts 已经把登录用户写进 event.context.currentUser。
  // 这里从上下文读取用户 id，只返回当前用户自己的通知。
  const currentUser = event.context.currentUser as CurrentUser | undefined
  const recipientUserId = currentUser?.id

  if (!recipientUserId) {
    throw createError({
      statusCode: 401,
      statusMessage: '请先登录'
    })
  }

  const list = getUserNotifications(recipientUserId)

  return {
    // 通知列表用于下拉面板或通知中心展示。
    list,
    // 未读数量用于后台 header 上的小红点。
    unreadCount: list.filter(notification => !notification.readAt).length
  }
})
