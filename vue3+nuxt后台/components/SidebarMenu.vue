<script setup lang="ts">
import {
  ChatDotRound,
  DataAnalysis,
  Document,
  Setting,
  Tickets,
  UserFilled
} from '@element-plus/icons-vue'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const activeMenu = computed(() => route.path)
const isSuperAdmin = computed(() => auth.user?.roles.includes('super_admin') ?? false)

const menus = [
  {
    path: '/dashboard',
    title: '工作台',
    icon: DataAnalysis
  },
  {
    path: '/work-orders',
    title: '工单列表',
    icon: Tickets
  },
  {
    path: '/ai/work-order-draft',
    title: '工单草稿助手',
    icon: Document
  },
  {
    path: '/ai/knowledge',
    title: '企业文档问答',
    icon: ChatDotRound
  },
  {
    path: '/accounts',
    title: '账号管理',
    icon: UserFilled,
    requiresSuperAdmin: true
  },
  {
    path: '/system',
    title: '系统日志',
    icon: Setting
  }
]

const visibleMenus = computed(() => {
  return menus.filter((item) => !item.requiresSuperAdmin || isSuperAdmin.value)
})
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
        <component :is="item.icon" />
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
