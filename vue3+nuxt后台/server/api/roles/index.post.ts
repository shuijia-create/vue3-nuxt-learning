import { isSuperAdmin } from '~/server/services/users'
import { createRole, roleExists } from '~/server/services/roles'

type CreateRoleBody = {
  name?: string
  code?: string
  description?: string
}

const roleCodePattern = /^[a-z][a-z0-9_]{2,29}$/

export default defineEventHandler(async (event) => {
  if (!isSuperAdmin(event.context.currentUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: '只有超级管理员可以创建角色'
    })
  }

  const body = await readBody<CreateRoleBody>(event)
  const name = body.name?.trim() ?? ''
  const code = body.code?.trim() ?? ''
  const description = body.description?.trim() ?? ''

  if (!name || name.length > 50) {
    throw createError({
      statusCode: 400,
      statusMessage: '角色名称不能为空，且不能超过 50 个字符'
    })
  }

  if (!roleCodePattern.test(code)) {
    throw createError({
      statusCode: 400,
      statusMessage: '角色编码必须以小写字母开头，只能包含小写字母、数字、下划线，长度 3-30 位'
    })
  }

  if (await roleExists(code)) {
    throw createError({
      statusCode: 409,
      statusMessage: '角色编码已存在'
    })
  }

  return {
    role: await createRole({
      name,
      code,
      description
    })
  }
})
