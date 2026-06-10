import type { AuthUser } from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
import { listAssignableUsers } from '~/server/services/users'
import { apiSuccess, throwApiError } from '~/server/utils/api-response'
import { isWorkOrderHandlerDepartment } from '~/utils/work-order-config'
import type { WorkOrderHandlerDepartment } from '~/types/work-order'

export default defineEventHandler(async (event) => {
  await requirePermissionCode(event.context.currentUser as AuthUser | undefined, 'work_order_detail.change_status')

  const query = getQuery(event)
  const rawDepartmentName = typeof query.departmentName === 'string' ? query.departmentName.trim() : undefined
  let departmentName: WorkOrderHandlerDepartment | undefined

  if (rawDepartmentName) {
    if (!isWorkOrderHandlerDepartment(rawDepartmentName)) {
      throwApiError(400, '处理部门不正确')
    }

    departmentName = rawDepartmentName
  }

  return apiSuccess({
    list: await listAssignableUsers(departmentName)
  })
})
