import { randomUUID } from 'node:crypto'
import { createClient } from 'redis'

export const authCookieName = 'nuxt-admin-token'

type AuthSession = {
  // token 对应哪个登录用户；后续 /api/me 和其他接口会根据它重新查 users 表。
  username: string
  // 当前只是记录创建时间，后续可以用它做 session 过期判断。
  createdAt: number
}

type SessionRedisClient = {
  isOpen: boolean
  on(event: 'error', listener: (error: unknown) => void): SessionRedisClient
  connect(): Promise<SessionRedisClient>
  set(key: string, value: string, options: { EX: number }): Promise<unknown>
  get(key: string): Promise<string | null>
  del(key: string): Promise<unknown>
}

const globalForAuth = globalThis as unknown as {
  authSessions?: Map<string, AuthSession>
  redisClient?: SessionRedisClient
  redisConnectPromise?: Promise<SessionRedisClient>
}

const sessionTtlSeconds = 60 * 60 * 24
const redisSessionKeyPrefix = 'nuxt-admin:session:'

// 没有配置 Redis 时，学习项目仍然可以用内存 Map 跑起来。
// 配置 SESSION_STORE=redis 后，这个 Map 就不会再保存登录态，token 会写入 Redis。
const authSessions = globalForAuth.authSessions ?? new Map<string, AuthSession>()

if (import.meta.dev) {
  globalForAuth.authSessions = authSessions
}

function shouldUseRedisSessionStore() {
  // SESSION_STORE 明确配置时，以它为准；memory 可以强制走内存模式。
  if (process.env.SESSION_STORE) {
    return process.env.SESSION_STORE === 'redis'
  }

  // 没写 SESSION_STORE 但配置了 REDIS_URL，也认为你想把 token 存到 Redis。
  return Boolean(process.env.REDIS_URL)
}

async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'

  if (!globalForAuth.redisClient) {
    const client = createClient({
      url: redisUrl
    }) as unknown as SessionRedisClient

    client.on('error', (error) => {
      console.error('[redis] session store error:', error)
    })

    globalForAuth.redisClient = client
  }

  const client = globalForAuth.redisClient

  if (!client.isOpen) {
    // 多个请求同时进来时，复用同一个连接 Promise，避免重复 connect。
    globalForAuth.redisConnectPromise = globalForAuth.redisConnectPromise ?? client.connect().then(() => client)

    try {
      await globalForAuth.redisConnectPromise
    } catch (error) {
      globalForAuth.redisConnectPromise = undefined
      throw error
    }
  }

  return client
}

function getRedisSessionKey(token: string) {
  return `${redisSessionKeyPrefix}${token}`
}

async function saveSessionToRedis(token: string, session: AuthSession) {
  const client = await getRedisClient()

  // EX 表示过期秒数。这里和 cookie maxAge 保持一致，都是 24 小时。
  await client.set(getRedisSessionKey(token), JSON.stringify(session), {
    EX: sessionTtlSeconds
  })
}

async function readSessionFromRedis(token: string) {
  const client = await getRedisClient()
  const rawSession = await client.get(getRedisSessionKey(token))

  if (!rawSession) {
    return null
  }

  try {
    const session = JSON.parse(rawSession) as Partial<AuthSession>

    return typeof session.username === 'string' ? session : null
  } catch {
    return null
  }
}

async function deleteSessionFromRedis(token: string) {
  const client = await getRedisClient()

  await client.del(getRedisSessionKey(token))
}

export async function createAuthSession(username: string) {
  // 登录成功后生成一个随机 token，浏览器后续请求会通过 cookie 带回这个 token。
  const token = randomUUID()
  const session: AuthSession = {
    username,
    createdAt: Date.now()
  }

  if (shouldUseRedisSessionStore()) {
    // Redis 模式：token -> session 写入 Redis，服务重启后登录态仍然可以被 Redis 找回。
    await saveSessionToRedis(token, session)
    return token
  }

  // token 本身不直接存用户信息，只在服务端 Map 里保存 token -> username 的关系。
  authSessions.set(token, session)

  return token
}

export async function getAuthSessionUsername(token: string | undefined) {
  if (!token) {
    return null
  }

  if (shouldUseRedisSessionStore()) {
    // Redis 模式：从 Redis 里用 token 查 session，再拿到 username。
    const session = await readSessionFromRedis(token)

    return session?.username ?? null
  }

  // middleware 只认服务端保存过的 token；伪造一个随机 token 查不到 username，就会被当成未登录。
  return authSessions.get(token)?.username ?? null
}

export async function deleteAuthSession(token: string | undefined) {
  if (!token) {
    return
  }

  if (shouldUseRedisSessionStore()) {
    // Redis 模式：删除 Redis key，旧 token 立刻失效。
    await deleteSessionFromRedis(token)
    return
  }

  // 退出登录时删除服务端 session，让旧 token 立即失效。
  authSessions.delete(token)
}

// 不需要登录也能访问的接口。登录接口必须公开，否则用户还没 token 就无法登录。
export const publicApiPaths = [
  '/api/login'
]
