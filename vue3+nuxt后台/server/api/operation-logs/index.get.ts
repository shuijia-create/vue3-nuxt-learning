import { getOperationLogs } from '~/server/services/operation-logs'

// GET /api/operation-logs
// 系统日志页使用。当前只做查询，不提供前端直接创建日志的接口。
export default defineEventHandler(async () => {
  return {
    // 日志写入由各业务 service 完成，例如创建工单和状态流转。
    list: await getOperationLogs()
  }
})
