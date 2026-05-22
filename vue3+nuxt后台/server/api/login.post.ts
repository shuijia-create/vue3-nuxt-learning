type LoginBody = {
  username?: string
  password?: string
}

const demoUser = {
  id: 1,
  username: 'admin',
  nickname: '管理员',
  roles: ['admin']
}

const demoToken = 'mock-admin-token'

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)

  if (body.username !== 'admin' || body.password !== '123456') {
    throw createError({
      statusCode: 401,
      statusMessage: '用户名或密码错误'
    })
  }

  setCookie(event, 'nuxt-admin-token', demoToken, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24
  })

  return {
    token: demoToken,
    user: demoUser
  }
})
