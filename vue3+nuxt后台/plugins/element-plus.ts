import ElementPlus, { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(ElementPlus)

  // Element Plus 在 SSR 场景下会给组件生成唯一 id。
  // 这里手动提供起始值，可以避免服务端渲染和客户端激活时 id 不一致。
  nuxtApp.vueApp.provide(ID_INJECTION_KEY, {
    prefix: 1024,
    current: 0
  })

  // z-index 控制弹窗、下拉框、消息提示这类浮层的层级。
  // provide 给 Element Plus 后，它内部的 Dialog、Message、Popover 会基于这个值递增层级。
  nuxtApp.vueApp.provide(ZINDEX_INJECTION_KEY, {
    current: 0
  })

  // 自动注册 Element Plus 图标，页面里可以直接使用 <Bell />、<User /> 这类图标组件。
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    nuxtApp.vueApp.component(key, component)
  }
})
