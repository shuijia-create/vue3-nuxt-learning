<template>
  <div class="auth-shell">
    <section class="auth-shell__intro">
      <p class="eyebrow">Nuxt Admin Study</p>
      <h1>登录后台</h1>
      <p>
        这个布局只负责登录场景。登录表单通过 <code>slot</code> 放进来，
        登录成功后再进入后台布局。
      </p>
    </section>

    <section class="auth-shell__panel" aria-label="登录表单">
      <slot />
    </section>
  </div>
</template>
