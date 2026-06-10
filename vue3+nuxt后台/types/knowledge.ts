export type KnowledgeDocumentCategory = '工单规范' | '设备安全' | '质量管理' | 'AI 使用边界'

export type KnowledgeSection = {
  id: string
  title: string
  content: string
  keywords: string[]
}

export type KnowledgeDocument = {
  id: string
  title: string
  category: KnowledgeDocumentCategory
  version: string
  owner: string
  updatedAt: string
  summary: string
  sections: KnowledgeSection[]
}

export type KnowledgeCitation = {
  documentId: string
  documentTitle: string
  category: KnowledgeDocumentCategory
  sectionId: string
  sectionTitle: string
  quote: string
  version: string
  updatedAt: string
}

export type KnowledgeAnswer = {
  question: string
  answer: string
  citations: KnowledgeCitation[]
  matchedKeywords: string[]
  disclaimer: string
}

export type KnowledgeAnswerResponse = {
  answer: KnowledgeAnswer
}
