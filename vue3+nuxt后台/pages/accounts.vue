<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '账号管理 - Nuxt 后台学习项目'
})

type AccountUser = {
  id: number
  username: string
  nickname: string
  role: string
  roles: string[]
  createdAt: string
}

const auth = useAuthStore()

await callOnce('current-user', () => auth.fetchMe())

const isSuperAdmin = computed(() => auth.user?.roles.includes('super_admin') ?? false)
const requestFetch = import.meta.server ? useRequestFetch() : $fetch

const roleOptions = [
  {
    label: '普通管理员',
    value: 'admin'
  },
  {
    label: '超级管理员',
    value: 'super_admin'
  }
]

const formRef = ref()
const creating = ref(false)
const form = reactive({
  username: '',
  nickname: '',
  password: '',
  role: 'admin'
})

const rules = {
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
  ]
}

const {
  data,
  pending,
  error,
  refresh
} = await useAsyncData('accounts', () => {
  if (!isSuperAdmin.value) {
    return Promise.resolve({ list: [] })
  }

  return requestFetch<{ list: AccountUser[] }>('/api/users')
})

const accounts = computed(() => data.value?.list ?? [])

function getRoleLabel(role: string) {
  return roleOptions.find((item) => item.value === role)?.label ?? role
}

function getRoleTagType(role: string) {
  return role === 'super_admin' ? 'danger' : 'info'
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

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { statusMessage?: string, message?: string } }).data

    return data?.statusMessage ?? data?.message ?? '操作失败'
  }

  return error instanceof Error ? error.message : '操作失败'
}

async function handleCreateAccount() {
  await formRef.value?.validate()

  creating.value = true
  try {
    await $fetch('/api/users', {
      method: 'POST',
      body: form
    })

    ElMessage.success('账号创建成功')
    Object.assign(form, {
      username: '',
      nickname: '',
      password: '',
      role: 'admin'
    })
    formRef.value?.clearValidate()
    await refresh()
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <section>
    <h1 class="page-title">账号管理</h1>

    <el-result
      v-if="!isSuperAdmin"
      icon="warning"
      title="无权访问"
      sub-title="只有超级管理员可以管理账号"
    />

    <template v-else>
      <el-row :gutter="16">
        <el-col :lg="9" :md="24">
          <el-card shadow="never">
            <template #header>添加账号</template>

            <el-form
              ref="formRef"
              :model="form"
              :rules="rules"
              label-position="top"
            >
              <el-form-item label="用户名" prop="username">
                <el-input v-model="form.username" placeholder="例如 zhangsan" />
              </el-form-item>

              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="form.nickname" placeholder="例如 张三" />
              </el-form-item>

              <el-form-item label="初始密码" prop="password">
                <el-input
                  v-model="form.password"
                  placeholder="至少 6 位"
                  show-password
                  type="password"
                />
              </el-form-item>

              <el-form-item label="角色" prop="role">
                <el-select v-model="form.role" class="role-select">
                  <el-option
                    v-for="item in roleOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button
                  :loading="creating"
                  type="primary"
                  @click="handleCreateAccount"
                >
                  创建账号
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <el-col :lg="15" :md="24">
          <el-card shadow="never">
            <template #header>账号列表</template>

            <el-alert
              v-if="error"
              class="accounts-alert"
              :title="getErrorMessage(error)"
              type="error"
              :closable="false"
              show-icon
            />

            <el-table
              :data="accounts"
              :loading="pending"
              border
              row-key="id"
            >
              <el-table-column prop="username" label="用户名" min-width="140" />
              <el-table-column prop="nickname" label="昵称" min-width="140" />
              <el-table-column label="角色" width="130">
                <template #default="{ row }">
                  <el-tag :type="getRoleTagType(row.role)">
                    {{ getRoleLabel(row.role) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.createdAt) }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </section>
</template>

<style scoped>
.role-select {
  width: 100%;
}

.accounts-alert {
  margin-bottom: 16px;
}

@media (max-width: 1199px) {
  .el-col + .el-col {
    margin-top: 16px;
  }
}
</style>
