import type { AuthUser } from '~/server/services/users'
import { requirePermissionCode, updateRolePermissions } from '~/server/services/permissions'
import { roleExists } from '~/server/services/roles'

type UpdateRolePermissionsBody = {
  role?: string
  permissionIds?: number[]
}

export default defineEventHandler(async (event) => {
  await requirePermissionCode(event.context.currentUser as AuthUser | undefined, 'roles.save_permissions')

  const body = await readBody<UpdateRolePermissionsBody>(event)
  const role = body.role ?? ''

  if (!(await roleExists(role))) {
    throw createError({
      statusCode: 400,
      statusMessage: '角色不存在'
    })
  }

  if (role === 'super_admin') {
    throw createError({
      statusCode: 400,
      statusMessage: '超级管理员默认拥有全部权限，不需要手动修改'
    })
  }

  const permissionIds = Array.isArray(body.permissionIds)
    ? body.permissionIds.filter(id => Number.isInteger(id))
    : []

  return updateRolePermissions(role, permissionIds)
})
