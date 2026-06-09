// service 层使用自己的错误类型表达业务失败，例如“工单不存在”“无权限”。
// server/api 会把它转换成 Nuxt/H3 能识别的 createError。
export class ServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

// 让 API handler 保持很薄：try/catch 里只需要调用这个函数，就能统一转换业务错误。
export function throwServiceError(error: unknown): never {
  if (error instanceof ServiceError) {
    throw createError({
      statusCode: error.statusCode,
      message: error.message
    })
  }

  throw error
}
