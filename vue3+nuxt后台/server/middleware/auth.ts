import { authCookieName, getAuthSessionUsername, publicApiPaths } from '~/server/data/auth'
import { findAuthUserByUsername } from '~/server/services/users'

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname

  // 这个 middleware 会经过所有请求；这里只处理 /api 开头的后端接口。
  if (!pathname.startsWith('/api')) {
    return
  }

  // 登录接口放行，因为它本来就是用来换取 token 的。
  if (publicApiPaths.includes(pathname)) {
    return
  }

  // 从 cookie 里取出登录时写入的 token。
  const token = getCookie(event, authCookieName)
  // token 本身不是用户信息，需要先去 Redis 里的 session 查 username。
  const username = await getAuthSessionUsername(token)

  if (!username) {
    throw createError({
      statusCode: 401,
      statusMessage: '请先登录'
    })
  }

  // 每次请求都重新查数据库，避免用户角色被改了以后仍然使用旧权限。
  const currentUser = await findAuthUserByUsername(username)

  if (!currentUser) {
    throw createError({
      statusCode: 401,
      statusMessage: '登录用户不存在'
    })
  }

  // 把当前用户挂到 event.context，后面的具体接口可以直接用它判断权限。
  event.context.currentUser = currentUser
})
