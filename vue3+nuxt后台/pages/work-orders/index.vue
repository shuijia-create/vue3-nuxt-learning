<script setup lang="ts">
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import type { BaseTableColumn, BaseTableRow } from '~/types/base-table'
import type { WorkOrderHandlerDepartment, WorkOrderStatus, WorkOrderType } from '~/types/work-order'
import { ElMessage } from 'element-plus'
import { useNotifications } from '~/composables/use-notifications'
import { useWorkOrders } from '~/composables/use-work-orders'
import { useAuthStore } from '~/stores/auth'
import { getApiErrorMessage } from '~/utils/api/errors'
import {
  getDefaultWorkOrderHandlerDept,
  workOrderHandlerDepartmentOptions,
  workOrderStatusOptions,
  workOrderTypeOptions
} from '~/utils/work-order-config'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '工单列表 - 企业工单后台'
})

type CreateWorkOrderForm = {
  title: string
  type: WorkOrderType | ''
  submitter: string
  description: string
}

type WorkOrderFilterForm = {
  type: WorkOrderType | ''
  status: WorkOrderStatus | ''
  handlerDeptName: WorkOrderHandlerDepartment | ''
}

const filterForm = reactive<WorkOrderFilterForm>({
  type: '',
  status: '',
  handlerDeptName: ''
})
const notificationActions = useNotifications()
const workOrderActions = useWorkOrders()
const auth = useAuthStore()

const requestQuery = ref({
  type: undefined as WorkOrderType | undefined,
  status: undefined as WorkOrderStatus | undefined,
  handlerDeptName: undefined as WorkOrderHandlerDepartment | undefined
})
const canSearchWorkOrders = computed(() => auth.hasButtonPermission('work_orders.search'))
const canResetWorkOrders = computed(() => auth.hasButtonPermission('work_orders.reset'))
const canCreateWorkOrder = computed(() => auth.hasButtonPermission('work_orders.create'))
const canViewWorkOrderDetail = computed(() => auth.hasButtonPermission('work_orders.view_detail'))

const { data, pending, error, refresh } = await useAsyncData('work-orders', () => {
  return workOrderActions.listWorkOrders(requestQuery.value)
})

const createDialogVisible = ref(false)
const createFormRef = ref()
const workOrderCurrentPage = ref(1)
const workOrderPageSize = ref(10)
const createForm = reactive<CreateWorkOrderForm>({
  title: '',
  type: '',
  submitter: '',
  description: ''
})

const tableData = computed<BaseTableRow[]>(() => {
  return (data.value?.list ?? []).map((item) => ({ ...item }))
})
const pagedTableData = computed(() => {
  const start = (workOrderCurrentPage.value - 1) * workOrderPageSize.value

  return tableData.value.slice(start, start + workOrderPageSize.value)
})

const createHandlerDeptName = computed(() => {
  return createForm.type ? getDefaultWorkOrderHandlerDept(createForm.type as WorkOrderType) : ''
})

const statusClassMap: Record<WorkOrderStatus, string> = {
  待受理: 'status-pending',
  处理中: 'status-processing',
  待确认: 'status-review',
  已关闭: 'status-success'
}

const createRules = {
  title: [
    { required: true, message: '请输入工单标题', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择工单类型', trigger: 'change' }
  ],
  submitter: [
    { required: true, message: '请输入提交人', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入问题描述', trigger: 'blur' }
  ]
}

const columns: BaseTableColumn[] = [
  {
    label: '工单编号',
    prop: 'code',
    width: 180,
    showOverflowTooltip: true
  },
  {
    label: '工单标题',
    prop: 'title',
    minWidth: 280,
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
    width: 130,
    slot: 'handlerDept'
  },
  {
    label: '状态',
    prop: 'status',
    width: 120,
    slot: 'status'
  },
  {
    label: '提交人',
    prop: 'submitter',
    width: 110
  },
  {
    label: '来源',
    prop: 'source',
    width: 110,
    slot: 'source'
  },
  {
    label: '创建时间',
    prop: 'createdAt',
    width: 180
  },
  {
    label: '操作',
    width: 100,
    fixed: 'right',
    slot: 'actions'
  }
]

function getStatusClass(value: unknown) {
  const status = value as WorkOrderStatus

  return statusClassMap[status] ?? 'status-pending'
}

function getSourceClass(value: unknown) {
  return value === 'AI 草稿' ? 'source-ai' : 'source-manual'
}

async function handleSearch() {
  if (!canSearchWorkOrders.value) {
    return
  }

  requestQuery.value = {
    type: filterForm.type || undefined,
    status: filterForm.status || undefined,
    handlerDeptName: filterForm.handlerDeptName || undefined
  }
  workOrderCurrentPage.value = 1
  await refresh()
}

async function resetSearch() {
  if (!canResetWorkOrders.value) {
    return
  }

  filterForm.type = ''
  filterForm.status = ''
  filterForm.handlerDeptName = ''
  requestQuery.value = {
    type: undefined,
    status: undefined,
    handlerDeptName: undefined
  }
  workOrderCurrentPage.value = 1
  await refresh()
}

function resetCreateForm() {
  createForm.title = ''
  createForm.type = ''
  createForm.submitter = ''
  createForm.description = ''
  createFormRef.value?.clearValidate()
}

function openCreateDialog() {
  if (!canCreateWorkOrder.value) {
    return
  }

  createDialogVisible.value = true
  resetCreateForm()
}

function closeCreateDialog() {
  createDialogVisible.value = false
}

function handleWorkOrderPageSizeChange(value: number) {
  workOrderPageSize.value = value
  workOrderCurrentPage.value = 1
}

async function handleCreateSubmit() {
  if (!canCreateWorkOrder.value) {
    return
  }

  await createFormRef.value?.validate()

  try {
    await workOrderActions.createWorkOrder({
      title: createForm.title,
      type: createForm.type as WorkOrderType,
      submitter: createForm.submitter,
      description: createForm.description
    })

    ElMessage.success('工单创建成功')
    closeCreateDialog()
    await notificationActions.fetchNotifications().catch(() => undefined)
    await refresh()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '操作失败'))
  }
}
</script>

