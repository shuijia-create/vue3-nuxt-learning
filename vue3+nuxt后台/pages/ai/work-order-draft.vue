<script setup lang="ts">
import type { WorkOrderDraft, WorkOrderPriority } from '~/types/work-order'
import { ElMessage } from 'element-plus'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '工单草稿助手 - Nuxt 后台学习项目'
})

const description = ref('2 号线混料设备温度偏高，现场已暂停投料，设备有报警但不清楚代码。')
const submitter = ref('现场员工')
const pending = ref(false)
const saving = ref(false)

const draft = ref<WorkOrderDraft>({
  title: '2 号线混料设备温度偏高报警',
  type: '设备故障',
  priority: '高',
  impact: '现场已暂停投料，可能影响当前批次生产节拍。',
  suggestion: '建议检查温控传感器、冷却系统和设备运行日志。',
  missingInfo: [
    '设备编号',
    '报警代码截图',
    '当前温度数值',
    '现场临时处理记录'
  ]
})

const priorityTypeMap: Record<WorkOrderPriority, 'success' | 'warning' | 'danger'> = {
  低: 'success',
  中: 'warning',
  高: 'danger'
}

async function handleGenerateDraft() {
  const text = description.value.trim()

  if (!text) {
    ElMessage.warning('请先输入问题描述')
    return
  }

  pending.value = true

  try {
    // 学习重点：真实 AI API 密钥不能放在浏览器端，应该由 server/api 统一调用。
    const res = await $fetch<{ draft: WorkOrderDraft, provider: 'qwen' | 'mock' }>('/api/ai/work-order-draft', {
      method: 'POST',
      body: {
        description: text
      }
    })

    draft.value = res.draft
    ElMessage.success(res.provider === 'qwen' ? '千问工单草稿已生成' : '本地 mock 草稿已生成')
  } catch (error: any) {
    ElMessage.error(error?.statusMessage || error?.message || '工单草稿生成失败')
  } finally {
    pending.value = false
  }
}

function buildWorkOrderDescription() {
  return description.value.trim()
}

async function handleSaveAsWorkOrder() {
  if (!submitter.value.trim()) {
    ElMessage.warning('请先填写提交人')
    return
  }

  saving.value = true

  try {
    const res: { code: number, message?: string } = await $fetch('/api/work-orders/add', {
      method: 'POST',
      body: {
        title: draft.value.title,
        type: draft.value.type,
        submitter: submitter.value.trim(),
        description: buildWorkOrderDescription(),
        source: 'AI 草稿',
        aiSuggestion: {
          impact: draft.value.impact,
          suggestion: draft.value.suggestion,
          missingInfo: draft.value.missingInfo
        }
      }
    })

    if (res.code !== 200) {
      ElMessage.error(res.message || '工单保存失败')
      return
    }

    ElMessage.success('已保存为正式工单')
    await navigateTo('/work-orders')
  } catch (error: any) {
    ElMessage.error(error?.statusMessage || error?.message || '工单保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section>
    <h1 class="page-title">AI 工单草稿助手</h1>

    <el-row :gutter="16">
      <el-col :md="10" :sm="24">
        <el-card shadow="never">
          <template #header>问题描述</template>
          <el-input
            v-model="description"
            type="textarea"
            :rows="8"
            placeholder="输入员工提交的问题描述"
          />
          <el-input
            v-model="submitter"
            class="submitter-input"
            placeholder="提交人"
          />
          <el-button
            class="generate-button"
            type="primary"
            :loading="pending"
            @click="handleGenerateDraft"
          >
            生成工单草稿
          </el-button>
          <p class="learning-note">
            已接入后端 AI 调用入口：配置 API Key 后调用真实 AI，未配置时使用本地 mock。
          </p>
        </el-card>
      </el-col>

      <el-col :md="14" :sm="24">
        <el-card shadow="never">
          <template #header>结构化草稿</template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="工单标题">
              {{ draft.title }}
            </el-descriptions-item>
            <el-descriptions-item label="建议类型">
              <el-tag>{{ draft.type }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag :type="priorityTypeMap[draft.priority]">
                {{ draft.priority }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="影响范围">
              {{ draft.impact }}
            </el-descriptions-item>
            <el-descriptions-item label="处理建议">
              {{ draft.suggestion }}
            </el-descriptions-item>
            <el-descriptions-item label="建议补充信息">
              <el-tag
                v-for="item in draft.missingInfo"
                :key="item"
                class="draft-tag"
                type="warning"
              >
                {{ item }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <el-alert
            class="review-alert"
            title="需要人工确认：AI 输出仅作为草稿，不作为最终安全、质量或生产处置结论。"
            type="warning"
            :closable="false"
            show-icon
          />

          <div class="draft-actions">
            <el-button
              type="primary"
              :loading="saving"
              @click="handleSaveAsWorkOrder"
            >
              保存为正式工单
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.submitter-input {
  margin-top: 12px;
}

.generate-button {
  margin-top: 16px;
}

.draft-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.review-alert {
  margin-top: 16px;
}

.draft-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
