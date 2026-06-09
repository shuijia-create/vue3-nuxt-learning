import { getPasswordPublicKey } from '~/server/utils/password-encryption'

export default defineEventHandler(() => {
  return {
    publicKey: getPasswordPublicKey()
  }
})
