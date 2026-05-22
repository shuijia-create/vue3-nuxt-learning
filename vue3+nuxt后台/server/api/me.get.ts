const demoUser = {
  id: 1,
  username: 'admin',
  nickname: '管理员',
  roles: ['admin']
}

export default defineEventHandler((event) => {
  const token = getCookie(event, 'nuxt-admin-token')

  if (token !== 'mock-admin-token') {
    throw createError({
      statusCode: 401,
      statusMessage: '请先登录'
    })
  }

  return {
    user: demoUser
  }
})
