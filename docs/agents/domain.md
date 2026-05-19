# 项目上下文文档

这个文件说明工程技能在探索仓库时，应该如何读取本项目的上下文文档。

## 开始之前优先读取

1. 根目录的 `CONTEXT.md`
2. `docs/adr/` 中和当前改动区域相关的架构决策
3. 如果任务涉及教学内容或学习路径，还要读取：
   - `docs/day-01.md`
   - `docs/day-02-login.md`
   - `docs/day-03-permission.md`
   - `LEARNING_PLAN.md`

如果某个文件和当前任务无关，可以跳过；如果文件不存在，也不要把它当成阻塞问题。

## 目录结构

这是一个单上下文仓库：

```text
/
|- CONTEXT.md
|- docs/
|  |- adr/
|  |- day-01.md
|  |- day-02-login.md
|  |- day-03-permission.md
|- pages/
|- components/
|- composables/
|- middleware/
|- server/
```

## 术语使用规则

- Nuxt 相关术语以 `CONTEXT.md` 为准
- 优先使用本仓库的教学用语，不要随意换成别的同义词
- 如果任务里出现新术语，先判断它是不是应该进入 glossary

## ADR 使用规则

如果某个修改方案和现有 ADR 冲突，需要明确指出，而不是静默覆盖。
