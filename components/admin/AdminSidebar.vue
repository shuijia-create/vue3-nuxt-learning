<script setup lang="ts">
import {
  House,
  Menu as MenuIcon,
  Setting
} from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)

const menus = [
  {
    path: '/dashboard',
    title: '首页',
    icon: House
  },
  {
    path: '/admin',
    title: '权限页面',
    icon: Setting
  },
  {
    path: '/element-plus',
    title: '组件示例',
    icon: MenuIcon
  }
]
</script>

<template>
  <el-aside class="admin-sidebar" width="220px">
    <AdminBrand />

    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      background-color="#111827"
      text-color="#cbd5e1"
      active-text-color="#ffffff"
      router
    >
      <el-menu-item
        v-for="item in menus"
        :key="item.path"
        :index="item.path"
      >
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.title }}</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>
