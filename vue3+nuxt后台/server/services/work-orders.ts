import type { Prisma, WorkOrder as DbWorkOrder } from '~/generated/prisma/client'
import type { AuthUser } from '~/server/services/users'
import { findUserById, listDepartmentManagers } from '~/server/services/users'
import { createOperationLog, getWorkOrderProcessRecords } from '~/server/services/operation-logs'
import {
  createWorkOrderCreatedNotification,
  createWorkOrderStatusChangedNotification
} from '~/server/services/notifications'
import { prisma } from '~/server/utils/prisma'
import { ServiceError } from '~/server/utils/service-error'
import type {
  WorkOrder,
  WorkOrderAiSuggestion,
  WorkOrderFlowAction,
  WorkOrderHandlerDepartment,
  WorkOrderPriority,
  WorkOrderSource,
  WorkOrderStatus,
  WorkOrderType
} from '~/types/work-order'
import {
  getDefaultWorkOrderHandlerDept,
  isWorkOrderHandlerDepartment,
  isWorkOrderType as isSupportedWorkOrderType
} from '~/utils/work-order-config'

type ListWorkOrdersParams = {
  type?: unknown
  status?: unknown
  handlerDeptName?: unknown
}

type CreateWorkOrderInput = {
  title?: string
  type?: WorkOrderType
  description?: string
  source?: WorkOrderSource
  priority?: WorkOrderPriority
  aiSuggestion?: WorkOrderAiSuggestion
}

type ChangeWorkOrderStatusInput = {
  id?: string
  action?: WorkOrderFlowAction
  assigneeUserId?: number
  assigneeName?: string
  handledResult?: string
  confirmResult?: string
}

// 数据库为了稳定存储使用数字枚举；页面为了好理解使用中文枚举。
// service 层负责在这两种表示之间转换，页面和数据库都不需要知道对方的细节。
const workOrderTypeToDb: Record<WorkOrderType, number> = {
  设备维修: 1,
  'IT 问题': 2,
  质量异常: 3,
  行政后勤: 4,
  权限申请: 5,
  安全隐患: 6
}

const dbToWorkOrderType: Record<number, WorkOrderType> = {
  1: '设备维修',
  2: 'IT 问题',
  3: '质量异常',
  4: '行政后勤',
  5: '权限申请',
  6: '安全隐患'
}

const workOrderStatusToDb: Record<WorkOrderStatus, number> = {
  待受理: 1,
  处理中: 2,
  待确认: 3,
  已关闭: 4
}

const dbToWorkOrderStatus: Record<number, WorkOrderStatus> = {
  1: '待受理',
  2: '处理中',
  3: '待确认',
  4: '已关闭'
}

const workOrderPriorityToDb: Record<WorkOrderPriority, number> = {
  低: 1,
  中: 2,
  高: 3
}

const workOrderSourceToDb: Record<WorkOrderSource, number> = {
  手动创建: 1,
  'AI 草稿': 2
}

const dbToWorkOrderSource: Record<number, WorkOrderSource> = {
  1: '手动创建',
  2: 'AI 草稿'
}

const workOrderFlowActionMap: Record<WorkOrderFlowAction, true> = {
  accept: true,
  submit_result: true,
  confirm_close: true,
  return_to_processing: true
}

// 把数据库 Date 转成页面可直接展示的字符串，避免每个页面重复格式化。
function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatOptionalDateTime(date: Date | null) {
  return date ? formatDateTime(date) : undefined
}

function normalizeOptionalText(value: string | undefined, fallback: string) {
  const text = value?.trim()

  return text || fallback
}

// 校验 query/body 里的工单类型。所有来自客户端的值都要先判断，不能直接信任。
function isWorkOrderType(value: unknown): value is WorkOrderType {
  return isSupportedWorkOrderType(value)
}

// 校验工单状态，避免用户手动改 URL 或请求体传入不存在的状态。
function isWorkOrderStatus(value: unknown): value is WorkOrderStatus {
  return typeof value === 'string' && value in workOrderStatusToDb
}

function isWorkOrderFlowAction(value: unknown): value is WorkOrderFlowAction {
  return typeof value === 'string' && value in workOrderFlowActionMap
}

// 校验优先级。优先级目前只在 AI 草稿保存时使用，手动创建默认中优先级。
function isWorkOrderPriority(value: unknown): value is WorkOrderPriority {
  return typeof value === 'string' && value in workOrderPriorityToDb
}

// 路由参数是字符串，数据库主键是数字；这里集中完成格式校验和转换。
function parseWorkOrderId(id: unknown) {
  if (typeof id !== 'string' || !/^\d+$/.test(id)) {
    throw new ServiceError(400, '工单 id 不正确')
  }

  return Number(id)
}

