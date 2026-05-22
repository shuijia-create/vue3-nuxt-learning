import { workOrders } from '~/server/data/work-orders'
import type { WorkOrderStatus, WorkOrderType } from '~/types/work-order'

const workOrderTypes: WorkOrderType[] = ['设备故障', 'IT 问题', '质量异常']
const workOrderStatuses: WorkOrderStatus[] = ['待处理', '处理中', '待确认']

function isWorkOrderType(value: unknown): value is WorkOrderType {
  return typeof value === 'string' && workOrderTypes.includes(value as WorkOrderType)
}

function isWorkOrderStatus(value: unknown): value is WorkOrderStatus {
  return typeof value === 'string' && workOrderStatuses.includes(value as WorkOrderStatus)
}

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const type = isWorkOrderType(query.type) ? query.type : undefined
  const status = isWorkOrderStatus(query.status) ? query.status : undefined

  const list = workOrders.filter((item) => {
    const matchedType = type ? item.type === type : true
    const matchedStatus = status ? item.status === status : true

    return matchedType && matchedStatus
  })

  return {
    list
  }
})
