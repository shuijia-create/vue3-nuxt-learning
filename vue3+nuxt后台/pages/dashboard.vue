<script setup lang="ts">
import type { WorkOrder } from '~/types/work-order'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '工作台 - Nuxt 后台学习项目'
})

const { data } = await useFetch<{ list: WorkOrder[] }>('/api/work-orders')

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
        当前阶段先用 mock 工单证明流程成立：页面通过 server/api 获取数据，后续再补新建工单、AI 草稿和数据库持久化。
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
