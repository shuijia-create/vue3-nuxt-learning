import { authCookieName, createAuthSession } from '~/server/services/auth'
import { findUserByCredentials } from '~/server/services/users'
import { apiSuccess, throwApiError } from '~/server/utils/api-response'

type LoginBody = {
  username?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  // 1. 从请求体取出用户名和密码；生产项目依赖 HTTPS 保护传输过程。
  const body = await readBody<LoginBody>(event)
  const username = body.username?.trim()
  const password = body.password ?? ''

  // 2. 用本次请求里的密码去数据库匹配。密码只存在于请求内存里，不写库、不返回。
  const user = username
    ? await findUserByCredentials(username, password)
    : null

  if (!user) {
    throwApiError(401, '用户名或密码错误')
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

  // 5. 登录接口只返回 token，不返回用户信息和权限。
  // 用户信息、菜单路由、按钮权限统一交给 GET /api/me 这个 getInfo 接口返回。
  // 为了保留 Nuxt SSR 学习链路，这里仍然写 httpOnly cookie，刷新页面时服务端才能通过 cookie 恢复登录态。
  return apiSuccess({ token }, '登录成功')
})
