import type { Role } from '~/generated/prisma/client'
import { prisma } from '~/server/utils/prisma'
import type { RoleListItem } from '~/types/role'

type CreateRoleInput = {
  name: string
  code: string
  description?: string
  isDepartmentManager: boolean
}

const defaultRoles = [
  {
    name: '普通管理员',
    code: 'admin',
    description: '可以查看基础后台页面，具体操作由角色权限控制。',
    isDepartmentManager: false,
    sort: 10
  },
  {
    name: '超级管理员',
    code: 'super_admin',
    description: '系统内置最高权限角色，默认拥有全部页面和按钮权限。',
    isDepartmentManager: false,
    sort: 20
  }
]

function toRoleListItem(role: Role): RoleListItem {
  return {
    id: role.id,
    name: role.name,
    code: role.code,
    description: role.description,
    isDepartmentManager: role.isDepartmentManager,
    status: role.status,
    sort: role.sort,
    createdAt: role.createdAt.toISOString()
  }
}

export async function ensureDefaultRoles() {
  for (const role of defaultRoles) {
    await prisma.role.upsert({
      where: {
        code: role.code
      },
      update: {
        name: role.name,
        description: role.description,
        isDepartmentManager: role.isDepartmentManager,
        status: 1,
        sort: role.sort
      },
      create: {
        ...role,
        status: 1
      }
    })
  }
}

export async function listRoles() {
  await ensureDefaultRoles()

  const roles = await prisma.role.findMany({
    orderBy: [
      {
        sort: 'asc'
      },
      {
        id: 'asc'
      }
    ]
  })

  return roles.map(toRoleListItem)
}

export async function listEnabledRoleCodes() {
  await ensureDefaultRoles()

  const roles = await prisma.role.findMany({
    where: {
      status: 1
    },
    select: {
      code: true
    }
  })

  return roles.map(role => role.code)
}

export async function roleExists(code: string) {
  await ensureDefaultRoles()

  const count = await prisma.role.count({
    where: {
      code,
      status: 1
    }
  })

  return count > 0
}

export async function findRoleByCode(code: string) {
  await ensureDefaultRoles()

  const role = await prisma.role.findUnique({
    where: {
      code
    }
  })

  return role ? toRoleListItem(role) : null
}

export async function createRole(input: CreateRoleInput) {
  await ensureDefaultRoles()

  const role = await prisma.role.create({
    data: {
      name: input.name,
      code: input.code,
      description: input.description || null,
      isDepartmentManager: input.isDepartmentManager,
      status: 1,
      sort: 100
    }
  })

  return toRoleListItem(role)
}
