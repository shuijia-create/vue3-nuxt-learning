import type { Notification } from '~/types/notification'

// mock 通知数据：现在先放在内存数组里，方便学习接口流程。
// 后面接数据库时，这个数组会换成 notifications 表。
export const notifications: Notification[] = [
  {
    id: 'notification-001',
    type: 'work_order_created',
    title: '新工单待处理',
    content: '工单“2 号线混料设备温度偏高”已创建，请及时处理。',
    recipientUserId: 1,
    relatedWorkOrderId: '1',
    targetPath: '/work-orders/1',
    createdAt: '2026-05-21 09:12'
  },
  {
    id: 'notification-002',
    type: 'work_order_status_changed',
    title: '工单状态已更新',
    content: '工单“质检电脑无法连接内网”已进入处理中。',
    recipientUserId: 1,
    relatedWorkOrderId: '2',
    targetPath: '/work-orders/2',
    createdAt: '2026-05-21 10:20',
    readAt: '2026-05-21 10:25'
  }
]
