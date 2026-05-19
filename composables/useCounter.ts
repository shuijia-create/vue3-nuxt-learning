// composables 目录中的函数会被 Nuxt 自动导入。
// 函数名建议以 use 开头，这是 Vue 组合式 API 的常见命名习惯。
export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  function increase() {
    count.value += 1
  }

  function reset() {
    count.value = initialValue
  }

  return {
    count,
    increase,
    reset
  }
}
