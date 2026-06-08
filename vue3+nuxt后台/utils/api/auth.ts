import type { LoginPayload, LoginResponse, LogoutResponse, MeResponse } from '~/types/auth'

type ApiFetch = <T>(request: string, options?: Parameters<typeof $fetch>[1]) => Promise<T>

function getApiFetch() {
  return (import.meta.server ? useRequestFetch() : $fetch) as ApiFetch
}

export function isUnauthorizedError(error: unknown) {
  const maybeError = error as {
    statusCode?: unknown
    response?: {
      status?: unknown
    }
  }

  return maybeError.statusCode === 401 || maybeError.response?.status === 401
}

// 登录请求：发送用户名 + 密码，后端校验通过后会把 token 写入 httpOnly cookie
export function loginApi(payload: LoginPayload) {
  return $fetch<LoginResponse>('/api/login', {
    method: 'POST',
    body: payload
  })
}

export function fetchMeApi(fetcher?: ApiFetch) {
  const requestFetch = fetcher ?? getApiFetch()

  return requestFetch<MeResponse>('/api/me')
}

export function logoutApi() {
  return $fetch<LogoutResponse>('/api/logout', {
    method: 'POST'
  })
}
