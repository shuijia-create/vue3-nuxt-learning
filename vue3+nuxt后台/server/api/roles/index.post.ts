import type { AuthUser } from '~/server/services/users'
import { requirePermissionCode, updateRolePermissionCodes } from '~/server/services/permissions'
import { createRole, roleExists } from '~/server/services/roles'
import { apiSuccess, throwApiError } from '~/server/utils/api-response'

type CreateRoleBody = {
  name?: string
  code?: string
  description?: string
  isDepartmentManager?: boolean
  canSubmitWorkOrder?: boolean
}

const roleCodePattern = /^[a-z][a-z0-9_]{2,29}$/

export default defineEventHandler(async (event) => {
  await requirePermissionCode(event.context.currentUser as AuthUser | undefined, 'roles.create')

  const body = await readBody<CreateRoleBody>(event)
  const name = body.name?.trim() ?? ''
  const code = body.code?.trim() ?? ''
  const description = body.description?.trim() ?? ''
  const isDepartmentManager = body.isDepartmentManager === true
  const canSubmitWorkOrder = !isDepartmentManager && body.canSubmitWorkOrder === true

  if (!name || name.length > 50) {
    throwApiError(400, '角色名称不能为空，且不能超过 50 个字符')
  }

  if (!roleCodePattern.test(code)) {
    throwApiError(400, '角色编码必须以小写字母开头，只能包含小写字母、数字、下划线，长度 3-30 位')
  }

  if (await roleExists(code)) {
    throwApiError(409, '角色编码已存在')
  }

  const role = await createRole({
    name,
    code,
    description,
    isDepartmentManager
  })

  const permissionCodes = [
    'dashboard.page',
    'work_orders.page',
    'work_orders.search',
    'work_orders.reset',
    'work_orders.view_detail',
    'work_order_detail.page'
  ]

  if (canSubmitWorkOrder) {
    permissionCodes.push(
      'work_orders.create',
      'ai_work_order_draft.page',
      'ai_work_order_draft.generate',
      'ai_work_order_draft.save_as_work_order'
    )
  } else {
    permissionCodes.push('work_order_detail.change_status')
  }

  await updateRolePermissionCodes(code, permissionCodes)

  return apiSuccess({
    role
  }, '角色创建成功')
})
