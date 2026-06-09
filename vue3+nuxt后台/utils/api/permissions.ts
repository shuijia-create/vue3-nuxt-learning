import type { PagePermissionCheckResponse } from '~/types/permission'

type ApiFetch = <T>(request: string, options?: Parameters<typeof $fetch>[1]) => Promise<T>

function getApiFetch() {
  return (import.meta.server ? useRequestFetch() : $fetch) as ApiFetch
}

// 前端只把当前要访问的 path 交给后端，真正的权限判断在服务端查权限表完成。
export function checkPagePermissionApi(path: string, fetcher?: ApiFetch) {
  const requestFetch = fetcher ?? getApiFetch()

  return requestFetch<PagePermissionCheckResponse>('/api/permissions/page-access', {
    query: {
      path
    }
  })
}
