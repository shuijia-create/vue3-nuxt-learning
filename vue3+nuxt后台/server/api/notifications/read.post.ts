import { markNotificationRead } from '~/server/services/notifications'

type CurrentUser = {
  id?: number
}

type ReadNotificationBody = {
  id?: string
}

export default defineEventHandler(async (event) => {
  // 标记已读必须知道当前登录用户是谁，不能只根据通知 id 直接改数据。
  const currentUser = event.context.currentUser as CurrentUser | undefined
  const recipientUserId = currentUser?.id

  if (!recipientUserId) {
    throw createError({
      statusCode: 401,
      statusMessage: '请先登录'
    })
  }

  // POST 请求的 body 里只需要传通知 id。
  const body = await readBody<ReadNotificationBody>(event)

  if (!body.id) {
    throw createError({
      statusCode: 400,
      statusMessage: '通知 id 不能为空'
    })
  }

  // service 层会同时校验通知 id 和接收人 id。
  const notification = markNotificationRead(body.id, recipientUserId)

  if (!notification) {
    throw createError({
      statusCode: 404,
      statusMessage: '通知不存在'
    })
  }

  return {
    code: 200,
    message: '通知已标记为已读',
    data: notification
  }
})
