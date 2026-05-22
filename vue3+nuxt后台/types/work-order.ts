export type WorkOrderType = '设备故障' | 'IT 问题' | '质量异常'

export type WorkOrderStatus = '待处理' | '处理中' | '待确认'

export type WorkOrderPriority = '低' | '中' | '高'

export interface WorkOrder {
  id: string
  code: string
  title: string
  type: WorkOrderType
  status: WorkOrderStatus
  submitter: string
  createdAt: string
  description: string
}

export interface WorkOrderDraft {
  title: string
  type: WorkOrderType
  priority: WorkOrderPriority
  impact: string
  suggestion: string
  missingInfo: string[]
}
