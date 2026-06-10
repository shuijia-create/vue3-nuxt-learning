// 引入用户状态管理 store，用来读取和缓存当前登录用户信息。
import { useAuthStore } from '~/stores/auth'
// 引入认证相关的操作函数，包括获取当前用户、登录、退出等。
import { useAuth } from '~/composables/use-auth'

// 白名单：这些页面不需要登录就能访问，也不需要请求 /api/me 确认登录态。
const whiteList = ['/login', '/']

// defineNuxtRouteMiddleware 定义一个路由中间件，每次页面跳转前都会执行。
// 文件名带 .global 表示对所有页面生效，不需要在每个页面单独声明。
export default defineNuxtRouteMiddleware(async (to) => {
  // 获取 Pinia 用户状态 store，里面缓存了当前登录用户信息。
  const auth = useAuthStore()
  // 获取认证操作函数集合。
  const authActions = useAuth()
  // 判断当前要跳转的页面是不是登录页。
  const isLoginPage = to.path === '/login'

  // 判断当前用户是否已登录，并在第一次进入后台时通过 /api/me 拉取 getInfo。
  // getInfo 会一次性返回用户信息、后端路由配置和按钮权限配置。
  // - 白名单页面（登录页、首页）不需要检查登录态，省掉一次不必要的 /api/me 请求。
  // - 其他页面：先从 store 缓存取，缓存没有就调 /api/me 向后端确认并缓存权限快照。
  const currentUser = whiteList.includes(to.path)
    ? (auth.user ?? null)
    : (auth.user ?? await authActions.fetchCurrentUser())

  // ========== 第一道门：未登录拦截 ==========
  // 没登录 + 目标页面不在白名单里 → 踢回登录页，并记录原始地址方便登录后跳回。
  if (!currentUser && !whiteList.includes(to.path)) {
    return navigateTo({
      path: '/login',
      query: {
        // redirect 保存用户原本想去的页面路径。
        redirect: to.fullPath
      }
    })
  }

  // ========== 第二道门：已登录用户不能再访问登录页 ==========
  // 已经登录了还访问登录页 → 直接跳到后台首页（或 redirect 指定的页面）。
  if (currentUser && isLoginPage) {
    const redirect = typeof to.query.redirect === 'string'
      ? to.query.redirect
      : '/dashboard'

    return navigateTo(redirect)
  }

  // ========== 白名单页面直接放行 ==========
  // 走到这里说明要么是未登录用户访问白名单页面，要么是已登录用户访问白名单页面，都不需要再做权限校验。
  if (!currentUser || whiteList.includes(to.path)) {
    return
  }

  // ========== 第三道门：后端路由配置本地校验 ==========
  // 可访问路由已经由 /api/me 返回并缓存在 auth store 里。
  // 路由跳转时前端只按后端返回的 routes 判断，不再自己定义权限路由。
  if (!auth.canAccessPage(to.path)) {
    return abortNavigation(createError({
      statusCode: 403,
      statusMessage: '没有当前页面的访问权限'
    }))
  }
})
