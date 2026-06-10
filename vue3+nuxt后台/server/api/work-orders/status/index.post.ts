import type { AuthUser } from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
import { changeWorkOrderStatus } from '~/server/services/work-orders'
import { apiSuccess } from '~/server/utils/api-response'
import { throwServiceError } from '~/server/utils/service-error'
import type { WorkOrderFlowAction } from '~/types/work-order'

type ChangeStatusBody = {
  id?: string
  action?: WorkOrderFlowAction
  assigneeUserId?: number
  assigneeName?: string
  handledResult?: string
  confirmResult?: string
}

// POST /api/work-orders/status
// API 层只接收“要对哪张工单执行什么动作”，具体状态机规则放在 service。
export default defineEventHandler(async (event) => {
  const body = await readBody<ChangeStatusBody>(event)
  // 状态流转必须知道操作人，用于写操作日志和站内通知。
  const currentUser = event.context.currentUser as AuthUser | undefined

  await requirePermissionCode(currentUser, 'work_order_detail.change_status')

  try {
    return apiSuccess(await changeWorkOrderStatus(body, currentUser), '工单流程处理成功')
  } catch (error) {
    // service 会判断“待受理才能受理、待确认才能关闭/退回”等规则，失败时从这里返回错误。
    throwServiceError(error)
  }
})
