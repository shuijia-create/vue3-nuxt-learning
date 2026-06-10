<script setup lang="ts">
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { BaseTableColumn, BaseTableRow } from '~/types/base-table'
import type { PermissionTreeItem, PermissionType, PermissionsResponse } from '~/types/permission'
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/use-auth'
import { getApiErrorMessage } from '~/utils/api/errors'
import { fetchApiData } from '~/utils/api/response'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '权限管理 - Nuxt 后台学习项目'
})

type PermissionQueryForm = {
  name: string
  code: string
  type: PermissionType | ''
}

const auth = useAuthStore()
const authActions = useAuth()

await callOnce('current-user', () => authActions.fetchCurrentUser())

const canCreatePermission = computed(() => auth.hasButtonPermission('permissions.create'))
const requestFetch = import.meta.server ? useRequestFetch() : $fetch

const queryForm = reactive<PermissionQueryForm>({
  name: '',
  code: '',
  type: ''
})
const queryParams = reactive<PermissionQueryForm>({
  name: '',
  code: '',
  type: ''
})
const createFormRef = ref()
const createDialogVisible = ref(false)
const creating = ref(false)
const permissionCurrentPage = ref(1)
const permissionPageSize = ref(10)
const createForm = reactive({
  name: '',
  code: '',
  type: 1 as PermissionType,
  path: '',
  parentId: undefined as number | undefined
})

const createRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { max: 50, message: '权限名称不能超过 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' },
    {
      pattern: /^[a-z0-9_.-]{3,80}$/,
      message: '只能包含小写字母、数字、点、横线和下划线',
      trigger: 'blur'
    }
  ],
  path: [
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (createForm.type === 1 && !value) {
          callback(new Error('页面权限必须填写页面路径'))
          return
        }

        callback()
      },
      trigger: 'blur'
    }
  ],
  parentId: [
    {
      validator: (_rule: unknown, value: number | undefined, callback: (error?: Error) => void) => {
        if (createForm.type === 2 && !value) {
          callback(new Error('按钮权限必须选择所属页面'))
          return
        }

        callback()
      },
      trigger: 'change'
    }
  ]
}

const permissionColumns: BaseTableColumn[] = [
  {
    label: '权限',
    prop: 'name',
    minWidth: 360,
    slot: 'permissionInfo'
  },
  {
    label: '类型',
    prop: 'type',
    width: 120,
    slot: 'permissionType'
  }
]

const {
  data,
  pending,
  error,
  refresh
} = await useAsyncData('permissions', async () => {
  return fetchApiData<PermissionsResponse>('/api/permissions', undefined, requestFetch)
})

const permissionTree = computed(() => data.value?.list ?? [])
const filteredPermissionTree = computed(() => {
  return filterPermissionTree(permissionTree.value)
})
const permissionTableData = computed<BaseTableRow[]>(() => {
  return filteredPermissionTree.value.map(mapPermissionToTableRow)
})
const pagedPermissionTableData = computed(() => {
  const start = (permissionCurrentPage.value - 1) * permissionPageSize.value

  return permissionTableData.value.slice(start, start + permissionPageSize.value)
})
const pagePermissionOptions = computed(() => {
  return permissionTree.value
    .filter(item => item.type === 1)
    .map(item => ({
      label: item.name,
      value: item.id
    }))
})

watch(() => createForm.type, (type) => {
  if (type === 1) {
    createForm.parentId = undefined
  } else {
    createForm.path = ''
  }
})

function mapPermissionToTableRow(permission: PermissionTreeItem): BaseTableRow {
  return {
    id: permission.id,
    name: permission.name,
    code: permission.code,
    type: permission.type,
    typeLabel: permission.typeLabel,
    path: permission.path,
    parentId: permission.parentId,
    sort: permission.sort,
    roles: permission.roles,
    children: permission.children?.map(mapPermissionToTableRow)
  }
}

