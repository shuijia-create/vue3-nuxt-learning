import type { ApiResponse } from '~/types/api-response'

export type ApiFetch = <T>(request: string, options?: Parameters<typeof $fetch>[1]) => Promise<T>

export function getApiFetch() {
  return (import.meta.server ? useRequestFetch() : $fetch) as ApiFetch
}

export async function fetchApiData<T>(
  request: string,
  options?: Parameters<typeof $fetch>[1],
  fetcher?: ApiFetch
) {
  const requestFetch = fetcher ?? getApiFetch()
  const response = await requestFetch<ApiResponse<T>>(request, options)

  if (response.code !== 200) {
    throw new Error(response.message)
  }

  return response.data
}

export function getApiErrorCode(error: unknown) {
  const maybeError = error as {
    statusCode?: unknown
    data?: {
      code?: unknown
      data?: {
        code?: unknown
      }
    }
    response?: {
      status?: unknown
      _data?: {
        code?: unknown
        data?: {
          code?: unknown
        }
      }
    }
  }
  const responseData = maybeError.response?._data ?? maybeError.data

  return responseData?.data?.code
    ?? responseData?.code
    ?? maybeError.statusCode
    ?? maybeError.response?.status
}
