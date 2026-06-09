import type { OperationLog as DbOperationLog } from '~/generated/prisma/client'
import { prisma } from '~/server/utils/prisma'
import type { OperationLog } from '~/types/operation-log'
import type { WorkOrderProcessRecord } from '~/types/work-order'

type CreateOperationLogParams = Omit<OperationLog, 'id' | 'createdAt'> & {
  operatorUserId?: number
}

// 操作日志最终要展示给人看，所以这里统一把 Date 转成稳定的本地时间字符串。
function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// 把数据库日志记录转换成前端表格需要的 OperationLog 类型。
function toOperationLog(log: DbOperationLog): OperationLog {
  return {
    id: String(log.id),
    module: log.module,
    action: log.action,
    operator: log.operator,
    target: log.target,
    detail: log.detail,
    createdAt: formatDateTime(log.createdAt)
  }
}

// 创建操作日志。工单创建、状态流转等后端业务动作完成后调用它。
export async function createOperationLog(log: CreateOperationLogParams) {
  const operationLog = await prisma.operationLog.create({
    data: {
      module: log.module,
      action: log.action,
      operator: log.operator,
      operatorUserId: log.operatorUserId,
      target: log.target,
      detail: log.detail
    }
  })

  return toOperationLog(operationLog)
}

// 系统日志页面使用：按最新时间倒序展示所有操作日志。
export async function getOperationLogs() {
  const logs = await prisma.operationLog.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  return logs.map(toOperationLog)
}

// 工单详情页使用：把同一个工单编号对应的日志转成时间线处理记录。
export async function getWorkOrderProcessRecords(workOrderCode: string): Promise<WorkOrderProcessRecord[]> {
  const logs = await prisma.operationLog.findMany({
    where: {
      module: '工单',
      target: workOrderCode
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return logs.map(log => ({
    id: String(log.id),
    action: log.action,
    operator: log.operator,
    createdAt: formatDateTime(log.createdAt),
    remark: log.detail
  }))
}
