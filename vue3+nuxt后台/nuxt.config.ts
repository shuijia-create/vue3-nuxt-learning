export default defineNuxtConfig({
  compatibilityDate: '2026-05-21',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css', 'element-plus/dist/index.css'],
  typescript: {
    strict: true,
    typeCheck: true
  },
  app: {
    head: {
      title: 'Nuxt 后台学习项目',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
