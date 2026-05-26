<script setup lang="ts">
import type { WorkOrder, WorkOrderStatus } from '~/types/work-order'
import { ElMessage } from 'element-plus'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const id = String(route.params.id ?? '')

type WorkOrderDetailResponse = {
  code: number
  data: WorkOrder
}

const workOrder = ref<WorkOrder>()
const pending = ref(false)
const error = ref(false)
const processRecords = computed(() => workOrder.value?.processRecords ?? [])
const hasAiSuggestion = computed(() => {
  return workOrder.value?.source === 'AI 草稿' && !!workOrder.value.aiSuggestion
})
const updatingStatus = ref(false)
const statusApi = '/api/work-orders/status' as string
const detailApi = `/api/work-orders/detail/${id}`

const statusTypeMap: Record<WorkOrderStatus, 'warning' | 'primary' | 'danger'> = {
  待处理: 'warning',
  处理中: 'primary',
  待确认: 'danger'
}

const nextStatusAction = computed(() => {
  if (!workOrder.value) {
    return null
  }

  const actionMap: Partial<Record<WorkOrderStatus, { label: string, status: WorkOrderStatus }>> = {
    待处理: {
      label: '开始处理',
      status: '处理中'
    },
    处理中: {
      label: '提交处理',
      status: '待确认'
    }
  }

  return actionMap[workOrder.value.status] ?? null
})

useHead(() => ({
  title: workOrder.value
    ? `${workOrder.value.title} - 工单详情`
    : '工单详情 - Nuxt 后台学习项目'
}))

async function fetchWorkOrderDetail() {
  pending.value = true
  error.value = false

  try {
    const res = await $fetch<WorkOrderDetailResponse>(detailApi)
    workOrder.value = res.data
  } catch {
    error.value = true
  } finally {
    pending.value = false
  }
}

async function handleChangeStatus(status: WorkOrderStatus) {
  if (!workOrder.value) {
    return
  }

  updatingStatus.value = true

  try {
    const res: { code: number, message?: string } = await $fetch(statusApi, {
      method: 'POST',
      body: {
        id: workOrder.value.id,
        status
      }
    })

    if (res.code !== 200) {
      ElMessage.error(res.message || '状态更新失败')
      return
    }

    ElMessage.success('工单状态已更新')
    await fetchWorkOrderDetail()
  } catch {
    ElMessage.error('状态更新失败，请确认后端接口已实现')
  } finally {
    updatingStatus.value = false
  }
}

onMounted(() => {
  fetchWorkOrderDetail()
})
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
          <el-tag :type="statusTypeMap[workOrder.status]">
            {{ workOrder.status }}
          </el-tag>
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
        <el-descriptions-item label="来源">
          <el-tag :type="workOrder.source === 'AI 草稿' ? 'success' : 'info'">
            {{ workOrder.source }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ workOrder.createdAt }}
        </el-descriptions-item>
        <el-descriptions-item label="问题描述">
          {{ workOrder.description }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="detail-actions">
        <el-button
          v-if="nextStatusAction"
          type="primary"
          :loading="updatingStatus"
          @click="handleChangeStatus(nextStatusAction.status)"
        >
          {{ nextStatusAction.label }}
        </el-button>
        <el-tag v-else type="success">
          当前工单等待确认
        </el-tag>
      </div>

      <el-divider />

      <section v-if="hasAiSuggestion" class="detail-section">
        <h2 class="section-title">AI 建议</h2>

        <el-alert
          class="ai-alert"
          title="AI 建议只用于辅助判断，最终处理结果以人工记录为准。"
          type="warning"
          :closable="false"
          show-icon
        />

        <el-descriptions :column="1" border>
          <el-descriptions-item label="影响范围">
            {{ workOrder.aiSuggestion?.impact }}
          </el-descriptions-item>
          <el-descriptions-item label="处理建议">
            {{ workOrder.aiSuggestion?.suggestion }}
          </el-descriptions-item>
          <el-descriptions-item label="建议补充信息">
            <el-tag
              v-for="item in workOrder.aiSuggestion?.missingInfo"
              :key="item"
              class="ai-tag"
              type="warning"
            >
              {{ item }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <el-divider />

      <h2 class="section-title">人工处理记录</h2>

      <el-timeline v-if="processRecords.length > 0">
        <el-timeline-item
          v-for="record in processRecords"
          :key="record.id"
          :timestamp="record.createdAt"
          placement="top"
        >
          <div class="record-title">
            {{ record.action }} - {{ record.operator }}
          </div>
          <div class="record-remark">
            {{ record.remark }}
          </div>
        </el-timeline-item>
      </el-timeline>

      <el-empty
        v-else
        description="暂无处理记录"
      />
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

.detail-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
}

.detail-section {
  margin-top: 16px;
}

.ai-alert {
  margin-bottom: 16px;
}

.ai-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.record-title {
  font-weight: 600;
}

.record-remark {
  margin-top: 6px;
  color: var(--admin-muted);
}
</style>
