import type { MenuRouteItem } from '~/types/menu'

export type LoginForm = {
  username: string
  password: string
}

export type LoginPayload = {
  username: string
  encryptedPassword: string
}

export type AuthUser = {
  id: number
  username: string
  nickname: string
  roles: string[]
}

export type AuthPagePermission = {
  code: string
  path: string
}

export type AuthInfo = {
  user: AuthUser
  menus: MenuRouteItem[]
  pagePermissions: AuthPagePermission[]
  buttonPermissions: string[]
}

export type LoginResponse = AuthInfo

export type MeResponse = AuthInfo

export type LogoutResponse = {
  ok: true
}

export type PasswordPublicKeyResponse = {
  publicKey: string
}
