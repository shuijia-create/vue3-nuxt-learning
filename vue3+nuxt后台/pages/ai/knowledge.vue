<script setup lang="ts">
import { ChatLineRound, DocumentChecked, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '~/stores/auth'
import { useKnowledge } from '~/composables/use-knowledge'
import { getApiErrorMessage } from '~/utils/api/errors'
import type { KnowledgeAnswer } from '~/types/knowledge'

definePageMeta({
  layout: 'admin'
})

useHead({
  title: '企业文档问答 - 企业工单后台'
})

const question = ref('设备维修工单需要填写哪些信息？')
const auth = useAuthStore()
const knowledgeActions = useKnowledge()
const canAskKnowledge = computed(() => auth.hasButtonPermission('ai_knowledge.ask'))
const pending = ref(false)
const answer = ref<KnowledgeAnswer | null>(null)

async function handleAskKnowledge() {
  if (!canAskKnowledge.value) {
    return
  }

  const text = question.value.trim()

  if (!text) {
    ElMessage.warning('请先输入要查询的问题')
    return
  }

  pending.value = true

  try {
    const result = await knowledgeActions.ask(text)

    answer.value = result.answer
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error, '知识库查询失败'))
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="knowledge-page">
    <div class="page-head">
      <div>
        <h1 class="page-title">企业文档问答</h1>
        <p class="page-desc">查询工单、设备安全、质量异常和 AI 使用边界制度。</p>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :md="10" :sm="24">
        <el-card class="question-card" shadow="never">
          <template #header>提问</template>

          <el-input
            v-model="question"
            type="textarea"
            :rows="7"
            placeholder="输入你想查询的制度、手册或流程问题"
            @keyup.ctrl.enter="handleAskKnowledge"
          />

          <el-button
            v-if="canAskKnowledge"
            class="ask-button"
            :icon="Search"
            type="primary"
            :loading="pending"
            @click="handleAskKnowledge"
          >
            查询文档
          </el-button>

          <div class="example-list">
            <div class="example-title">示例问题</div>
            <button type="button" @click="question = '设备维修工单需要填写哪些信息？'">
              设备维修工单需要填写哪些信息？
            </button>
            <button type="button" @click="question = '什么情况下设备必须先停机？'">
              什么情况下设备必须先停机？
            </button>
            <button type="button" @click="question = '质量异常工单关闭前要补哪些内容？'">
              质量异常工单关闭前要补哪些内容？
            </button>
          </div>
        </el-card>
      </el-col>

      <el-col :md="14" :sm="24">
        <el-card class="answer-card" shadow="never">
          <template #header>
            <div class="answer-head">
              <span>回答</span>
              <el-tag v-if="answer" class="status-tag source-ai" effect="plain">
                {{ answer.citations.length }} 个引用
              </el-tag>
            </div>
          </template>

          <el-empty
            v-if="!answer"
            description="输入问题后查询企业知识库"
            :image-size="96"
          />

          <template v-else>
            <el-alert
              class="boundary-alert"
              :title="answer.disclaimer"
              type="warning"
              :closable="false"
              show-icon
            />

            <div class="answer-box">
              <el-icon class="answer-icon"><ChatLineRound /></el-icon>
              <p class="answer-text">
                {{ answer.answer }}
              </p>
            </div>

            <div v-if="answer.matchedKeywords.length > 0" class="keyword-list">
              <span class="keyword-label">匹配关键词</span>
              <el-tag
                v-for="item in answer.matchedKeywords"
                :key="item"
                class="status-tag permission-page-tag"
                effect="plain"
              >
                {{ item }}
              </el-tag>
            </div>

            <el-divider />

            <h2 class="section-title">引用来源</h2>

            <el-empty
              v-if="answer.citations.length === 0"
              description="当前 mock 知识库未找到引用来源"
              :image-size="80"
            />

            <div v-else class="source-list">
              <el-card
                v-for="citation in answer.citations"
                :key="`${citation.documentId}-${citation.sectionId}`"
                shadow="never"
                class="source-card"
              >
                <div class="source-head">
                  <div>
                    <strong>《{{ citation.documentTitle }}》</strong>
                    <div class="source-meta">
                      {{ citation.category }} / {{ citation.version }} / {{ citation.updatedAt }}
                    </div>
                  </div>
                  <el-icon><DocumentChecked /></el-icon>
                </div>

                <div class="source-section">
                  {{ citation.sectionTitle }}
                </div>
                <p>
                  {{ citation.quote }}
                </p>
              </el-card>
            </div>
          </template>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.knowledge-page {
  min-height: calc(100vh - 164px);
}

.question-card,
.answer-card {
  height: 100%;
}

.ask-button {
  width: 100%;
  margin-top: 16px;
}

.example-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 18px;
}

.example-title {
  color: var(--admin-muted);
  font-size: 13px;
  font-weight: 700;
}

.example-list button {
  padding: 9px 10px;
  color: var(--admin-text-secondary);
  text-align: left;
  cursor: pointer;
  background: var(--admin-surface-subtle);
  border: 1px solid var(--admin-border);
  border-radius: 6px;
}

.example-list button:hover {
  color: var(--admin-primary);
  border-color: #bfdbfe;
  background: var(--admin-primary-soft);
}

.answer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.answer-box {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: var(--admin-surface-subtle);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
}

.answer-icon {
  margin-top: 4px;
  color: var(--admin-primary);
  font-size: 20px;
}

.answer-text {
  margin: 0;
  white-space: pre-line;
  line-height: 1.9;
}

.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 14px;
}

.keyword-label {
  color: var(--admin-muted);
  font-size: 13px;
  font-weight: 700;
}

.section-title {
  margin: 0 0 12px;
  font-size: 16px;
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.source-card {
  background: #f8fafc;
}

.source-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.source-head .el-icon {
  color: var(--admin-accent);
  font-size: 20px;
}

.source-meta,
.source-section {
  margin-top: 6px;
  color: var(--admin-muted);
  font-size: 13px;
}

.source-section {
  color: var(--admin-primary);
  font-weight: 700;
}

.source-card p {
  margin: 8px 0 0;
  color: var(--admin-text-secondary);
  line-height: 1.7;
}

.boundary-alert {
  margin-bottom: 14px;
}
</style>
