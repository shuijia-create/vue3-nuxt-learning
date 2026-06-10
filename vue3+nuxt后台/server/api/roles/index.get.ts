import type { AuthUser } from '~/server/services/users'
import { requireAnyPermissionCode } from '~/server/services/permissions'
import { listRoles } from '~/server/services/roles'
import { apiSuccess } from '~/server/utils/api-response'

export default defineEventHandler(async (event) => {
  await requireAnyPermissionCode(event.context.currentUser as AuthUser | undefined, [
    'roles.page',
    'accounts.page',
    'accounts.create',
    'accounts.update_role'
  ])

  return apiSuccess({
    list: await listRoles()
  })
})
