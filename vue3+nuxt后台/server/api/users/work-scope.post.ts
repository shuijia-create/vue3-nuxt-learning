import type { AuthUser } from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
import { updateUserWorkScope } from '~/server/services/users'
import { apiSuccess, throwApiError } from '~/server/utils/api-response'
import { isWorkOrderHandlerDepartment } from '~/utils/work-order-config'

type UpdateUserWorkScopeBody = {
  id?: number
  departmentName?: string
  isDepartmentManager?: boolean
}

export default defineEventHandler(async (event) => {
  await requirePermissionCode(event.context.currentUser as AuthUser | undefined, 'accounts.update_role')

  const body = await readBody<UpdateUserWorkScopeBody>(event)
  const id = typeof body.id === 'number' && Number.isInteger(body.id) ? body.id : null
  const departmentName = body.departmentName?.trim()
  const isDepartmentManager = body.isDepartmentManager === true

  if (id === null) {
    throwApiError(400, '账号 ID 不正确')
  }

  if (!isWorkOrderHandlerDepartment(departmentName)) {
    throwApiError(400, '请选择账号所属部门')
  }

  return apiSuccess({
    user: await updateUserWorkScope(id, departmentName, isDepartmentManager)
  }, '账号工作范围已更新')
})
