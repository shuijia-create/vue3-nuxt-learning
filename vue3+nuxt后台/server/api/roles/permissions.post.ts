import { isSuperAdmin } from '~/server/services/users'
import { updateRolePermissions } from '~/server/services/permissions'
import { roleExists } from '~/server/services/roles'

type UpdateRolePermissionsBody = {
  role?: string
  permissionIds?: number[]
}

export default defineEventHandler(async (event) => {
  if (!isSuperAdmin(event.context.currentUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: '只有超级管理员可以分配角色权限'
    })
  }

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
