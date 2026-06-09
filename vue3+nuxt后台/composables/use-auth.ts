import { fetchMeApi, isUnauthorizedError, loginApi, logoutApi } from '~/utils/api/auth'
import { useAuthStore } from '~/stores/auth'
import { usePageTabsStore } from '~/stores/page-tabs'
import type { LoginPayload } from '~/types/auth'

export function useAuth() {
  const authStore = useAuthStore()

  async function login(payload: LoginPayload) {
    const result = await loginApi(payload)

    authStore.setUser(result.user)

    return result.user
  }

  async function fetchCurrentUser() {
    try {
      const result = await fetchMeApi()

      authStore.setUser(result.user)

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
