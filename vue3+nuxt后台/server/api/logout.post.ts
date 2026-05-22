export default defineEventHandler((event) => {
  deleteCookie(event, 'nuxt-admin-token', {
    path: '/'
  })

  return {
    ok: true
  }
})
