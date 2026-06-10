import { getUserNotifications } from '~/server/services/notifications'
import { apiSuccess, throwApiError } from '~/server/utils/api-response'

type CurrentUser = {
  id?: number
}

// GET /api/notifications
// 查询当前登录用户的站内通知，用于后台 header 通知下拉。
export default defineEventHandler(async (event) => {
  // server/middleware/auth.ts 已经把登录用户写进 event.context.currentUser。
  // 这里从上下文读取用户 id，只返回当前用户自己的通知。
  const currentUser = event.context.currentUser as CurrentUser | undefined
  const recipientUserId = currentUser?.id

  if (!recipientUserId) {
    throwApiError(401, '请先登录')
  }

  // 真正的数据库查询放在 service，API 层不直接操作 Prisma。
  const list = await getUserNotifications(recipientUserId)

  return apiSuccess({
    // 通知列表用于下拉面板或通知中心展示。
    list,
    // 未读数量用于后台 header 上的小红点。
    // 未读数量由服务端返回，前端不用重复计算接口数据是否已读。
    unreadCount: list.filter(notification => !notification.readAt).length
  })
})
