import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/use-auth'

const whiteList = ['/login']

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  const authActions = useAuth()
  const isLoginPage = to.path === '/login'
  const currentUser = auth.user ?? await authActions.fetchCurrentUser()

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
})
