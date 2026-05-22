import { authCookieName } from '~/server/data/auth'

export default defineEventHandler((event) => {
  deleteCookie(event, authCookieName, {
    path: '/'
  })

  return {
    ok: true
  }
})
