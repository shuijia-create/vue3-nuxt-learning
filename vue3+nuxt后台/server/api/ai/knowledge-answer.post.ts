import type { AuthUser } from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
import { answerKnowledgeQuestion } from '~/server/services/knowledge'
import { apiSuccess, throwApiError } from '~/server/utils/api-response'

type KnowledgeAnswerBody = {
  question?: string
}

// POST /api/ai/knowledge-answer
// 第一版知识库使用 mock 制度文档 + 关键词检索，先跑通“提问 -> 检索 -> 引用来源”的后端链路。
export default defineEventHandler(async (event) => {
  await requirePermissionCode(event.context.currentUser as AuthUser | undefined, 'ai_knowledge.ask')

  const body = await readBody<KnowledgeAnswerBody>(event)
  const question = body.question?.trim()

  if (!question) {
    throwApiError(400, '请输入要查询的问题')
  }

  if (question.length > 200) {
    throwApiError(400, '问题不能超过 200 个字符')
  }

  return apiSuccess({
    answer: answerKnowledgeQuestion(question)
  }, '知识库回答已生成')
})
