<script setup lang="ts">
import { ArrowRight, ChatDotRound, DataAnalysis, Tickets } from '@element-plus/icons-vue'
import type { BaseTableColumn, BaseTableRow } from '~/types/base-table'
import type { WorkOrderStatus } from '~/types/work-order'
import { useWorkOrders } from '~/composables/use-work-orders'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '工作台 - 企业工单后台'
})

const workOrderActions = useWorkOrders()
const { data } = await useAsyncData('dashboard-work-orders', () => {
  return workOrderActions.listWorkOrders()
})

const workOrders = computed(() => data.value?.list ?? [])
const totalCount = computed(() => workOrders.value.length)
const pendingCount = computed(() => workOrders.value.filter((item) => item.status === '待受理').length)
const processingCount = computed(() => workOrders.value.filter((item) => item.status === '处理中').length)
const reviewCount = computed(() => workOrders.value.filter((item) => item.status === '待确认').length)
const closedCount = computed(() => workOrders.value.filter((item) => item.status === '已关闭').length)
const aiDraftCount = computed(() => workOrders.value.filter((item) => item.source === 'AI 草稿').length)
const recentWorkOrders = computed<BaseTableRow[]>(() => {
  return workOrders.value.slice(0, 6).map((item) => ({
    ...item,
    submitterDeptName: item.submitterDeptName ?? '未配置'
  }))
})

const statusClassMap: Record<WorkOrderStatus, string> = {
  待受理: 'status-pending',
  处理中: 'status-processing',
  待确认: 'status-review',
  已关闭: 'status-success'
}

const metricCards = computed(() => [
  {
    label: '当前工单',
    value: totalCount.value,
    hint: '全部业务单据',
    color: '#2563eb'
  },
  {
    label: '待受理',
    value: pendingCount.value,
    hint: '等待领导受理',
    color: '#d97706'
  },
  {
    label: '处理中',
    value: processingCount.value,
    hint: '现场正在跟进',
    color: '#0f766e'
  },
  {
    label: '待确认',
    value: reviewCount.value,
    hint: '等待业务确认',
    color: '#7c3aed'
  }
])

const todoCards = computed(() => [
  {
    label: '待受理工单',
    value: pendingCount.value,
    desc: '优先完成受理和处理人指派',
    className: 'status-pending'
  },
  {
    label: '待确认工单',
    value: reviewCount.value,
    desc: '核对现场反馈后关闭流程',
    className: 'status-review'
  },
  {
    label: '已关闭工单',
    value: closedCount.value,
    desc: '处理结果已经确认归档',
    className: 'status-success'
  },
  {
    label: 'AI 草稿来源',
    value: aiDraftCount.value,
    desc: '需要人工复核后继续流转',
    className: 'source-ai'
  }
])

const columns: BaseTableColumn[] = [
  {
    label: '工单编号',
    prop: 'code',
    width: 170,
    showOverflowTooltip: true
  },
  {
    label: '标题',
    prop: 'title',
    minWidth: 260,
    showOverflowTooltip: true
  },
  {
    label: '类型',
    prop: 'type',
    width: 120
  },
  {
    label: '处理部门',
    prop: 'handlerDeptName',
    width: 130
  },
  {
    label: '提交人',
    prop: 'submitter',
    width: 110
  },
  {
    label: '提交部门',
    prop: 'submitterDeptName',
    width: 120
  },
  {
    label: '状态',
    prop: 'status',
    width: 120,
    slot: 'status'
  },
  {
    label: '来源',
    prop: 'source',
    width: 110,
    slot: 'source'
  },
  {
    label: '操作',
    width: 90,
    fixed: 'right',
    align: 'center',
    slot: 'actions'
  }
]

function getStatusClass(value: unknown) {
  return statusClassMap[value as WorkOrderStatus] ?? 'status-pending'
}

function getSourceClass(value: unknown) {
  return value === 'AI 草稿' ? 'source-ai' : 'source-manual'
}
</script>

