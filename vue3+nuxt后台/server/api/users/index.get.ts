import { isSuperAdmin, listUsers } from '~/server/services/users'

export default defineEventHandler(async (event) => {
  // 前端菜单隐藏只能改善体验，真正的权限必须在服务端接口里判断。
  if (!isSuperAdmin(event.context.currentUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: '只有超级管理员可以查看账号'
    })
  }

  const list = await listUsers()

  return {
    list
  }
})
