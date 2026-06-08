export type LoginPayload = {
  username: string
  password: string
}

export type AuthUser = {
  id: number
  username: string
  nickname: string
  roles: string[]
}

export type LoginResponse = {
  user: AuthUser
}

export type MeResponse = {
  user: AuthUser
}

export type LogoutResponse = {
  ok: true
}
