<script setup lang="ts">
import type { WorkOrder } from '~/types/work-order'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const id = String(route.params.id ?? '')

const { data, pending, error } = await useFetch<{ data: WorkOrder, code: number }>(
  `/api/work-orders/detail/${id}`
)

const workOrder = computed(() => data.value?.data)

useHead(() => ({
  title: workOrder.value
    ? `${workOrder.value.title} - 工单详情`
    : '工单详情 - Nuxt 后台学习项目'
}))
</script>

<template>
  <section>
    <div class="page-head">
      <div>
        <h1 class="page-title">工单详情</h1>
        <p class="page-desc">
          当前页面通过路由参数 id 请求对应工单详情。
        </p>
      </div>

      <el-button @click="navigateTo('/work-orders')">
        返回列表
      </el-button>
    </div>

    <el-card v-if="pending" shadow="never">
      正在加载工单详情...
    </el-card>

    <el-alert
      v-else-if="error"
      title="工单不存在或加载失败"
      type="error"
      :closable="false"
      show-icon
    />

    <el-card v-else-if="workOrder" shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ workOrder.title }}</span>
          <el-tag>{{ workOrder.status }}</el-tag>
        </div>
      </template>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="工单编号">
          {{ workOrder.code }}
        </el-descriptions-item>
        <el-descriptions-item label="类型">
          {{ workOrder.type }}
        </el-descriptions-item>
        <el-descriptions-item label="提交人">
          {{ workOrder.submitter }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ workOrder.createdAt }}
        </el-descriptions-item>
        <el-descriptions-item label="问题描述">
          {{ workOrder.description }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </section>
</template>

<style scoped>
.page-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.page-desc {
  margin: -6px 0 0;
  color: var(--admin-muted);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
