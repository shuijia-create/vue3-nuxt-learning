// Nuxt 的主配置文件。
// Nuxt 3/4 基于 Vue 3，并且开发服务器与构建流程默认使用 Vite。
export default defineNuxtConfig({
  // Nuxt 模块会在构建阶段扩展 Nuxt 能力。
  // @element-plus/nuxt 会帮我们在 Nuxt 中接入 Element Plus。
  modules: ['@element-plus/nuxt'],

  // 开启 Nuxt DevTools，学习阶段可以在浏览器里观察路由、组件、payload 等信息。
  devtools: { enabled: true },

  // 这里声明全局 CSS。Nuxt 会自动把它注入到所有页面。
  css: ['~/assets/css/main.css'],

  // app 配置会影响最终 HTML 文档，例如标题、meta 标签、favicon 等。
  app: {
    head: {
      title: 'Nuxt + Vite 学习项目',
      meta: [
        {
          name: 'description',
          content: '一个用于学习 Vue 3、Nuxt 和 Vite 的最小项目'
        }
      ]
    }
  },

  // runtimeConfig 用来管理运行时配置。
  // public 内的数据会暴露给浏览器，非 public 数据只应在服务端使用。
  runtimeConfig: {
    public: {
      appName: 'Nuxt Vite Study'
    }
  },

  // Nuxt 内部已经使用 Vite；这里可以写 Vite 原生配置。
  vite: {
    server: {
      // 让本机局域网也可以访问开发服务器，学习移动端调试时有用。
      host: '0.0.0.0'
    },
    css: {
      devSourcemap: true
    }
  },

  // TypeScript 严格模式更适合学习阶段发现类型问题。
  typescript: {
    strict: true
  }
})