// 后端 service 不能默认相信调用方已经登录；需要当前用户的写操作都先过这一关。
function requireCurrentUser(currentUser: AuthUser | undefined) {
  if (!currentUser?.id) {
    throw new ServiceError(401, '请先登录')
  }

  return currentUser
}

// 操作日志需要显示“谁做的”。优先用登录用户昵称，没有时再退到提交人或系统用户。
function getOperatorName(currentUser: AuthUser | undefined, fallback: string) {
  return currentUser?.nickname || currentUser?.username || fallback || '系统用户'
}

function getUserSnapshotName(currentUser: AuthUser) {
  if (currentUser.nickname && currentUser.username && currentUser.nickname !== currentUser.username) {
    return `${currentUser.nickname}（${currentUser.username}）`
  }

  return currentUser.nickname || currentUser.username
}

function isSuperAdmin(user: AuthUser) {
  return user.roles.includes('super_admin')
}

function isDepartmentManagerFor(user: AuthUser, departmentName: WorkOrderHandlerDepartment) {
  return user.isDepartmentManager && user.departmentName === departmentName
}

function getVisibleWorkOrderWhere(user: AuthUser): Prisma.WorkOrderWhereInput {
  if (isSuperAdmin(user)) {
    return {}
  }

  const or: Prisma.WorkOrderWhereInput[] = [
    {
      createdBy: user.id
    },
    {
      assigneeId: user.id
    }
  ]

  if (user.departmentName && user.isDepartmentManager) {
    or.push({
      handlerDeptName: user.departmentName
    })
  }

  return {
    OR: or
  }
}

function canViewWorkOrder(order: DbWorkOrder, user: AuthUser) {
  if (isSuperAdmin(user) || order.createdBy === user.id || order.assigneeId === user.id) {
    return true
  }

  return isWorkOrderHandlerDepartment(order.handlerDeptName)
    && isDepartmentManagerFor(user, order.handlerDeptName)
}

function requireCanViewWorkOrder(order: DbWorkOrder, user: AuthUser) {
  if (!canViewWorkOrder(order, user)) {
    throw new ServiceError(403, '无权查看该工单')
  }
}

function requireCanAcceptWorkOrder(order: DbWorkOrder, user: AuthUser) {
  if (
    isSuperAdmin(user)
    || (
      isWorkOrderHandlerDepartment(order.handlerDeptName)
      && isDepartmentManagerFor(user, order.handlerDeptName)
    )
  ) {
    return
  }

  throw new ServiceError(403, '只有处理部门负责人可以受理该工单')
}

function requireCanSubmitResult(order: DbWorkOrder, user: AuthUser) {
  if (isSuperAdmin(user) || order.assigneeId === user.id) {
    return
  }

  throw new ServiceError(403, '只有被指派的处理人可以提交处理结果')
}

function requireCanConfirmWorkOrder(order: DbWorkOrder, user: AuthUser) {
  if (isSuperAdmin(user) || order.createdBy === user.id) {
    return
  }

  if (
    isWorkOrderHandlerDepartment(order.handlerDeptName)
    && isDepartmentManagerFor(user, order.handlerDeptName)
  ) {
    return
  }

  throw new ServiceError(403, '只有提交人或处理部门负责人可以确认该工单')
}

// 工单编号里的日期部分使用 YYYYMMDD，方便人工按日期识别工单。
function createWorkOrderCodeDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('')
}

// 生成当天递增的工单编号，例如 WO-20260609-001。
// 这比用 Date.now() 更像企业后台里的业务编号。
async function createWorkOrderCode() {
  const date = createWorkOrderCodeDate(new Date())
  const prefix = `WO-${date}-`
  const count = await prisma.workOrder.count({
    where: {
      code: {
        startsWith: prefix
      }
    }
  })

  return `${prefix}${String(count + 1).padStart(3, '0')}`
}

// Prisma Json 字段读出来是 unknown，这里把它收窄成前端真正需要的 AI 建议结构。
function toWorkOrderAiSuggestion(value: unknown): WorkOrderAiSuggestion | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  const suggestion = value as Partial<WorkOrderAiSuggestion>

  if (
    typeof suggestion.impact !== 'string'
    || typeof suggestion.suggestion !== 'string'
    || !Array.isArray(suggestion.missingInfo)
    || !suggestion.missingInfo.every(item => typeof item === 'string')
  ) {
    return undefined
  }

  return {
    impact: suggestion.impact,
    suggestion: suggestion.suggestion,
    missingInfo: suggestion.missingInfo
  }
}

