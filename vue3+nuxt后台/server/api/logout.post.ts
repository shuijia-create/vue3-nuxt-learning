import { authCookieName, deleteAuthSession } from '~/server/services/auth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, authCookieName)

  await deleteAuthSession(token)

  deleteCookie(event, authCookieName, {
    path: '/'
  })

  return {
    ok: true
  }
})
