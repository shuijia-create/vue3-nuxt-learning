<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import type { WorkOrderFlowAction, WorkOrderStatus } from '~/types/work-order'
import { ElMessage } from 'element-plus'
import { useNotifications } from '~/composables/use-notifications'
import { useWorkOrders } from '~/composables/use-work-orders'
import { useAuthStore } from '~/stores/auth'
import { getApiErrorMessage } from '~/utils/api/errors'
import { fetchApiData } from '~/utils/api/response'

type AssignableUser = {
  id: number
  username: string
  nickname: string
  departmentName?: string
}

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
const currentUserName = computed(() => auth.user?.nickname || auth.user?.username || '')
const flowForm = reactive({
  assigneeUserId: undefined as number | undefined,
  assigneeName: '',
  handledResult: '',
  confirmResult: ''
})
const assignableUsers = ref<AssignableUser[]>([])
const loadingAssignableUsers = ref(false)

const statusClassMap: Record<WorkOrderStatus, string> = {
  待受理: 'status-pending',
  处理中: 'status-processing',
  待确认: 'status-review',
  已关闭: 'status-success'
}

const currentFlowStepIndex = computed(() => {
  const status = workOrder.value?.status

  if (status === '待受理') {
    return 1
  }

  if (status === '处理中') {
    return 2
  }

  if (status === '待确认') {
    return 3
  }

  return 3
})

const flowStepItems = computed(() => {
  const order = workOrder.value

  if (!order) {
    return []
  }

  return [
    {
      label: '员工提交',
      desc: `${order.submitter} 提交工单`,
      time: order.createdAt,
      done: true
    },
    {
      label: '领导受理',
      desc: order.acceptedByName
        ? `${order.acceptedByName} 受理并指派给 ${order.assigneeName || '处理人'}`
        : '等待领导或主管受理并指派处理人',
      time: order.acceptedAt,
      done: Boolean(order.acceptedAt)
    },
    {
      label: '处理反馈',
      desc: order.handledByName
        ? `${order.handledByName} 已提交处理结果`
        : '等待处理人处理并提交反馈',
      time: order.handledAt,
      done: Boolean(order.handledAt)
    },
    {
      label: '确认关闭',
      desc: order.status === '已关闭'
        ? `${order.confirmedByName || '确认人'} 已确认关闭`
        : '等待提交人或领导确认处理结果',
      time: order.closedAt || order.confirmedAt,
      done: order.status === '已关闭'
    }
  ]
})

const flowActionTitle = computed(() => {
  const status = workOrder.value?.status

  if (status === '待受理') {
    return '领导受理并指派处理人'
  }

  if (status === '处理中') {
    return '处理人提交处理说明'
  }

  if (status === '待确认') {
    return '提交人或领导确认结果'
  }

  return '工单已关闭'
})

useHead(() => ({
  title: workOrder.value
    ? `${workOrder.value.title} - 工单详情`
    : '工单详情 - 企业工单后台'
}))

watch(workOrder, (order) => {
  if (!order) {
    return
  }

  flowForm.assigneeUserId = order.assigneeUserId
  flowForm.assigneeName = order.assigneeName || currentUserName.value
  flowForm.handledResult = ''
  flowForm.confirmResult = ''
}, { immediate: true })

watch(() => workOrder.value?.handlerDeptName, async (handlerDeptName) => {
  if (!handlerDeptName || !canChangeWorkOrderStatus.value) {
    assignableUsers.value = []
    return
  }

  loadingAssignableUsers.value = true

  try {
    const res = await fetchApiData<{ list: AssignableUser[] }>('/api/users/assignees', {
      query: {
        departmentName: handlerDeptName
      }
    })

    assignableUsers.value = res.list
  } catch {
    assignableUsers.value = []
  } finally {
    loadingAssignableUsers.value = false
  }
}, { immediate: true })

async function handleFlowAction(action: WorkOrderFlowAction) {
  if (!workOrder.value || !canChangeWorkOrderStatus.value) {
    return
  }

  updatingStatus.value = true

  try {
    await workOrderActions.changeWorkOrderStatus({
      id: workOrder.value.id,
      action,
      assigneeUserId: flowForm.assigneeUserId,
      assigneeName: flowForm.assigneeName,
      handledResult: flowForm.handledResult,
      confirmResult: flowForm.confirmResult
    })

    const successMessageMap: Record<WorkOrderFlowAction, string> = {
      accept: '工单已受理，进入处理中',
      submit_result: '处理结果已提交，等待确认',
      confirm_close: '工单已确认关闭',
      return_to_processing: '工单已退回处理'
    }

    ElMessage.success(successMessageMap[action])
    await notificationActions.fetchNotifications().catch(() => undefined)
    await refresh()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '流程处理失败'))
  } finally {
    updatingStatus.value = false
  }
}

function handleAssigneeChange(value: unknown) {
  const assignee = assignableUsers.value.find(item => item.id === Number(value))

  flowForm.assigneeName = assignee ? assignee.nickname || assignee.username : currentUserName.value
}

