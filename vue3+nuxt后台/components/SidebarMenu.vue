<script setup lang="ts">
import {
  ChatDotRound,
  DataAnalysis,
  Document,
  Key,
  Management,
  Setting,
  Tickets,
  UserFilled
} from '@element-plus/icons-vue'
import type { MenuRouteItem } from '~/types/menu'

const route = useRoute()

const requestFetch = import.meta.server ? useRequestFetch() : $fetch
const iconMap = {
  ChatDotRound,
  DataAnalysis,
  Document,
  Key,
  Management,
  Setting,
  Tickets,
  UserFilled
}

const { data } = await useAsyncData('sidebar-menus', () => {
  return requestFetch<{ list: MenuRouteItem[] }>('/api/menus')
})

const visibleMenus = computed(() => data.value?.list ?? [])
const activeMenu = computed(() => {
  const matchedMenu = visibleMenus.value.find((item) => {
    return route.path === item.path || route.path.startsWith(`${item.path}/`)
  })

  return matchedMenu?.path ?? route.path
})

function getMenuIcon(icon: string) {
  return iconMap[icon as keyof typeof iconMap] ?? Setting
}
</script>

<template>
  <el-menu
    :default-active="activeMenu"
    class="sidebar-menu"
    background-color="#0f172a"
    text-color="#cbd5e1"
    active-text-color="#ffffff"
    router
  >
    <el-menu-item
      v-for="item in visibleMenus"
      :key="item.path"
      :index="item.path"
    >
      <el-icon>
        <component :is="getMenuIcon(item.icon)" />
      </el-icon>
      <span>{{ item.title }}</span>
    </el-menu-item>
  </el-menu>
</template>

<style scoped>
.sidebar-menu {
  border-right: 0;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: var(--admin-sidebar-active);
}
</style>
