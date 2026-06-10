<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '企业文档问答 - 企业工单后台'
})

const question = ref('设备故障工单需要填写哪些信息？')
const auth = useAuthStore()
const canAskKnowledge = computed(() => auth.hasButtonPermission('ai_knowledge.ask'))

const answer = '设备故障工单需要包含设备名称、故障现象、报警信息、影响范围和现场处理情况。若涉及停机、质量风险或安全风险，需要由负责人进行人工确认。'
</script>

<template>
  <section>
    <h1 class="page-title">企业文档问答</h1>

    <el-row :gutter="16">
      <el-col :md="10" :sm="24">
        <el-card shadow="never">
          <template #header>提问</template>
          <el-input
            v-model="question"
            type="textarea"
            :rows="5"
            placeholder="输入你想查询的制度、手册或流程问题"
          />
          <el-button v-if="canAskKnowledge" class="ask-button" type="primary">
            查询文档
          </el-button>
          <p class="learning-note">
            第一版先用 mock 文档和关键词检索，不做向量数据库。
          </p>
        </el-card>
      </el-col>

      <el-col :md="14" :sm="24">
        <el-card shadow="never">
          <template #header>回答</template>
          <p class="answer-text">
            {{ answer }}
          </p>

          <el-divider />

          <h2 class="section-title">引用来源</h2>
          <el-card shadow="never" class="source-card">
            <strong>《工单填写规范》</strong>
            <p>
              设备故障工单需要包含设备名称、故障现象、报警信息、影响范围和现场处理情况。
            </p>
          </el-card>

          <el-alert
            class="boundary-alert"
            title="边界提醒：AI 不做最终事故原因、安全等级、责任归属或停机决策。"
            type="error"
            :closable="false"
            show-icon
          />
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.ask-button {
  margin-top: 16px;
}

.answer-text {
  margin: 0;
  line-height: 1.9;
}

.section-title {
  margin: 0 0 12px;
  font-size: 16px;
}

.source-card {
  background: #f8fafc;
}

.source-card p {
  margin: 8px 0 0;
  color: var(--admin-muted);
  line-height: 1.7;
}

.boundary-alert {
  margin-top: 16px;
}
</style>
