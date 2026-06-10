import type {
  WorkOrder,
  WorkOrderAiSuggestion,
  WorkOrderDraft,
  WorkOrderFlowAction,
  WorkOrderHandlerDepartment,
  WorkOrderPriority,
  WorkOrderSource,
  WorkOrderStatus,
  WorkOrderType
} from '~/types/work-order'
import { fetchApiData, getApiFetch, type ApiFetch } from '~/utils/api/response'

// 工单列表的筛选参数。这里保持和页面中文枚举一致，API client 只负责传参，不做数据库数字转换。
export type WorkOrderListParams = {
  type?: WorkOrderType
  status?: WorkOrderStatus
  handlerDeptName?: WorkOrderHandlerDepartment
}

// 新建工单的前端入参。手动创建和 AI 草稿保存共用这一套结构。
export type CreateWorkOrderPayload = {
  title: string
  type: WorkOrderType
  submitter: string
  description: string
  source?: WorkOrderSource
  priority?: WorkOrderPriority
  aiSuggestion?: WorkOrderAiSuggestion
}

// 工单流程按动作提交，后端 service 再根据当前状态决定能不能执行。
export type ChangeWorkOrderStatusPayload = {
  id: string
  action: WorkOrderFlowAction
  assigneeUserId?: number
  assigneeName?: string
  handledResult?: string
  confirmResult?: string
}

// 列表接口返回值。保持一个 list 字段，页面拿到后可以直接交给表格。
export type WorkOrderListResponse = {
  list: WorkOrder[]
}

// 详情接口解包后直接返回单条工单，里面可能包含 processRecords 处理记录。
export type WorkOrderDetailData = WorkOrder

// 创建和状态变更都会返回更新后的工单，方便页面刷新局部状态。
export type WorkOrderMutationResponse = WorkOrder

// AI 草稿接口会告诉页面当前使用真实千问还是本地 mock，便于提示用户。
export type WorkOrderDraftResponse = {
  draft: WorkOrderDraft
  provider: 'qwen' | 'mock'
}

// 查询工单列表。页面只传筛选条件，接口地址统一收在 API client 里。
export function listWorkOrdersApi(params: WorkOrderListParams = {}, fetcher?: ApiFetch) {
  const requestFetch = fetcher ?? getApiFetch()

  return fetchApiData<WorkOrderListResponse>('/api/work-orders', {
    query: params
  }, requestFetch)
}

// 查询工单详情。id 来自前端路由参数，后端会再次校验它是不是合法数字 id。
export function getWorkOrderDetailApi(id: string, fetcher?: ApiFetch) {
  const requestFetch = fetcher ?? getApiFetch()

  return fetchApiData<WorkOrderDetailData>(`/api/work-orders/detail/${id}`, undefined, requestFetch)
}

// 创建正式工单。这里不判断来源和权限，后端 service 会统一处理。
export function createWorkOrderApi(payload: CreateWorkOrderPayload) {
  return fetchApiData<WorkOrderMutationResponse>('/api/work-orders/add', {
    method: 'POST',
    body: payload
  })
}

// 发起工单流程动作。页面表达业务动作，后端负责校验状态机和保存处理记录。
export function changeWorkOrderStatusApi(payload: ChangeWorkOrderStatusPayload) {
  return fetchApiData<WorkOrderMutationResponse>('/api/work-orders/status', {
    method: 'POST',
    body: payload
  })
}

// 生成 AI 工单草稿。AI Key 只存在后端，所以浏览器永远只请求自己的 Nuxt server/api。
export function generateWorkOrderDraftApi(description: string) {
  return fetchApiData<WorkOrderDraftResponse>('/api/ai/work-order-draft', {
    method: 'POST',
    body: {
      description
    }
  })
}
