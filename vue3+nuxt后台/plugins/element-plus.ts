import {
  ElAlert,
  ElAside,
  ElBadge,
  ElButton,
  ElCard,
  ElCheckbox,
  ElCol,
  ElContainer,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElDivider,
  ElDrawer,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElHeader,
  ElIcon,
  ElInput,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElOption,
  ElPagination,
  ElRadioButton,
  ElRadioGroup,
  ElRow,
  ElScrollbar,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTimeline,
  ElTimelineItem,
  ID_INJECTION_KEY,
  ZINDEX_INJECTION_KEY
} from 'element-plus'

const elementPlusComponents = [
  ElAlert,
  ElAside,
  ElBadge,
  ElButton,
  ElCard,
  ElCheckbox,
  ElCol,
  ElContainer,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElDivider,
  ElDrawer,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElHeader,
  ElIcon,
  ElInput,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElOption,
  ElPagination,
  ElRadioButton,
  ElRadioGroup,
  ElRow,
  ElScrollbar,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTimeline,
  ElTimelineItem
]

export default defineNuxtPlugin((nuxtApp) => {
  for (const component of elementPlusComponents) {
    nuxtApp.vueApp.use(component)
  }

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

  // 图标在页面里按需 import，不再全量注册 @element-plus/icons-vue。
})
