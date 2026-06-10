<script setup lang="ts">
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { BaseTableColumn, BaseTableRow } from '~/types/base-table'
import type { PermissionTreeItem, PermissionsResponse } from '~/types/permission'
import type { RoleListItem } from '~/types/role'
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/use-auth'
import { getApiErrorMessage } from '~/utils/api/errors'
import { fetchApiData } from '~/utils/api/response'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '角色管理 - Nuxt 后台学习项目'
})

type RoleQueryForm = {
  name: string
  code: string
}

const auth = useAuthStore()
const authActions = useAuth()

await callOnce('current-user', () => authActions.fetchCurrentUser())

const canCreateRole = computed(() => auth.hasButtonPermission('roles.create'))
const canSaveRolePermissions = computed(() => auth.hasButtonPermission('roles.save_permissions'))
const requestFetch = import.meta.server ? useRequestFetch() : $fetch

const queryForm = reactive<RoleQueryForm>({
  name: '',
  code: ''
})
const queryParams = reactive<RoleQueryForm>({
  name: '',
  code: ''
})
const createFormRef = ref()
const createDialogVisible = ref(false)
const permissionDrawerVisible = ref(false)
const creating = ref(false)
const saving = ref(false)
const roleCurrentPage = ref(1)
const rolePageSize = ref(10)
const selectedRoleCode = ref('')
const selectedPermissionIds = ref<number[]>([])
const createForm = reactive({
  name: '',
  code: '',
  description: ''
})

const createRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 50, message: '角色名称不能超过 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    {
      pattern: /^[a-z][a-z0-9_]{2,29}$/,
      message: '以小写字母开头，只能包含小写字母、数字、下划线',
      trigger: 'blur'
    }
  ]
}

const roleColumns: BaseTableColumn[] = [
  {
    label: '角色名称',
    prop: 'name',
    minWidth: 140,
    showOverflowTooltip: true
  },
  {
    label: '角色编码',
    prop: 'code',
    minWidth: 160,
    showOverflowTooltip: true
  },
  {
    label: '角色说明',
    prop: 'description',
    minWidth: 220,
    showOverflowTooltip: true
  },
  {
    label: '状态',
    prop: 'status',
    width: 100,
    align: 'center',
    slot: 'status'
  },
  {
    label: '创建时间',
    prop: 'createdAt',
    width: 180
  },
  {
    label: '操作',
    width: 120,
    fixed: 'right',
    align: 'center',
    slot: 'actions'
  }
]

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
    width: 110,
    slot: 'permissionType'
  },
  {
    label: '是否拥有',
    width: 110,
    align: 'center',
    slot: 'permissionChecked'
  }
]

const {
  data: rolesData,
  pending: rolesPending,
  error: rolesError,
  refresh: refreshRoles
} = await useAsyncData('roles', async () => {
  return fetchApiData<{ list: RoleListItem[] }>('/api/roles', undefined, requestFetch)
})

const {
  data: permissionsData,
  pending: permissionsPending,
  error: permissionsError,
  refresh: refreshPermissions
} = await useAsyncData('role-permissions', async () => {
  return fetchApiData<PermissionsResponse>('/api/permissions', undefined, requestFetch)
})

const roles = computed(() => rolesData.value?.list ?? [])
const filteredRoles = computed(() => {
  const name = queryParams.name.trim()
  const code = queryParams.code.trim()

  return roles.value.filter((role) => {
    const matchedName = name ? role.name.includes(name) : true
    const matchedCode = code ? role.code.includes(code) : true

    return matchedName && matchedCode
  })
})
const roleTableData = computed<BaseTableRow[]>(() => {
  return filteredRoles.value.map(role => ({ ...role }))
})
const pagedRoleTableData = computed(() => {
  const start = (roleCurrentPage.value - 1) * rolePageSize.value

  return roleTableData.value.slice(start, start + rolePageSize.value)
})
const permissionTree = computed(() => permissionsData.value?.list ?? [])
const permissionTableData = computed<BaseTableRow[]>(() => {
  return permissionTree.value.map(mapPermissionToTableRow)
})
const selectedRole = computed(() => {
  return roles.value.find(role => role.code === selectedRoleCode.value) ?? null
})
const selectedPermissionIdSet = computed(() => new Set(selectedPermissionIds.value))
const allPermissionIds = computed(() => collectPermissionIds(permissionTree.value))
const selectedPermissionCount = computed(() => selectedPermissionIds.value.length)
const isBuiltInSuperAdmin = computed(() => selectedRoleCode.value === 'super_admin')

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

function collectDescendantIds(row: PermissionTreeItem) {
  const ids: number[] = []

  for (const child of row.children ?? []) {
    ids.push(child.id, ...collectDescendantIds(child))
  }

  return ids
}

function collectPermissionIds(rows: PermissionTreeItem[]) {
  const ids: number[] = []

  for (const row of rows) {
    ids.push(row.id)

    if (row.children?.length) {
      ids.push(...collectPermissionIds(row.children))
    }
  }

  return ids
}

