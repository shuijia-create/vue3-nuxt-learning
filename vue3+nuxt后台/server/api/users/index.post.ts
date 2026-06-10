import type { AuthUser } from '~/server/services/users'
import {
  createUserAccount,
  findAuthUserByUsername
} from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
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
  await requirePermissionCode(event.context.currentUser as AuthUser | undefined, 'accounts.create')

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

  if (!usernamePattern.test(username)) {
    throw createError({
      statusCode: 400,
      statusMessage: '用户名只能包含字母、数字、下划线，长度 3-30 位'
    })
  }

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: '密码至少 6 位'
    })
  }

  if (!nickname || nickname.length > 50) {
    throw createError({
      statusCode: 400,
      statusMessage: '昵称不能为空，且不能超过 50 个字符'
    })
  }

  if (!(await roleExists(role))) {
    throw createError({
      statusCode: 400,
      statusMessage: '账号角色不正确'
    })
  }

  const existingUser = await findAuthUserByUsername(username)

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: '用户名已存在'
    })
  }

  return {
    user: await createUserAccount({
      username,
      password,
      nickname,
      role
    })
  }
})
