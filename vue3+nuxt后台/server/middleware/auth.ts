import { authCookieName, demoToken, demoUser, publicApiPaths } from '~/server/data/auth'

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname

  if (!pathname.startsWith('/api')) {
    return
  }

  if (publicApiPaths.includes(pathname)) {
    return
  }

  const token = getCookie(event, authCookieName)

  if (token !== demoToken) {
    throw createError({
      statusCode: 401,
      statusMessage: '请先登录'
    })
  }

  event.context.currentUser = demoUser
})
