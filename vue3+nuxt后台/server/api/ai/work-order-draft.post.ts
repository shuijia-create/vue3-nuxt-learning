import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { z } from 'zod'
import type { WorkOrderDraft } from '~/types/work-order'

type GenerateDraftBody = {
  description?: string
}

type AiProvider = 'qwen' | 'mock'

const workOrderDraftSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['设备故障', 'IT 问题', '质量异常']),
  priority: z.enum(['低', '中', '高']),
  impact: z.string().min(1),
  suggestion: z.string().min(1),
  missingInfo: z.array(z.string().min(1))
})

function parseDraftText(text: string): WorkOrderDraft {
  const jsonText = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '')
  const jsonStart = jsonText.indexOf('{')
  const jsonEnd = jsonText.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error('AI 没有返回 JSON 对象')
  }

  const parsed = JSON.parse(jsonText.slice(jsonStart, jsonEnd + 1))

  return workOrderDraftSchema.parse(parsed)
}

function createMockDraft(description: string): WorkOrderDraft {
  return {
    title: description.slice(0, 24),
    type: '设备故障',
    priority: '高',
    impact: '现场可能影响生产节拍，需要优先确认风险和临时处置情况。',
    suggestion: '建议先确认设备编号、报警代码、当前参数和现场临时处理记录，再分派给设备人员处理。',
    missingInfo: [
      '设备编号',
      '发生时间',
      '现场照片或报警截图',
      '已采取的临时处理措施'
    ]
  }
}

async function generateDraftWithQwen(description: string, apiKey: string, baseURL: string, model: string): Promise<WorkOrderDraft> {
  const qwen = createOpenAI({
    apiKey,
    baseURL,
    name: 'qwen'
  })

  try {
    const { text } = await generateText({
      model: qwen(model),
      system: [
        '你是制造企业内部工单助手。',
        '你必须只返回一个 JSON 对象，不要返回 Markdown，不要返回解释文字，不要返回“以下是”。',
        'JSON 字段只能包含 title、type、priority、impact、suggestion、missingInfo。',
        'type 只能是“设备故障”、“IT 问题”、“质量异常”之一。',
        'priority 只能是“低”、“中”、“高”之一。'
      ].join('\n'),
      prompt: [
        '请根据员工提交的问题描述生成工单草稿。',
        '',
        `员工描述：${description}`,
        '',
        '返回格式示例：',
        '{"title":"2号线设备温度偏高","type":"设备故障","priority":"高","impact":"可能影响当前生产节拍","suggestion":"建议检查设备报警代码、温控传感器和冷却系统","missingInfo":["设备编号","报警代码","当前温度数值"]}'
      ].join('\n')
    })

    return parseDraftText(text)
  } catch (error) {
    console.error('[AI_WORK_ORDER_DRAFT_ERROR]', error)

    throw createError({
      statusCode: 502,
      statusMessage: '千问接口调用失败，请检查 API Key、模型名称和网络连接'
    })
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<GenerateDraftBody>(event)
  const description = body.description?.trim()

  if (!description) {
    throw createError({
      statusCode: 400,
      statusMessage: '请输入问题描述'
    })
  }

  const config = useRuntimeConfig()
  const apiKey = String(config.aiApiKey || '')
  const baseURL = String(config.aiBaseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1')
  const model = String(config.aiModel || 'qwen-plus')
  const draft = apiKey
    ? await generateDraftWithQwen(description, apiKey, baseURL, model)
    : createMockDraft(description)
  const provider: AiProvider = apiKey ? 'qwen' : 'mock'

  return {
    draft,
    provider
  }
})
