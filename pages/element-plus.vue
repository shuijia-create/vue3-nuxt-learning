<script setup lang="ts">
import { ElMessage } from 'element-plus'

const form = reactive({
  name: '',
  department: '',
  enabled: true
})

const departments = [
  '销售部',
  '生产部',
  '财务部',
  '行政部',
  '信息部'
]

function submitForm() {
  if (!form.name || !form.department) {
    ElMessage.warning('请填写姓名并选择部门')
    return
  }

  ElMessage.success(`已提交：${form.name} / ${form.department}`)
}
</script>

<template>
  <section class="content element-demo">
    <p class="eyebrow">Nuxt Module</p>
    <h1>Element Plus 示例</h1>

    <p>
      Nuxt 没有传统 Vue 项目的 <code>main.js</code>。在 Nuxt 中，第三方库通常通过
      <code>nuxt.config.ts</code> 的 <code>modules</code> 或 <code>plugins/</code> 接入。
    </p>

    <el-alert
      title="Element Plus 已接入"
      type="success"
      description="这个页面使用了 ElAlert、ElForm、ElInput、ElSelect、ElSwitch、ElButton 和 ElMessage。"
      show-icon
      :closable="false"
    />

    <el-form class="element-form" label-width="90px" :model="form">
      <el-form-item label="姓名">
        <el-input v-model="form.name" placeholder="请输入姓名" />
      </el-form-item>

      <el-form-item label="部门">
        <el-select v-model="form.department" placeholder="请选择部门">
          <el-option
            v-for="department in departments"
            :key="department"
            :label="department"
            :value="department"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="是否启用">
        <el-switch v-model="form.enabled" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="form.name = ''; form.department = ''">重置</el-button>
      </el-form-item>
    </el-form>
  </section>
</template>