function filterPermissionTree(rows: PermissionTreeItem[]) {
  const name = queryParams.name.trim()
  const code = queryParams.code.trim()
  const type = queryParams.type

  return rows.reduce<PermissionTreeItem[]>((list, row) => {
    const children = filterPermissionTree(row.children ?? [])
    const matchedName = name ? row.name.includes(name) : true
    const matchedCode = code ? row.code.includes(code) : true
    const matchedType = type ? row.type === type : true
    const matchedSelf = matchedName && matchedCode && matchedType

    if (matchedSelf || children.length > 0) {
      list.push({
        ...row,
        children
      })
    }

    return list
  }, [])
}

function getPermissionTypeTagType(row: BaseTableRow) {
  return Number(row.type) === 1 ? 'primary' : 'success'
}

function getPermissionMeta(row: BaseTableRow) {
  return [row.code, row.path].filter(Boolean).join(' / ')
}

function handleSearch() {
  queryParams.name = queryForm.name.trim()
  queryParams.code = queryForm.code.trim()
  queryParams.type = queryForm.type
  permissionCurrentPage.value = 1
}

function resetSearch() {
  queryForm.name = ''
  queryForm.code = ''
  queryForm.type = ''
  queryParams.name = ''
  queryParams.code = ''
  queryParams.type = ''
  permissionCurrentPage.value = 1
}

function resetCreateForm() {
  Object.assign(createForm, {
    name: '',
    code: '',
    type: 1,
    path: '',
    parentId: undefined
  })
  createFormRef.value?.clearValidate()
}

function openCreateDialog() {
  if (!canCreatePermission.value) {
    return
  }

  createDialogVisible.value = true
  resetCreateForm()
}

function closeCreateDialog() {
  createDialogVisible.value = false
}

function handlePermissionPageSizeChange(value: number) {
  permissionPageSize.value = value
  permissionCurrentPage.value = 1
}

