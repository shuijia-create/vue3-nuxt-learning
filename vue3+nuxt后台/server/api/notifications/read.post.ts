import { markNotificationRead } from '~/server/services/notifications'
import { apiSuccess, throwApiError } from '~/server/utils/api-response'
import { throwServiceError } from '~/server/utils/service-error'

type CurrentUser = {
  id?: number
}

type ReadNotificationBody = {
  id?: string
}

// POST /api/notifications/read
// 标记当前用户自己的通知为已读。
export default defineEventHandler(async (event) => {
  // 标记已读必须知道当前登录用户是谁，不能只根据通知 id 直接改数据。
  const currentUser = event.context.currentUser as CurrentUser | undefined
  const recipientUserId = currentUser?.id

  if (!recipientUserId) {
    throwApiError(401, '请先登录')
  }

  // POST 请求的 body 里只需要传通知 id。
  const body = await readBody<ReadNotificationBody>(event)

  if (!body.id) {
    throwApiError(400, '通知 id 不能为空')
  }

  // service 层会同时校验通知 id 和接收人 id。
  let notification: Awaited<ReturnType<typeof markNotificationRead>>

  try {
    notification = await markNotificationRead(body.id, recipientUserId)
  } catch (error) {
    // 通知 id 格式不对等业务错误由 service 抛出，在这里转成 HTTP 错误。
    throwServiceError(error)
  }

  if (!notification) {
    throwApiError(404, '通知不存在')
  }

  return apiSuccess(notification, '通知已标记为已读')
})
