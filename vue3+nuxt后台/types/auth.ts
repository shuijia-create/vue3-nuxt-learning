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

export type LoginResponse = {
  user: AuthUser
}

export type MeResponse = {
  user: AuthUser
}

export type LogoutResponse = {
  ok: true
}

export type PasswordPublicKeyResponse = {
  publicKey: string
}
