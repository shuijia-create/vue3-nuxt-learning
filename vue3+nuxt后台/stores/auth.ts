import { defineStore } from 'pinia'
import type { AuthButtonPermission, AuthInfo, AuthRouteItem, AuthUser } from '~/types/auth'

function normalizePagePath(path: string) {
  const pathWithoutQuery = path.split('?')[0]?.split('#')[0] ?? '/'
  const normalized = pathWithoutQuery.startsWith('/') ? pathWithoutQuery : `/${pathWithoutQuery}`

  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1)
  }

  return normalized
}

function splitPath(path: string) {
  return normalizePagePath(path).split('/').filter(Boolean)
}

function isDynamicSegment(segment: string) {
  return segment.startsWith('[') && segment.endsWith(']')
}

function isPagePathMatched(permissionPath: string, requestPath: string) {
  const permissionSegments = splitPath(permissionPath)
  const requestSegments = splitPath(requestPath)

  if (permissionSegments.length !== requestSegments.length) {
    return false
  }

  return permissionSegments.every((segment, index) => {
    return isDynamicSegment(segment) || segment === requestSegments[index]
  })
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const routes = ref<AuthRouteItem[]>([])
  const buttons = ref<AuthButtonPermission[]>([])
  const authResolved = ref(false)

  const isLoggedIn = computed(() => Boolean(user.value))
  const menus = computed(() => routes.value.filter(route => route.showInMenu))
  const buttonPermissionSet = computed(() => new Set(buttons.value.map(button => button.code)))

  function setAuthInfo(nextInfo: AuthInfo) {
    user.value = nextInfo.user
    routes.value = nextInfo.routes
    buttons.value = nextInfo.buttons
    authResolved.value = true
  }

  function setUser(nextUser: AuthUser) {
    user.value = nextUser
    authResolved.value = true
  }

  function clearUser() {
    user.value = null
    routes.value = []
    buttons.value = []
    authResolved.value = true
  }

  function canAccessPage(path: string) {
    if (!user.value) {
      return false
    }

    return routes.value.some((route) => {
      return isPagePathMatched(route.path, path)
    })
  }

  function hasButtonPermission(code: string) {
    return buttonPermissionSet.value.has(code)
  }

  return {
    user,
    routes,
    menus,
    buttons,
    authResolved,
    isLoggedIn,
    setAuthInfo,
    setUser,
    clearUser,
    canAccessPage,
    hasButtonPermission
  }
})
