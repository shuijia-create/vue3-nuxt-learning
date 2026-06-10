<script setup lang="ts">
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { BaseTableColumn, BaseTableRow } from '~/types/base-table'
import type { RoleListItem } from '~/types/role'
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/use-auth'
import { getApiErrorMessage } from '~/utils/api/errors'
import { fetchApiData } from '~/utils/api/response'
import { workOrderHandlerDepartmentOptions } from '~/utils/work-order-config'
import type { WorkOrderHandlerDepartment } from '~/types/work-order'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '账号管理 - 企业工单后台'
})

type AccountUser = {
  id: number
  username: string
  nickname: string
  role: string
  roles: string[]
  departmentName?: WorkOrderHandlerDepartment
  isDepartmentManager: boolean
  createdAt: string
}

type AccountQueryForm = {
  username: string
  nickname: string
  role: string
  departmentName: WorkOrderHandlerDepartment | ''
}

const auth = useAuthStore()
const authActions = useAuth()

await callOnce('current-user', () => authActions.fetchCurrentUser())

const canCreateAccount = computed(() => auth.hasButtonPermission('accounts.create'))
const canUpdateAccountRole = computed(() => auth.hasButtonPermission('accounts.update_role'))
const requestFetch = import.meta.server ? useRequestFetch() : $fetch

const queryForm = reactive<AccountQueryForm>({
  username: '',
  nickname: '',
  role: '',
  departmentName: ''
})
const queryParams = reactive<AccountQueryForm>({
  username: '',
  nickname: '',
  role: '',
  departmentName: ''
})
const createFormRef = ref()
const createDialogVisible = ref(false)
const creating = ref(false)
const accountCurrentPage = ref(1)
const accountPageSize = ref(10)
const updatingRoleUserId = ref<number | null>(null)
const createForm = reactive({
  username: '',
  nickname: '',
  password: '',
  role: 'admin',
  departmentName: 'IT 部' as WorkOrderHandlerDepartment,
  isDepartmentManager: false
})

const createRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]{3,30}$/,
      message: '用户名只能包含字母、数字、下划线，长度 3-30 位',
      trigger: 'blur'
    }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 50, message: '昵称不能超过 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  departmentName: [
    { required: true, message: '请选择所属部门', trigger: 'change' }
  ]
}

const accountColumns: BaseTableColumn[] = [
  {
    label: '用户名',
    prop: 'username',
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    label: '昵称',
    prop: 'nickname',
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    label: '角色',
    prop: 'role',
    width: 180,
    slot: 'role'
  },
  {
    label: '所属部门',
    prop: 'departmentName',
    width: 170,
    slot: 'department'
  },
  {
    label: '部门负责人',
    prop: 'isDepartmentManager',
    width: 130,
    align: 'center',
    slot: 'manager'
  },
  {
    label: '创建时间',
    prop: 'createdAtText',
    width: 180
  }
]

const {
  data,
  pending,
  error,
  refresh
} = await useAsyncData('accounts', () => {
  return fetchApiData<{ list: AccountUser[] }>('/api/users', undefined, requestFetch)
})

const { data: rolesData } = await useAsyncData('roles-for-accounts', () => {
  return fetchApiData<{ list: RoleListItem[] }>('/api/roles', undefined, requestFetch)
})

const accounts = computed(() => data.value?.list ?? [])
const roleMap = computed(() => {
  return new Map((rolesData.value?.list ?? []).map(role => [role.code, role]))
})
const roleOptions = computed(() => {
  return (rolesData.value?.list ?? []).map(role => ({
    label: getRoleOptionLabel(role),
    value: role.code
  }))
})
const filteredAccounts = computed(() => {
  const username = queryParams.username.trim()
  const nickname = queryParams.nickname.trim()
  const role = queryParams.role
  const departmentName = queryParams.departmentName

  return accounts.value.filter((account) => {
    const matchedUsername = username ? account.username.includes(username) : true
    const matchedNickname = nickname ? account.nickname.includes(nickname) : true
    const matchedRole = role ? account.role === role : true
    const matchedDepartment = departmentName ? account.departmentName === departmentName : true

    return matchedUsername && matchedNickname && matchedRole && matchedDepartment
  })
})
const tableData = computed<BaseTableRow[]>(() => {
  return filteredAccounts.value.map(account => ({
    ...account,
    roleLabel: getRoleLabel(account.role),
    departmentName: account.departmentName ?? '未配置',
    managerText: account.isDepartmentManager ? '是' : '否',
    createdAtText: formatDate(account.createdAt)
  }))
})
const pagedTableData = computed(() => {
  const start = (accountCurrentPage.value - 1) * accountPageSize.value

  return tableData.value.slice(start, start + accountPageSize.value)
})

