import { defineStore } from 'pinia'

export type PageTab = {
  title: string
  // path 是页面唯一标识，不带 query，用来判断是不是同一个 tag。
  path: string
  // fullPath 是真实跳转地址，带 query，用来恢复页面筛选状态。
  fullPath: string
}

const pageTabsStorageKey = 'nuxt-admin-page-tabs'

function getPathWithoutQuery(fullPath: string) {
  return fullPath.split('?')[0] || fullPath
}

// localStorage 里的数据不一定可信，恢复前先转换成当前 PageTab 结构。
function toPageTab(value: unknown): PageTab | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const tab = value as PageTab

  if (typeof tab.title !== 'string' || typeof tab.path !== 'string') {
    return null
  }

  const fullPath = typeof tab.fullPath === 'string' ? tab.fullPath : tab.path

  return {
    title: tab.title,
    path: getPathWithoutQuery(tab.path),
    fullPath
  }
}

export const usePageTabsStore = defineStore('page-tabs', () => {
  const tabs = ref<PageTab[]>([])
  // 刷新页面时，组件会先执行一次路由监听，再执行 onMounted。
  // 这个标记用来避免本地旧标签还没恢复，就被当前页覆盖掉。
  const isRestored = ref(false)

  function readStoredTabs() {
    // Nuxt 有 SSR，服务端没有 localStorage，所以只能在浏览器端读取。
    if (!import.meta.client) {
      return []
    }

    const rawTabs = localStorage.getItem(pageTabsStorageKey)

    if (!rawTabs) {
      return []
    }

    try {
      const parsedTabs = JSON.parse(rawTabs)

      return Array.isArray(parsedTabs)
        ? parsedTabs.map(toPageTab).filter((tab): tab is PageTab => Boolean(tab))
        : []
    } catch {
      return []
    }
  }

  function persistTabs() {
    // 只有恢复完成后才允许写入，避免刷新瞬间把历史标签覆盖成当前页。
    if (!import.meta.client || !isRestored.value) {
      return
    }

    localStorage.setItem(pageTabsStorageKey, JSON.stringify(tabs.value))
  }

  function restoreTabs() {
    const storedTabs = readStoredTabs()

    if (storedTabs.length > 0) {
      tabs.value = storedTabs
    }

    isRestored.value = true
    // 恢复后立即写回一次，可以清理掉本地存储里不合法的旧数据。
    persistTabs()
  }

  function addTab(tab: PageTab) {
    // 同一个页面 path 只保留一个 tag；query 变化时只更新 fullPath，不新增 tag。
    const existingTab = tabs.value.find((item) => item.path === tab.path)

    if (existingTab) {
      existingTab.title = tab.title
      existingTab.fullPath = tab.fullPath
      persistTabs()
      return
    }

    tabs.value.push(tab)
    persistTabs()
  }

  function removeTab(path: string) {
    // 至少保留一个标签，避免后台顶部出现空标签栏。
    if (tabs.value.length <= 1) {
      return
    }

    tabs.value = tabs.value.filter((item) => item.path !== path)
    persistTabs()
  }

  function clearTabs() {
    tabs.value = []
    isRestored.value = true

    if (import.meta.client) {
      localStorage.removeItem(pageTabsStorageKey)
    }
  }

  return {
    tabs,
    restoreTabs,
    addTab,
    removeTab,
    clearTabs
  }
})
