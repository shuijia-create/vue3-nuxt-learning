import { defineStore } from 'pinia'
import { usePageTabsStore } from '~/stores/page-tabs'

type LoginPayload = {
  username: string
  password: string
}

type UserInfo = {
  id: number
  username: string
  nickname: string
  roles: string[]
}

type LoginResponse = {
  token: string
  user: UserInfo
}

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie<string | null>('nuxt-admin-token')
  const user = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => Boolean(token.value))

  async function login(payload: LoginPayload) {
    const result = await $fetch<LoginResponse>('/api/login', {
      method: 'POST',
      body: payload
    })

    token.value = result.token
    user.value = result.user
  }

  async function fetchMe() {
    if (!token.value) {
      user.value = null
      return null
    }

    // SSR 中用 useRequestFetch 转发当前请求的 cookie，避免内部调用 /api/me 时丢失登录态。
    const requestFetch = import.meta.server ? useRequestFetch() : $fetch
    const result = await requestFetch<{ user: UserInfo }>('/api/me')
    user.value = result.user
    return result.user
  }

  async function logout() {
    const pageTabsStore = usePageTabsStore()

    await $fetch('/api/logout', { method: 'POST' })
    token.value = null
    user.value = null
    pageTabsStore.clearTabs()
    await navigateTo('/login')
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    fetchMe,
    logout
  }
})
