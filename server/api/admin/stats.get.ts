import { requireAdmin } from '../../utils/auth'
import { toPublicUser } from '../../utils/users'

export default defineEventHandler((event) => {
  const user = requireAdmin(event)

  return {
    user: toPublicUser(user),
    stats: {
      users: 2,
      protectedPages: 2,
      authMode: 'httpOnly cookie token'
    }
  }
})
