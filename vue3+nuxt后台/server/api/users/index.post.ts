import {
  createUserAccount,
  findAuthUserByUsername,
  isSuperAdmin
} from '~/server/services/users'
import { roleExists } from '~/server/services/roles'
import { decryptPassword } from '~/server/utils/password-encryption'

type CreateUserBody = {
  username?: string
  encryptedPassword?: string
  nickname?: string
  role?: string
}

const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/

export default defineEventHandler(async (event) => {
  // 创建账号属于高权限操作，不能只靠前端隐藏按钮。
  // 即使普通管理员手动请求 POST /api/users，也会在这里被拦住。
  if (!isSuperAdmin(event.context.currentUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: '只有超级管理员可以创建账号'
    })
  }

  // 读取前端表单提交的数据，并统一 trim，避免用户名和昵称前后带空格。
  const body = await readBody<CreateUserBody>(event)
  const username = body.username?.trim() ?? ''
  const encryptedPassword = body.encryptedPassword ?? ''
  const nickname = body.nickname?.trim() ?? ''
  const role = body.role ?? 'admin'

  let password = ''

  try {
    password = encryptedPassword ? decryptPassword(encryptedPassword) : ''
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: '密码加密数据不正确'
    })
  }

  // 用户名校验放在服务端，前端校验只是体验，不能当安全边界。
  if (!usernamePattern.test(username)) {
    throw createError({
      statusCode: 400,
      statusMessage: '用户名只能包含字母、数字、下划线，长度 3-30 位'
    })
  }

  // 后端解密后再校验长度；请求体里不会出现原始明文密码。
  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: '密码至少 6 位'
    })
  }

  // 昵称用于页面展示，不参与登录，但不能让它为空。
  if (!nickname || nickname.length > 50) {
    throw createError({
      statusCode: 400,
      statusMessage: '昵称不能为空，且不能超过 50 个字符'
    })
  }

  // role 只能选择角色表里已经存在的角色，避免前端随便传一个未知角色。
  if (!(await roleExists(role))) {
    throw createError({
      statusCode: 400,
      statusMessage: '账号角色不正确'
    })
  }

  // username 是唯一字段；创建前先查一次，返回更友好的错误。
  const existingUser = await findAuthUserByUsername(username)

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: '用户名已存在'
    })
  }

  // 真正写数据库在 service 层完成：service 会先 hash 解密后的密码，再 create users 记录。
  const user = await createUserAccount({
    username,
    password,
    nickname,
    role
  })

  return {
    user
  }
})
