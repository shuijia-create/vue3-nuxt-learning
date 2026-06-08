import { defineStore } from 'pinia'
import { fetchMeApi, isUnauthorizedError, loginApi, logoutApi } from '~/utils/api/auth'
import { usePageTabsStore } from '~/stores/page-tabs'
import type { AuthUser, LoginPayload } from '~/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const authResolved = ref(false)

  const isLoggedIn = computed(() => Boolean(user.value))

  // 登录：调后端 /api/login，cookie 由后端自动写入，前端只需要把返回的用户信息存进 store
  async function login(payload: LoginPayload) {
    const result = await loginApi(payload)

    user.value = result.user
    authResolved.value = true

    return result.user
  }

  async function fetchMe() {
    try {
      const result = await fetchMeApi()

      user.value = result.user
      authResolved.value = true

      return result.user
    } catch (error) {
      if (!isUnauthorizedError(error)) {
        throw error
      }

      user.value = null
      authResolved.value = true

      return null
    }
  }

  async function logout() {
    const pageTabsStore = usePageTabsStore()

    await logoutApi()
    user.value = null
    authResolved.value = true
    pageTabsStore.clearTabs()
    await navigateTo('/login')
  }

  return {
    user,
    authResolved,
    isLoggedIn,
    login,
    fetchMe,
    logout
  }
})
