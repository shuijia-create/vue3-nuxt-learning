import type { User } from '~/generated/prisma/client'
import { prisma } from '~/server/utils/prisma'
import { hashPassword, verifyPassword } from '~/server/utils/password'

type DbUserForAuth = Pick<User, 'id' | 'username' | 'nickname' | 'role'>
type DbUserForList = Pick<User, 'id' | 'username' | 'nickname' | 'role' | 'createdAt'>

export const userRoles = ['admin', 'super_admin'] as const

export type UserRole = typeof userRoles[number]

// 返回给前端和鉴权 middleware 使用的用户结构。
// 注意这里没有 passwordHash，避免把密码哈希暴露给浏览器。
export type AuthUser = {
  id: number
  username: string
  nickname: string
  roles: string[]
}

export type UserListItem = AuthUser & {
  role: string
  createdAt: string
}

type CreateUserInput = {
  username: string
  password: string
  nickname: string
  role: UserRole
}

// 把数据库里的 User 记录转换成前端需要的登录用户信息。
// 数据库里现在只有一个 role 字符串，前端沿用之前的 roles 数组格式，所以这里包成数组。
function toAuthUser(user: DbUserForAuth): AuthUser {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    roles: [user.role]
  }
}

// 账号管理列表使用：同样不返回 passwordHash，只返回可以展示的账号字段。
function toUserListItem(user: DbUserForList): UserListItem {
  return {
    ...toAuthUser(user),
    role: user.role,
    createdAt: user.createdAt.toISOString()
  }
}

export function isUserRole(role: string): role is UserRole {
  // 用白名单限制 role，防止接口收到乱写的角色字符串。
  return userRoles.includes(role as UserRole)
}

export function isSuperAdmin(user: AuthUser | undefined) {
  // 当前权限模型很简单：roles 里包含 super_admin，就允许进入账号管理。
  return Boolean(user?.roles.includes('super_admin'))
}

// 登录接口使用：根据用户名查 users 表，再校验用户输入的密码。
// 登录时不应该插入用户；用户应该提前存在数据库里，这里只负责“查找 + 校验”。
export async function findUserByCredentials(username: string, password: string) {
  // username 在 schema.prisma 里是 @unique，所以可以用 findUnique 精准查一条。
  const user = await prisma.user.findUnique({
    where: {
      username
    }
  })

  // 查不到用户，或者密码哈希对不上，都统一返回 null。
  // 这样登录接口只需要判断 null，不暴露“账号不存在”还是“密码错误”的细节。
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return null
  }

  // 登录成功后，只返回安全的用户字段，不返回 passwordHash。
  return toAuthUser(user)
}

// 已登录接口和服务端鉴权使用：根据用户名重新从数据库读取当前用户。
// middleware 先从 session token 找到用户名，再用这个函数查数据库，保证当前用户来自真实 users 表。
export async function findAuthUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: {
      username
    }
  })

  // 查到就转换成 AuthUser；查不到返回 null，让 middleware 返回 401。
  return user ? toAuthUser(user) : null
}

export async function listUsers() {
  // 账号列表只读 users 表，不返回 passwordHash。
  const users = await prisma.user.findMany({
    orderBy: {
      id: 'asc'
    }
  })

  return users.map(toUserListItem)
}

export async function createUserAccount(input: CreateUserInput) {
  // 写入数据库前必须先把明文密码变成 bcrypt 哈希。
  // 数据库永远只保存 passwordHash，不保存用户输入的原始密码。
  const passwordHash = await hashPassword(input.password)

  // Prisma 会把 passwordHash 映射到 MySQL 的 password_hash 字段。
  const user = await prisma.user.create({
    data: {
      username: input.username,
      passwordHash,
      nickname: input.nickname,
      role: input.role
    }
  })

  return toUserListItem(user)
}
