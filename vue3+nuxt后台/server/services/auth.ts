// 从 Node 内置 crypto 模块引入 randomUUID，用来生成随机登录 token。
import { randomUUID } from 'node:crypto'
// 从 redis 包引入 createClient，用来连接 Redis 保存服务端 session。
import { createClient } from 'redis'

// 浏览器保存登录 token 的 cookie 名称，登录、鉴权、退出都必须使用同一个名字。
export const authCookieName = 'nuxt-admin-token'

// Redis 里保存的 session 结构，只保存“token 对应哪个用户”和创建时间。
type AuthSession = {
  // token 对应哪个登录用户；后续 /api/me 和其他接口会根据它重新查 users 表。
  username: string
  // 当前只是记录创建时间，后续可以用它做 session 过期判断。
  createdAt: number
}

// 这里只声明当前代码真正用到的 Redis client 方法，避免把完整 redis 类型带进学习代码。
type SessionRedisClient = {
  // Redis 连接是否已经打开；未打开时才需要 connect。
  isOpen: boolean
  // 监听 Redis 错误，方便本地 Redis 没启动时在终端看到原因。
  on(event: 'error', listener: (error: unknown) => void): SessionRedisClient
  // 建立 Redis 连接；返回 client 自身，方便复用连接 Promise。
  connect(): Promise<SessionRedisClient>
  // 写入 Redis key；这里会配合 EX 设置 session 过期时间。
  set(key: string, value: string, options: { EX: number }): Promise<unknown>
  // 读取 Redis key；找不到时 redis 会返回 null。
  get(key: string): Promise<string | null>
  // 删除 Redis key；退出登录时用它让旧 token 立即失效。
  del(key: string): Promise<unknown>
}

// Nuxt 开发环境热更新会重复加载服务端文件，所以把 Redis client 缓存在 globalThis 上。
const globalForAuth = globalThis as unknown as {
  // 复用同一个 Redis client，避免每次请求都创建新连接。
  redisClient?: SessionRedisClient
  // 多个请求同时触发连接时复用同一个 Promise，避免并发重复 connect。
  redisConnectPromise?: Promise<SessionRedisClient>
}

// session 有效期，单位秒；这里和 cookie maxAge 保持一致，都是 24 小时。
const sessionTtlSeconds = 60 * 60 * 24
// Redis key 前缀，最终 key 形如 nuxt-admin:session:<token>。
const redisSessionKeyPrefix = 'nuxt-admin:session:'

// 获取 Redis client；如果还没连接，就先连接 Redis。
async function getRedisClient() {
  // 没写 REDIS_URL 时默认连本机 Redis，适合本地学习。
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'

  // 第一次使用时创建 Redis client；后续请求直接复用。
  if (!globalForAuth.redisClient) {
    // createClient 读取 Redis 地址，真实连接会在 connect() 时建立。
    const client = createClient({
      // Redis 连接地址，例如 redis://localhost:6379。
      url: redisUrl
    }) as unknown as SessionRedisClient

    // Redis 报错时打印到终端，方便定位本地 Redis 未启动、端口不对等问题。
    client.on('error', (error) => {
      // 这里不记录密码或 token，只记录连接错误本身。
      console.error('[redis] session store error:', error)
    })

    // 把创建好的 client 放到全局缓存里。
    globalForAuth.redisClient = client
  }

  // 取出已经创建或刚刚创建的 Redis client。
  const client = globalForAuth.redisClient

  // 如果连接还没打开，就发起连接。
  if (!client.isOpen) {
    // 多个请求同时进来时，复用同一个连接 Promise，避免重复 connect。
    globalForAuth.redisConnectPromise = globalForAuth.redisConnectPromise ?? client.connect().then(() => client)

    // 等待 Redis 连接完成。
    try {
      // 连接成功后，后续代码就可以安全读写 Redis。
      await globalForAuth.redisConnectPromise
    } catch (error) {
      // 连接失败时清掉 Promise，下次请求可以重新尝试连接。
      globalForAuth.redisConnectPromise = undefined
      // 把错误继续抛给调用方，让接口返回真实失败状态。
      throw error
    }
  }

  // 返回已经可用的 Redis client。
  return client
}

