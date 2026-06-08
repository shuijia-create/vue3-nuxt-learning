import { authCookieName, createAuthSession } from '~/server/data/auth'
import { findUserByCredentials } from '~/server/services/users'

type LoginBody = {
  username?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  // 1. 从请求体取出用户提交的用户名和密码
  const body = await readBody<LoginBody>(event)
  const username = body.username?.trim()
  const password = body.password ?? ''

  // 2. 用用户名 + 密码去数据库匹配，查不到说明凭证不对
  const user = username
    ? await findUserByCredentials(username, password)
    : null

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误'
    })
  }

  // 3. 凭证正确，在 Redis 里创建一条 session 记录（token → username），返回随机 token
  const token = await createAuthSession(user.username)

  // 4. 把 token 写入 httpOnly cookie，后续请求自动携带，JS 无法读取，防 XSS
  setCookie(event, authCookieName, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24
  })

  // 5. 把用户信息返回给前端（token 已经在 cookie 里了，不需要在 body 里再传）
  return {
    user
  }
})
