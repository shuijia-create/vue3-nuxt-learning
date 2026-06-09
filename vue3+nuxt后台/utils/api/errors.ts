export function getApiErrorMessage(error: unknown, fallback: string) {
  const maybeError = error as {
    data?: {
      message?: unknown
      statusMessage?: unknown
    }
    message?: unknown
    statusMessage?: unknown
  }

  return String(
    maybeError.data?.message
    || maybeError.data?.statusMessage
    || maybeError.message
    || maybeError.statusMessage
    || fallback
  )
}
