import { isSuperAdmin } from '~/server/services/users'
import { listPermissionTree } from '~/server/services/permissions'

export default defineEventHandler(async (event) => {
  // 权限配置只能超级管理员查看；页面隐藏不是安全边界，接口也要拦。
  if (!isSuperAdmin(event.context.currentUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: '只有超级管理员可以查看权限'
    })
  }

  return listPermissionTree()
})
