import { workOrders } from '~/server/data/work-orders'
import type { WorkOrder, WorkOrderType } from '~/types/work-order'

type CreateWorkOrderBody = {
  title?: string
  type?: WorkOrderType
  submitter?: string
  description?: string
}

function createWorkOrderCode() {
  const now = new Date()
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('')
  const sequence = String(workOrders.length + 1).padStart(3, '0')

  return `WO-${date}-${sequence}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateWorkOrderBody>(event)

  if (!body.title || !body.type || !body.submitter || !body.description) {
    throw createError({
      statusCode: 400,
      statusMessage: '请填写完整工单信息'
    })
  }

  const newWorkOrder: WorkOrder = {
    id: String(Date.now()),
    code: createWorkOrderCode(),
    title: body.title,
    type: body.type,
    status: '待处理',
    submitter: body.submitter,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    description: body.description
  }

  workOrders.unshift(newWorkOrder)

  return {
    message: '工单创建成功',
    code: 200,
    data: newWorkOrder
  }
})