async function handleCreatePermission() {
  if (!canCreatePermission.value) {
    return
  }

  await createFormRef.value?.validate()

  creating.value = true

  try {
    data.value = await fetchApiData<PermissionsResponse>('/api/permissions', {
      method: 'POST',
      body: {
        name: createForm.name,
        code: createForm.code,
        type: createForm.type,
        path: createForm.type === 1 ? createForm.path : undefined,
        parentId: createForm.type === 2 ? createForm.parentId : undefined
      }
    })

    ElMessage.success('权限创建成功')
    closeCreateDialog()
    await refresh()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '操作失败'))
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <section class="management-page">
    <h1 class="page-title">
      权限管理
    </h1>

    <el-card class="query-card" shadow="never">
        <el-form :model="queryForm" inline>
          <el-form-item label="权限名称">
            <el-input
              v-model="queryForm.name"
              class="query-control"
              clearable
              placeholder="输入权限名称"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="权限编码">
            <el-input
              v-model="queryForm.code"
              class="query-control"
              clearable
              placeholder="输入权限编码"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="权限类型">
            <el-select
              v-model="queryForm.type"
              class="query-control"
              clearable
              placeholder="全部类型"
              style="width: 180px;"
            >
              <el-option label="页面权限" :value="1" />
              <el-option label="按钮权限" :value="2" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button :icon="Search" type="primary" @click="handleSearch">
              查询
            </el-button>
            <el-button :icon="Refresh" @click="resetSearch">
              重置
            </el-button>
            <el-button v-if="canCreatePermission" :icon="Plus" type="primary" @click="openCreateDialog">
              创建权限
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-alert
        v-if="error"
        class="page-alert"
        :title="getApiErrorMessage(error, '权限列表加载失败')"
        type="error"
        :closable="false"
        show-icon
      />

      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="table-card-header">
            <span>页面权限 / 按钮权限</span>
            <span class="table-count">共 {{ filteredPermissionTree.length }} 组权限</span>
          </div>
        </template>

        <BaseTable
          :model-value="pagedPermissionTableData"
          :columns="permissionColumns"
          :loading="pending"
          :total="filteredPermissionTree.length"
          :current-page="permissionCurrentPage"
          :page-size="permissionPageSize"
          pagination
          row-key="id"
          default-expand-all
          :tree-props="{ children: 'children' }"
          @current-change="permissionCurrentPage = $event"
          @size-change="handlePermissionPageSizeChange"
        >
          <template #permissionInfo="{ row }">
            <div class="permission-info">
              <span class="permission-name">{{ row.name }}</span>
              <span class="permission-meta">{{ getPermissionMeta(row) }}</span>
            </div>
          </template>

          <template #permissionType="{ row }">
            <el-tag :type="getPermissionTypeTagType(row)">
              {{ row.typeLabel }}
            </el-tag>
          </template>
        </BaseTable>
      </el-card>

      <el-dialog
        v-model="createDialogVisible"
        title="创建权限"
        width="560px"
        @closed="resetCreateForm"
      >
        <el-form
          ref="createFormRef"
          :model="createForm"
          :rules="createRules"
          label-position="top"
        >
          <el-form-item label="权限类型" prop="type">
            <el-radio-group v-model="createForm.type">
              <el-radio-button :label="1">
                页面权限
              </el-radio-button>
              <el-radio-button :label="2">
                按钮权限
              </el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="权限名称" prop="name">
            <el-input v-model="createForm.name" placeholder="例如 工单列表" />
          </el-form-item>

          <el-form-item label="权限编码" prop="code">
            <el-input v-model="createForm.code" placeholder="例如 work_orders.page" />
          </el-form-item>

          <el-form-item v-if="createForm.type === 1" label="页面路径" prop="path">
            <el-input v-model="createForm.path" placeholder="例如 /work-orders" />
          </el-form-item>

          <el-form-item v-else label="所属页面权限" prop="parentId">
            <el-select
              v-model="createForm.parentId"
              class="full-width"
              placeholder="请选择页面权限"
              style="width: 100%;"
            >
              <el-option
                v-for="item in pagePermissionOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="closeCreateDialog">
            取消
          </el-button>
          <el-button
            v-if="canCreatePermission"
            type="primary"
            :loading="creating"
            @click="handleCreatePermission"
          >
            提交
          </el-button>
        </template>
      </el-dialog>
  </section>
</template>

<style scoped>
.management-page {
  color: var(--admin-text);
}

.query-card,
.page-alert {
  margin-bottom: 16px;
}

.query-card {
  border-color: #e5e7eb;
  background: #fbfcfe;
}

.query-card :deep(.el-card__body) {
  padding: 16px 20px 4px;
}

.query-card :deep(.el-form-item) {
  margin-right: 18px;
  margin-bottom: 12px;
}

.query-control {
  width: 180px;
  min-width: 180px;
}

.query-card :deep(.el-input.query-control),
.query-card :deep(.el-select.query-control) {
  width: 180px;
  min-width: 180px;
}

.query-card :deep(.el-form-item:last-child) {
  margin-right: 0;
}

.table-card {
  border-color: #e5e7eb;
}

.table-card :deep(.el-card__header) {
  padding: 14px 20px;
}

.table-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--admin-text);
  font-weight: 600;
}

.table-count {
  color: var(--admin-muted);
  font-size: 13px;
  font-weight: 400;
}

.full-width {
  width: 100%;
}

.permission-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.permission-name {
  color: var(--admin-text);
  line-height: 1.4;
}

.permission-meta {
  overflow: hidden;
  color: var(--admin-muted);
  font-size: 12px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .query-card :deep(.el-form) {
    display: block;
  }

  .query-card :deep(.el-form-item) {
    display: block;
    margin-right: 0;
    margin-bottom: 12px;
  }

  .query-control {
    width: 100%;
  }
}
</style>
