import type { VNodeChild } from 'vue'

export type BaseTableRow = Record<string, unknown>

export type BaseTableColumnAlign = 'left' | 'center' | 'right'

export type BaseTableColumnFixed = boolean | 'left' | 'right'

export type BaseTableColumnWidth = string | number

export interface BaseTableRenderScope {
  row: BaseTableRow
  column: BaseTableColumn
  elColumn: unknown
  index: number
  value: unknown
}

export interface BaseTableColumn {
  label: string
  prop?: string
  width?: BaseTableColumnWidth
  minWidth?: BaseTableColumnWidth
  align?: BaseTableColumnAlign
  headerAlign?: BaseTableColumnAlign
  fixed?: BaseTableColumnFixed
  slot?: string
  render?: (scope: BaseTableRenderScope) => VNodeChild
  showOverflowTooltip?: boolean
  sortable?: boolean | 'custom'
}
