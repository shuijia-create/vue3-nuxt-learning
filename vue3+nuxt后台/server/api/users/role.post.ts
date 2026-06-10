import type { AuthUser } from '~/server/services/users'
import { updateUserRole } from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
import { findRoleByCode } from '~/server/services/roles'
import { apiSuccess, throwApiError } from '~/server/utils/api-response'

type UpdateUserRoleBody = {
  id?: number
  role?: string
}

export default defineEventHandler(async (event) => {
  await requirePermissionCode(event.context.currentUser as AuthUser | undefined, 'accounts.update_role')

  const body = await readBody<UpdateUserRoleBody>(event)
  const id = typeof body.id === 'number' && Number.isInteger(body.id) ? body.id : null
  const role = body.role ?? ''

  if (id === null) {
    throwApiError(400, '账号 ID 不正确')
  }

  const roleConfig = await findRoleByCode(role)

  if (!roleConfig) {
    throwApiError(400, '角色不存在')
  }

  return apiSuccess({
    user: await updateUserRole(id, role, {
      isDepartmentManager: roleConfig.isDepartmentManager
    })
  }, '账号角色已更新')
})
