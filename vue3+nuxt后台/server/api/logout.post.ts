import { authCookieName, deleteAuthSession } from '~/server/services/auth'

import { apiSuccess } from '~/server/utils/api-response'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, authCookieName)

  await deleteAuthSession(token)

  deleteCookie(event, authCookieName, {
    path: '/'
  })

  return apiSuccess({ ok: true }, '退出登录成功')
})
