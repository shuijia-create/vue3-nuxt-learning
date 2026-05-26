import { workOrders } from '~/server/data/work-orders'
import { addOperationLog } from '~/server/data/operation-logs'
import type { WorkOrderStatus } from '~/types/work-order'

type ChangeStatusBody = {
  id?: string
  status?: WorkOrderStatus
}

const workOrderStatuses: WorkOrderStatus[] = ['待处理', '处理中', '待确认']

function isWorkOrderStatus(value: unknown): value is WorkOrderStatus {
  return typeof value === 'string' && workOrderStatuses.includes(value as WorkOrderStatus)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ChangeStatusBody>(event)
  const { id, status } = body
  const currentUser = event.context.currentUser as { nickname?: string, username?: string } | undefined

  if (!id || !isWorkOrderStatus(status)) {
    return {
      code: 400,
      message: '工单状态参数不正确',
      data: null
    }
  }

  const order = workOrders.find(order => order.id === id)

  if (!order) {
    return {
      code: 404,
      message: '工单不存在',
      data: null
    }
  }

  if (order.status === '待处理' && status !== '处理中') {
    return {
      code: 400,
      message: '待处理工单只能流转到处理中',
      data: null
    }
  }

  if (order.status === '处理中' && status !== '待确认') {
    return {
      code: 400,
      message: '处理中工单只能流转到待确认',
      data: null
    }
  }

  const oldStatus = order.status
  const operator = currentUser?.nickname || currentUser?.username || '系统用户'

  order.status = status
  order.processRecords ??= []
  order.processRecords.unshift({
    id: String(Date.now()),
    action: '状态流转',
    operator,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    remark: `工单状态由“${oldStatus}”变更为“${status}”。`
  })
  addOperationLog({
    module: '工单',
    action: '状态流转',
    operator,
    target: order.code,
    detail: `工单“${order.title}”状态由“${oldStatus}”变更为“${status}”。`
  })

  return {
    code: 200,
    message: '工单状态更新成功',
    data: order
  }
})
