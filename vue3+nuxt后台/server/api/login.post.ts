import { authCookieName, createAuthSession } from '~/server/data/auth'
import { findUserByCredentials } from '~/server/services/users'

type LoginBody = {
  username?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  // Nuxt server/api 中通过 readBody 读取前端 POST 过来的 JSON。
  const body = await readBody<LoginBody>(event)
  const username = body.username?.trim()
  const password = body.password ?? ''

  // 登录只做校验：去 users 表按 username 找用户，再用 bcrypt 校验密码。
  const user = username
    ? await findUserByCredentials(username, password)
    : null

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '用户名或密码错误'
    })
  }

  // 校验通过后创建服务端 session，并拿到给浏览器使用的 token。
  const token = await createAuthSession(user.username)

  // 把 token 写进 cookie。之后浏览器访问 /api/me、/api/users 等接口会自动携带这个 cookie。
  setCookie(event, authCookieName, token, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24
  })

  // 同时把 token 和安全的用户信息返回给前端。注意 user 里没有 passwordHash。
  return {
    token,
    user
  }
})
