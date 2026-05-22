import type { WorkOrderDraft, WorkOrderPriority, WorkOrderType } from '~/types/work-order'

type GenerateDraftBody = {
  description?: string
}

function inferWorkOrderType(description: string): WorkOrderType {
  if (description.includes('电脑') || description.includes('内网') || description.includes('系统')) {
    return 'IT 问题'
  }

  if (description.includes('标签') || description.includes('批次') || description.includes('质量')) {
    return '质量异常'
  }

  return '设备故障'
}

function inferPriority(description: string): WorkOrderPriority {
  if (description.includes('停机') || description.includes('报警') || description.includes('暂停')) {
    return '高'
  }

  if (description.includes('影响') || description.includes('异常')) {
    return '中'
  }

  return '低'
}

function buildTitle(description: string, type: WorkOrderType) {
  const cleanDescription = description.replace(/\s+/g, '')

  if (cleanDescription.length <= 18) {
    return cleanDescription
  }

  return `${type}：${cleanDescription.slice(0, 18)}`
}

function buildSuggestion(type: WorkOrderType) {
  const suggestionMap: Record<WorkOrderType, string> = {
    设备故障: '建议先确认设备编号、报警代码、当前温度或运行参数，并联系设备工程师排查传感器、冷却系统和运行日志。',
    'IT 问题': '建议先确认电脑编号、网络连接状态、影响系统范围，并联系 IT 人员检查账号、网络和内部系统访问权限。',
    质量异常: '建议先隔离相关批次，记录标签、批号和系统数据差异，并通知质量人员复核后再决定后续处置。'
  }

  return suggestionMap[type]
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

  const type = inferWorkOrderType(description)
  const priority = inferPriority(description)

  const draft: WorkOrderDraft = {
    title: buildTitle(description, type),
    type,
    priority,
    impact: priority === '高'
      ? '现场可能已经影响生产节拍，需要优先确认风险和临时处置情况。'
      : '当前影响范围需要进一步确认，建议补充现场记录后再分派处理。',
    suggestion: buildSuggestion(type),
    missingInfo: [
      '设备或系统编号',
      '发生时间',
      '现场照片或报警截图',
      '已采取的临时处理措施'
    ]
  }

  return {
    draft
  }
})
