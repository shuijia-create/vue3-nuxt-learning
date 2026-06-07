import { isSuperAdmin, updateUserRole } from '~/server/services/users'
import { roleExists } from '~/server/services/roles'

type UpdateUserRoleBody = {
  id?: number
  role?: string
}

export default defineEventHandler(async (event) => {
  if (!isSuperAdmin(event.context.currentUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: '只有超级管理员可以分配账号角色'
    })
  }

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