function getRoleStatusLabel(value: unknown) {
  return Number(value) === 1 ? '启用' : '停用'
}

function getRoleStatusTagType(value: unknown) {
  return Number(value) === 1 ? 'success' : 'info'
}

function getPermissionTypeTagType(row: BaseTableRow) {
  return Number(row.type) === 1 ? 'primary' : 'success'
}

function isPermissionChecked(row: BaseTableRow) {
  return selectedPermissionIdSet.value.has(Number(row.id))
}

function getPermissionMeta(row: BaseTableRow) {
  return [row.code, row.path].filter(Boolean).join(' / ')
}

function handleSearch() {
  queryParams.name = queryForm.name.trim()
  queryParams.code = queryForm.code.trim()
  roleCurrentPage.value = 1
}

function resetSearch() {
  queryForm.name = ''
  queryForm.code = ''
  queryParams.name = ''
  queryParams.code = ''
  roleCurrentPage.value = 1
}

function resetCreateForm() {
  Object.assign(createForm, {
    name: '',
    code: '',
    description: ''
  })
  createFormRef.value?.clearValidate()
}

function openCreateDialog() {
  if (!canCreateRole.value) {
    return
  }

  createDialogVisible.value = true
  resetCreateForm()
}

function closeCreateDialog() {
  createDialogVisible.value = false
}

function handleRolePageSizeChange(value: number) {
  rolePageSize.value = value
  roleCurrentPage.value = 1
}

function openPermissionDrawer(role: RoleListItem) {
  if (!canSaveRolePermissions.value) {
    return
  }

  selectedRoleCode.value = role.code
  selectedPermissionIds.value = [
    ...(permissionsData.value?.rolePermissionIds?.[role.code] ?? [])
  ]
  permissionDrawerVisible.value = true
}

function openPermissionDrawerByRow(row: BaseTableRow) {
  const role = roles.value.find(item => item.code === String(row.code))

  if (!role) {
    ElMessage.error('角色不存在')
    return
  }

  openPermissionDrawer(role)
}

function handlePermissionChange(row: PermissionTreeItem, checked: boolean) {
  if (!canSaveRolePermissions.value) {
    return
  }

  const ids = new Set(selectedPermissionIds.value)

  if (checked) {
    ids.add(row.id)

    if (row.parentId) {
      ids.add(row.parentId)
    }
  } else {
    ids.delete(row.id)

    for (const childId of collectDescendantIds(row)) {
      ids.delete(childId)
    }
  }

  selectedPermissionIds.value = Array.from(ids)
}

function handlePermissionCheckboxChange(row: BaseTableRow, checked: unknown) {
  handlePermissionChange(row as unknown as PermissionTreeItem, Boolean(checked))
}

function selectAllPermissions() {
  if (isBuiltInSuperAdmin.value || !canSaveRolePermissions.value) {
    return
  }

  selectedPermissionIds.value = [...allPermissionIds.value]
}

function clearAllPermissions() {
  if (isBuiltInSuperAdmin.value || !canSaveRolePermissions.value) {
    return
  }

  selectedPermissionIds.value = []
}

async function handleCreateRole() {
  if (!canCreateRole.value) {
    return
  }

  await createFormRef.value?.validate()

  creating.value = true

  try {
    await fetchApiData('/api/roles', {
      method: 'POST',
      body: createForm
    })

    ElMessage.success('角色创建成功')
    closeCreateDialog()
    await refreshRoles()
    await refreshPermissions()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '操作失败'))
  } finally {
    creating.value = false
  }
}

