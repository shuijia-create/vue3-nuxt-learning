export default defineEventHandler((event) => {
  // currentUser 是 server/middleware/auth.ts 鉴权成功后写进来的。
  // 这个接口给前端刷新页面时恢复当前登录用户信息。
  return {
    user: event.context.currentUser
  }
})
