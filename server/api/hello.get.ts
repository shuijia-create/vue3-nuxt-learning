// server/api 中的文件会自动变成服务端接口。
// hello.get.ts 对应 GET /api/hello。
export default defineEventHandler(() => {
  return {
    message: '你好，这是来自 Nuxt 服务端 API 的响应。'
  }
})
