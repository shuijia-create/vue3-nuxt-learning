import { send, setResponseHeader, setResponseStatus } from 'h3'
import { defineNitroErrorHandler } from 'nitropack/runtime/error'
import { apiError } from '~/server/utils/api-response'
import type { ApiErrorResponse } from '~/types/api-response'

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const maybeResponse = value as Partial<ApiErrorResponse>

  return typeof maybeResponse.code === 'number'
    && typeof maybeResponse.message === 'string'
    && 'data' in maybeResponse
}

export default defineNitroErrorHandler((error, event) => {
  if (!event.path.startsWith('/api')) {
    return
  }

  const statusCode = error.statusCode || 500
  const fallbackMessage = statusCode >= 500
    ? '服务端错误'
    : error.message || error.statusMessage || '请求失败'
  const body = isApiErrorResponse(error.data)
    ? error.data
    : apiError(statusCode, fallbackMessage)

  setResponseStatus(event, statusCode, error.statusMessage || body.message)
  setResponseHeader(event, 'content-type', 'application/json; charset=utf-8')

  return send(event, JSON.stringify(body))
})
