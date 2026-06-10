export interface RoleListItem {
  id: number
  name: string
  code: string
  description: string | null
  isDepartmentManager: boolean
  status: number
  sort: number
  createdAt: string
}
