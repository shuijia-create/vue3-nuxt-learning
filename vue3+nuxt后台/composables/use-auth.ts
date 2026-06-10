import { fetchMeApi, isUnauthorizedError, loginApi, logoutApi } from '~/utils/api/auth'
import { useAuthStore } from '~/stores/auth'
import { usePageTabsStore } from '~/stores/page-tabs'
import type { LoginForm } from '~/types/auth'

export function useAuth() {
  const authStore = useAuthStore()

  async function login(form: LoginForm) {
    const { token } = await loginApi(form)

    const currentUser = await fetchCurrentUser({ force: true, token })

    if (!currentUser) {
      throw new Error('登录成功，但获取用户信息和权限失败')
    }

    return currentUser
  }

  async function fetchCurrentUser(options: { force?: boolean, token?: string } = {}) {
    if (!options.force && authStore.authResolved && authStore.user) {
      return authStore.user
    }

    try {
      const result = await fetchMeApi(undefined, options.token)

      authStore.setAuthInfo(result)

      return result.user
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        throw error
      }

      authStore.clearUser()

      return null
    }
  }

  async function logout() {
    const pageTabsStore = usePageTabsStore()

    await logoutApi()
    authStore.clearUser()
    pageTabsStore.clearTabs()
    await navigateTo('/login')
  }

  return {
    login,
    fetchCurrentUser,
    logout
  }
}
