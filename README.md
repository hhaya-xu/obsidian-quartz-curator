# obsidian-quartz-curator

将 Obsidian 知识库通过 Quartz 构建为可定制设计的静态网站。

## 安装

```bash
codex skill install obsidian-quartz-curator
```

## 前置条件

- Node.js 18+
- 一个已初始化的 Quartz 项目（`npx quartz create`）
- Obsidian 知识库内容已存在于 `content/` 目录

## 快速开始

1. 在 Quartz 项目目录中启动 Codex
2. 说："用 obsidian-quartz-curator 发布我的知识库"
3. 代理引导你完成 9 步管线（含 3 个前置步骤）：选择布局 → 选择设计方向 → 生成预览 → CSS 设计 → 部署 → 验收

## 版本

**v0.5b** — 半自动管线，面向有 Quartz 基础的程序员用户。
- 6 种设计方向（1 种含完整 CSS Patch 示例，5 种有数据表待设计智能体补全）
- 2 种布局模板（三栏 / 两栏）
- 结构化通信文件（zone 四区）
- `patches/example-warm-paper/` 为完整 CSS Patch 示例，展示 diff 格式和 @zone 分块规范

## 许可证

MIT



