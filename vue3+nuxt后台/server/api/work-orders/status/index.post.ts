import type { AuthUser } from '~/server/services/users'
import { changeWorkOrderStatus } from '~/server/services/work-orders'
import { throwServiceError } from '~/server/utils/service-error'
import type { WorkOrderStatus } from '~/types/work-order'

type ChangeStatusBody = {
  id?: string
  status?: WorkOrderStatus
}

// POST /api/work-orders/status
// API 层只接收“要把哪张工单改到什么状态”，不在这里判断流转规则。
export default defineEventHandler(async (event) => {
  const body = await readBody<ChangeStatusBody>(event)
  // 状态流转必须知道操作人，用于写操作日志和站内通知。
  const currentUser = event.context.currentUser as AuthUser | undefined

  try {
    return {
      code: 200,
      message: '工单状态更新成功',
      data: await changeWorkOrderStatus(body, currentUser)
    }
  } catch (error) {
    // service 会判断“待处理只能到处理中”等规则，失败时从这里返回错误。
    throwServiceError(error)
  }
})
