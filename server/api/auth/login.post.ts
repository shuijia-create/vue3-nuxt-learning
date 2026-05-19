import { findUserByEmail, toPublicUser } from '../../utils/users'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)

  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: '请输入邮箱和密码'
    })
  }

  const user = findUserByEmail(body.email)

  if (!user || user.password !== body.password) {
    throw createError({
      statusCode: 401,
      statusMessage: '邮箱或密码错误'
    })
  }

  // httpOnly cookie 只能被服务端读取，浏览器 JS 不能直接读取，安全性比 localStorage 更好。
  // 学习项目用用户 id 当作会话值；真实项目应使用随机 session id 或 JWT，并做好过期与签名校验。
  setCookie(event, 'study_session', user.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24
  })

  return {
    user: toPublicUser(user)
  }
})
