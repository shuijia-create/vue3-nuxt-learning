import { getAuthPermissionSnapshotForUser } from '~/server/services/permissions'

export default defineEventHandler(async (event) => {
  // currentUser 是 server/middleware/auth.ts 鉴权成功后写进来的。
  // 这个接口现在就是前端的 getInfo：刷新页面时一次性恢复用户、后端路由和按钮权限。
  const user = event.context.currentUser
  const permissionSnapshot = await getAuthPermissionSnapshotForUser(user)

  return {
    user,
    ...permissionSnapshot
  }
})
