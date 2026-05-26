<script setup lang="ts">
import type { BaseTableColumn, BaseTableRow } from '~/types/base-table'
import type { OperationLog } from '~/types/operation-log'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '系统日志 - Nuxt 后台学习项目'
})

const { data, pending, error } = await useFetch<{ list: OperationLog[] }>('/api/operation-logs')

const tableData = computed<BaseTableRow[]>(() => {
  return (data.value?.list ?? []).map((item) => ({ ...item }))
})

const columns: BaseTableColumn[] = [
  {
    label: '时间',
    prop: 'createdAt',
    width: 180
  },
  {
    label: '模块',
    prop: 'module',
    width: 100
  },
  {
    label: '操作',
    prop: 'action',
    width: 120
  },
  {
    label: '操作人',
    prop: 'operator',
    width: 120
  },
  {
    label: '对象',
    prop: 'target',
    width: 180,
    showOverflowTooltip: true
  },
  {
    label: '详情',
    prop: 'detail',
    minWidth: 280,
    showOverflowTooltip: true
  }
]
</script>

<template>
  <section>
    <h1 class="page-title">系统日志</h1>

    <el-card class="system-card" shadow="never">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="项目类型">
          Nuxt SSR 后台学习项目
        </el-descriptions-item>
        <el-descriptions-item label="登录账号">
          admin
        </el-descriptions-item>
        <el-descriptions-item label="鉴权方式">
          页面 middleware + server/api cookie 校验
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-alert
      v-if="error"
      class="page-alert"
      title="操作日志加载失败"
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
      />
    </el-card>
  </section>
</template>

<style scoped>
.system-card,
.page-alert {
  margin-bottom: 16px;
}
</style>
