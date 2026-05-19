<script setup lang="ts">
const { user, loading, login } = useAuth()

const email = ref('student@example.com')
const password = ref('123456')
const errorMessage = ref('')

if (user.value) {
  await navigateTo('/dashboard')
}

async function handleLogin() {
  errorMessage.value = ''

  try {
    await login(email.value, password.value)
    await navigateTo('/dashboard')
  } catch (error) {
    const responseError = error as { data?: { message?: string }; statusMessage?: string }
    errorMessage.value =
      responseError.data?.message || responseError.statusMessage || '登录失败，请检查账号密码'
  }
}

function useDemoAccount(type: 'student' | 'admin') {
  email.value = type === 'admin' ? 'admin@example.com' : 'student@example.com'
  password.value = '123456'
}
</script>

<template>
  <section class="auth-layout">
    <div class="auth-copy">
      <p class="eyebrow">Day 2</p>
      <h1>登录与会话</h1>
      <p>
        这个页面会调用 <code>POST /api/auth/login</code>，服务端验证账号后写入 httpOnly cookie。
      </p>
    </div>

    <form class="auth-form" @submit.prevent="handleLogin">
      <label>
        邮箱
        <input v-model="email" type="email" autocomplete="email" />
      </label>

      <label>
        密码
        <input v-model="password" type="password" autocomplete="current-password" />
      </label>

      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>

      <div class="demo-accounts">
        <button type="button" class="secondary" @click="useDemoAccount('student')">
          普通用户
        </button>
        <button type="button" class="secondary" @click="useDemoAccount('admin')">
          管理员
        </button>
      </div>
    </form>
  </section>
</template>
