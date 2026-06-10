import type { AuthUser } from '~/server/services/users'
import { listUsers } from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
import { apiSuccess } from '~/server/utils/api-response'

export default defineEventHandler(async (event) => {
  await requirePermissionCode(event.context.currentUser as AuthUser | undefined, 'accounts.page')

  return apiSuccess({
    list: await listUsers()
  })
})
