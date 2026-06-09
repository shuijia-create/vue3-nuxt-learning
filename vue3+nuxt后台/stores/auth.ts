import { defineStore } from 'pinia'
import type { AuthUser } from '~/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const authResolved = ref(false)

  const isLoggedIn = computed(() => Boolean(user.value))

  function setUser(nextUser: AuthUser) {
    user.value = nextUser
    authResolved.value = true
  }

  function clearUser() {
    user.value = null
    authResolved.value = true
  }

  return {
    user,
    authResolved,
    isLoggedIn,
    setUser,
    clearUser
  }
})
