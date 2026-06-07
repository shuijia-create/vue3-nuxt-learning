import { listMenuRoutesForUser } from '~/server/services/permissions'

export default defineEventHandler(async (event) => {
  // 当前用户由 server/middleware/auth.ts 从 Redis token + MySQL users 表解析出来。
  // 菜单不再写死在前端，而是根据当前用户角色拥有的页面权限从后端返回。
  return {
    list: await listMenuRoutesForUser(event.context.currentUser)
  }
})
