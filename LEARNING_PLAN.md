# Nuxt 专项学习计划

你已经会 Vue，所以学习重点应该放在 Nuxt 相比 Vue SPA 多出来的能力：路由约定、布局、SSR、数据获取、服务端 API、中间件、权限、部署。

## 前 3 天跟敲路线

- [Day 1：Vue 开发者上手 Nuxt 约定](./docs/day-01.md)
- [Day 2：Nuxt 数据获取、Server API 与登录会话](./docs/day-02-login.md)
- [Day 3：Nuxt Middleware、页面权限与服务端权限边界](./docs/day-03-permission.md)

## 第 1 周：Nuxt 核心约定

- 第 1 天：跟敲 Day 1，掌握 `app.vue`、`layouts/`、`pages/`、`nuxt.config.ts`。
- 第 2 天：跟敲 Day 2，掌握 `server/api`、`useFetch`、`$fetch`、cookie 会话。
- 第 3 天：跟敲 Day 3，掌握 `middleware`、`definePageMeta`、登录保护和角色权限。
- 第 4 天：练习动态路由，完成 `pages/posts/[id].vue` 和 `pages/users/[id].vue`。
- 第 5 天：练习 layout，新增后台布局 `layouts/admin.vue`。
- 第 6 天：练习错误页，新增 `error.vue` 和 404 展示。
- 第 7 天：整理 Nuxt 文件约定清单。

## 第 2 周：SSR 与数据获取

- 第 1 天：比较 `useFetch`、`useAsyncData`、`$fetch` 的使用场景。
- 第 2 天：练习服务端渲染时的数据预取。
- 第 3 天：练习客户端事件请求，比如登录、提交表单、删除数据。
- 第 4 天：学习 `pending`、`error`、`refresh` 状态处理。
- 第 5 天：学习 cookie、headers、SSR 请求上下文。
- 第 6 天：给 `/admin` 页面新增服务端权限接口。
- 第 7 天：复盘 SSR 和 CSR 在 Nuxt 里的差异。

## 第 3 周：权限、插件和工程化

- 第 1 天：把 auth middleware 改成支持 redirect query。
- 第 2 天：新增 `editor` 角色和 `/editor` 页面。
- 第 3 天：学习 `plugins/`，写一个只在客户端运行的插件。
- 第 4 天：学习 `runtimeConfig`，区分 public 和 server-only 配置。
- 第 5 天：学习 `public/` 和 `assets/` 的区别。
- 第 6 天：运行 `npm run build`，观察 `.output/` 产物。
- 第 7 天：运行 `npm run preview`，验证生产构建。

## 第 4 周：Nuxt 实战项目

- 第 1 天：确定项目主题，例如后台管理、博客、课程系统。
- 第 2 天：设计路由表和 layout。
- 第 3 天：实现登录、退出、当前用户。
- 第 4 天：实现列表页和详情页。
- 第 5 天：实现服务端 API 权限判断。
- 第 6 天：处理加载态、错误态、空状态。
- 第 7 天：构建并写项目总结。
