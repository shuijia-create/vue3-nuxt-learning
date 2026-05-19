export default defineEventHandler((event) => {
  deleteCookie(event, 'study_session', {
    path: '/'
  })

  return {
    ok: true
  }
})
