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
} finally {
  if (connection) {
    connection.release()
  }

  await pool.end()
}