// 根据 token 拼出 Redis session key。
function getRedisSessionKey(token: string) {
  // 用固定前缀隔离项目里的登录 session key。
  return `${redisSessionKeyPrefix}${token}`
}

// 把登录 session 保存到 Redis。
async function saveSessionToRedis(token: string, session: AuthSession) {
  // 先拿到可用 Redis client。
  const client = await getRedisClient()

  // 写入 token -> session 映射，并设置过期时间。
  await client.set(getRedisSessionKey(token), JSON.stringify(session), {
    // EX 表示过期秒数。
    EX: sessionTtlSeconds
  })
}

// 从 Redis 读取登录 session。
async function readSessionFromRedis(token: string) {
  // 先拿到可用 Redis client。
  const client = await getRedisClient()
  // 按 token 对应的 key 读取 Redis 字符串。
  const rawSession = await client.get(getRedisSessionKey(token))

  // Redis 查不到 key，说明 token 不存在或已经过期。
  if (!rawSession) {
    // 返回 null，让 middleware 按未登录处理。
    return null
  }

  // Redis 存的是 JSON 字符串，读取后要解析回对象。
  try {
    // 解析时先当成 Partial<AuthSession>，因为 Redis 内容不能完全信任。
    const session = JSON.parse(rawSession) as Partial<AuthSession>

    // 只要 username 是字符串，就认为这个 session 可用于后续查数据库用户。
    return typeof session.username === 'string' ? session : null
  } catch {
    // JSON 解析失败说明 Redis 里数据异常，按无效 session 处理。
    return null
  }
}

// 删除 Redis 里的登录 session。
async function deleteSessionFromRedis(token: string) {
  // 先拿到可用 Redis client。
  const client = await getRedisClient()

  // 删除 token 对应的 Redis key。
  await client.del(getRedisSessionKey(token))
}

// 登录成功后创建服务端 session。
export async function createAuthSession(username: string) {
  // 生成随机 token，浏览器后续请求会通过 cookie 带回这个 token。
  const token = randomUUID()
  // session 里只保存 username 和创建时间，不保存完整用户对象。
  const session: AuthSession = {
    // 保存用户名，后续 middleware 会用它重新查 users 表。
    username,
    // 保存创建时间，后续可以扩展为更细的 session 过期判断。
    createdAt: Date.now()
  }

  // token 本身不直接存用户信息，真实登录态统一保存到 Redis。
  await saveSessionToRedis(token, session)

  // 返回 token，让登录接口写入 httpOnly cookie。
  return token
}

// 根据 cookie 里的 token 找回登录用户名。
export async function getAuthSessionUsername(token: string | undefined) {
  // 没有 token 就没有登录态。
  if (!token) {
    // 返回 null，让 middleware 按未登录处理。
    return null
  }

  // 从 Redis 里用 token 查 session。
  const session = await readSessionFromRedis(token)

  // 有 session 就返回 username；没有就返回 null。
  return session?.username ?? null
}

// 退出登录时删除服务端 session。
export async function deleteAuthSession(token: string | undefined) {
  // 没有 token 时不需要访问 Redis。
  if (!token) {
    // 直接结束退出逻辑。
    return
  }

  // 删除 Redis key，让旧 token 立即失效。
  await deleteSessionFromRedis(token)
}

// 不需要登录也能访问的接口白名单。
export const publicApiPaths = [
  // 前端登录前需要先拿公钥加密密码，所以公钥接口必须公开。
  '/api/auth/password-key',
  // 登录接口必须公开，否则用户还没 token 就无法登录。
  '/api/login',
  // 退出接口允许公开调用，服务端会根据 cookie 尝试删除 session。
  '/api/logout'
]
