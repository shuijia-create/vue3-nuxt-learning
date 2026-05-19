# Nuxt + Vue 3 + Vite 学习项目

这是一个面向 Vue 开发者的 Nuxt 学习项目。你已经会 Vue，所以这里重点学习 Nuxt 多出来的能力。

Nuxt 默认使用 Vue 3，并且默认通过 Vite 提供开发服务器和生产构建能力。通常不需要单独创建 `vite.config.ts`，Vite 配置可以写在 `nuxt.config.ts` 的 `vite` 字段中。

## 启动方式

```bash
npm install
npm run dev
```

访问：

```text
http://localhost:3000
```

## 学习顺序

1. 跟敲 [Day 1：Vue 开发者上手 Nuxt 约定](./docs/day-01.md)。
2. 跟敲 [Day 2：Nuxt 数据获取、Server API 与登录会话](./docs/day-02-login.md)。
3. 跟敲 [Day 3：Nuxt Middleware、页面权限与服务端权限边界](./docs/day-03-permission.md)。
4. 再按 [Nuxt 专项学习计划](./LEARNING_PLAN.md) 做完整练习。

## 项目目录

```text
app.vue                 # Nuxt 应用入口
layouts/default.vue     # 默认布局
nuxt.config.ts          # Nuxt 配置，也包含 Vite 配置
pages/                  # 文件路由
components/             # 自动导入组件
composables/            # 自动导入组合式函数
middleware/             # 路由中间件
server/api/             # 服务端 API
server/utils/           # 服务端工具函数
assets/css/main.css     # 全局样式
docs/                   # 跟敲学习文档
```

## 登录测试账号

普通用户：

```text
student@example.com
123456
```

管理员：

```text
admin@example.com
123456
```

## 常用命令

```bash
npm run dev       # 启动开发服务器
npm run build     # 构建生产版本
npm run preview   # 本地预览生产构建结果
npm run generate  # 生成静态站点
```
