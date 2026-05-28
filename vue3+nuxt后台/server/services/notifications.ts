import { notifications } from '~/server/data/notifications'
import type { Notification, NotificationType } from '~/types/notification'
import type { WorkOrder, WorkOrderStatus } from '~/types/work-order'

type CreateNotificationParams = {
  type: NotificationType
  title: string
  content: string
  recipientUserId: number
  relatedWorkOrderId?: string
  targetPath?: string
}

type WorkOrderNotificationParams = {
  recipientUserId: number
  workOrder: Pick<WorkOrder, 'id' | 'title'>
}

type WorkOrderStatusChangedNotificationParams = WorkOrderNotificationParams & {
  oldStatus: WorkOrderStatus
  newStatus: WorkOrderStatus
}

// 生成 mock 通知 id。真实项目一般由数据库自增 id 或 uuid 生成。
function createNotificationId() {
  return `notification-${Date.now()}`
}

// 统一生成当前时间，避免每个接口里重复写 new Date()。
function createCurrentTime() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

// 创建通知：工单创建、状态变化等业务动作完成后调用它。
// unshift 表示把新通知放到列表最前面，让用户优先看到最新消息。
export function createNotification(params: CreateNotificationParams) {
  const notification: Notification = {
    id: createNotificationId(),
    createdAt: createCurrentTime(),
    ...params
  }

  notifications.unshift(notification)

  return notification
}

// 工单创建后的消息体。
// 这里集中说明一条“新工单通知”应该包含什么：
// 1. type：告诉前端这是工单创建通知。
// 2. title：列表里显示的短标题。
// 3. content：用户能读懂的完整提醒文案。
// 4. recipientUserId：这条通知发给谁。
// 5. relatedWorkOrderId：通知关联哪张工单。
// 6. targetPath：用户点击通知后跳到哪一页。
export function createWorkOrderCreatedNotification(params: WorkOrderNotificationParams) {
  return createNotification({
    type: 'work_order_created',
    title: '新工单待处理',
    content: `工单“${params.workOrder.title}”已创建，请及时处理。`,
    recipientUserId: params.recipientUserId,
    relatedWorkOrderId: params.workOrder.id,
    targetPath: `/work-orders/${params.workOrder.id}`
  })
}

// 工单状态变化后的消息体。
// 和创建通知相比，它的重点不是“有新工单”，而是告诉用户状态从哪一步变到了哪一步。
export function createWorkOrderStatusChangedNotification(params: WorkOrderStatusChangedNotificationParams) {
  return createNotification({
    type: 'work_order_status_changed',
    title: '工单状态已更新',
    content: `工单“${params.workOrder.title}”状态由“${params.oldStatus}”变更为“${params.newStatus}”。`,
    recipientUserId: params.recipientUserId,
    relatedWorkOrderId: params.workOrder.id,
    targetPath: `/work-orders/${params.workOrder.id}`
  })
}

// 查询某个用户收到的通知。
// 当前项目只有一个 mock 管理员，但仍然保留 recipientUserId，方便后续扩展多用户。
export function getUserNotifications(recipientUserId: number) {
  return notifications.filter(notification => notification.recipientUserId === recipientUserId)
}

// 标记已读：只允许用户操作自己的通知，避免把别人的通知误标记。
export function markNotificationRead(id: string, recipientUserId: number) {
  const notification = notifications.find((item) => {
    return item.id === id && item.recipientUserId === recipientUserId
  })

  if (!notification) {
    return null
  }

  // ||= 表示如果 readAt 已经有值，就不重复覆盖首次阅读时间。
  notification.readAt ||= createCurrentTime()

  return notification
}