<template>
  <section class="dashboard-page">
    <div class="dashboard-head">
      <div>
        <div class="dashboard-eyebrow">运营概览</div>
        <h1 class="page-title">工作台</h1>
        <p class="page-desc">聚合工单状态、待办风险和最近业务流转。</p>
      </div>

      <el-button :icon="Tickets" type="primary" @click="navigateTo('/work-orders')">
        工单列表
      </el-button>
    </div>

    <div class="metric-grid">
      <el-card
        v-for="item in metricCards"
        :key="item.label"
        class="metric-card dashboard-metric"
        :style="{ '--metric-color': item.color }"
        shadow="never"
      >
        <div class="metric-label">{{ item.label }}</div>
        <div class="metric-value">{{ item.value }}</div>
        <div class="metric-hint">{{ item.hint }}</div>
      </el-card>
    </div>

    <div class="dashboard-main">
      <el-card class="dashboard-table-card table-card" shadow="never">
        <template #header>
          <div class="table-card-header">
            <span>最近工单</span>
            <span class="table-count">展示最近 {{ recentWorkOrders.length }} 条</span>
          </div>
        </template>

        <BaseTable
          :model-value="recentWorkOrders"
          :columns="columns"
          row-key="id"
          empty-text="暂无工单"
        >
          <template #status="{ value }">
            <el-tag class="status-tag" :class="getStatusClass(value)" effect="plain">
              {{ value }}
            </el-tag>
          </template>

          <template #source="{ value }">
            <el-tag class="status-tag" :class="getSourceClass(value)" effect="plain">
              {{ value }}
            </el-tag>
          </template>

          <template #actions="{ row }">
            <el-button
              link
              type="primary"
              @click="navigateTo(`/work-orders/${String(row.id)}`)"
            >
              查看
            </el-button>
          </template>
        </BaseTable>
      </el-card>

      <div class="dashboard-side">
        <el-card class="side-card" shadow="never">
          <template #header>
            <div class="side-card-title">
              <el-icon><DataAnalysis /></el-icon>
              <span>待办状态</span>
            </div>
          </template>

          <div class="todo-list">
            <div v-for="item in todoCards" :key="item.label" class="todo-item">
              <div>
                <div class="todo-label">{{ item.label }}</div>
                <div class="todo-desc">{{ item.desc }}</div>
              </div>
              <el-tag class="status-tag" :class="item.className" effect="plain">
                {{ item.value }}
              </el-tag>
            </div>
          </div>
        </el-card>

        <el-card class="side-card ai-card" shadow="never">
          <template #header>
            <div class="side-card-title">
              <el-icon><ChatDotRound /></el-icon>
              <span>AI 工单草稿</span>
            </div>
          </template>

          <div class="ai-card-content">
            <div>
              <div class="ai-card-title">现场问题结构化</div>
              <div class="ai-card-desc">把员工描述整理为标题、类型、优先级和处理建议。</div>
            </div>
            <el-button
              :icon="ArrowRight"
              type="primary"
              plain
              @click="navigateTo('/ai/work-order-draft')"
            >
              进入
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  min-height: calc(100vh - 164px);
  flex-direction: column;
}

.dashboard-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.dashboard-eyebrow {
  margin-bottom: 8px;
  color: var(--admin-primary);
  font-size: 13px;
  font-weight: 700;
}

.metric-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 16px;
}

.dashboard-metric :deep(.el-card__body) {
  padding: 18px 18px 16px;
}

.metric-label {
  color: var(--admin-muted);
  font-size: 13px;
  font-weight: 700;
}

.metric-value {
  margin-top: 10px;
  color: var(--admin-text);
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
}

.metric-hint {
  margin-top: 10px;
  color: var(--admin-text-weak);
  font-size: 13px;
}

.dashboard-main {
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) 340px;
}

.dashboard-table-card {
  min-height: 460px;
}

.dashboard-side {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 16px;
}

.side-card {
  flex: 0 0 auto;
}

.side-card-title {
  display: flex;
  gap: 8px;
  align-items: center;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--admin-surface-subtle);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
}

.todo-label {
  color: var(--admin-text);
  font-weight: 700;
}

.todo-desc {
  margin-top: 4px;
  color: var(--admin-muted);
  font-size: 13px;
  line-height: 1.5;
}

.ai-card {
  border-color: #a7f3d0;
}

.ai-card-content {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.ai-card-title {
  color: var(--admin-text);
  font-weight: 800;
}

.ai-card-desc {
  margin-top: 6px;
  color: var(--admin-muted);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 1180px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-main {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-head {
    display: block;
  }

  .dashboard-head .el-button {
    margin-top: 12px;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
