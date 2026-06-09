import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/use-auth'
import { checkPagePermissionApi } from '~/utils/api/permissions'
import { isUnauthorizedError } from '~/utils/api/auth'

const whiteList = ['/login', '/']

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  const authActions = useAuth()
  const isLoginPage = to.path === '/login'
  // 白名单页面（登录页、首页）不需要检查登录态，省掉一次不必要的 /api/me 请求。
  const currentUser = whiteList.includes(to.path)
    ? (auth.user ?? null)
    : (auth.user ?? await authActions.fetchCurrentUser())

  if (!currentUser && !whiteList.includes(to.path)) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
  }

  if (currentUser && isLoginPage) {
    const redirect = typeof to.query.redirect === 'string'
      ? to.query.redirect
      : '/dashboard'

    return navigateTo(redirect)
  }

  if (!currentUser || whiteList.includes(to.path)) {
    return
  }

  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  try {
    const { allowed } = await checkPagePermissionApi(to.path, requestFetch)

    if (!allowed) {
      return abortNavigation(createError({
        statusCode: 403,
        statusMessage: '没有当前页面的访问权限'
      }))
    }
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return navigateTo({
        path: '/login',
        query: {
          redirect: to.fullPath
        }
      })
    }

    throw error
  }
})
