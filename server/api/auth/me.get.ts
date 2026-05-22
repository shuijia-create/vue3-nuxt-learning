import { getCurrentUser } from '../../utils/auth'
import { toPublicUser } from '../../utils/users'

export default defineEventHandler((event) => {
  const user = getCurrentUser(event)

  return {
    user: user ? toPublicUser(user) : null
  }
})
