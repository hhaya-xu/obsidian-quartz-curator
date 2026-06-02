# obsidian-quartz-curator — Introduction

> 英文版紧随中文版之后 | English version follows the Chinese version

---

## 中文版

### 这是什么

**obsidian-quartz-curator** 是一个 Codex CLI 技能——它帮你把 Obsidian 知识库从「默认 Quartz 白底黑字」变成「有设计感的学术网站」。

它不是一键美颜工具。它是一个**协作管线**：你（程序员）负责跑命令和复制粘贴，设计智能体负责告诉你「改成什么色值、多大字号、多少间距」。你不需要自己做设计决策。

### 谁适合用

| 你是什么状态 | 适不适合 |
|-------------|:--:|
| 会跑 `npx quartz build`，会 `git push` | ✅ 就是为你写的 |
| 看得懂 `color: #ede3cf` 但不知道 #ede3cf 和 #f8f2e8 哪个更适合做背景 | ✅ 设计智能体会告诉你 |
| 完全没用过命令行 | ❌ 需要先熟悉 Quartz 基础 |
| 想要一键全自动 | ❌ v0.5 是手工管线，诚实标注 |
| 有自己的设计师 | ✅ 设计师可以充当设计智能体角色 |

### 怎么工作

整个流程三步，全程约 15 分钟：

**1. 选方向（1 分钟）**

6 套预设设计方向，每套 7 个 CSS 变量（背景色、文字色、accent 色等），用数据表呈现，不用形容词。选一个方向就是选一套色板 + 字体栈。

| 方向 | 气质 | 适合 |
|------|------|------|
| 暖纸学术 | 纸墨质感、宋体、琥珀 accent | 学术知识库、数字策展 |
| 编辑杂志风 | 大衬线标题、奢侈留白 | 博客、深度长文 |
| 现代极简 | 系统字体、极细边框 | 技术文档、SaaS |
| 亲和人性化 | 大圆角、温暖色调 | 教育、社区 |
| 技术工具风 | 等宽字体、密集表格 | 运维面板、代码文档 |
| 粗野实验派 | 大字、不对称分栏 | 艺术、独立出版 |

**2. 逐 zone 替换（10 分钟）**

你的知识库页面被拆成 8 个 zone——顶栏、左栏、中栏、右栏、Footer、纸纹、布局、视口——每个 zone 对应一个 CSS diff 文件（`patch` 格式，跟 `git diff` 一样）。

打开 `custom.scss`，找到 `@zone:left-sidebar` 锚点，把 `zone5-left-sidebar.patch` 的内容替换进去。8 个 zone 逐一替换，

**3. 构建验证（3 分钟）**

```bash
npx quartz build
npx quartz build --serve  # 本地预览
# 浏览器打开 http://localhost:8080 确认效果
git add -A && git commit -m "应用暖纸学术 CSS" && git push
```

### 设计协作模式

这是这个技能最特别的地方。你不直接调色板、不拖拽、不写设计文档。你通过一个**结构化通信文件**跟设计智能体对话：

```
你（知识总管代理）：zone=left-sidebar 已部署，请验收
设计智能体：左侧栏滚动条宽度从 4px → 6px 需要调整，其他地方通过
你：收到，修改 custom.scss → 重新 build → 再次验收
```

设计智能体可以是你团队里的设计师，也可以是同一个 Codex 会话中的另一个代理。通信文件里的对话历史就是你的设计档案。

### 当前版本 v0.5b — 诚实的能力边界

- ✅ 6 套设计方向数据表（1 套含完整 CSS Patch）
- ✅ 8 个 `@zone` 锚点（顶栏、左栏、中栏、右栏、Footer、纸纹、布局、视口）
- ✅ 2 种布局模板（三栏 Quartz 默认 / 左中两栏）
- ✅ 部署前检查清单（5 条：字体本地 ✓、Grid 布局 ✓、sidebar padding ✓、单冒号 ✓、清缓存 ✓）
- ❌ 不包含一键全自动——当前是手工管线
- ❌ 不包含 CSS 自动校验
- ❌ 不包含 `folder-count` JS 注入

