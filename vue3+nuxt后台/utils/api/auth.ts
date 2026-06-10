// 引入登录表单、接口请求体、接口返回值这些类型，让 API 层和页面层保持类型一致。
import type { LoginForm, LoginPayload, LoginResponse, LogoutResponse, MeResponse } from '~/types/auth'
import { fetchApiData, getApiErrorCode, type ApiFetch } from '~/utils/api/response'

// 判断一个接口错误是不是 401 未登录错误。
export function isUnauthorizedError(error: unknown) {
  // Nuxt 和 ofetch 的错误结构不完全一样，所以这里只取我们关心的状态码字段。
  return getApiErrorCode(error) === 401
}

// 登录接口请求：HTTPS 负责传输加密，后端只用 bcrypt 校验数据库里的密码哈希。
export async function loginApi(form: LoginForm) {
  // 组装真正发给后端的请求体。
  const payload: LoginPayload = {
    username: form.username,
    password: form.password
  }

  // 调用 Nuxt 后端登录接口；成功后后端会返回 token，并写入 SSR 需要的 httpOnly cookie。
  return fetchApiData<LoginResponse>('/api/login', {
    // 登录接口使用 POST，因为它会创建服务端 session。
    method: 'POST',
    // body 只包含登录接口需要的账号和密码。
    body: payload
  })
}

// 获取当前登录用户和权限；这就是后台常说的 getInfo。
// 可选 fetcher 是为了 SSR 时让调用方传 useRequestFetch。
// token 来自登录接口返回值，登录后第一次 getInfo 会显式带 Bearer token。
export function fetchMeApi(fetcher?: ApiFetch, token?: string) {
  // 如果调用方没传 fetcher，就根据当前环境自动选择。
  // 请求 /api/me；服务端 middleware 会根据 cookie + Redis session 解析当前用户。
  // 权限 routes/buttons 只从这里返回，不从 login 返回。
  return fetchApiData<MeResponse>('/api/me', {
    headers: token
      ? {
          Authorization: `Bearer ${token}`
        }
      : undefined
  }, fetcher)
}

// 退出登录接口请求。
export function logoutApi() {
  // 调用后端退出接口；后端会删除 Redis session 和 cookie。
  return fetchApiData<LogoutResponse>('/api/logout', {
    // 退出登录会改变服务端 session 状态，所以使用 POST。
    method: 'POST'
  })
}