function toWorkOrderHandlerDept(order: DbWorkOrder, type: WorkOrderType): WorkOrderHandlerDepartment {
  if (isWorkOrderHandlerDepartment(order.handlerDeptName)) {
    return order.handlerDeptName
  }

  return getDefaultWorkOrderHandlerDept(type)
}

function toWorkOrderSubmitterDept(order: DbWorkOrder): WorkOrderHandlerDepartment | undefined {
  return isWorkOrderHandlerDepartment(order.submitterDeptName)
    ? order.submitterDeptName
    : undefined
}

async function notifyWorkOrderCreated(workOrder: WorkOrder, creatorId: number) {
  const recipientIds = new Set<number>([creatorId])
  const managers = await listDepartmentManagers(workOrder.handlerDeptName)

  managers.forEach(manager => recipientIds.add(manager.id))

  await Promise.all([...recipientIds].map(recipientUserId => createWorkOrderCreatedNotification({
    recipientUserId,
    workOrder
  })))
}

async function notifyWorkOrderStatusChanged(
  workOrder: WorkOrder,
  oldStatus: WorkOrderStatus,
  newStatus: WorkOrderStatus,
  recipientIds: Array<number | null | undefined>
) {
  const uniqueRecipientIds = [...new Set(recipientIds.filter((id): id is number => typeof id === 'number'))]

  await Promise.all(uniqueRecipientIds.map(recipientUserId => createWorkOrderStatusChangedNotification({
    recipientUserId,
    workOrder,
    oldStatus,
    newStatus
  })))
}

async function resolveAssignee(order: DbWorkOrder, currentUser: AuthUser, input: ChangeWorkOrderStatusInput) {
  if (typeof input.assigneeUserId !== 'number') {
    return {
      id: currentUser.id,
      name: getOperatorName(currentUser, order.submitter)
    }
  }

  if (!Number.isInteger(input.assigneeUserId)) {
    throw new ServiceError(400, '处理人不正确')
  }

  const assignee = await findUserById(input.assigneeUserId)

  if (!assignee) {
    throw new ServiceError(400, '处理人不存在')
  }

  if (
    isWorkOrderHandlerDepartment(order.handlerDeptName)
    && assignee.departmentName !== order.handlerDeptName
  ) {
    throw new ServiceError(400, `只能指派给${order.handlerDeptName}的用户`)
  }

  return {
    id: assignee.id,
    name: assignee.nickname || assignee.username
  }
}

// 把数据库记录转换成前端类型。所有数字枚举、Date、Json 都在这里统一处理。
function toWorkOrder(order: DbWorkOrder): WorkOrder {
  const type = dbToWorkOrderType[order.type] ?? 'IT 问题'

  return {
    id: String(order.id),
    code: order.code,
    title: order.title,
    type,
    handlerDeptName: toWorkOrderHandlerDept(order, type),
    status: dbToWorkOrderStatus[order.status] ?? '待受理',
    submitter: order.submitter,
    submitterDeptName: toWorkOrderSubmitterDept(order),
    assigneeUserId: order.assigneeId ?? undefined,
    assigneeName: order.assigneeName ?? undefined,
    acceptedByName: order.acceptedByName ?? undefined,
    acceptedAt: formatOptionalDateTime(order.acceptedAt),
    handledByName: order.handledByName ?? undefined,
    handledResult: order.handledResult ?? undefined,
    handledAt: formatOptionalDateTime(order.handledAt),
    confirmedByName: order.confirmedByName ?? undefined,
    confirmResult: order.confirmResult ?? undefined,
    confirmedAt: formatOptionalDateTime(order.confirmedAt),
    closedAt: formatOptionalDateTime(order.closedAt),
    createdAt: formatDateTime(order.createdAt),
    description: order.description,
    source: dbToWorkOrderSource[order.source] ?? '手动创建',
    aiSuggestion: toWorkOrderAiSuggestion(order.aiSuggestion)
  }
}

