import type { ApiErrorResponse, ApiResponse } from '~/types/api-response'

export function apiSuccess<T>(data: T, message = '请求成功'): ApiResponse<T> {
  return {
    code: 200,
    message,
    data
  }
}

export function apiError(statusCode: number, message: string): ApiErrorResponse {
  return {
    code: statusCode,
    message,
    data: null
  }
}

export function throwApiError(statusCode: number, message: string): never {
  throw createError({
    statusCode,
    statusMessage: message,
    message,
    data: apiError(statusCode, message)
  })
}
