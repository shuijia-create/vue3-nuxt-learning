<script setup lang="ts">
import { useWorkOrders } from '~/composables/use-work-orders'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '工作台 - Nuxt 后台学习项目'
})

const workOrderActions = useWorkOrders()
const { data } = await useAsyncData('dashboard-work-orders', () => {
  return workOrderActions.listWorkOrders()
})

const workOrders = computed(() => data.value?.list ?? [])
const pendingCount = computed(() => workOrders.value.filter((item) => item.status === '待处理').length)
const reviewCount = computed(() => workOrders.value.filter((item) => item.status === '待确认').length)
</script>

<template>
  <section>
    <h1 class="page-title">工作台</h1>

    <el-row :gutter="16">
      <el-col :md="8" :sm="24">
        <el-card shadow="never">
          <el-statistic title="当前工单" :value="workOrders.length" />
        </el-card>
      </el-col>
      <el-col :md="8" :sm="24">
        <el-card shadow="never">
          <el-statistic title="待处理" :value="pendingCount" />
        </el-card>
      </el-col>
      <el-col :md="8" :sm="24">
        <el-card shadow="never">
          <el-statistic title="需要确认" :value="reviewCount" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="intro-card" shadow="never">
      <template #header>今日学习链路</template>
      <div class="learning-note">
        当前工单链路已经切到数据库：页面通过 useWorkOrders 进入 API client，再到 server service 和 Prisma。
      </div>
    </el-card>

    <el-card class="intro-card" shadow="never">
      <template #header>最近工单</template>
      <el-table :data="workOrders" border>
        <el-table-column prop="code" label="工单编号" width="180" />
        <el-table-column prop="title" label="标题" min-width="260" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
      </el-table>
    </el-card>
  </section>
</template>

<style scoped>
.intro-card {
  margin-top: 16px;
}
</style>
