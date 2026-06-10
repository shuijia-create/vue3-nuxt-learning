import type { AuthUser } from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
import { listWorkOrders } from '~/server/services/work-orders'
import { throwServiceError } from '~/server/utils/service-error'

// GET /api/work-orders
// API 层只读取 URL query，真正的筛选和数据库查询交给 service。
export default defineEventHandler(async (event) => {
  await requirePermissionCode(event.context.currentUser as AuthUser | undefined, 'work_orders.page')

  // getQuery(event) 读取 ?type=设备故障&status=待处理 这类查询参数。
  const query = getQuery(event)

  try {
    return {
      list: await listWorkOrders({
        type: query.type,
        status: query.status
      })
    }
  } catch (error) {
    // service 抛出的业务错误在这里统一转换成 HTTP 错误响应。
    throwServiceError(error)
  }
})
