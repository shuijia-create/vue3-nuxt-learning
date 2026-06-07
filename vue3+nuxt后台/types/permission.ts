export type PermissionType = 1 | 2

export type PermissionRole = string

export interface PermissionTreeItem {
  id: number
  name: string
  code: string
  type: PermissionType
  typeLabel: string
  path: string | null
  parentId: number | null
  sort: number
  roles: PermissionRole[]
  children?: PermissionTreeItem[]
}

export interface PermissionsResponse {
  list: PermissionTreeItem[]
  rolePermissionIds: Record<string, number[]>
}
