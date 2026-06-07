import { prisma } from '~/server/utils/prisma'
import { ensureDefaultRoles, listEnabledRoleCodes, roleExists } from '~/server/services/roles'
import type { AuthUser } from '~/server/services/users'
import type { MenuRouteItem } from '~/types/menu'
import type { PermissionTreeItem, PermissionType } from '~/types/permission'

type PermissionSeedButton = {
  name: string
  code: string
  sort: number
}

type PermissionSeedPage = {
  name: string
  code: string
  path: string
  sort: number
  buttons?: PermissionSeedButton[]
}

type CreatePermissionInput = {
  name: string
  code: string
  type: PermissionType
  path?: string
  parentId?: number
}

const permissionTypeLabels: Record<PermissionType, string> = {
  1: '页面权限',
  2: '按钮权限'
}

const menuIconMap: Record<string, string> = {
  'dashboard.page': 'DataAnalysis',
  'work_orders.page': 'Tickets',
  'ai_work_order_draft.page': 'Document',
  'ai_knowledge.page': 'ChatDotRound',
  'accounts.page': 'UserFilled',
  'permissions.page': 'Key',
  'roles.page': 'Management',
  'system.page': 'Setting'
}

// 所有页面都先建立页面权限；页面里的关键操作再建立按钮权限。
// code 是后端以后判断权限时最稳定的字段，不建议用中文名称判断权限。
const permissionSeeds: PermissionSeedPage[] = [
  {
    name: '工作台',
    code: 'dashboard.page',
    path: '/dashboard',
    sort: 10
  },
  {
    name: '工单列表',
    code: 'work_orders.page',
    path: '/work-orders',
    sort: 20,
    buttons: [
      { name: '查询工单', code: 'work_orders.search', sort: 21 },
      { name: '重置筛选', code: 'work_orders.reset', sort: 22 },
      { name: '创建工单', code: 'work_orders.create', sort: 23 },
      { name: '查看详情', code: 'work_orders.view_detail', sort: 24 }
    ]
  },
  {
    name: '工单详情',
    code: 'work_order_detail.page',
    path: '/work-orders/[id]',
    sort: 30,
    buttons: [
      { name: '状态流转', code: 'work_order_detail.change_status', sort: 31 }
    ]
  },
  {
    name: '工单草稿助手',
    code: 'ai_work_order_draft.page',
    path: '/ai/work-order-draft',
    sort: 40,
    buttons: [
      { name: '生成草稿', code: 'ai_work_order_draft.generate', sort: 41 },
      { name: '保存为工单', code: 'ai_work_order_draft.save_as_work_order', sort: 42 }
    ]
  },
  {
    name: '企业文档问答',
    code: 'ai_knowledge.page',
    path: '/ai/knowledge',
    sort: 50,
    buttons: [
      { name: '提交问题', code: 'ai_knowledge.ask', sort: 51 }
    ]
  },
  {
    name: '账号管理',
    code: 'accounts.page',
    path: '/accounts',
    sort: 60,
    buttons: [
      { name: '创建账号', code: 'accounts.create', sort: 61 }
    ]
  },
  {
    name: '权限管理',
    code: 'permissions.page',
    path: '/permissions',
    sort: 70,
    buttons: [
      { name: '创建权限', code: 'permissions.create', sort: 71 }
    ]
  },
  {
    name: '角色管理',
    code: 'roles.page',
    path: '/roles',
    sort: 80,
    buttons: [
      { name: '创建角色', code: 'roles.create', sort: 81 },
      { name: '保存角色权限', code: 'roles.save_permissions', sort: 82 }
    ]
  },
  {
    name: '系统日志',
    code: 'system.page',
    path: '/system',
    sort: 90
  }
]

const adminDefaultPermissionCodes = [
  'dashboard.page',
  'work_orders.page',
  'work_orders.search',
  'work_orders.reset',
  'work_orders.view_detail',
  'work_order_detail.page',
  'ai_work_order_draft.page',
  'ai_work_order_draft.generate',
  'ai_knowledge.page',
  'ai_knowledge.ask',
  'system.page'
]

async function upsertDefaultPermissions() {
  for (const page of permissionSeeds) {
    const pagePermission = await prisma.permission.upsert({
      where: {
        code: page.code
      },
      update: {
        name: page.name,
        type: 1,
        parentId: null,
        path: page.path,
        sort: page.sort
      },
      create: {
        name: page.name,
        code: page.code,
        type: 1,
        path: page.path,
        sort: page.sort
      }
    })

    for (const button of page.buttons ?? []) {
      await prisma.permission.upsert({
        where: {
          code: button.code
        },
        update: {
          name: button.name,
          type: 2,
          parentId: pagePermission.id,
          path: null,
          sort: button.sort
        },
        create: {
          name: button.name,
          code: button.code,
          type: 2,
          parentId: pagePermission.id,
          sort: button.sort
        }
      })
    }
  }
}

async function createMissingRolePermissions(role: string, permissionIds: number[]) {
  const currentRolePermissions = await prisma.rolePermission.findMany({
    where: {
      role
    },
    select: {
      permissionId: true
    }
  })
  const currentIds = new Set(currentRolePermissions.map(item => item.permissionId))
  const missingIds = permissionIds.filter(id => !currentIds.has(id))

  if (missingIds.length === 0) {
    return
  }

  await prisma.rolePermission.createMany({
    data: missingIds.map(permissionId => ({
      role,
      permissionId
    })),
    skipDuplicates: true
  })
}