function getStatusClass(status: WorkOrderStatus) {
  return statusClassMap[status] ?? 'status-pending'
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
        <el-descriptions-item label="处理部门">
          <el-tag class="status-tag permission-button-tag" effect="plain">
            {{ workOrder.handlerDeptName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交人">
          {{ workOrder.submitter }}
        </el-descriptions-item>
        <el-descriptions-item label="指派处理人">
          {{ workOrder.assigneeName || '待指派' }}
        </el-descriptions-item>
        <el-descriptions-item label="受理记录">
          <span v-if="workOrder.acceptedByName">
            {{ workOrder.acceptedByName }} 于 {{ workOrder.acceptedAt }} 受理
          </span>
          <span v-else>待领导或主管受理</span>
        </el-descriptions-item>
        <el-descriptions-item v-if="workOrder.handledResult" label="处理说明">
          <div class="multiline-text">{{ workOrder.handledResult }}</div>
        </el-descriptions-item>
        <el-descriptions-item v-if="workOrder.confirmResult" label="确认说明">
          <div class="multiline-text">{{ workOrder.confirmResult }}</div>
        </el-descriptions-item>
        <el-descriptions-item v-if="workOrder.closedAt" label="关闭时间">
          {{ workOrder.closedAt }}
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

      <section class="workflow-panel">
        <div class="workflow-title-row">
          <h2 class="section-title">{{ flowActionTitle }}</h2>
          <el-tag class="status-tag" :class="getStatusClass(workOrder.status)" effect="plain">
            {{ workOrder.status }}
          </el-tag>
        </div>

        <div class="workflow-steps">
          <div
            v-for="(item, index) in flowStepItems"
            :key="item.label"
            class="workflow-step"
            :class="{
              'is-done': item.done,
              'is-current': index === currentFlowStepIndex
            }"
          >
            <div class="workflow-dot">{{ index + 1 }}</div>
            <div>
              <div class="workflow-step-title">{{ item.label }}</div>
              <div class="workflow-step-desc">{{ item.desc }}</div>
              <div class="workflow-step-time">{{ item.time || '未完成' }}</div>
            </div>
          </div>
        </div>

        <div v-if="workOrder.status !== '已关闭'" class="workflow-action-box">
          <template v-if="canChangeWorkOrderStatus">
            <template v-if="workOrder.status === '待受理'">
              <el-form label-position="top">
                <el-form-item label="指派处理人">
                  <el-select
                    v-model="flowForm.assigneeUserId"
                    class="workflow-control"
                    clearable
                    filterable
                    :loading="loadingAssignableUsers"
                    placeholder="选择处理人，不选则默认当前登录人"
                    @change="handleAssigneeChange"
                  >
                    <el-option
                      v-for="user in assignableUsers"
                      :key="user.id"
                      :label="`${user.nickname}（${user.username}）`"
                      :value="user.id"
                    />
                  </el-select>
                </el-form-item>
              </el-form>

              <el-button
                type="primary"
                :loading="updatingStatus"
                @click="handleFlowAction('accept')"
              >
                受理并开始处理
              </el-button>
            </template>

            <template v-else-if="workOrder.status === '处理中'">
              <el-form label-position="top">
                <el-form-item label="处理说明">
                  <el-input
                    v-model="flowForm.handledResult"
                    type="textarea"
                    :rows="4"
                    maxlength="500"
                    show-word-limit
                    placeholder="请输入怎么处理，可不填"
                  />
                </el-form-item>
              </el-form>

              <el-button
                type="primary"
                :loading="updatingStatus"
                @click="handleFlowAction('submit_result')"
              >
                提交处理结果
              </el-button>
            </template>

            <template v-else-if="workOrder.status === '待确认'">
              <el-form label-position="top">
                <el-form-item label="确认说明 / 退回原因">
                  <el-input
                    v-model="flowForm.confirmResult"
                    type="textarea"
                    :rows="4"
                    maxlength="500"
                    show-word-limit
                    placeholder="确认或退回都可以补充说明，可不填"
                  />
                </el-form-item>
              </el-form>

              <div class="workflow-action-buttons">
                <el-button
                  type="primary"
                  :loading="updatingStatus"
                  @click="handleFlowAction('confirm_close')"
                >
                  确认关闭
                </el-button>
                <el-button
                  type="warning"
                  plain
                  :loading="updatingStatus"
                  @click="handleFlowAction('return_to_processing')"
                >
                  退回处理
                </el-button>
              </div>
            </template>
          </template>

          <el-alert
            v-else
            title="暂无流程操作权限，只能查看当前工单进度。"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>

        <el-alert
          v-else
          title="工单已关闭，流程结束。"
          type="success"
          :closable="false"
          show-icon
        />
      </section>

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

.section-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
}

.detail-section {
  margin-top: 16px;
}

.multiline-text {
  white-space: pre-wrap;
  line-height: 1.7;
}

.workflow-panel {
  margin-top: 18px;
  padding: 18px;
  background: var(--admin-surface-subtle);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
}

.workflow-title-row {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.workflow-title-row .section-title {
  margin-bottom: 0;
}

.workflow-steps {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.workflow-step {
  display: flex;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
}

.workflow-step.is-current {
  border-color: #bfdbfe;
  box-shadow: 0 0 0 2px var(--admin-primary-soft);
}

.workflow-dot {
  display: inline-flex;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  color: var(--admin-muted);
  background: #f3f4f6;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
}

.workflow-step.is-done .workflow-dot {
  color: var(--admin-success);
  background: var(--admin-success-soft);
}

.workflow-step-title {
  color: var(--admin-text);
  font-weight: 800;
}

.workflow-step-desc,
.workflow-step-time {
  margin-top: 4px;
  color: var(--admin-muted);
  font-size: 13px;
  line-height: 1.5;
}

.workflow-action-box {
  margin-top: 16px;
  padding: 14px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
}

.workflow-action-buttons {
  display: flex;
  gap: 10px;
}

.workflow-control {
  width: 100%;
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

@media (max-width: 980px) {
  .workflow-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .workflow-steps {
    grid-template-columns: 1fr;
  }
}
</style>
