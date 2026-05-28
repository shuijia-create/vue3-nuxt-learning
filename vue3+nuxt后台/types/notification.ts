// 通知类型用于区分“为什么产生这条通知”。
// 当前项目只做工单闭环，所以先保留两类：创建工单、状态变化。
export type NotificationType = 'work_order_created' | 'work_order_status_changed'

// 站内通知是一条业务数据，不是 Element Plus 的弹窗消息。
// 它需要能被查询、显示未读数量、标记已读，并能跳转到相关业务页面。
export interface Notification {
  // 通知唯一 id，用于标记已读或列表渲染 key。
  id: string
  // 通知业务类型，方便前端后续按类型展示不同图标或文案。
  type: NotificationType
  // 列表里展示的短标题。
  title: string
  // 通知的具体说明内容。
  content: string
  // 接收通知的用户 id。真实项目里会来自用户表，这里先用 mock 登录用户 id。
  recipientUserId: number
  // 关联的工单 id。不是所有通知都必须关联工单，所以是可选字段。
  relatedWorkOrderId?: string
  // 点击通知后跳转的页面路径，例如 /work-orders/1。
  targetPath?: string
  // 通知创建时间。
  createdAt: string
  // 有值代表已读；没有值代表未读。
  readAt?: string
}
