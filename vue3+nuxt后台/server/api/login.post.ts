import { authCookieName, demoToken, demoUser } from '~/server/data/auth'

type LoginBody = {
  username?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)

  if (body.username !== 'admin' || body.password !== '123456') {
    throw createError({
      statusCode: 401,
      statusMessage: '用户名或密码错误'
    })
  }

  setCookie(event, authCookieName, demoToken, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24
  })

  return {
    token: demoToken,
    user: demoUser
  }
})