// 查询工单列表。筛选条件来自 URL query，因此先校验再转成数据库数字枚举。
export async function listWorkOrders(params: ListWorkOrdersParams = {}, currentUser: AuthUser | undefined) {
  const user = requireCurrentUser(currentUser)
  // URL query 可能是任意字符串。合法才转成数据库枚举，不合法就忽略该筛选条件。
  const type = isWorkOrderType(params.type) ? workOrderTypeToDb[params.type] : undefined
  const status = isWorkOrderStatus(params.status) ? workOrderStatusToDb[params.status] : undefined
  const handlerDeptName = isWorkOrderHandlerDepartment(params.handlerDeptName)
    ? params.handlerDeptName
    : undefined
  // Prisma 会忽略 where 里值为 undefined 的字段，所以可以自然实现“全部类型/全部状态”。
  const list = await prisma.workOrder.findMany({
    where: {
      ...getVisibleWorkOrderWhere(user),
      type,
      status,
      handlerDeptName
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return list.map(toWorkOrder)
}

// 查询工单详情。详情额外把 operation_logs 中对应工单编号的日志转成处理记录。
export async function getWorkOrderDetail(id: string, currentUser: AuthUser | undefined) {
  const user = requireCurrentUser(currentUser)
  // 先把路由字符串 id 转成数据库数字主键，不合法时直接抛 400。
  const workOrderId = parseWorkOrderId(id)
  const order = await prisma.workOrder.findUnique({
    where: {
      id: workOrderId
    }
  })

  if (!order) {
    throw new ServiceError(404, '工单不存在')
  }

  requireCanViewWorkOrder(order, user)

  // 工单主数据来自 work_orders，处理记录来自 operation_logs。
  // 这样不新增 process_records 表，也能让详情页看到完整时间线。
  return {
    ...toWorkOrder(order),
    processRecords: await getWorkOrderProcessRecords(order.code)
  }
}

// 创建工单是完整业务动作：校验输入、写工单表、写操作日志、创建站内通知。
export async function createWorkOrder(input: CreateWorkOrderInput, currentUser: AuthUser | undefined) {
  // 创建工单属于写操作，必须确认当前请求已经通过服务端鉴权。
  const user = requireCurrentUser(currentUser)
  // trim 放在后端做一遍，避免前端绕过表单校验提交纯空格。
  const title = input.title?.trim()
  const submitter = getUserSnapshotName(user)
  const submitterDeptName = user.departmentName
  const description = input.description?.trim()

  // 这里做服务端最终校验。前端校验只负责体验，不能作为安全边界。
  if (!title || !input.type || !description) {
    throw new ServiceError(400, '请填写完整工单信息')
  }

  // 类型必须是系统支持的工单类型，否则不能写入数据库。
  if (!isWorkOrderType(input.type)) {
    throw new ServiceError(400, '工单类型不正确')
  }

  // 来源只允许两种：手动创建、AI 草稿。其它传值统一落到手动创建。
  const source: WorkOrderSource = input.source === 'AI 草稿' ? 'AI 草稿' : '手动创建'
  // 手动创建没有优先级表单，默认中优先级；AI 草稿会把模型给出的优先级带过来。
  const priority: WorkOrderPriority = isWorkOrderPriority(input.priority) ? input.priority : '中'
  // 只有 AI 草稿保存时才写入 aiSuggestion，手动创建不保存这个字段。
  const aiSuggestion = source === 'AI 草稿' ? input.aiSuggestion : undefined
  const handlerDeptName = getDefaultWorkOrderHandlerDept(input.type)
  // 先写工单主表。后面的日志和通知都需要使用新工单的 id、code、title。
  const order = await prisma.workOrder.create({
    data: {
      code: await createWorkOrderCode(),
      title,
      type: workOrderTypeToDb[input.type],
      status: workOrderStatusToDb.待受理,
      priority: workOrderPriorityToDb[priority],
      submitter,
      submitterDeptName,
      description,
      source: workOrderSourceToDb[source],
      handlerDeptName,
      aiSuggestion: aiSuggestion as Prisma.InputJsonValue | undefined,
      createdBy: user.id
    }
  })
  const workOrder = toWorkOrder(order)
  const operator = getOperatorName(user, submitter)

  // 创建工单后的日志会同时作为详情页“人工处理记录”的来源。
  await createOperationLog({
    module: '工单',
    action: '创建工单',
    operator,
    operatorUserId: user.id,
    target: order.code,
    detail: source === 'AI 草稿'
      ? `提交人根据 AI 草稿创建了工单“${title}”，自动流向${handlerDeptName}，当前状态为待受理。`
      : `提交人创建了工单“${title}”，自动流向${handlerDeptName}，当前状态为待受理。`
  })
  // 创建工单后通知提交人和处理部门负责人，header 未读数会随之更新。
  await notifyWorkOrderCreated(workOrder, user.id)

  // 返回给前端的是页面类型，不是数据库原始记录；同时补上刚写入的处理记录。
  return {
    ...workOrder,
    processRecords: await getWorkOrderProcessRecords(order.code)
  }
}

// 状态流转是另一类完整业务动作：校验状态规则、更新工单、写日志、发通知。
export async function changeWorkOrderStatus(input: ChangeWorkOrderStatusInput, currentUser: AuthUser | undefined) {
  // 状态流转同样是写操作，需要当前登录用户用于权限、日志和通知。
  const user = requireCurrentUser(currentUser)
  // body 里的 id 先转成数据库数字主键。
  const workOrderId = parseWorkOrderId(input.id)

  if (!isWorkOrderFlowAction(input.action)) {
    throw new ServiceError(400, '工单处理动作不正确')
  }

  // 先查当前工单，因为状态流转规则依赖“当前状态”。
  const order = await prisma.workOrder.findUnique({
    where: {
      id: workOrderId
    }
  })

  if (!order) {
    throw new ServiceError(404, '工单不存在')
  }

  const oldStatus = dbToWorkOrderStatus[order.status] ?? '待受理'
  const operator = getOperatorName(user, order.submitter)
  const now = new Date()
  let newStatus: WorkOrderStatus
  let actionName: string
  let detail: string
  let updateData: Prisma.WorkOrderUpdateInput

  switch (input.action) {
    case 'accept': {
      if (oldStatus !== '待受理') {
        throw new ServiceError(400, `${oldStatus}工单不能重复受理`)
      }

      requireCanAcceptWorkOrder(order, user)

      const assignee = await resolveAssignee(order, user, input)
      const assigneeName = normalizeOptionalText(input.assigneeName, assignee.name)

      newStatus = '处理中'
      actionName = '受理工单'
      detail = `${operator}受理${order.handlerDeptName}工单，并指派给${assigneeName}处理。`
      updateData = {
        status: workOrderStatusToDb[newStatus],
        assigneeId: assignee.id,
        assigneeName,
        acceptedBy: user.id,
        acceptedByName: operator,
        acceptedAt: now
      }
      break
    }

    case 'submit_result': {
      if (oldStatus !== '处理中') {
        throw new ServiceError(400, `${oldStatus}工单不能提交处理结果`)
      }

      requireCanSubmitResult(order, user)

      const handledResult = normalizeOptionalText(
        input.handledResult,
        '处理人提交处理结果，未填写处理说明。'
      )

      newStatus = '待确认'
      actionName = '提交处理结果'
      detail = `${operator}提交处理结果：${handledResult}`
      updateData = {
        status: workOrderStatusToDb[newStatus],
        handledBy: user.id,
        handledByName: operator,
        handledResult,
        handledAt: now
      }
      break
    }

    case 'confirm_close': {
      if (oldStatus !== '待确认') {
        throw new ServiceError(400, `${oldStatus}工单不能确认关闭`)
      }

      requireCanConfirmWorkOrder(order, user)

      const confirmResult = normalizeOptionalText(input.confirmResult, '确认处理完成。')

      newStatus = '已关闭'
      actionName = '确认关闭'
      detail = `${operator}确认关闭工单：${confirmResult}`
      updateData = {
        status: workOrderStatusToDb[newStatus],
        confirmedBy: user.id,
        confirmedByName: operator,
        confirmResult,
        confirmedAt: now,
        closedAt: now
      }
      break
    }

    case 'return_to_processing': {
      if (oldStatus !== '待确认') {
        throw new ServiceError(400, `${oldStatus}工单不能退回处理`)
      }

      requireCanConfirmWorkOrder(order, user)

      const returnReason = normalizeOptionalText(
        input.confirmResult,
        '确认人退回处理，未填写退回原因。'
      )

      newStatus = '处理中'
      actionName = '退回处理'
      detail = `${operator}退回工单：${returnReason}`
      updateData = {
        status: workOrderStatusToDb[newStatus],
        confirmedBy: user.id,
        confirmedByName: operator,
        confirmResult: returnReason,
        confirmedAt: now,
        closedAt: null
      }
      break
    }

    default: {
      throw new ServiceError(400, '工单处理动作不正确')
    }
  }

  const updated = await prisma.workOrder.update({
    where: {
      id: order.id
    },
    data: updateData
  })
  const workOrder = toWorkOrder(updated)

  // 状态变化日志同样会显示在工单详情时间线中。
  await createOperationLog({
    module: '工单',
    action: actionName,
    operator,
    operatorUserId: user.id,
    target: order.code,
    detail
  })
  // 状态变化后提醒提交人、处理人和当前操作人，形成“业务动作 -> 通知”的闭环。
  await notifyWorkOrderStatusChanged(workOrder, oldStatus, newStatus, [
    user.id,
    updated.createdBy,
    updated.assigneeId,
    updated.acceptedBy
  ])

  // 返回最新工单详情，页面刷新后能立刻看到新状态和新时间线。
  return {
    ...workOrder,
    processRecords: await getWorkOrderProcessRecords(order.code)
  }
}
