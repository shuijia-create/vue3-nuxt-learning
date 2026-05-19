# 问题跟踪：本地 Markdown

这个仓库的需求、PRD、任务单都放在 `.scratch/` 目录下，用 Markdown 文件管理。

当前仓库没有 GitHub 或 GitLab 远程仓库，因此 `mattpocock/skills` 相关工程技能应优先使用本地文件，而不是调用远程 issue 系统。

## 目录约定

- 一个学习主题或功能点对应一个目录：`.scratch/<feature-slug>/`
- PRD 文件路径：`.scratch/<feature-slug>/PRD.md`
- 实现任务路径：`.scratch/<feature-slug>/issues/<NN>-<slug>.md`
- 任务编号从 `01` 开始递增
- 任务状态写在文件开头的 `Status:` 字段
- 可选分类写在文件开头的 `Category:` 字段，例如 `bug`、`enhancement`
- 讨论记录追加在 `## Comments` 标题下面

## 主题命名示例

- `nuxt-routing`
- `nuxt-auth-flow`
- `nuxt-server-api`
- `nuxt-learning-plan`

## 当技能提示“发布到 issue tracker”

在 `.scratch/<feature-slug>/` 下创建对应 Markdown 文件；如果目录不存在，先创建目录。

## 当技能提示“读取任务单”

直接读取 `.scratch/` 下对应的 Markdown 文件即可。
