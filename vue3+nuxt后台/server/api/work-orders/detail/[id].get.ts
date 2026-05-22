import { workOrders } from '~/server/data/work-orders'
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const workOrder = workOrders.find(workOrder => workOrder.id === id)
  if (!workOrder) {
    throw createError({
      statusCode: 404,
      statusMessage: '工单不存在'
    })
  }
  return {
    data: workOrder,
    code: 200
  }
})
