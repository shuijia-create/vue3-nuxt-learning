import type { AuthUser } from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
import { createWorkOrder } from '~/server/services/work-orders'
import { apiSuccess } from '~/server/utils/api-response'
import { throwServiceError } from '~/server/utils/service-error'
import type {
  WorkOrderAiSuggestion,
  WorkOrderPriority,
  WorkOrderSource,
  WorkOrderType
} from '~/types/work-order'

type CreateWorkOrderBody = {
  title?: string
  type?: WorkOrderType
  submitter?: string
  description?: string
  source?: WorkOrderSource
  priority?: WorkOrderPriority
  aiSuggestion?: WorkOrderAiSuggestion
}

// POST /api/work-orders/add
// API 层负责读取请求体和当前用户，创建工单的业务规则放在 service。
export default defineEventHandler(async (event) => {
  // readBody(event) 读取浏览器 POST 过来的 JSON。
  const body = await readBody<CreateWorkOrderBody>(event)
  // server/middleware/auth.ts 已经把登录用户写入 event.context.currentUser。
  const currentUser = event.context.currentUser as AuthUser | undefined
  const requiredButtonCode = body.source === 'AI 草稿'
    ? 'ai_work_order_draft.save_as_work_order'
    : 'work_orders.create'

  await requirePermissionCode(currentUser, requiredButtonCode)

  try {
    return apiSuccess(await createWorkOrder(body, currentUser), '工单创建成功')
  } catch (error) {
    // 例如“未登录”“工单类型错误”“请填写完整信息”都由这里转成 HTTP 错误。
    throwServiceError(error)
  }
})
