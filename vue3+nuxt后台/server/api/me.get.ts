import { demoUser } from '~/server/data/auth'

export default defineEventHandler((event) => {
  return {
    user: event.context.currentUser ?? demoUser
  }
})
