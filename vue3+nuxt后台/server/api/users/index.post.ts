import type { AuthUser } from '~/server/services/users'
import {
  createUserAccount,
  findAuthUserByUsername
} from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
import { roleExists } from '~/server/services/roles'
import { apiSuccess, throwApiError } from '~/server/utils/api-response'

type CreateUserBody = {
  username?: string
  password?: string
  nickname?: string
  role?: string
}

const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/

export default defineEventHandler(async (event) => {
  await requirePermissionCode(event.context.currentUser as AuthUser | undefined, 'accounts.create')

  const body = await readBody<CreateUserBody>(event)
  const username = body.username?.trim() ?? ''
  const password = body.password ?? ''
  const nickname = body.nickname?.trim() ?? ''
  const role = body.role ?? 'admin'

  if (!usernamePattern.test(username)) {
    throwApiError(400, '用户名只能包含字母、数字、下划线，长度 3-30 位')
  }

  if (password.length < 6) {
    throwApiError(400, '密码至少 6 位')
  }

  if (!nickname || nickname.length > 50) {
    throwApiError(400, '昵称不能为空，且不能超过 50 个字符')
  }

  if (!(await roleExists(role))) {
    throwApiError(400, '账号角色不正确')
  }

  const existingUser = await findAuthUserByUsername(username)

  if (existingUser) {
    throwApiError(409, '用户名已存在')
  }

  return apiSuccess({
    user: await createUserAccount({
      username,
      password,
      nickname,
      role
    })
  }, '账号创建成功')
})
