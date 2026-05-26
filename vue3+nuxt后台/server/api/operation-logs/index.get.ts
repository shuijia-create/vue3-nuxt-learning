import { operationLogs } from '~/server/data/operation-logs'

export default defineEventHandler(() => {
  return {
    list: operationLogs
  }
})

