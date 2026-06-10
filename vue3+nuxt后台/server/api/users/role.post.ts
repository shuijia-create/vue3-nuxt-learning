import type { AuthUser } from '~/server/services/users'
import { updateUserRole } from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
import { roleExists } from '~/server/services/roles'

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
    throw createError({
      statusCode: 400,
      statusMessage: '账号 ID 不正确'
    })
  }

  if (!(await roleExists(role))) {
    throw createError({
      statusCode: 400,
      statusMessage: '角色不存在'
    })
  }

  return {
    user: await updateUserRole(id, role)
  }
})
