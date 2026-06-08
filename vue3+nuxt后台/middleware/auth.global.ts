import { useAuthStore } from '~/stores/auth'

const whiteList = ['/login']

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  const isLoginPage = to.path === '/login'
  const currentUser = auth.user ?? await auth.fetchMe()

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
