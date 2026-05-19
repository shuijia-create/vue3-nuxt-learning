import type { PublicUser } from '~/server/utils/users'

export function useAuth() {
  // 这份状态保存“当前登录用户”。
  // 同一个 key 在不同页面、组件、middleware 里拿到的是同一份共享状态。
  const user = useState<PublicUser | null>('auth:user', () => null)
  const loading = useState('auth:loading', () => false)

  const isLoggedIn = computed(() => Boolean(user.value))
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function fetchUser() {
    // 从服务端读取“当前 cookie 对应的用户是谁”。
    // cookie 转发逻辑统一交给 useApiFetch 处理。
    const data = await useApiFetch<{ user: PublicUser | null }>('/api/auth/me')

    user.value = data.user
    return user.value
  }

  async function login(email: string, password: string) {
    loading.value = true

    try {
      const data = await useApiFetch<{ user: PublicUser }>('/api/auth/login', {
        method: 'POST',
        body: {
          email,
          password
        }
      })

      user.value = data.user
      return data.user
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await useApiFetch('/api/auth/logout', {
      method: 'POST'
    })

    user.value = null
    await navigateTo('/login')
  }

  return {
    user,
    loading,
    isLoggedIn,
    isAdmin,
    fetchUser,
    login,
    logout
  }
}
