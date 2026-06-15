import { URL } from 'node:url'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '~/generated/prisma/client'

function createMariaDbConfig(databaseUrl: string) {
  const parsedUrl = new URL(databaseUrl)
  const database = parsedUrl.pathname.replace(/^\//, '')
  const shouldUseSsl = parsedUrl.searchParams.has('sslaccept')
    || parsedUrl.searchParams.get('ssl') === 'true'
    || parsedUrl.hostname.includes('tidbcloud.com')

  return {
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || 3306),
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database,
    ...(shouldUseSsl
      ? {
          ssl: {
            rejectUnauthorized: true
          }
        }
      : {})
  }
}

// 创建 PrismaClient，也就是 Nuxt 后端访问 MySQL 的客户端。
// server/api 和 server/services 不直接写 SQL，而是通过这个客户端调用 users、work_orders 等表。
function createPrismaClient() {
  // DATABASE_URL 写在本地 .env，里面包含 MySQL 主机、端口、用户名、密码和数据库名。
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured')
  }

  // Nuxt 后端连接 MySQL 的入口。
  // TiDB Cloud Serverless 强制要求 TLS；这里把 DATABASE_URL 转成 mariadb PoolConfig 后显式启用 SSL。
  const adapter = new PrismaMariaDb(createMariaDbConfig(databaseUrl))

  return new PrismaClient({ adapter })
}

type PrismaClientInstance = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientInstance
}

// 开发环境热更新会重复加载服务端文件，复用同一个 PrismaClient 可以避免创建过多数据库连接。
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 只在开发环境挂到 globalThis；生产环境正常创建即可，避免全局状态长期残留。
if (import.meta.dev) {
  globalForPrisma.prisma = prisma
}