### 安装

```bash
codex skill install obsidian-quartz-curator
```

### 前置条件

- Node.js 18+
- 一个已初始化的 Quartz 项目（`npx quartz create`）
- Obsidian 知识库内容在 `content/` 目录

### 快速开始

在 Quartz 项目目录中启动 Codex，说一句话：

> 「用 obsidian-quartz-curator 发布我的知识库」

代理会引导你走完完整流程。

---

## English Version

### What It Is

**obsidian-quartz-curator** is a Codex CLI skill that helps you turn your Obsidian knowledge base from "default Quartz white background with black text" into a well-designed academic website.

It is not a one-click beautifier. It is a **collaboration pipeline**: you (the programmer) run commands and apply patches; a design agent tells you exactly what color values, font sizes, and spacing to use. You never need to make design decisions yourself.

### Who It Is For

| Your skill level | Fit |
|------------------|:--:|
| You can run `npx quartz build` and `git push` | ✅ Built for you |
| You understand `color: #ede3cf` but don't know whether #ede3cf or #f8f2e8 makes a better background | ✅ The design agent tells you |
| You have never used a terminal | ❌ Learn Quartz basics first |
| You want full automation with one click | ❌ v0.5 is a manual pipeline, honestly stated |
| You have your own designer | ✅ They can play the design agent role |

### How It Works

Three steps, roughly 15 minutes end-to-end:

**1. Pick a direction (1 minute)**

Six preset design directions. Each is a 7-variable CSS palette (background, text, accent, etc.) presented as a data table, not adjectives. Choosing a direction means choosing a color system + font stack.

| Direction | Vibe | Best for |
|-----------|------|----------|
| Warm Paper | Paper texture, serif, amber accent | Academic KBs, digital curation |
| Editorial Monocle | Large serif headlines, generous whitespace | Blogs, long-form essays |
| Modern Minimal | System fonts, hairline borders | Tech docs, SaaS |
| Human Approachable | Generous radii, warm tones | Education, community |
| Tech Utility | Monospace, dense tables | Dashboards, code docs |
| Brutalist Experimental | Oversized type, asymmetric layouts | Art, indie publishing |

**2. Apply zone patches (10 minutes)**

Your knowledge base page is split into 8 zones — topbar, left sidebar, center, right sidebar, footer, paper texture, layout, viewport — each corresponding to a CSS diff file in `patch` format (just like `git diff`).

Open `custom.scss`, find the `@zone:left-sidebar` anchor, replace its contents with `zone5-left-sidebar.patch`. Repeat for all 8 zones.

**3. Build and verify (3 minutes)**

```bash
npx quartz build
npx quartz build --serve  # local preview
# Open http://localhost:8080 in your browser to confirm
git add -A && git commit -m "Apply warm-paper CSS" && git push
```

### The Design Collaboration Model

This is what makes the skill unique. You don't tweak color palettes, drag sliders, or write design docs. You communicate with a design agent through a **structured communication file**:

```
You (knowledge steward agent): zone=left-sidebar deployed, please review
Design agent: Scrollbar width in left sidebar needs to change from 4px to 6px. Everything else passes.
You: Received, modifying custom.scss → rebuilding → re-reviewing
```

The design agent can be a designer on your team or another agent in the same Codex session. The communication file's history is your design archive.

### Current Version v0.5b — Honest Scope

- ✅ 6 design direction data tables (1 with complete CSS patches)
- ✅ 8 `@zone` anchors for `custom.scss`
- ✅ 2 layout templates (Quartz 3-column default / left-center 2-column)
- ✅ Pre-deployment checklist (5 items)
- ❌ No one-click automation — this is a manual pipeline
- ❌ No automatic CSS validation
- ❌ No `folder-count` JS injection

### Installation

```bash
codex skill install obsidian-quartz-curator
```

### Prerequisites

- Node.js 18+
- An initialized Quartz project (`npx quartz create`)
- Obsidian knowledge base content in `content/` directory

### Quick Start

Start Codex in your Quartz project directory and say:

> "Publish my knowledge base with obsidian-quartz-curator"

The agent will guide you through the full pipeline.
