import bcrypt from 'bcryptjs'

const bcryptSaltRounds = 10

// 真实项目不要存“可解密密码”，而是存单向密码哈希。
// bcrypt 每次 hash 都会生成随机盐，所以同一个明文密码每次得到的哈希也可能不同。
export async function hashPassword(password: string) {
  return bcrypt.hash(password, bcryptSaltRounds)
}

// 登录时使用 bcrypt.compare 校验明文密码和数据库里的 password_hash 是否匹配。
// 不能自己把明文重新拼字符串比较，因为 bcrypt 的盐值已经包含在哈希结果里。
export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}
