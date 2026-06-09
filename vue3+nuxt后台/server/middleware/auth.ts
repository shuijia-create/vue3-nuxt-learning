// 引入认证 service 里的 cookie 名、session 查询方法和公开 API 白名单。
import { authCookieName, getAuthSessionUsername, publicApiPaths } from '~/server/services/auth'
// 引入用户 service，用 Redis session 里的 username 重新查询数据库用户。
import { findAuthUserByUsername } from '~/server/services/users'

// Nuxt server/middleware 会在服务端处理请求前执行这里的逻辑。
export default defineEventHandler(async (event) => {
  // 从当前请求 URL 里取出 pathname，例如 /api/me 或 /dashboard。
  const pathname = getRequestURL(event).pathname

  // 这里只保护后端 API；页面跳转由 middleware/auth.global.ts 处理。
  if (!pathname.startsWith('/api')) {
    // 非 /api 请求直接放行。
    return
  }

  // 登录、公钥、退出等公开接口不需要先登录。
  if (publicApiPaths.includes(pathname)) {
    // 命中白名单直接放行。
    return
  }

  // 从 httpOnly cookie 里取出登录 token；前端 JavaScript 不能直接读取这个 cookie。
  const token = getCookie(event, authCookieName)
  // 拿 token 去 Redis 查 username；这一步只确认 token 对应哪个账号。
  const username = await getAuthSessionUsername(token)

  // Redis 查不到 username，说明 token 缺失、过期或已经被退出登录删除。
  if (!username) {
    // 清掉浏览器里可能残留的旧 cookie，避免下次请求继续带无效 token。
    deleteCookie(event, authCookieName, {
      // path 必须和 setCookie 时保持一致，否则可能删不掉同一个 cookie。
      path: '/'
    })

    // 返回 401，让前端知道当前请求没有登录态。
    throw createError({
      // 401 表示未认证，不是权限不足。
      statusCode: 401,
      // 这里给前端或调试信息使用。
      message: '请先登录'
    })
  }

  // token 有效后，再按 username 查询 MySQL users 表，保证用户仍然真实存在。
  const currentUser = await findAuthUserByUsername(username)

  // 如果 Redis 里还有 session，但数据库用户已经被删除，也必须拒绝访问。
  if (!currentUser) {
    // 同样删除旧 cookie，避免浏览器继续携带失效 token。
    deleteCookie(event, authCookieName, {
      // 删除根路径 cookie。
      path: '/'
    })

    // 返回 401，因为这个登录态已经不能解析成有效用户。
    throw createError({
      // 仍然是未认证状态。
      statusCode: 401,
      // 明确告诉学习者：token 找到了，但数据库用户不存在。
      message: '登录用户不存在'
    })
  }

  // 把当前用户挂到 event.context，后续 server/api 可以直接读取 currentUser。
  event.context.currentUser = currentUser
})