<template>
  <section class="data-page">
    <div class="page-head">
      <div>
        <h1 class="page-title">工单列表</h1>
        <p class="page-desc">
          按类型、状态筛选工单，跟进现场处理和确认进度。
        </p>
      </div>

      <el-button v-if="canCreateWorkOrder" :icon="Plus" type="primary" @click="openCreateDialog">
        新建工单
      </el-button>
    </div>

    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="工单类型">
          <el-select
            v-model="filterForm.type"
            clearable
            placeholder="全部类型"
            class="filter-control"
          >
            <el-option
              v-for="item in workOrderTypeOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="工单状态">
          <el-select
            v-model="filterForm.status"
            clearable
            placeholder="全部状态"
            class="filter-control"
          >
            <el-option
              v-for="item in workOrderStatusOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="处理部门">
          <el-select
            v-model="filterForm.handlerDeptName"
            clearable
            placeholder="全部部门"
            class="filter-control"
          >
            <el-option
              v-for="item in workOrderHandlerDepartmentOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button v-if="canSearchWorkOrders" :icon="Search" type="primary" @click="handleSearch">
            查询
          </el-button>
          <el-button v-if="canResetWorkOrders" :icon="Refresh" @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert
      v-if="error"
      class="page-alert"
      title="工单数据加载失败"
      type="error"
      :closable="false"
      show-icon
    />

    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-card-header">
          <span>工单列表</span>
          <span class="table-count">共 {{ tableData.length }} 条工单</span>
        </div>
      </template>

      <BaseTable
        :model-value="pagedTableData"
        :columns="columns"
        :loading="pending"
        :total="tableData.length"
        :current-page="workOrderCurrentPage"
        :page-size="workOrderPageSize"
        pagination
        row-key="id"
        @current-change="workOrderCurrentPage = $event"
        @size-change="handleWorkOrderPageSizeChange"
      >
        <template #status="{ value }">
          <el-tag class="status-tag" :class="getStatusClass(value)" effect="plain">
            {{ value }}
          </el-tag>
        </template>

        <template #handlerDept="{ value }">
          <el-tag class="status-tag permission-button-tag" effect="plain">
            {{ value }}
          </el-tag>
        </template>

        <template #source="{ value }">
          <el-tag
            class="status-tag"
            :class="getSourceClass(value)"
            effect="plain"
          >
            {{ value }}
          </el-tag>
        </template>

        <template #actions="{ row }">
          <el-button
            v-if="canViewWorkOrderDetail"
            link
            type="primary"
            @click="navigateTo(`/work-orders/${String(row.id)}`)"
          >
            查看
          </el-button>
        </template>
      </BaseTable>
    </el-card>

    <el-dialog
      v-model="createDialogVisible"
      title="新建工单"
      width="560px"
      @closed="resetCreateForm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-position="top"
      >
        <el-form-item label="工单标题" prop="title">
          <el-input
            v-model="createForm.title"
            placeholder="请输入工单标题"
          />
        </el-form-item>

        <el-form-item label="工单类型" prop="type">
          <el-select
            v-model="createForm.type"
            placeholder="请选择工单类型"
            class="form-control"
          >
            <el-option
              v-for="item in workOrderTypeOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-alert
          v-if="createHandlerDeptName"
          class="handler-dept-alert"
          :title="`该类型会自动流向：${createHandlerDeptName}`"
          type="info"
          :closable="false"
          show-icon
        />

        <el-form-item label="提交人" prop="submitter">
          <el-input
            v-model="createForm.submitter"
            placeholder="请输入提交人"
          />
        </el-form-item>

        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="4"
            placeholder="请描述问题现象、影响范围和现场处理情况"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeCreateDialog">
          取消
        </el-button>
        <el-button v-if="canCreateWorkOrder" type="primary" @click="handleCreateSubmit">
          提交
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.filter-card :deep(.el-form-item) {
  margin-bottom: 0;
}

.form-control {
  width: 100%;
}

.handler-dept-alert {
  margin-bottom: 18px;
}
</style>
