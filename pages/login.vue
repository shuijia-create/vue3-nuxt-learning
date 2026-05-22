<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const { user, loading, fetchUser, login } = useAuth()

const email = ref('student@example.com')
const password = ref('123456')
const errorMessage = ref('')

if (!user.value) {
  await fetchUser()
}

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
      responseError.data?.message || responseError.statusMessage || '登录失败，请检查账号和密码'
  }
}

function useDemoAccount(type: 'student' | 'admin') {
  email.value = type === 'admin' ? 'admin@example.com' : 'student@example.com'
  password.value = '123456'
}
</script>

<template>
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
</template>
