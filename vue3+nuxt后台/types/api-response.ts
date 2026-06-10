export type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

export type ApiErrorResponse = ApiResponse<null>
