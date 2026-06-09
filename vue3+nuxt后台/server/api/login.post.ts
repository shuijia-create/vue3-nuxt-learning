import { authCookieName, createAuthSession } from '~/server/services/auth'
import { findUserByCredentials } from '~/server/services/users'
import { decryptPassword } from '~/server/utils/password-encryption'

type LoginBody = {
  username?: string
  encryptedPassword?: string
}

export default defineEventHandler(async (event) => {
  // 1. 从请求体取出用户名和加密后的密码；请求里不传原始明文密码。
  const body = await readBody<LoginBody>(event)
  const username = body.username?.trim()
  const encryptedPassword = body.encryptedPassword ?? ''

  let password = ''

  try {
    password = encryptedPassword ? decryptPassword(encryptedPassword) : ''
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: '密码加密数据不正确'
    })
  }

  // 2. 用解密后的密码去数据库匹配。密码只存在于本次服务端请求内存里，不写库、不返回。
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
