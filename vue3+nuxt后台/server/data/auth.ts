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
  redisClient?: SessionRedisClient
  redisConnectPromise?: Promise<SessionRedisClient>
}

const sessionTtlSeconds = 60 * 60 * 24
const redisSessionKeyPrefix = 'nuxt-admin:session:'

async function getRedisClient() {
  // 项目现在只保留 Redis session。
  // 没写 REDIS_URL 时默认连本机 Redis：redis://localhost:6379。
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'

  if (!globalForAuth.redisClient) {
    const client = createClient({
      url: redisUrl
    }) as unknown as SessionRedisClient

    client.on('error', (error) => {
      // Redis 没启动、端口不对、连接断开时，会在终端看到这个错误。
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

  // token 本身不直接存用户信息，真实登录态统一保存到 Redis。
  // Redis 里保存的是 nuxt-admin:session:<token> -> { username, createdAt }。
  await saveSessionToRedis(token, session)

  return token
}

export async function getAuthSessionUsername(token: string | undefined) {
  if (!token) {
    return null
  }

  // 从 Redis 里用 token 查 session，再拿到 username。
  const session = await readSessionFromRedis(token)

  return session?.username ?? null
}

export async function deleteAuthSession(token: string | undefined) {
  if (!token) {
    return
  }

  // 退出登录时删除 Redis key，让旧 token 立即失效。
  await deleteSessionFromRedis(token)
}

// 不需要登录也能访问的接口。登录接口必须公开，否则用户还没 token 就无法登录。
export const publicApiPaths = [
  '/api/login',
  '/api/logout'
]
