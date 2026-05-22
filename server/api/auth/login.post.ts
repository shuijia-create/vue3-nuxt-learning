import { setAuthToken } from '../../utils/auth'
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

  // 登录成功后，把 token 写入 httpOnly cookie。
  // 浏览器会保存并自动携带，前端 JS 不能直接读取。
  setAuthToken(event, user.id)

  return {
    user: toPublicUser(user)
  }
})
