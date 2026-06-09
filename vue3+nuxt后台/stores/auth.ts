import { defineStore } from 'pinia'
import type { AuthInfo, AuthPagePermission, AuthUser } from '~/types/auth'
import type { MenuRouteItem } from '~/types/menu'

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
  const menus = ref<MenuRouteItem[]>([])
  const pagePermissions = ref<AuthPagePermission[]>([])
  const buttonPermissions = ref<string[]>([])
  const authResolved = ref(false)

  const isLoggedIn = computed(() => Boolean(user.value))
  const buttonPermissionSet = computed(() => new Set(buttonPermissions.value))

  function setAuthInfo(nextInfo: AuthInfo) {
    user.value = nextInfo.user
    menus.value = nextInfo.menus
    pagePermissions.value = nextInfo.pagePermissions
    buttonPermissions.value = nextInfo.buttonPermissions
    authResolved.value = true
  }

  function setUser(nextUser: AuthUser) {
    user.value = nextUser
    authResolved.value = true
  }

  function clearUser() {
    user.value = null
    menus.value = []
    pagePermissions.value = []
    buttonPermissions.value = []
    authResolved.value = true
  }

  function canAccessPage(path: string) {
    if (!user.value) {
      return false
    }

    return pagePermissions.value.some((permission) => {
      return isPagePathMatched(permission.path, path)
    })
  }

  function hasButtonPermission(code: string) {
    return buttonPermissionSet.value.has(code)
  }

  return {
    user,
    menus,
    pagePermissions,
    buttonPermissions,
    authResolved,
    isLoggedIn,
    setAuthInfo,
    setUser,
    clearUser,
    canAccessPage,
    hasButtonPermission
  }
})
