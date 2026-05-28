import { getOperationLogs } from '~/server/services/operation-logs'

export default defineEventHandler(() => {
  return {
    list: getOperationLogs()
  }
})