watch(() => createForm.role, (roleCode) => {
  const role = roleMap.value.get(roleCode)

  if (role) {
    createForm.isDepartmentManager = role.isDepartmentManager
  }
})

function getRoleOptionLabel(role: RoleListItem) {
  return role.isDepartmentManager ? `${role.name}（负责人）` : role.name
}

function getRoleLabel(role: string) {
  return roleOptions.value.find((item) => item.value === role)?.label ?? role
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function handleSearch() {
  queryParams.username = queryForm.username.trim()
  queryParams.nickname = queryForm.nickname.trim()
  queryParams.role = queryForm.role
  queryParams.departmentName = queryForm.departmentName
  accountCurrentPage.value = 1
}

function resetSearch() {
  queryForm.username = ''
  queryForm.nickname = ''
  queryForm.role = ''
  queryForm.departmentName = ''
  queryParams.username = ''
  queryParams.nickname = ''
  queryParams.role = ''
  queryParams.departmentName = ''
  accountCurrentPage.value = 1
}

function resetCreateForm() {
  Object.assign(createForm, {
    username: '',
    nickname: '',
    password: '',
    role: 'admin',
    departmentName: 'IT 部',
    isDepartmentManager: false
  })
  createFormRef.value?.clearValidate()
}

function openCreateDialog() {
  if (!canCreateAccount.value) {
    return
  }

  createDialogVisible.value = true
  resetCreateForm()
}

function closeCreateDialog() {
  createDialogVisible.value = false
}

function handleAccountPageSizeChange(value: number) {
  accountPageSize.value = value
  accountCurrentPage.value = 1
}

async function handleCreateAccount() {
  if (!canCreateAccount.value) {
    return
  }

  await createFormRef.value?.validate()

  creating.value = true
  try {
    await fetchApiData('/api/users', {
      method: 'POST',
      body: {
        username: createForm.username,
        nickname: createForm.nickname,
        password: createForm.password,
        role: createForm.role,
        departmentName: createForm.departmentName,
        isDepartmentManager: createForm.isDepartmentManager
      }
    })

    ElMessage.success('账号创建成功')
    closeCreateDialog()
    await refresh()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '操作失败'))
  } finally {
    creating.value = false
  }
}

async function handleUpdateAccountRole(row: BaseTableRow, roleValue: unknown) {
  if (!canUpdateAccountRole.value) {
    return
  }

  const accountId = Number(row.id)
  const role = String(roleValue)

  updatingRoleUserId.value = accountId

  try {
    await fetchApiData('/api/users/role', {
      method: 'POST',
      body: {
        id: accountId,
        role
      }
    })

    ElMessage.success('账号角色已更新')
    await refresh()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '操作失败'))
    await refresh()
  } finally {
    updatingRoleUserId.value = null
  }
}

async function handleUpdateWorkScope(row: BaseTableRow, patch: Partial<Pick<AccountUser, 'departmentName' | 'isDepartmentManager'>>) {
  if (!canUpdateAccountRole.value) {
    return
  }

  const accountId = Number(row.id)
  const departmentName = patch.departmentName ?? row.departmentName
  const isDepartmentManager = patch.isDepartmentManager ?? Boolean(row.isDepartmentManager)

  if (!departmentName || departmentName === '未配置') {
    ElMessage.warning('请选择所属部门')
    await refresh()
    return
  }

  updatingRoleUserId.value = accountId

  try {
    await fetchApiData('/api/users/work-scope', {
      method: 'POST',
      body: {
        id: accountId,
        departmentName,
        isDepartmentManager
      }
    })

    ElMessage.success('账号工作范围已更新')
    await refresh()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '操作失败'))
    await refresh()
  } finally {
    updatingRoleUserId.value = null
  }
}

function handleUpdateDepartment(row: BaseTableRow, value: unknown) {
  handleUpdateWorkScope(row, {
    departmentName: value as WorkOrderHandlerDepartment
  })
}

function handleUpdateManager(row: BaseTableRow, value: unknown) {
  handleUpdateWorkScope(row, {
    isDepartmentManager: Boolean(value)
  })
}
</script>

