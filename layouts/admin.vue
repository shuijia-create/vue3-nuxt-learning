<template>
  <el-container class="admin-layout">
    <AdminSidebar />

    <el-container>
      <AdminHeader />

      <el-main class="admin-content">
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>
