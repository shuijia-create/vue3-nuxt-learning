import type { AuthUser } from '~/server/services/users'
import { requirePermissionCode, updateRolePermissions } from '~/server/services/permissions'
import { roleExists } from '~/server/services/roles'
import { apiSuccess, throwApiError } from '~/server/utils/api-response'

type UpdateRolePermissionsBody = {
  role?: string
  permissionIds?: number[]
}

export default defineEventHandler(async (event) => {
  await requirePermissionCode(event.context.currentUser as AuthUser | undefined, 'roles.save_permissions')

  const body = await readBody<UpdateRolePermissionsBody>(event)
  const role = body.role ?? ''

  if (!(await roleExists(role))) {
    throwApiError(400, '角色不存在')
  }

  if (role === 'super_admin') {
    throwApiError(400, '超级管理员默认拥有全部权限，不需要手动修改')
  }

  const permissionIds = Array.isArray(body.permissionIds)
    ? body.permissionIds.filter(id => Number.isInteger(id))
    : []

  return apiSuccess(await updateRolePermissions(role, permissionIds), '角色权限已保存')
})
