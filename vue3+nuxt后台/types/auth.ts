import type { WorkOrderHandlerDepartment } from '~/types/work-order'

export type LoginForm = {
  username: string
  password: string
}

export type LoginPayload = {
  username: string
  password: string
}

export type AuthUser = {
  id: number
  username: string
  nickname: string
  roles: string[]
  departmentName?: WorkOrderHandlerDepartment
  isDepartmentManager: boolean
}

export type AuthRouteItem = {
  code: string
  title: string
  path: string
  icon: string
  showInMenu: boolean
}

export type AuthButtonPermission = {
  code: string
  name: string
}

export type AuthInfo = {
  user: AuthUser
  routes: AuthRouteItem[]
  buttons: AuthButtonPermission[]
}

export type LoginResponse = {
  token: string
}

export type MeResponse = AuthInfo

export type LogoutResponse = {
  ok: true
}
