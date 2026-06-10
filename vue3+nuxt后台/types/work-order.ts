export type WorkOrderType = 'IT 问题' | '设备维修' | '质量异常' | '行政后勤' | '权限申请' | '安全隐患'

export type WorkOrderHandlerDepartment = 'IT 部' | '维修部' | '质量部' | '行政部' | '系统管理员' | '安环部'

export type WorkOrderStatus = '待受理' | '处理中' | '待确认' | '已关闭'

export type WorkOrderFlowAction = 'accept' | 'submit_result' | 'confirm_close' | 'return_to_processing'

export type WorkOrderPriority = '低' | '中' | '高'

export type WorkOrderSource = '手动创建' | 'AI 草稿'

export interface WorkOrderProcessRecord {
  id: string
  action: string
  operator: string
  createdAt: string
  remark: string
}

export interface WorkOrderAiSuggestion {
  impact: string
  suggestion: string
  missingInfo: string[]
}

export interface WorkOrder {
  id: string
  code: string
  title: string
  type: WorkOrderType
  handlerDeptName: WorkOrderHandlerDepartment
  status: WorkOrderStatus
  submitter: string
  submitterDeptName?: WorkOrderHandlerDepartment
  assigneeUserId?: number
  assigneeName?: string
  acceptedByName?: string
  acceptedAt?: string
  handledByName?: string
  handledResult?: string
  handledAt?: string
  confirmedByName?: string
  confirmResult?: string
  confirmedAt?: string
  closedAt?: string
  createdAt: string
  description: string
  source: WorkOrderSource
  aiSuggestion?: WorkOrderAiSuggestion
  processRecords?: WorkOrderProcessRecord[]
}

export interface WorkOrderDraft {
  title: string
  type: WorkOrderType
  priority: WorkOrderPriority
  impact: string
  suggestion: string
  missingInfo: string[]
}
