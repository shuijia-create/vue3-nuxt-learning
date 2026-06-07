import { isSuperAdmin } from '~/server/services/users'
import { createPermission } from '~/server/services/permissions'
import type { PermissionType } from '~/types/permission'

type CreatePermissionBody = {
  name?: string
  code?: string
  type?: PermissionType
  path?: string
  parentId?: number
}

const permissionCodePattern = /^[a-z0-9_.-]{3,80}$/

export default defineEventHandler(async (event) => {
  if (!isSuperAdmin(event.context.currentUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: '只有超级管理员可以创建权限'
    })
  }

  const body = await readBody<CreatePermissionBody>(event)
  const name = body.name?.trim() ?? ''
  const code = body.code?.trim() ?? ''
  const path = body.path?.trim() ?? ''
  const type = body.type === 2 ? 2 : 1

  if (!name || name.length > 50) {
    throw createError({
      statusCode: 400,
      statusMessage: '权限名称不能为空，且不能超过 50 个字符'
    })
  }

  if (!permissionCodePattern.test(code)) {
    throw createError({
      statusCode: 400,
      statusMessage: '权限编码只能包含小写字母、数字、点、横线和下划线，长度 3-80 位'
    })
  }

  if (type === 1 && !path) {
    throw createError({
      statusCode: 400,
      statusMessage: '页面权限必须填写页面路径'
    })
  }

  return createPermission({
    name,
    code,
    type,
    path: type === 1 ? path : undefined,
    parentId: type === 2 ? body.parentId : undefined
  })
})
