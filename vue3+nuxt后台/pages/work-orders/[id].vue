<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import type { WorkOrderStatus } from '~/types/work-order'
import { ElMessage } from 'element-plus'
import { useNotifications } from '~/composables/use-notifications'
import { useWorkOrders } from '~/composables/use-work-orders'
import { useAuthStore } from '~/stores/auth'
import { getApiErrorMessage } from '~/utils/api/errors'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const id = String(route.params.id ?? '')
const notificationActions = useNotifications()
const workOrderActions = useWorkOrders()
const auth = useAuthStore()
const { data, pending, error, refresh } = await useAsyncData(`work-order-${id}`, () => {
  return workOrderActions.fetchWorkOrderDetail(id)
})
const workOrder = computed(() => data.value)
const processRecords = computed(() => workOrder.value?.processRecords ?? [])
const hasAiSuggestion = computed(() => {
  return workOrder.value?.source === 'AI 草稿' && !!workOrder.value.aiSuggestion
})
const updatingStatus = ref(false)
const canChangeWorkOrderStatus = computed(() => auth.hasButtonPermission('work_order_detail.change_status'))

const statusClassMap: Record<WorkOrderStatus, string> = {
  待处理: 'status-pending',
  处理中: 'status-processing',
  待确认: 'status-review'
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
    : '工单详情 - 企业工单后台'
}))

async function handleChangeStatus(status: WorkOrderStatus) {
  if (!workOrder.value || !canChangeWorkOrderStatus.value) {
    return
  }

  updatingStatus.value = true

  try {
    await workOrderActions.changeWorkOrderStatus({
      id: workOrder.value.id,
      status
    })

    ElMessage.success('工单状态已更新')
    await notificationActions.fetchNotifications().catch(() => undefined)
    await refresh()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '状态更新失败'))
  } finally {
    updatingStatus.value = false
  }
}

function getStatusClass(status: WorkOrderStatus) {
  return statusClassMap[status]
}

function getSourceClass(value: unknown) {
  return value === 'AI 草稿' ? 'source-ai' : 'source-manual'
}
</script>

<template>
  <section class="detail-page">
    <div class="page-head">
      <div>
        <h1 class="page-title">工单详情</h1>
        <p class="page-desc">
          查看工单信息、AI 建议和人工处理记录。
        </p>
      </div>

      <el-button :icon="ArrowLeft" @click="navigateTo('/work-orders')">
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

    <el-card v-else-if="workOrder" class="detail-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ workOrder.title }}</span>
          <el-tag class="status-tag" :class="getStatusClass(workOrder.status)" effect="plain">
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
          <el-tag class="status-tag" :class="getSourceClass(workOrder.source)" effect="plain">
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
          v-if="nextStatusAction && canChangeWorkOrderStatus"
          type="primary"
          :loading="updatingStatus"
          @click="handleChangeStatus(nextStatusAction.status)"
        >
          {{ nextStatusAction.label }}
        </el-button>
        <el-tag v-else-if="nextStatusAction" class="status-tag source-manual" effect="plain">
          暂无状态流转权限
        </el-tag>
        <el-tag v-else class="status-tag status-success" effect="plain">
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
              effect="plain"
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
.detail-page {
  min-height: calc(100vh - 164px);
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
  color: var(--admin-warning);
  background: var(--admin-warning-soft);
  border-color: #fcd34d;
}

.record-title {
  font-weight: 600;
}

.record-remark {
  margin-top: 6px;
  color: var(--admin-muted);
}
</style>
