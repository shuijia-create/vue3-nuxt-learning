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
  // 拿着 token 去 Redis 查对应的 username（登录时 createAuthSession 写入的映射）。
  const username = await getAuthSessionUsername(token)

  // token 无效或已过期 → 没登录，清掉残留 cookie 后返回 401。
  if (!username) {
    deleteCookie(event, authCookieName, {
      path: '/'
    })

    throw createError({
      statusCode: 401,
      message: '请先登录'
    })
  }

  // token 有效但用户已从数据库删除（比如被管理员删号），同样拒绝。
  const currentUser = await findAuthUserByUsername(username)

  if (!currentUser) {
    deleteCookie(event, authCookieName, {
      path: '/'
    })

    throw createError({
      statusCode: 401,
      message: '登录用户不存在'
    })
  }

  // 把当前用户挂到 event.context，后面的具体接口可以直接用它判断权限。
  event.context.currentUser = currentUser
})
