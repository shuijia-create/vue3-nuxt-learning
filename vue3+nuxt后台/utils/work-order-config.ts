import type { WorkOrderHandlerDepartment, WorkOrderStatus, WorkOrderType } from '~/types/work-order'

export const workOrderTypeOptions = [
  'IT 问题',
  '设备维修',
  '质量异常',
  '行政后勤',
  '权限申请',
  '安全隐患'
] as const satisfies readonly WorkOrderType[]

export const workOrderStatusOptions = [
  '待受理',
  '处理中',
  '待确认',
  '已关闭'
] as const satisfies readonly WorkOrderStatus[]

export const workOrderHandlerDepartmentOptions = [
  'IT 部',
  '维修部',
  '质量部',
  '行政部',
  '系统管理员',
  '安环部'
] as const satisfies readonly WorkOrderHandlerDepartment[]

export const workOrderTypeToHandlerDept: Record<WorkOrderType, WorkOrderHandlerDepartment> = {
  'IT 问题': 'IT 部',
  设备维修: '维修部',
  质量异常: '质量部',
  行政后勤: '行政部',
  权限申请: '系统管理员',
  安全隐患: '安环部'
}

export function getDefaultWorkOrderHandlerDept(type: WorkOrderType): WorkOrderHandlerDepartment {
  return workOrderTypeToHandlerDept[type]
}

export function isWorkOrderType(value: unknown): value is WorkOrderType {
  return typeof value === 'string' && workOrderTypeOptions.includes(value as WorkOrderType)
}

export function isWorkOrderHandlerDepartment(value: unknown): value is WorkOrderHandlerDepartment {
  return typeof value === 'string'
    && workOrderHandlerDepartmentOptions.includes(value as WorkOrderHandlerDepartment)
}
