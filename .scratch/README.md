# 本地任务区说明

这个目录是当前仓库给 `mattpocock/skills` 使用的本地问题跟踪区。

## 目录结构

```text
.scratch/
  <feature-slug>/
    PRD.md
    issues/
      01-some-task.md
      02-another-task.md
```

## 任务文件必填字段

每个任务文件开头至少包含：

```md
Status: 待处理
Category: enhancement
```

## 说明

- `Status:` 的可用值以 `docs/agents/triage-labels.md` 为准
- 一个学习主题或功能点使用一个目录
- 讨论记录统一追加到 `## Comments` 下
