const whiteList = ['/login']

export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie<string | null>('nuxt-admin-token')
  const isLoginPage = to.path === '/login'

  if (!token.value && !whiteList.includes(to.path)) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
  }

  if (token.value && isLoginPage) {
    const redirect = typeof to.query.redirect === 'string'
      ? to.query.redirect
      : '/dashboard'

    return navigateTo(redirect)
  }
})
