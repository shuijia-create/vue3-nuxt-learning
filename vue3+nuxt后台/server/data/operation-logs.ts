import type { OperationLog } from '~/types/operation-log'

export const operationLogs: OperationLog[] = []

type CreateOperationLogParams = Omit<OperationLog, 'id' | 'createdAt'>

export function addOperationLog(log: CreateOperationLogParams) {
  operationLogs.unshift({
    id: String(Date.now()),
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    ...log
  })
}

