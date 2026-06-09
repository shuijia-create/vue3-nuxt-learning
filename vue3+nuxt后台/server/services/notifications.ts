import type { Notification as DbNotification } from '~/generated/prisma/client'
import { prisma } from '~/server/utils/prisma'
import { ServiceError } from '~/server/utils/service-error'
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

// 通知类型在数据库中保存为数字，前端类型中保存为可读字符串。
// 转换集中在 service，避免页面和 API handler 到处写 1、2 这种魔法数字。
const notificationTypeToDb: Record<NotificationType, number> = {
  work_order_created: 1,
  work_order_status_changed: 2
}

const dbToNotificationType: Record<number, NotificationType> = {
  1: 'work_order_created',
  2: 'work_order_status_changed'
}

// 统一把数据库时间转成页面显示字符串，通知列表和 header 下拉都直接复用。
function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// 通知可以关联工单，也可以不关联；这里只在传入合法数字 id 时写入 relatedWorkOrderId。
function parseOptionalWorkOrderId(id: string | undefined) {
  if (!id) {
    return undefined
  }

  return /^\d+$/.test(id) ? Number(id) : undefined
}

// 标记已读时，通知 id 来自浏览器请求体，必须先校验再转成数据库数字主键。
function parseNotificationId(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new ServiceError(400, '通知 id 不正确')
  }

  return Number(id)
}

// 把 Prisma Notification 记录转换成前端 Notification 类型。
// 这里会把数字类型、数字 id、Date 字段都换成页面更容易使用的格式。
function toNotification(notification: DbNotification): Notification {
  return {
    id: String(notification.id),
    type: dbToNotificationType[notification.type] ?? 'work_order_created',
    title: notification.title,
    content: notification.content,
    recipientUserId: notification.recipientUserId,
    relatedWorkOrderId: notification.relatedWorkOrderId
      ? String(notification.relatedWorkOrderId)
      : undefined,
    targetPath: notification.targetPath ?? undefined,
    createdAt: formatDateTime(notification.createdAt),
    readAt: notification.readAt ? formatDateTime(notification.readAt) : undefined
  }
}

// 创建通用通知。业务模块不直接操作 notification 表，而是调用这个方法。
export async function createNotification(params: CreateNotificationParams) {
  const notification = await prisma.notification.create({
    data: {
      type: notificationTypeToDb[params.type],
      title: params.title,
      content: params.content,
      recipientUserId: params.recipientUserId,
      relatedWorkOrderId: parseOptionalWorkOrderId(params.relatedWorkOrderId),
      targetPath: params.targetPath
    }
  })

  return toNotification(notification)
}

// 工单创建后的通知模板。把文案集中在 service，页面不用知道通知内容怎么组织。
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

// 工单状态变化后的通知模板。它和创建通知共用底层 createNotification。
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

// 查询某个用户自己的通知。后端按 recipientUserId 过滤，避免看到别人的消息。
export async function getUserNotifications(recipientUserId: number) {
  const notifications = await prisma.notification.findMany({
    where: {
      recipientUserId
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return notifications.map(toNotification)
}

// 标记通知已读。这里同时校验通知 id 和接收人 id，防止用户改 id 标记别人的通知。
export async function markNotificationRead(id: string, recipientUserId: number) {
  const notificationId = parseNotificationId(id)
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      recipientUserId
    }
  })

  if (!notification) {
    return null
  }

  // 已读通知不重复覆盖 readAt，保留首次阅读时间。
  if (notification.readAt) {
    return toNotification(notification)
  }

  const updated = await prisma.notification.update({
    where: {
      id: notification.id
    },
    data: {
      readAt: new Date()
    }
  })

  return toNotification(updated)
}
