import type { User } from '~/generated/prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/prisma'
import type { WorkOrderHandlerDepartment } from '~/types/work-order'

type DbUserForAuth = Pick<User, 'id' | 'username' | 'nickname' | 'role' | 'departmentName' | 'isDepartmentManager'>
type DbUserForList = Pick<User, 'id' | 'username' | 'nickname' | 'role' | 'departmentName' | 'isDepartmentManager' | 'createdAt'>

const bcryptSaltRounds = 10

// 返回给前端和鉴权 middleware 使用的用户结构。
// 注意这里没有 passwordHash，避免把密码哈希暴露给浏览器。
export type AuthUser = {
  id: number
  username: string
  nickname: string
  roles: string[]
  departmentName?: WorkOrderHandlerDepartment
  isDepartmentManager: boolean
}

export type UserListItem = AuthUser & {
  role: string
  createdAt: string
}

export type AssignableUser = Pick<AuthUser, 'id' | 'username' | 'nickname' | 'departmentName'>

type CreateUserInput = {
  username: string
  // 这里是 HTTPS 请求里的原始密码，只在本次请求内存里用于生成 bcrypt 哈希。
  password: string
  nickname: string
  role: string
  departmentName: WorkOrderHandlerDepartment
  isDepartmentManager: boolean
}

const authUserSelect = {
  id: true,
  username: true,
  nickname: true,
  role: true,
  departmentName: true,
  isDepartmentManager: true
} as const

const credentialUserSelect = {
  ...authUserSelect,
  passwordHash: true
} as const

const userListSelect = {
  ...authUserSelect,
  createdAt: true
} as const

// 把数据库里的 User 记录转换成前端需要的登录用户信息。
// 数据库里现在只有一个 role 字符串，前端沿用之前的 roles 数组格式，所以这里包成数组。
function toAuthUser(user: DbUserForAuth): AuthUser {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    roles: [user.role],
    departmentName: (user.departmentName as WorkOrderHandlerDepartment | null) ?? undefined,
    isDepartmentManager: user.isDepartmentManager
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

// 登录接口使用：根据用户名查 users 表，再校验本次请求里的密码。
// 登录时不应该插入用户；用户应该提前存在数据库里，这里只负责“查找 + 校验”。
export async function findUserByCredentials(username: string, password: string) {
  // username 在 schema.prisma 里是 @unique，所以可以用 findUnique 精准查一条。
  const user = await prisma.user.findUnique({
    where: {
      username
    },
    // 只有登录校验需要读取 passwordHash；其他查询都不应该把密码哈希带出数据库。
    select: credentialUserSelect
  })

  // 查不到用户，或者密码哈希对不上，都统一返回 null。
  // 这样登录接口只需要判断 null，不暴露“账号不存在”还是“密码错误”的细节。
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
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
    },
    select: authUserSelect
  })

  // 查到就转换成 AuthUser；查不到返回 null，让 middleware 返回 401。
  return user ? toAuthUser(user) : null
}

export async function listUsers() {
  // 账号列表只读 users 表，不返回 passwordHash。
  const users = await prisma.user.findMany({
    select: userListSelect,
    orderBy: {
      id: 'asc'
    }
  })

  return users.map(toUserListItem)
}

export async function createUserAccount(input: CreateUserInput) {
  // 写入数据库前必须先把请求里的密码变成 bcrypt 哈希。
  // 数据库永远只保存 passwordHash，不保存用户输入的原始密码。
  const passwordHash = await bcrypt.hash(input.password, bcryptSaltRounds)

  // Prisma 会把 passwordHash 映射到 MySQL 的 password_hash 字段。
  const user = await prisma.user.create({
    data: {
      username: input.username,
      passwordHash,
      nickname: input.nickname,
      role: input.role,
      departmentName: input.departmentName,
      isDepartmentManager: input.isDepartmentManager
    },
    select: userListSelect
  })

  return toUserListItem(user)
}

export async function updateUserRole(id: number, role: string) {
  const user = await prisma.user.update({
    where: {
      id
    },
    data: {
      role
    },
    select: userListSelect
  })

  return toUserListItem(user)
}

export async function updateUserWorkScope(
  id: number,
  departmentName: WorkOrderHandlerDepartment,
  isDepartmentManager: boolean
) {
  const user = await prisma.user.update({
    where: {
      id
    },
    data: {
      departmentName,
      isDepartmentManager
    },
    select: userListSelect
  })

  return toUserListItem(user)
}

export async function findUserById(id: number) {
  const user = await prisma.user.findUnique({
    where: {
      id
    },
    select: authUserSelect
  })

  return user ? toAuthUser(user) : null
}

export async function listAssignableUsers(departmentName?: WorkOrderHandlerDepartment) {
  const users = await prisma.user.findMany({
    where: departmentName
      ? {
          departmentName
        }
      : undefined,
    select: authUserSelect,
    orderBy: {
      id: 'asc'
    }
  })

  return users.map(user => ({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    departmentName: (user.departmentName as WorkOrderHandlerDepartment | null) ?? undefined
  }))
}

export async function listDepartmentManagers(departmentName: WorkOrderHandlerDepartment) {
  const users = await prisma.user.findMany({
    where: {
      departmentName,
      isDepartmentManager: true
    },
    select: authUserSelect,
    orderBy: {
      id: 'asc'
    }
  })

  return users.map(toAuthUser)
}
