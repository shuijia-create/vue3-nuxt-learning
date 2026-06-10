export function getApiErrorMessage(error: unknown, fallback: string) {
  const maybeError = error as {
    data?: {
      data?: {
        message?: unknown
        statusMessage?: unknown
      }
      message?: unknown
      statusMessage?: unknown
    }
    response?: {
      _data?: {
        data?: {
          message?: unknown
          statusMessage?: unknown
        }
        message?: unknown
        statusMessage?: unknown
      }
    }
    message?: unknown
    statusMessage?: unknown
  }
  const responseData = maybeError.response?._data ?? maybeError.data

  return String(
    responseData?.data?.message
    || responseData?.data?.statusMessage
    || responseData?.message
    || responseData?.statusMessage
    || maybeError.message
    || maybeError.statusMessage
    || fallback
  )
}
