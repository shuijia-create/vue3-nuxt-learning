<script setup lang="ts">
import { getAdminPageTitle } from '~/utils/admin-page-title'
import type { PageTab } from '~/stores/page-tabs'
import { usePageTabsStore } from '~/stores/page-tabs'

const route = useRoute()
const tabsStore = usePageTabsStore()

// 当前激活标签用 path 判断，query 变化仍然属于同一个页面 tag。
const activePath = computed(() => route.path)

function addCurrentRouteTab() {
  tabsStore.addTab({
    // 标题只看 path，避免 /work-orders?status=xxx 找不到标题映射。
    title: getAdminPageTitle(route.path),
    // path 不带 query，用来判断同一个页面不要重复生成 tag。
    path: route.path,
    // fullPath 带 query，用来点击 tag 时还原当前筛选条件。
    fullPath: route.fullPath
  })
}

function goToTab(tab: PageTab) {
  if (tab.fullPath !== route.fullPath) {
    navigateTo(tab.fullPath)
  }
}

async function closeTab(tab: PageTab) {
  // 先记录被关闭标签的位置，因为 removeTab 后数组下标会变化。
  const currentIndex = tabsStore.tabs.findIndex((item) => item.path === tab.path)
  const isActiveTab = tab.path === route.path

  tabsStore.removeTab(tab.path)

  // 关闭的不是当前页面标签，只需要移除 tag，不需要跳转页面。
  if (!isActiveTab) {
    return
  }

  // 关闭当前标签后，优先跳到右侧同位置标签；没有右侧时跳到左侧标签。
  const nextTab = tabsStore.tabs[currentIndex] ?? tabsStore.tabs[currentIndex - 1]

  if (nextTab) {
    await navigateTo(nextTab.fullPath)
  }
}

// 路由变化时自动把当前页面加入标签栏。
watch(
  () => route.fullPath,
  () => addCurrentRouteTab(),
  { immediate: true }
)

// localStorage 只能在浏览器读取，所以持久化恢复放在 onMounted。
onMounted(() => {
  tabsStore.restoreTabs()
  // 恢复历史标签后，再补一次当前页面，保证刷新所在页面也一定在标签栏里。
  addCurrentRouteTab()
})
</script>

<template>
  <div class="page-tabs">
    <el-scrollbar>
      <div class="tabs-inner">
        <el-tag
          v-for="tab in tabsStore.tabs"
          :key="tab.path"
          class="page-tab"
          :closable="tabsStore.tabs.length > 1"
          :effect="tab.path === activePath ? 'dark' : 'plain'"
          @click="goToTab(tab)"
          @close="closeTab(tab)"
        >
          {{ tab.title }}
        </el-tag>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.page-tabs {
  height: 42px;
  padding: 6px 16px;
  background: var(--admin-surface-subtle);
  border-bottom: 1px solid var(--admin-border);
}

.tabs-inner {
  display: flex;
  gap: 8px;
  min-width: max-content;
}

.page-tab {
  height: 28px;
  padding: 0 10px;
  cursor: pointer;
  border-radius: 6px;
  user-select: none;
}

.page-tab.el-tag--dark {
  background: var(--admin-primary);
  border-color: var(--admin-primary);
}

.page-tab.el-tag--plain {
  color: var(--admin-text-secondary);
  background: #ffffff;
  border-color: var(--admin-border);
}

.page-tab.el-tag--plain:hover {
  color: var(--admin-primary);
  border-color: #bfdbfe;
}
</style>
