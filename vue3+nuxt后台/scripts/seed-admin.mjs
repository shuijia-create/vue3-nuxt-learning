import { URL } from 'node:url'
import bcrypt from 'bcryptjs'
import mariadb from 'mariadb'

const databaseUrl = process.env.DATABASE_URL
const username = process.env.ADMIN_USERNAME ?? 'admin'
const password = process.env.ADMIN_PASSWORD
const nickname = process.env.ADMIN_NICKNAME ?? '超级管理员'
const role = process.env.ADMIN_ROLE ?? 'super_admin'
const departmentName = process.env.ADMIN_DEPARTMENT_NAME ?? 'IT 部'
const resetPassword = process.env.ADMIN_RESET_PASSWORD === 'true'

const permissionPages = [
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
      { name: '创建账号', code: 'accounts.create', sort: 61 },
      { name: '分配账号角色', code: 'accounts.update_role', sort: 62 }
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

async function seedRoles(connection) {
  for (const defaultRole of defaultRoles) {
    await connection.query(
      `INSERT INTO roles
        (name, code, description, is_department_manager, status, sort, created_at, updated_at)
       VALUES
        (?, ?, ?, ?, 1, ?, NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        is_department_manager = VALUES(is_department_manager),
        status = 1,
        sort = VALUES(sort),
        updated_at = NOW(3)`,
      [
        defaultRole.name,
        defaultRole.code,
        defaultRole.description,
        defaultRole.isDepartmentManager,
        defaultRole.sort
      ]
    )
  }
}

async function seedPermissions(connection) {
  for (const page of permissionPages) {
    await connection.query(
      `INSERT IGNORE INTO permissions
        (name, code, type, parent_id, path, sort, created_at, updated_at)
       VALUES
        (?, ?, 1, NULL, ?, ?, NOW(3), NOW(3))`,
      [page.name, page.code, page.path, page.sort]
    )

    const pageRows = await connection.query(
      'SELECT id FROM permissions WHERE code = ? LIMIT 1',
      [page.code]
    )
    const pageId = pageRows[0]?.id

    if (!pageId) {
      throw new Error(`Permission page "${page.code}" was not created`)
    }

    for (const button of page.buttons ?? []) {
      await connection.query(
        `INSERT IGNORE INTO permissions
          (name, code, type, parent_id, path, sort, created_at, updated_at)
         VALUES
          (?, ?, 2, ?, NULL, ?, NOW(3), NOW(3))`,
        [button.name, button.code, pageId, button.sort]
      )
    }
  }
}

async function seedRolePermissions(connection) {
  const permissions = await connection.query('SELECT id, code FROM permissions')

  for (const permission of permissions) {
    await connection.query(
      `INSERT IGNORE INTO role_permissions
        (role, permission_id, created_at)
       VALUES
        (?, ?, NOW(3))`,
      ['super_admin', permission.id]
    )
  }

  const adminPermissionRows = await connection.query(
    'SELECT COUNT(*) AS count FROM role_permissions WHERE role = ?',
    ['admin']
  )
  const adminPermissionCount = Number(adminPermissionRows[0]?.count ?? 0)

  if (adminPermissionCount > 0) {
    return
  }

  for (const permission of permissions) {
    if (!adminDefaultPermissionCodes.includes(permission.code)) {
      continue
    }

    await connection.query(
      `INSERT IGNORE INTO role_permissions
        (role, permission_id, created_at)
       VALUES
        (?, ?, NOW(3))`,
      ['admin', permission.id]
    )
  }
}

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

if (!password) {
  throw new Error('ADMIN_PASSWORD is required')
}

const parsedUrl = new URL(databaseUrl)
const database = parsedUrl.pathname.replace(/^\//, '')
const shouldUseSsl = parsedUrl.searchParams.has('sslaccept')
  || parsedUrl.searchParams.get('ssl') === 'true'
  || parsedUrl.hostname.includes('tidbcloud.com')

const pool = mariadb.createPool({
  host: parsedUrl.hostname,
  port: Number(parsedUrl.port || 3306),
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  database,
  connectionLimit: 1,
  connectTimeout: 30000,
  acquireTimeout: 30000,
  initializationTimeout: 30000,
  socketTimeout: 60000,
  ...(shouldUseSsl
    ? {
        ssl: {
          rejectUnauthorized: true
        }
      }
    : {})
})

let connection

try {
  connection = await pool.getConnection()

  const existingUsers = await connection.query(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    [username]
  )

  if (existingUsers.length > 0 && !resetPassword) {
    console.log(`Admin user "${username}" already exists. Set ADMIN_RESET_PASSWORD=true to update it.`)
    process.exitCode = 0
  } else {
    const passwordHash = await bcrypt.hash(password, 10)

    if (existingUsers.length > 0) {
      await connection.query(
        `UPDATE users
         SET password_hash = ?, nickname = ?, role = ?, department_name = ?, is_department_manager = ?, updated_at = NOW()
         WHERE username = ?`,
        [passwordHash, nickname, role, departmentName, true, username]
      )
      console.log(`Admin user "${username}" was updated.`)
    } else {
      await connection.query(
        `INSERT INTO users
          (username, password_hash, nickname, role, department_name, is_department_manager, created_at, updated_at)
         VALUES
          (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [username, passwordHash, nickname, role, departmentName, true]
      )
      console.log(`Admin user "${username}" was created.`)
    }
  }

  await seedRoles(connection)
  await seedPermissions(connection)
  await seedRolePermissions(connection)
  console.log('Default roles and permissions are ready.')
} finally {
  if (connection) {
    connection.release()
  }

  await pool.end()
}
