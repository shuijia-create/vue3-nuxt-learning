import type { AuthUser } from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
import { getWorkOrderDetail } from '~/server/services/work-orders'
import { apiSuccess } from '~/server/utils/api-response'
import { throwServiceError } from '~/server/utils/service-error'

// GET /api/work-orders/detail/:id
// 动态路由参数只在 API 层读取，参数是否合法由 service 再判断。
export default defineEventHandler(async (event) => {
  const currentUser = event.context.currentUser as AuthUser | undefined

  await requirePermissionCode(currentUser, 'work_order_detail.page')

  // 文件名 [id].get.ts 对应这里的 getRouterParam(event, 'id')。
  const id = getRouterParam(event, 'id') ?? ''

  try {
    return apiSuccess(await getWorkOrderDetail(id, currentUser))
  } catch (error) {
    // 找不到工单时，service 会抛 404，这里负责转成 Nuxt 错误响应。
    throwServiceError(error)
  }
})