<template>
  <section class="management-page">
    <h1 class="page-title">
      账号管理
    </h1>

    <el-card class="query-card" shadow="never">
        <el-form :model="queryForm" inline>
          <el-form-item label="用户名">
            <el-input
              v-model="queryForm.username"
              class="query-control"
              clearable
              placeholder="输入用户名"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="昵称">
            <el-input
              v-model="queryForm.nickname"
              class="query-control"
              clearable
              placeholder="输入昵称"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="角色">
            <el-select
              v-model="queryForm.role"
              class="query-control"
              clearable
              placeholder="全部角色"
              style="width: 180px;"
            >
              <el-option
                v-for="item in roleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="部门">
            <el-select
              v-model="queryForm.departmentName"
              class="query-control"
              clearable
              placeholder="全部部门"
              style="width: 180px;"
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
            <el-button :icon="Search" type="primary" @click="handleSearch">
              查询
            </el-button>
            <el-button :icon="Refresh" @click="resetSearch">
              重置
            </el-button>
            <el-button v-if="canCreateAccount" :icon="Plus" type="primary" @click="openCreateDialog">
              创建账号
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-alert
        v-if="error"
        class="page-alert"
        :title="getApiErrorMessage(error, '账号列表加载失败')"
        type="error"
        :closable="false"
        show-icon
      />

      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="table-card-header">
            <span>账号列表</span>
            <span class="table-count">共 {{ filteredAccounts.length }} 个账号</span>
          </div>
        </template>

        <BaseTable
          :model-value="pagedTableData"
          :columns="accountColumns"
          :loading="pending"
          :total="filteredAccounts.length"
          :current-page="accountCurrentPage"
          :page-size="accountPageSize"
          pagination
          row-key="id"
          @current-change="accountCurrentPage = $event"
          @size-change="handleAccountPageSizeChange"
        >
          <template #role="{ row }">
            <el-select
              v-if="canUpdateAccountRole"
              class="table-role-select"
              :model-value="String(row.role ?? '')"
              :loading="updatingRoleUserId === Number(row.id)"
              style="width: 150px;"
              @change="handleUpdateAccountRole(row, $event)"
            >
              <el-option
                v-for="item in roleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-tag v-else class="status-tag source-manual" effect="plain">
              {{ row.roleLabel }}
            </el-tag>
          </template>

          <template #department="{ row }">
            <el-select
              v-if="canUpdateAccountRole"
              class="table-role-select"
              :model-value="String(row.departmentName ?? '')"
              :loading="updatingRoleUserId === Number(row.id)"
              style="width: 150px;"
              @change="handleUpdateDepartment(row, $event)"
            >
              <el-option
                v-for="item in workOrderHandlerDepartmentOptions"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
            <el-tag v-else class="status-tag source-manual" effect="plain">
              {{ row.departmentName }}
            </el-tag>
          </template>

          <template #manager="{ row }">
            <el-switch
              v-if="canUpdateAccountRole"
              :model-value="Boolean(row.isDepartmentManager)"
              :loading="updatingRoleUserId === Number(row.id)"
              @change="handleUpdateManager(row, $event)"
            />
            <el-tag v-else class="status-tag" :class="row.isDepartmentManager ? 'status-success' : 'source-manual'" effect="plain">
              {{ row.managerText }}
            </el-tag>
          </template>
        </BaseTable>
      </el-card>

      <el-dialog
        v-model="createDialogVisible"
        title="创建账号"
        width="520px"
        @closed="resetCreateForm"
      >
        <el-form
          ref="createFormRef"
          :model="createForm"
          :rules="createRules"
          label-position="top"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="createForm.username" placeholder="例如 zhangsan" />
          </el-form-item>

          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="createForm.nickname" placeholder="例如 张三" />
          </el-form-item>

          <el-form-item label="初始密码" prop="password">
            <el-input
              v-model="createForm.password"
              placeholder="至少 6 位"
              show-password
              type="password"
            />
          </el-form-item>

          <el-form-item label="角色" prop="role">
            <el-select v-model="createForm.role" class="full-width" style="width: 100%;">
              <el-option
                v-for="item in roleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="所属部门" prop="departmentName">
            <el-select v-model="createForm.departmentName" class="full-width" style="width: 100%;">
              <el-option
                v-for="item in workOrderHandlerDepartmentOptions"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="部门负责人">
            <el-switch
              v-model="createForm.isDepartmentManager"
              active-text="是"
              inactive-text="否"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="closeCreateDialog">
            取消
          </el-button>
          <el-button
            v-if="canCreateAccount"
            type="primary"
            :loading="creating"
            @click="handleCreateAccount"
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

.table-role-select {
  width: 150px;
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
