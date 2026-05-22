<script setup lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { BaseTableColumn, BaseTableRenderScope, BaseTableRow } from '~/types/base-table'

defineOptions({
  inheritAttrs: false
})

withDefaults(defineProps<{
  columns: BaseTableColumn[]
  rowKey?: string
  border?: boolean
  stripe?: boolean
  loading?: boolean
  emptyText?: string
}>(), {
  rowKey: 'id',
  border: true,
  stripe: false,
  loading: false,
  emptyText: '暂无数据'
})

const tableData = defineModel<BaseTableRow[]>({
  default: () => []
})

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
</script>

<template>
  <el-table
    v-loading="loading"
    class="base-table"
    :data="tableData"
    :row-key="rowKey"
    :border="border"
    :stripe="stripe"
    :empty-text="emptyText"
    v-bind="$attrs"
  >
    <el-table-column
      v-for="columnConfig in columns"
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
</template>
