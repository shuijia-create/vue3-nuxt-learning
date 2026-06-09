import {
  changeWorkOrderStatusApi,
  createWorkOrderApi,
  generateWorkOrderDraftApi,
  getWorkOrderDetailApi,
  listWorkOrdersApi,
  type ChangeWorkOrderStatusPayload,
  type CreateWorkOrderPayload,
  type WorkOrderListParams
} from '~/utils/api/work-orders'

// 工单模块的前端业务入口。
// 页面调用这里表达“我要做什么”，不用关心具体接口地址和请求细节。
export function useWorkOrders() {
  // 查询列表：工作台和工单列表页都可以复用。
  function listWorkOrders(params: WorkOrderListParams = {}) {
    return listWorkOrdersApi(params)
  }

  // 查询详情：详情页只需要传路由里的 id。
  function fetchWorkOrderDetail(id: string) {
    return getWorkOrderDetailApi(id)
  }

  // 创建工单：普通新建和 AI 草稿保存都走这个动作。
  function createWorkOrder(payload: CreateWorkOrderPayload) {
    return createWorkOrderApi(payload)
  }

  // 状态流转：页面按钮只表达目标状态，后端负责校验规则。
  function changeWorkOrderStatus(payload: ChangeWorkOrderStatusPayload) {
    return changeWorkOrderStatusApi(payload)
  }

  // 生成 AI 草稿：放在工单 composable 里，是因为最终会保存成正式工单。
  function generateDraft(description: string) {
    return generateWorkOrderDraftApi(description)
  }

  return {
    listWorkOrders,
    fetchWorkOrderDetail,
    createWorkOrder,
    changeWorkOrderStatus,
    generateDraft
  }
}
