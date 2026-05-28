import { workOrders } from '~/server/data/work-orders'
import { createOperationLog } from '~/server/services/operation-logs'
import { createWorkOrderCreatedNotification } from '~/server/services/notifications'
import type { WorkOrder, WorkOrderAiSuggestion, WorkOrderSource, WorkOrderType } from '~/types/work-order'

type CreateWorkOrderBody = {
  title?: string
  type?: WorkOrderType
  submitter?: string
  description?: string
  source?: WorkOrderSource
  aiSuggestion?: WorkOrderAiSuggestion
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

type CurrentUser = {
  id?: number
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateWorkOrderBody>(event)
  const currentUser = event.context.currentUser as CurrentUser | undefined

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
    description: body.description,
    source: body.source === 'AI 草稿' ? 'AI 草稿' : '手动创建',
    aiSuggestion: body.source === 'AI 草稿' ? body.aiSuggestion : undefined,
    processRecords: [
      {
        id: String(Date.now()),
        action: '创建工单',
        operator: body.submitter,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        remark: body.source === 'AI 草稿'
          ? '提交人根据 AI 草稿创建了工单，当前状态为待处理。'
          : '提交人创建了工单，当前状态为待处理。'
      }
    ]
  }

  workOrders.unshift(newWorkOrder)
  createOperationLog({
    module: '工单',
    action: '创建工单',
    operator: body.submitter,
    target: newWorkOrder.code,
    detail: `通过“${newWorkOrder.source}”创建工单“${newWorkOrder.title}”。`
  })
  createWorkOrderCreatedNotification({
    recipientUserId: currentUser?.id ?? 1,
    workOrder: newWorkOrder
  })

  return {
    message: '工单创建成功',
    code: 200,
    data: newWorkOrder
  }
})
