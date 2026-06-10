import type { KnowledgeAnswerResponse } from '~/types/knowledge'
import { fetchApiData } from '~/utils/api/response'

export function askKnowledgeApi(question: string) {
  return fetchApiData<KnowledgeAnswerResponse>('/api/ai/knowledge-answer', {
    method: 'POST',
    body: {
      question
    }
  })
}
