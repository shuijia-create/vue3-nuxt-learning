import type {
  KnowledgeAnswer,
  KnowledgeCitation,
  KnowledgeDocument,
  KnowledgeSection
} from '~/types/knowledge'

type ScoredSection = {
  document: KnowledgeDocument
  section: KnowledgeSection
  score: number
  matchedKeywords: string[]
}

export const knowledgeDisclaimer = 'AI 回答不能替代制度原文；涉及安全、质量、停机、责任归属或奖惩结论时，必须以企业正式制度和负责人审批为准。'

// 第一版知识库先用内置 mock 文档，重点学习“文档结构、检索、引用来源”的完整链路。
// 后续接入数据库或向量库时，可以保持 KnowledgeDocument / KnowledgeSection 结构不变。
const knowledgeDocuments: KnowledgeDocument[] = [
  {
    id: 'work-order-fill-standard',
    title: '工单填写规范',
    category: '工单规范',
    version: 'V1.0',
    owner: '数字化部',
    updatedAt: '2026-06-10',
    summary: '规定设备维修、IT 问题和质量异常工单的必填信息。',
    sections: [
      {
        id: 'equipment-fault-required-fields',
        title: '设备维修工单必填信息',
        content: '设备维修工单必须包含设备名称或编号、发生时间、故障现象、报警代码或截图、影响范围、现场临时处理措施和提交人。',
        keywords: ['设备', '故障', '工单', '填写', '信息', '报警', '停机', '处理']
      },
      {
        id: 'it-issue-required-fields',
        title: 'IT 问题工单必填信息',
        content: 'IT 问题工单必须包含系统名称、账号或岗位、异常页面、报错截图、影响人数、发生时间和是否影响生产业务。',
        keywords: ['IT', '系统', '账号', '报错', '截图', '生产业务']
      },
      {
        id: 'quality-issue-required-fields',
        title: '质量异常工单必填信息',
        content: '质量异常工单必须包含产品批次、异常现象、发现工位、影响数量、隔离状态、现场照片和初步处置记录。',
        keywords: ['质量', '异常', '批次', '隔离', '产品', '照片']
      }
    ]
  },
  {
    id: 'equipment-safety-escalation',
    title: '设备停机与安全升级流程',
    category: '设备安全',
    version: 'V1.2',
    owner: '设备部',
    updatedAt: '2026-06-08',
    summary: '说明设备异常时的停机、隔离和升级规则。',
    sections: [
      {
        id: 'stop-machine-rules',
        title: '必须停机的情况',
        content: '出现人员安全风险、设备温度持续超限、保护装置失效、异响伴随振动加剧或无法确认报警含义时，现场应先暂停设备并通知班组长和设备工程师。',
        keywords: ['停机', '安全', '温度', '超限', '报警', '保护装置', '异响', '振动']
      },
      {
        id: 'temporary-action-record',
        title: '临时处置记录',
        content: '现场临时处置必须记录执行人、执行时间、处置动作、设备状态变化和是否恢复生产，不允许只写“已处理”。',
        keywords: ['临时处置', '记录', '执行人', '恢复生产', '已处理']
      }
    ]
  },
  {
    id: 'quality-exception-process',
    title: '质量异常处置流程',
    category: '质量管理',
    version: 'V2.1',
    owner: '质量部',
    updatedAt: '2026-06-06',
    summary: '说明质量异常发现后的隔离、复核和关闭要求。',
    sections: [
      {
        id: 'quality-isolation',
        title: '异常品隔离要求',
        content: '发现质量异常后，应先隔离疑似影响批次，记录批次号、数量、发现工位和隔离区域，未经质量负责人确认不得放行。',
        keywords: ['质量', '异常', '隔离', '批次', '放行', '负责人']
      },
      {
        id: 'quality-close-rule',
        title: '质量工单关闭条件',
        content: '质量异常工单关闭前，必须补齐原因分析、处置结果、复核人和是否需要预防措施，不能只凭口头确认关闭。',
        keywords: ['质量', '关闭', '原因分析', '处置结果', '复核', '预防措施']
      }
    ]
  },
  {
    id: 'ai-answer-boundary',
    title: 'AI 问答使用边界',
    category: 'AI 使用边界',
    version: 'V1.0',
    owner: '数字化部',
    updatedAt: '2026-06-10',
    summary: '说明 AI 问答只能辅助检索制度，不能代替制度原文。',
    sections: [
      {
        id: 'ai-answer-limit',
        title: 'AI 回答边界',
        content: 'AI 回答只能作为制度检索和阅读辅助，不得替代制度原文、负责人审批、安全等级判定、事故原因结论或责任归属结论。',
        keywords: ['AI', '边界', '制度原文', '审批', '安全等级', '事故原因', '责任']
      }
    ]
  }
]

function scoreSection(question: string, document: KnowledgeDocument, section: KnowledgeSection): ScoredSection {
  const normalizedQuestion = question.toLowerCase()
  const matchedKeywords = section.keywords.filter((keyword) => {
    return normalizedQuestion.includes(keyword.toLowerCase())
  })
  const titleScore = normalizedQuestion.includes(section.title.toLowerCase()) ? 3 : 0
  const documentScore = normalizedQuestion.includes(document.title.toLowerCase()) ? 2 : 0
  const score = matchedKeywords.length + titleScore + documentScore

  return {
    document,
    section,
    score,
    matchedKeywords
  }
}

function findMatchedSections(question: string) {
  return knowledgeDocuments
    .flatMap(document => document.sections.map(section => scoreSection(question, document, section)))
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
}

function toCitation(item: ScoredSection): KnowledgeCitation {
  return {
    documentId: item.document.id,
    documentTitle: item.document.title,
    category: item.document.category,
    sectionId: item.section.id,
    sectionTitle: item.section.title,
    quote: item.section.content,
    version: item.document.version,
    updatedAt: item.document.updatedAt
  }
}

function buildAnswer(question: string, matchedSections: ScoredSection[]) {
  if (matchedSections.length === 0) {
    return [
      `没有在当前 mock 知识库中找到与“${question}”直接匹配的制度片段。`,
      '可以换成更具体的关键词，例如“设备维修工单”“质量异常隔离”“停机报警”“AI 使用边界”。'
    ].join('\n')
  }

  const points = matchedSections.map((item, index) => {
    return `${index + 1}. ${item.section.content}`
  })

  return [
    `根据当前企业知识库，关于“${question}”可以按以下制度口径理解：`,
    ...points,
    '',
    '处理实际业务时，请打开引用来源核对原文，必要时交由对应负责人确认。'
  ].join('\n')
}

export function listKnowledgeDocuments() {
  return knowledgeDocuments
}

export function answerKnowledgeQuestion(question: string): KnowledgeAnswer {
  const trimmedQuestion = question.trim()
  const matchedSections = findMatchedSections(trimmedQuestion)
  const matchedKeywords = Array.from(new Set(matchedSections.flatMap(item => item.matchedKeywords)))

  return {
    question: trimmedQuestion,
    answer: buildAnswer(trimmedQuestion, matchedSections),
    citations: matchedSections.map(toCitation),
    matchedKeywords,
    disclaimer: knowledgeDisclaimer
  }
}
