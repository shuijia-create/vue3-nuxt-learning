import type { WorkOrder } from '~/types/work-order'

export const workOrders: WorkOrder[] = [
  {
    id: '1',
    code: 'WO-20260521-001',
    title: '2 号线混料设备温度偏高',
    type: '设备故障',
    status: '待处理',
    submitter: '张工',
    createdAt: '2026-05-21 09:12',
    description: '现场已暂停投料，设备有报警但暂不清楚报警代码。',
    source: '手动创建'
  },
  {
    id: '2',
    code: 'WO-20260521-002',
    title: '质检电脑无法连接内网',
    type: 'IT 问题',
    status: '处理中',
    submitter: '李明',
    createdAt: '2026-05-21 10:05',
    description: '质检区电脑无法访问内部系统，影响检验记录录入。',
    source: '手动创建'
  },
  {
    id: '3',
    code: 'WO-20260521-003',
    title: '包装批次标签信息不一致',
    type: '质量异常',
    status: '待确认',
    submitter: '王芳',
    createdAt: '2026-05-21 11:20',
    description: '外箱标签批次号与系统记录不一致，需要质量人员确认。',
    source: '手动创建'
  }
]
