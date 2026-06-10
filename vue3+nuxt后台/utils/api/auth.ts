// 引入登录表单、接口请求体、接口返回值这些类型，让 API 层和页面层保持类型一致。
import type { LoginForm, LoginPayload, LoginResponse, LogoutResponse, MeResponse } from '~/types/auth'
// 引入前端密码加密工具，保证请求体只提交 encryptedPassword，不提交原始密码。
import { encryptPasswordForRequest } from '~/utils/password-encryption'

// 定义当前项目里“可替换的 fetch 函数”类型；SSR 时会传 useRequestFetch，浏览器端用 $fetch。
type ApiFetch = <T>(request: string, options?: Parameters<typeof $fetch>[1]) => Promise<T>

// 获取当前运行环境应该使用的请求函数。
function getApiFetch() {
  // 服务端渲染阶段必须用 useRequestFetch 转发浏览器 cookie；浏览器端直接用 $fetch。
  return (import.meta.server ? useRequestFetch() : $fetch) as ApiFetch
}

// 判断一个接口错误是不是 401 未登录错误。
export function isUnauthorizedError(error: unknown) {
  // Nuxt 和 ofetch 的错误结构不完全一样，所以这里只取我们关心的状态码字段。
  const maybeError = error as {
    // 服务端或部分封装里可能直接带 statusCode。
    statusCode?: unknown
    // ofetch 错误通常把 HTTP 状态码放在 response.status。
    response?: {
      // HTTP 状态码，例如 401。
      status?: unknown
    }
  }

  // 任意一种错误结构出现 401，都认为当前登录态无效。
  return maybeError.statusCode === 401 || maybeError.response?.status === 401
}

// 登录接口请求：页面传入原始表单，API 层负责加密密码并提交给后端。
export async function loginApi(form: LoginForm) {
  // 组装真正发给后端的请求体；这里没有 password 字段。
  const payload: LoginPayload = {
    // 用户名不加密，后端用它查询 users 表。
    username: form.username,
    // 密码先用服务端公钥加密，后端再用私钥解密。
    encryptedPassword: await encryptPasswordForRequest(form.password)
  }

  // 调用 Nuxt 后端登录接口；成功后后端会返回 token，并写入 SSR 需要的 httpOnly cookie。
  return $fetch<LoginResponse>('/api/login', {
    // 登录接口使用 POST，因为它会创建服务端 session。
    method: 'POST',
    // body 只包含 username 和 encryptedPassword。
    body: payload
  })
}

// 获取当前登录用户和权限；这就是后台常说的 getInfo。
// 可选 fetcher 是为了 SSR 时让调用方传 useRequestFetch。
// token 来自登录接口返回值，登录后第一次 getInfo 会显式带 Bearer token。
export function fetchMeApi(fetcher?: ApiFetch, token?: string) {
  // 如果调用方没传 fetcher，就根据当前环境自动选择。
  const requestFetch = fetcher ?? getApiFetch()

  // 请求 /api/me；服务端 middleware 会根据 cookie + Redis session 解析当前用户。
  // 权限 routes/buttons 只从这里返回，不从 login 返回。
  return requestFetch<MeResponse>('/api/me', {
    headers: token
      ? {
          Authorization: `Bearer ${token}`
        }
      : undefined
  })
}

// 退出登录接口请求。
export function logoutApi() {
  // 调用后端退出接口；后端会删除 Redis session 和 cookie。
  return $fetch<LogoutResponse>('/api/logout', {
    // 退出登录会改变服务端 session 状态，所以使用 POST。
    method: 'POST'
  })
}
