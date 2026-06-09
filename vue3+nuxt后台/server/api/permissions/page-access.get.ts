import { canAccessPageByPath } from '~/server/services/permissions'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const path = typeof query.path === 'string' ? query.path.trim() : ''

  if (!path.startsWith('/')) {
    throw createError({
      statusCode: 400,
      statusMessage: '页面路径必须以 / 开头'
    })
  }

  // API 层只负责读取请求参数和当前用户；是否允许访问页面交给 service 查数据库权限表。
  return {
    allowed: await canAccessPageByPath(event.context.currentUser, path)
  }
})
