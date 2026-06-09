import {
  constants,
  generateKeyPairSync,
  privateDecrypt
} from 'node:crypto'

type PasswordKeyPair = {
  publicKey: string
  privateKey: string
}

const globalForPasswordEncryption = globalThis as unknown as {
  passwordKeyPair?: PasswordKeyPair
}

function normalizePem(value: string | undefined) {
  return value?.replace(/\\n/g, '\n').trim()
}

function createDevelopmentKeyPair(): PasswordKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  })

  return {
    publicKey,
    privateKey
  }
}

function getPasswordKeyPair() {
  const publicKey = normalizePem(process.env.PASSWORD_PUBLIC_KEY)
  const privateKey = normalizePem(process.env.PASSWORD_PRIVATE_KEY)

  if (publicKey && privateKey) {
    return {
      publicKey,
      privateKey
    }
  }

  // 学习项目本地开发可以自动生成内存密钥对；生产环境应在环境变量里配置固定密钥。
  globalForPasswordEncryption.passwordKeyPair =
    globalForPasswordEncryption.passwordKeyPair ?? createDevelopmentKeyPair()

  return globalForPasswordEncryption.passwordKeyPair
}

export function getPasswordPublicKey() {
  return getPasswordKeyPair().publicKey
}

export function decryptPassword(encryptedPassword: string) {
  const { privateKey } = getPasswordKeyPair()
  const encryptedBuffer = Buffer.from(encryptedPassword, 'base64')

  const decrypted = privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    encryptedBuffer
  )

  return decrypted.toString('utf8')
}
