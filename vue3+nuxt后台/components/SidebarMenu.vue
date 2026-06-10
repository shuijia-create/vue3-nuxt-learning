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
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const auth = useAuthStore()

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

const visibleMenus = computed(() => auth.menus)
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
    background-color="transparent"
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
  padding: 10px 8px;
  border-right: 0;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 44px;
  margin: 4px 0;
  border-radius: 8px;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  color: #ffffff;
  background: rgb(255 255 255 / 8%);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, var(--admin-sidebar-active), var(--admin-accent));
  box-shadow: 0 10px 20px rgb(37 99 235 / 18%);
}
</style>
