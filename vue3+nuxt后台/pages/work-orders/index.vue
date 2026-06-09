<script setup lang="ts">
import type { BaseTableColumn, BaseTableRow } from '~/types/base-table'
import type { WorkOrderStatus, WorkOrderType } from '~/types/work-order'
import { ElMessage } from 'element-plus'
import { useNotifications } from '~/composables/use-notifications'
import { useWorkOrders } from '~/composables/use-work-orders'
import { getApiErrorMessage } from '~/utils/api/errors'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '工单列表 - Nuxt 后台学习项目'
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
}

const filterForm = reactive<WorkOrderFilterForm>({
  type: '',
  status: ''
})
const notificationActions = useNotifications()
const workOrderActions = useWorkOrders()

const requestQuery = ref({
  type: undefined as WorkOrderType | undefined,
  status: undefined as WorkOrderStatus | undefined
})

const { data, pending, error, refresh } = await useAsyncData('work-orders', () => {
  return workOrderActions.listWorkOrders(requestQuery.value)
})

const createDialogVisible = ref(false)
const createFormRef = ref()
const createForm = reactive<CreateWorkOrderForm>({
  title: '',
  type: '',
  submitter: '',
  description: ''
})

const tableData = computed<BaseTableRow[]>(() => {
  return (data.value?.list ?? []).map((item) => ({ ...item }))
})

const workOrderTypeOptions: WorkOrderType[] = ['设备故障', 'IT 问题', '质量异常']
const workOrderStatusOptions: WorkOrderStatus[] = ['待处理', '处理中', '待确认']

const statusTypeMap: Record<WorkOrderStatus, 'warning' | 'primary' | 'danger'> = {
  待处理: 'warning',
  处理中: 'primary',
  待确认: 'danger'
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

function getStatusTagType(value: unknown) {
  const status = value as WorkOrderStatus

  return statusTypeMap[status]
}

async function handleSearch() {
  requestQuery.value = {
    type: filterForm.type || undefined,
    status: filterForm.status || undefined
  }
  await refresh()
}

async function resetSearch() {
  filterForm.type = ''
  filterForm.status = ''
  requestQuery.value = {
    type: undefined,
    status: undefined
  }
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
  createDialogVisible.value = true
  resetCreateForm()
}

function closeCreateDialog() {
  createDialogVisible.value = false
}

async function handleCreateSubmit() {
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
  <section>
    <div class="page-head">
      <div>
        <h1 class="page-title">工单列表</h1>
        <p class="page-desc">
          页面只处理筛选、弹窗和表格渲染，请求流程统一交给 useWorkOrders。
        </p>
      </div>

      <el-button type="primary" @click="openCreateDialog">
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

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            查询
          </el-button>
          <el-button @click="resetSearch">
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

    <el-card shadow="never">
      <BaseTable
        :model-value="tableData"
        :columns="columns"
        :loading="pending"
        row-key="id"
      >
        <template #status="{ value }">
          <el-tag :type="getStatusTagType(value)" effect="light">
            {{ value }}
          </el-tag>
        </template>

        <template #source="{ value }">
          <el-tag
            :type="value === 'AI 草稿' ? 'success' : 'info'"
            effect="light"
          >
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
        <el-button type="primary" @click="handleCreateSubmit">
          提交
        </el-button>
      </template>
    </el-dialog>
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

.page-alert {
  margin-bottom: 16px;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-card :deep(.el-form-item) {
  margin-bottom: 0;
}

.filter-control {
  width: 160px;
}

.form-control {
  width: 100%;
}
</style>
