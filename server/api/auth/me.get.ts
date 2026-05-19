import { findUserById, toPublicUser } from '../../utils/users'

export default defineEventHandler((event) => {
  const userId = getCookie(event, 'study_session')

  if (!userId) {
    return {
      user: null
    }
  }

  const user = findUserById(userId)

  return {
    user: user ? toPublicUser(user) : null
  }
})
