export type UserRole = 'admin' | 'user'

export interface DemoUser {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
}

export interface PublicUser {
  id: string
  name: string
  email: string
  role: UserRole
}

// 学习项目先用内存数组模拟数据库。
// 真实项目中，这里通常会改成 Prisma、Drizzle、MySQL、PostgreSQL 或其他数据源。
export const demoUsers: DemoUser[] = [
  {
    id: 'u_1001',
    name: '学习用户',
    email: 'student@example.com',
    password: '123456',
    role: 'user'
  },
  {
    id: 'u_1002',
    name: '管理员',
    email: 'admin@example.com',
    password: '123456',
    role: 'admin'
  }
]

export function toPublicUser(user: DemoUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  }
}

export function findUserByEmail(email: string) {
  return demoUsers.find((user) => user.email === email)
}

export function findUserById(id: string) {
  return demoUsers.find((user) => user.id === id)
}
