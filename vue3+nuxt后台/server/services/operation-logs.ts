import { operationLogs } from '~/server/data/operation-logs'
import type { OperationLog } from '~/types/operation-log'

type CreateOperationLogParams = Omit<OperationLog, 'id' | 'createdAt'>

function createOperationLogId() {
  return `operation-log-${Date.now()}`
}

function createCurrentTime() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

export function createOperationLog(log: CreateOperationLogParams) {
  const operationLog: OperationLog = {
    id: createOperationLogId(),
    createdAt: createCurrentTime(),
    ...log
  }

  operationLogs.unshift(operationLog)

  return operationLog
}

export function getOperationLogs() {
  return operationLogs
}
