// 统一请求当前 Nuxt 项目的 /api/* 接口。
// 这个封装的重点不是“代替所有请求库”，而是统一处理 SSR 时的 cookie 转发。
export function useApiFetch<T>(
  request: string,
  options: Parameters<typeof $fetch>[1] = {}
) {
  // 浏览器请求同源接口时会自动带 cookie。
  // Nuxt 服务端内部请求不会自动继承浏览器 cookie，
  // 所以 SSR 时要手动把当前请求头里的 cookie 转发给内部 API。
  const forwardedHeaders = import.meta.server
    ? useRequestHeaders(['cookie'])
    : undefined

  const mergedHeaders = {
    ...forwardedHeaders,
    ...(options.headers || {})
  }

  return $fetch<T>(request, {
    ...options,
    headers: mergedHeaders
  })
}
