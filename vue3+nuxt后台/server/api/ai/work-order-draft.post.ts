import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { z } from 'zod'
import type { AuthUser } from '~/server/services/users'
import { requirePermissionCode } from '~/server/services/permissions'
import { apiSuccess, throwApiError } from '~/server/utils/api-response'
import type { WorkOrderDraft } from '~/types/work-order'

type GenerateDraftBody = {
  description?: string
}

type AiProvider = 'qwen' | 'mock'

// 后端用 zod 校验 AI 返回值。即使提示词要求 AI 返回 JSON，也不能直接相信模型输出。
// 这里明确规定草稿必须包含哪些字段，以及每个字段允许哪些值。
const workOrderDraftSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['IT 问题', '设备维修', '质量异常', '行政后勤', '权限申请', '安全隐患']),
  priority: z.enum(['低', '中', '高']),
  impact: z.string().min(1),
  suggestion: z.string().min(1),
  missingInfo: z.array(z.string().min(1))
})

// AI 有时会返回 ```json 代码块或夹带空白字符。
// 这个函数负责从模型文本里提取 JSON 对象，并用 zod 转成稳定的 WorkOrderDraft。
function parseDraftText(text: string): WorkOrderDraft {
  // 先去掉常见 Markdown 代码块包裹，降低模型输出格式波动带来的解析失败。
  const jsonText = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '')
  // 再定位第一个 { 和最后一个 }，只截取 JSON 对象主体。
  const jsonStart = jsonText.indexOf('{')
  const jsonEnd = jsonText.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error('AI 没有返回 JSON 对象')
  }

  const parsed = JSON.parse(jsonText.slice(jsonStart, jsonEnd + 1))

  // parse 只能证明是 JSON，zod 才能证明字段结构和业务枚举符合要求。
  return workOrderDraftSchema.parse(parsed)
}

// 没配置 AI Key 时使用本地 mock，保证学习项目不依赖外部服务也能跑完整流程。
function createMockDraft(description: string): WorkOrderDraft {
  return {
    title: description.slice(0, 24),
    type: '设备维修',
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

// 调用通义千问的 OpenAI 兼容接口。这个方法只在服务端执行，浏览器看不到 apiKey。
async function generateDraftWithQwen(description: string, apiKey: string, baseURL: string, model: string): Promise<WorkOrderDraft> {
  // createOpenAI 只是创建模型客户端，真正请求发生在 generateText。
  const qwen = createOpenAI({
    apiKey,
    baseURL,
    name: 'qwen'
  })

  try {
    // system 负责限制 AI 的角色和输出格式；prompt 负责传入本次员工描述。
    const { text } = await generateText({
      model: qwen(model),
      system: [
        '你是制造企业内部工单助手。',
        '你必须只返回一个 JSON 对象，不要返回 Markdown，不要返回解释文字，不要返回“以下是”。',
        'JSON 字段只能包含 title、type、priority、impact、suggestion、missingInfo。',
        'type 只能是“IT 问题”、“设备维修”、“质量异常”、“行政后勤”、“权限申请”、“安全隐患”之一。',
        'priority 只能是“低”、“中”、“高”之一。'
      ].join('\n'),
      prompt: [
        '请根据员工提交的问题描述生成工单草稿。',
        '',
        `员工描述：${description}`,
        '',
        '返回格式示例：',
        '{"title":"2号线设备温度偏高","type":"设备维修","priority":"高","impact":"可能影响当前生产节拍","suggestion":"建议检查设备报警代码、温控传感器和冷却系统","missingInfo":["设备编号","报警代码","当前温度数值"]}'
      ].join('\n')
    })

    // 不直接把 text 返回给前端，而是先解析成稳定结构。
    return parseDraftText(text)
  } catch (error) {
    // 服务端记录原始错误，方便排查 Key、模型名、网络或 JSON 格式问题。
    console.error('[AI_WORK_ORDER_DRAFT_ERROR]', error)

    throwApiError(502, '千问接口调用失败，请检查 API Key、模型名称和网络连接')
  }
}

// POST /api/ai/work-order-draft
// 前端只提交员工问题描述，后端决定调用真实 AI 还是本地 mock。
export default defineEventHandler(async (event) => {
  await requirePermissionCode(event.context.currentUser as AuthUser | undefined, 'ai_work_order_draft.generate')

  const body = await readBody<GenerateDraftBody>(event)
  const description = body.description?.trim()

  // 空描述没有业务意义，提前返回 400，避免浪费 AI 调用成本。
  if (!description) {
    throwApiError(400, '请输入问题描述')
  }

  // AI 配置来自 nuxt.config.ts 的 runtimeConfig，真实密钥只在服务端可见。
  const config = useRuntimeConfig()
  const apiKey = String(config.aiApiKey || '')
  const baseURL = String(config.aiBaseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1')
  const model = String(config.aiModel || 'qwen-plus')
  // 有 apiKey 就调用真实千问，没有就走 mock，保证本地学习时接口永远可用。
  const draft = apiKey
    ? await generateDraftWithQwen(description, apiKey, baseURL, model)
    : createMockDraft(description)
  const provider: AiProvider = apiKey ? 'qwen' : 'mock'

  // provider 返回给页面用于展示“千问生成”还是“本地 mock 生成”。
  return apiSuccess({
    draft,
    provider
  })
})
