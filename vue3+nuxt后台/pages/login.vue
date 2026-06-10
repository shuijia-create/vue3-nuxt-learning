<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useAuth } from '~/composables/use-auth'

definePageMeta({
  layout: 'auth'
})

useHead({
  title: '登录 - 企业工单后台'
})

const route = useRoute()
const authActions = useAuth()

const formRef = ref()
const loading = ref(false)
const form = reactive({
  username: 'admin',
  password: '123456'
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

async function handleLogin() {
  await formRef.value?.validate()

  loading.value = true
  try {
    await authActions.login(form)

    const redirect = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/dashboard'

    await navigateTo(redirect)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <section class="login-visual">
      <div class="visual-content">
        <div class="visual-badge">Enterprise Work Order</div>
        <h1>企业工单后台</h1>
        <p>
          面向生产现场、IT 支持和质量异常的统一处理台。
        </p>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-box">
        <div class="login-heading">
          <h2>欢迎登录</h2>
          <p>请输入管理员账号进入控制台</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @keyup.enter="handleLogin"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="admin" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              placeholder="123456"
              show-password
              type="password"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              class="login-button"
              :loading="loading"
              type="primary"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-tip">
          演示账号：admin / 123456
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, 0.92fr);
  background: var(--admin-bg);
}

.login-visual {
  display: flex;
  align-items: center;
  min-height: 100vh;
  padding: 80px;
  color: #ffffff;
  background:
    linear-gradient(135deg, rgb(15 23 42 / 88%), rgb(15 118 110 / 72%)),
    url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80') center / cover;
}

.visual-content {
  max-width: 560px;
}

.visual-badge {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  margin-bottom: 26px;
  font-size: 13px;
  font-weight: 600;
  background: rgb(255 255 255 / 16%);
  border: 1px solid rgb(255 255 255 / 24%);
  border-radius: 999px;
}

.visual-content h1 {
  margin: 0;
  font-size: 42px;
  line-height: 1.18;
}

.visual-content p {
  max-width: 480px;
  margin: 22px 0 0;
  color: #dbeafe;
  font-size: 17px;
  line-height: 1.8;
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px;
}

.login-box {
  width: min(100%, 390px);
  padding: 32px;
  background: #ffffff;
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  box-shadow: var(--admin-shadow-md);
}

.login-heading {
  margin-bottom: 30px;
}

.login-heading h2 {
  margin: 0;
  color: #111827;
  font-size: 28px;
}

.login-heading p {
  margin: 10px 0 0;
  color: var(--admin-muted);
}

.login-button {
  width: 100%;
}

.login-tip {
  margin-top: 18px;
  color: var(--admin-muted);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-visual {
    min-height: 280px;
    padding: 48px 28px;
  }

  .visual-content h1 {
    font-size: 32px;
  }

  .login-panel {
    min-height: auto;
    padding: 36px 24px;
  }
}
</style>
