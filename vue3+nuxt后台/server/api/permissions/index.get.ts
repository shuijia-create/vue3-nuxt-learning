import type { AuthUser } from '~/server/services/users'
import { listPermissionTree, requireAnyPermissionCode } from '~/server/services/permissions'

export default defineEventHandler(async (event) => {
  await requireAnyPermissionCode(event.context.currentUser as AuthUser | undefined, [
    'permissions.page',
    'roles.page'
  ])

  return listPermissionTree()
})
