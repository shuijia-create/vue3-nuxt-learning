import { isSuperAdmin } from '~/server/services/users'
import { listRoles } from '~/server/services/roles'

export default defineEventHandler(async (event) => {
  if (!isSuperAdmin(event.context.currentUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: '只有超级管理员可以查看角色'
    })
  }

  return {
    list: await listRoles()
  }
})
