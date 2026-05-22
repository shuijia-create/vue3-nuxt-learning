import type { H3Event } from 'h3'
import { findUserById, type DemoUser } from './users'

export const AUTH_COOKIE_NAME = 'study_token'

const LEGACY_COOKIE_NAME = 'study_session'
const DEMO_TOKEN_PREFIX = 'demo-token:'
const ONE_DAY_SECONDS = 60 * 60 * 24

// 教学用 token：把用户 id 包进一个 token 字符串里。
// 真实项目不要这样写，应该使用随机 session id、签名 JWT，或服务端 session 存储。
export function createAuthToken(userId: string) {
  return `${DEMO_TOKEN_PREFIX}${userId}`
}

export function parseAuthToken(token?: string) {
  if (!token?.startsWith(DEMO_TOKEN_PREFIX)) {
    return null
  }

  return token.slice(DEMO_TOKEN_PREFIX.length)
}

export function setAuthToken(event: H3Event, userId: string) {
  setCookie(event, AUTH_COOKIE_NAME, createAuthToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_DAY_SECONDS
  })

  // 兼容之前学习版本里的 study_session，避免旧 cookie 干扰判断。
  deleteCookie(event, LEGACY_COOKIE_NAME, {
    path: '/'
  })
}

export function clearAuthToken(event: H3Event) {
  deleteCookie(event, AUTH_COOKIE_NAME, {
    path: '/'
  })

  deleteCookie(event, LEGACY_COOKIE_NAME, {
    path: '/'
  })
}

export function getCurrentUser(event: H3Event): DemoUser | null {
  const token = getCookie(event, AUTH_COOKIE_NAME)
  const userId = parseAuthToken(token)

  if (!userId) {
    return null
  }

  return findUserById(userId) || null
}

export function requireUser(event: H3Event): DemoUser {
  const user = getCurrentUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '请先登录'
    })
  }

  return user
}

export function requireAdmin(event: H3Event): DemoUser {
  const user = requireUser(event)

  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: '没有管理员权限'
    })
  }

  return user
}