async function handleSaveRolePermissions() {
  if (!canSaveRolePermissions.value) {
    return
  }

  if (!selectedRoleCode.value) {
    return
  }

  if (isBuiltInSuperAdmin.value) {
    ElMessage.info('超级管理员默认拥有全部权限')
    return
  }

  saving.value = true

  try {
    permissionsData.value = await fetchApiData<PermissionsResponse>('/api/roles/permissions', {
      method: 'POST',
      body: {
        role: selectedRoleCode.value,
        permissionIds: selectedPermissionIds.value
      }
    })

    ElMessage.success('角色权限已保存')
    permissionDrawerVisible.value = false
    await refreshPermissions()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '操作失败'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="management-page">
    <h1 class="page-title">
      角色管理
    </h1>

    <el-card class="query-card" shadow="never">
        <el-form :model="queryForm" inline>
          <el-form-item label="角色名称">
            <el-input
              v-model="queryForm.name"
              class="query-control"
              clearable
              placeholder="输入角色名称"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="角色编码">
            <el-input
              v-model="queryForm.code"
              class="query-control"
              clearable
              placeholder="输入角色编码"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item>
            <el-button :icon="Search" type="primary" @click="handleSearch">
              查询
            </el-button>
            <el-button :icon="Refresh" @click="resetSearch">
              重置
            </el-button>
            <el-button v-if="canCreateRole" :icon="Plus" type="primary" @click="openCreateDialog">
              创建角色
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-alert
        v-if="rolesError"
        class="page-alert"
        :title="getApiErrorMessage(rolesError, '角色列表加载失败')"
        type="error"
        :closable="false"
        show-icon
      />

      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="table-card-header">
            <span>角色列表</span>
            <span class="table-count">共 {{ filteredRoles.length }} 个角色</span>
          </div>
        </template>

        <BaseTable
          :model-value="pagedRoleTableData"
          :columns="roleColumns"
          :loading="rolesPending"
          :total="filteredRoles.length"
          :current-page="roleCurrentPage"
          :page-size="rolePageSize"
          pagination
          row-key="id"
          @current-change="roleCurrentPage = $event"
          @size-change="handleRolePageSizeChange"
        >
          <template #status="{ value }">
            <el-tag :type="getRoleStatusTagType(value)">
              {{ getRoleStatusLabel(value) }}
            </el-tag>
          </template>

          <template #actions="{ row }">
            <el-button
              v-if="canSaveRolePermissions"
              link
              type="primary"
              @click="openPermissionDrawerByRow(row)"
            >
              分配权限
            </el-button>
          </template>
        </BaseTable>
      </el-card>

      <el-dialog
        v-model="createDialogVisible"
        title="创建角色"
        width="520px"
        @closed="resetCreateForm"
      >
        <el-form
          ref="createFormRef"
          :model="createForm"
          :rules="createRules"
          label-position="top"
        >
          <el-form-item label="角色名称" prop="name">
            <el-input v-model="createForm.name" placeholder="例如 质检管理员" />
          </el-form-item>

          <el-form-item label="角色编码" prop="code">
            <el-input v-model="createForm.code" placeholder="例如 quality_admin" />
          </el-form-item>

          <el-form-item label="角色说明">
            <el-input
              v-model="createForm.description"
              type="textarea"
              :rows="3"
              placeholder="说明这个角色负责哪些业务"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="closeCreateDialog">
            取消
          </el-button>
          <el-button
            v-if="canCreateRole"
            type="primary"
            :loading="creating"
            @click="handleCreateRole"
          >
            提交
          </el-button>
        </template>
      </el-dialog>

      <el-drawer
        v-model="permissionDrawerVisible"
        :title="`分配权限：${selectedRole?.name ?? selectedRoleCode}`"
        size="820px"
      >
        <el-alert
          v-if="permissionsError"
          class="drawer-alert"
          :title="getApiErrorMessage(permissionsError, '权限列表加载失败')"
          type="error"
          :closable="false"
          show-icon
        />

        <el-alert
          v-if="isBuiltInSuperAdmin"
          class="drawer-alert"
          title="超级管理员默认拥有全部权限，不需要手动分配"
          type="info"
          :closable="false"
          show-icon
        />

        <div class="permission-toolbar">
          <span class="permission-count">
            已选 {{ selectedPermissionCount }} / {{ allPermissionIds.length }}
          </span>

          <div class="permission-toolbar-actions">
            <el-button
              size="small"
              :disabled="isBuiltInSuperAdmin || !canSaveRolePermissions"
              @click="selectAllPermissions"
            >
              全选
            </el-button>
            <el-button
              size="small"
              :disabled="isBuiltInSuperAdmin || !canSaveRolePermissions"
              @click="clearAllPermissions"
            >
              清空
            </el-button>
          </div>
        </div>

        <BaseTable
          :model-value="permissionTableData"
          :columns="permissionColumns"
          :loading="permissionsPending"
          row-key="id"
          class="permission-table"
          default-expand-all
          max-height="calc(100vh - 260px)"
          :tree-props="{ children: 'children' }"
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

          <template #permissionChecked="{ row }">
            <el-checkbox
              :model-value="isPermissionChecked(row)"
              :disabled="isBuiltInSuperAdmin || !canSaveRolePermissions"
              @change="handlePermissionCheckboxChange(row, $event)"
            />
          </template>
        </BaseTable>

        <div class="drawer-footer">
          <el-button @click="permissionDrawerVisible = false">
            取消
          </el-button>
          <el-button
            v-if="canSaveRolePermissions"
            type="primary"
            :disabled="isBuiltInSuperAdmin"
            :loading="saving"
            @click="handleSaveRolePermissions"
          >
            保存权限
          </el-button>
        </div>
      </el-drawer>
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

.drawer-alert {
  margin-bottom: 16px;
}

.permission-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.permission-count {
  color: var(--admin-muted);
  font-size: 14px;
}

.permission-toolbar-actions {
  display: flex;
  gap: 8px;
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

.permission-table {
  width: 100%;
}

.drawer-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin: 16px -20px -20px;
  padding: 16px 20px;
  background: #fff;
  border-top: 1px solid var(--el-border-color-lighter);
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
