import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '~/generated/prisma/client'

// 创建 PrismaClient，也就是 Nuxt 后端访问 MySQL 的客户端。
// server/api 和 server/services 不直接写 SQL，而是通过这个客户端调用 users、work_orders 等表。
function createPrismaClient() {
  // DATABASE_URL 写在本地 .env，里面包含 MySQL 主机、端口、用户名、密码和数据库名。
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured')
  }

  // Nuxt 后端连接 MySQL 的入口。
  // Prisma 7 需要 driver adapter；这里用 .env 的 DATABASE_URL 创建 MySQL/MariaDB 适配器。
  const adapter = new PrismaMariaDb(databaseUrl)

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
