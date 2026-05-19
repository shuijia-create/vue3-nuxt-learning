# Triage 状态标签

`mattpocock/skills` 使用五个标准 triage 状态。本仓库将它们映射为中文状态，方便本地 Markdown 工作流统一使用。

| mattpocock/skills 标准状态 | 本仓库状态名称 | 含义 |
| --- | --- | --- |
| `needs-triage` | `待处理` | 还需要维护者或学习者判断怎么处理 |
| `needs-info` | `待补信息` | 目前信息不够，需要补充后再继续 |
| `ready-for-agent` | `可交给Agent` | 需求已经足够明确，可以交给 Agent 执行 |
| `ready-for-human` | `需要人工` | 需要人来做设计判断、确认方向或手工验证 |
| `wontfix` | `不处理` | 当前决定不继续处理 |

对于 `.scratch/` 下的本地任务文件，状态通过文件开头的 `Status:` 字段记录，值使用右侧中文名称。

示例：

```md
Status: 可交给Agent
Category: enhancement
```