async function ensureDefaultRolePermissions() {
  await ensureDefaultRoles()

  const permissions = await prisma.permission.findMany({
    select: {
      id: true,
      code: true
    }
  })
  const allPermissionIds = permissions.map(permission => permission.id)

  await createMissingRolePermissions('super_admin', allPermissionIds)

  const adminPermissionCount = await prisma.rolePermission.count({
    where: {
      role: 'admin'
    }
  })

  if (adminPermissionCount > 0) {
    return
  }

  const adminPermissionIds = permissions
    .filter(permission => adminDefaultPermissionCodes.includes(permission.code))
    .map(permission => permission.id)

  await createMissingRolePermissions('admin', adminPermissionIds)
}

export async function ensurePermissionSeedData() {
  await upsertDefaultPermissions()
  await ensureDefaultRolePermissions()
}

function toPermissionTreeItem(permission: {
  id: number
  name: string
  code: string
  type: number
  path: string | null
  parentId: number | null
  sort: number
  rolePermissions: Array<{ role: string }>
}): PermissionTreeItem {
  const type = permission.type === 2 ? 2 : 1

  return {
    id: permission.id,
    name: permission.name,
    code: permission.code,
    type,
    typeLabel: permissionTypeLabels[type],
    path: permission.path,
    parentId: permission.parentId,
    sort: permission.sort,
    roles: permission.rolePermissions.map(item => item.role)
  }
}

export async function listPermissionTree() {
  await ensurePermissionSeedData()

  const permissions = await prisma.permission.findMany({
    include: {
      rolePermissions: true
    },
    orderBy: [
      {
        sort: 'asc'
      },
      {
        id: 'asc'
      }
    ]
  })

  const items = permissions.map(toPermissionTreeItem)
  const itemMap = new Map<number, PermissionTreeItem>()
  const tree: PermissionTreeItem[] = []
  const roleCodes = await listEnabledRoleCodes()
  const rolePermissionIds: Record<string, number[]> = Object.fromEntries(roleCodes.map(role => [role, []]))

  for (const item of items) {
    itemMap.set(item.id, item)

    for (const role of item.roles) {
      rolePermissionIds[role] ??= []
      rolePermissionIds[role].push(item.id)
    }
  }

  for (const item of items) {
    if (item.parentId) {
      const parent = itemMap.get(item.parentId)

      if (parent) {
        parent.children ??= []
        parent.children.push(item)
        continue
      }
    }

    tree.push(item)
  }

  return {
    list: tree,
    rolePermissionIds
  }
}

export async function listMenuRoutesForUser(user: AuthUser | undefined) {
  await ensurePermissionSeedData()

  const userRoles = user?.roles ?? []
  const isSuperAdmin = userRoles.includes('super_admin')
  const permissions = await prisma.permission.findMany({
    where: {
      type: 1
    },
    include: {
      rolePermissions: true
    },
    orderBy: [
      {
        sort: 'asc'
      },
      {
        id: 'asc'
      }
    ]
  })

  return permissions
    .filter((permission) => {
      if (!permission.path) {
        return false
      }

      // /work-orders/[id] 这种动态详情页是“页面权限”，但不是左侧菜单项。
      if (permission.path.includes('[')) {
        return false
      }

      if (isSuperAdmin) {
        return true
      }

      return permission.rolePermissions.some(item => userRoles.includes(item.role))
    })
    .map<MenuRouteItem>(permission => ({
      code: permission.code,
      title: permission.name,
      path: permission.path ?? '/',
      icon: menuIconMap[permission.code] ?? 'Setting'
    }))
}

export async function createPermission(input: CreatePermissionInput) {
  await ensurePermissionSeedData()

  if (input.type === 1) {
    await prisma.permission.create({
      data: {
        name: input.name,
        code: input.code,
        type: 1,
        path: input.path,
        sort: 100
      }
    })

    return listPermissionTree()
  }

  if (!input.parentId) {
    throw createError({
      statusCode: 400,
      statusMessage: '按钮权限必须选择所属页面'
    })
  }

  const parent = await prisma.permission.findFirst({
    where: {
      id: input.parentId,
      type: 1
    }
  })

  if (!parent) {
    throw createError({
      statusCode: 400,
      statusMessage: '所属页面权限不存在'
    })
  }

  await prisma.permission.create({
    data: {
      name: input.name,
      code: input.code,
      type: 2,
      parentId: input.parentId,
      sort: 100
    }
  })

  return listPermissionTree()
}

export async function updateRolePermissions(role: string, rawPermissionIds: number[]) {
  await ensurePermissionSeedData()

  if (!(await roleExists(role))) {
    throw createError({
      statusCode: 400,
      statusMessage: '角色不存在'
    })
  }

  const permissions = await prisma.permission.findMany({
    select: {
      id: true,
      parentId: true
    }
  })
  const permissionMap = new Map(permissions.map(permission => [permission.id, permission]))
  const permissionIds = new Set<number>()

  for (const id of rawPermissionIds) {
    const permission = permissionMap.get(id)

    if (!permission) {
      continue
    }

    permissionIds.add(permission.id)

    // 勾选按钮权限时，自动补上它所属页面的权限。
    if (permission.parentId) {
      permissionIds.add(permission.parentId)
    }
  }

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({
      where: {
        role
      }
    }),
    prisma.rolePermission.createMany({
      data: Array.from(permissionIds).map(permissionId => ({
        role,
        permissionId
      })),
      skipDuplicates: true
    })
  ])

  // 超级管理员始终保留所有权限，避免误操作后无法进入权限管理。
  const allPermissionIds = permissions.map(permission => permission.id)
  await createMissingRolePermissions('super_admin', allPermissionIds)

  return listPermissionTree()
}
