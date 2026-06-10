<script setup lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { BaseTableColumn, BaseTableRenderScope, BaseTableRow } from '~/types/base-table'

defineOptions({
  inheritAttrs: false
})

const props = withDefaults(defineProps<{
  columns: BaseTableColumn[]
  rowKey?: string
  border?: boolean
  stripe?: boolean
  loading?: boolean
  emptyText?: string
  pagination?: boolean
  total?: number
  currentPage?: number
  pageSize?: number
  pageSizes?: number[]
  paginationLayout?: string
}>(), {
  rowKey: 'id',
  border: false,
  stripe: false,
  loading: false,
  emptyText: '暂无数据',
  pagination: false,
  total: 0,
  currentPage: 1,
  pageSize: 10,
  pageSizes: () => [10, 20, 50, 100],
  paginationLayout: 'total, sizes, prev, pager, next, jumper'
})

const emit = defineEmits<{
  'update:currentPage': [value: number]
  'update:pageSize': [value: number]
  'current-change': [value: number]
  'size-change': [value: number]
}>()

const tableData = defineModel<BaseTableRow[]>({
  default: () => []
})

const shouldShowPagination = computed(() => props.pagination && props.total > 0)

const BaseTableCell = defineComponent({
  name: 'BaseTableCell',
  props: {
    scope: {
      type: Object as PropType<BaseTableRenderScope>,
      required: true
    }
  },
  setup(props) {
    return () => {
      const { column, value } = props.scope

      if (column.render) {
        return column.render(props.scope)
      }

      return String(value ?? '')
    }
  }
})

function getCellValue(row: BaseTableRow, prop?: string) {
  if (!prop) {
    return ''
  }

  // 支持 user.name 这种简单路径，方便表格直接读取嵌套字段。
  return prop.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object' && key in value) {
      return (value as BaseTableRow)[key]
    }

    return ''
  }, row)
}

function handleCurrentChange(value: number) {
  emit('update:currentPage', value)
  emit('current-change', value)
}

function handleSizeChange(value: number) {
  emit('update:pageSize', value)
  emit('size-change', value)
}
</script>

<template>
  <div class="base-table-wrap">
    <div class="base-table-body">
      <el-table
        v-loading="props.loading"
        class="base-table"
        :data="tableData"
        :row-key="props.rowKey"
        :border="props.border"
        :stripe="props.stripe"
        :empty-text="props.emptyText"
        v-bind="$attrs"
      >
        <el-table-column
          v-for="columnConfig in props.columns"
          :key="columnConfig.prop || columnConfig.label"
          :prop="columnConfig.prop"
          :label="columnConfig.label"
          :width="columnConfig.width"
          :min-width="columnConfig.minWidth"
          :align="columnConfig.align"
          :header-align="columnConfig.headerAlign"
          :fixed="columnConfig.fixed"
          :show-overflow-tooltip="columnConfig.showOverflowTooltip"
          :sortable="columnConfig.sortable"
        >
          <template #default="{ row, column: elColumn, $index }">
            <slot
              v-if="columnConfig.slot"
              :name="columnConfig.slot"
              :row="row"
              :column="columnConfig"
              :el-column="elColumn"
              :index="$index"
              :value="getCellValue(row, columnConfig.prop)"
            />
            <BaseTableCell
              v-else
              :scope="{
                row,
                column: columnConfig,
                elColumn,
                index: $index,
                value: getCellValue(row, columnConfig.prop)
              }"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="shouldShowPagination" class="base-table-pagination">
      <el-pagination
        background
        :current-page="props.currentPage"
        :page-size="props.pageSize"
        :page-sizes="props.pageSizes"
        :layout="props.paginationLayout"
        :total="props.total"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.base-table-wrap {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
}

.base-table-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.base-table {
  width: 100%;
}

.base-table :deep(.el-table__inner-wrapper::before),
.base-table :deep(.el-table__border-left-patch) {
  display: none;
}

.base-table :deep(.el-table__header th) {
  height: 46px;
  background: var(--admin-surface-subtle);
  color: var(--admin-text-secondary);
  font-size: 13px;
  font-weight: 700;
  border-bottom: 1px solid var(--admin-border);
}

.base-table :deep(.el-table__row td) {
  height: 44px;
  color: var(--admin-text);
  border-bottom-color: #eef2f7;
}

.base-table :deep(.el-table__cell) {
  padding: 7px 0;
}

.base-table :deep(.el-table__body tr:hover > td.el-table__cell) {
  background: #f8fbff;
}

.base-table :deep(.el-table__fixed-right) {
  box-shadow: -8px 0 18px rgb(15 23 42 / 6%);
}

.base-table :deep(.el-table__empty-text) {
  color: var(--admin-muted);
}

.base-table-pagination {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  padding: 10px 16px;
  background: #ffffff;
  border-top: 1px solid var(--admin-border);
}

@media (max-width: 768px) {
  .base-table-pagination {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
