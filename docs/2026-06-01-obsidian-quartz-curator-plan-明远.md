# obsidian-quartz-curator 开发规划（修订版）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 Codex Skill `obsidian-quartz-curator`，实现 Obsidian 知识库 → Quartz 静态网站 → CSS 设计协作的半自动化管线（v0.5）。

**Architecture:** SKILL.md 作为主指令文件，6 步管线驱动代理完成布局选择→Quartz 构建→preview-base 生成→CSS 注入→部署上线。辅助文件包括沟通模板、设计方向表、部署检查清单、CSS Patch 示例库。用语全部中性化（伯喈→知识总管代理、文姬→设计智能体）。

**Tech Stack:** Markdown (SKILL.md), SCSS/CSS (Quartz custom.scss), TypeScript (Quartz config), Shell (build/deploy 命令)

**开发目录:** `D:\AI\Character\伯喈\quartz-publisher\`

## 执行模式

- **模式 A（推荐）：** 子代理自动执行全部任务（使用 superpowers:subagent-driven-development）
- **模式 B（备选）：** 伯喈手动执行，主公逐 Task 验收

> 主公确认模式后开工。

## 输入来源

| 来源 | 文件 | 用途 |
|------|------|------|
| 审固+伯喈 | `D:\AI\Character\伯喈\.shengu\memory.md` | v0.5 范围定义、审固 10 条批评、决策汇总 |
| 文姬 | `8zone-css-patches-文姬.md` | 智慧树暖纸系 8 区 CSS Patch |
| 文姬 | `方向对比表-文姬整理.md` | 6 设计方向数据表 |
| 文姬 | `首页功能规划-文姬方案.md` | 首页 CSS + Markdown 模板 |

## v0.5 边界标记说明

| 标记 | 含义 |
|:--:|------|
| ✅ | 已可用（脚本或步骤可直接执行） |
| ⚠️ | 当前手动操作，v1.0 将脚本化 |
| 📋 | 待实现（依赖外部输入或后续版本） |

---

## 文件结构

```
quartz-publisher/
├── SKILL.md                              # 主指令文件
├── README.md                             # GitHub 发布用
├── LICENSE                               # MIT
├── .gitignore                            # Node/Quartz 忽略
├── templates/
│   ├── communication-template.md         # zone=layout/design/review/issues 四区通信模板
│   ├── layout-three-column.md            # 左中右三栏 quartz.config.ts 片段
│   └── layout-two-column.md              # 左中两栏 quartz.config.ts 片段
├── references/
│   ├── 16-anchors-mapping.md            # 16 锚点 → Quartz Component 映射表
│   ├── deployment-checklist.md           # 部署前 5+3 checkbox
│   ├── preview-base-steps.md            # preview-base.html 生成 7 步序列
│   ├── design-directions.md             # 6 设计方向数据表（整理自文姬）
│   └── diff-format-spec.md              # CSS 变更 diff 格式规范
└── patches/
    └── example-warm-paper/               # ⚠️ 完整 CSS Patch 示例（展示 diff 格式 + @zone 分块规范）
        ├── zone1-viewport.patch
        ├── zone2-paper.patch
        ├── zone3-layout.patch
        ├── zone4-topbar.patch
        ├── zone5-left-sidebar.patch
        ├── zone6-center.patch            # 含首页元素 CSS（home-stats / project-cards / recent-notes / tag-cloud）
        ├── zone7-right-sidebar.patch
        └── zone8-footer.patch
```

---

### Task 1: 项目脚手架 ⚠️

**Files:**
- Create: `.gitignore`
- Create: `LICENSE`
- Create: 子目录 `templates/`, `references/`, `patches/example-warm-paper/`

- [ ] **Step 1: 创建目录结构**

```powershell
New-Item -ItemType Directory -Force -Path "D:\AI\Character\伯喈\quartz-publisher\templates"
New-Item -ItemType Directory -Force -Path "D:\AI\Character\伯喈\quartz-publisher\references"
New-Item -ItemType Directory -Force -Path "D:\AI\Character\伯喈\quartz-publisher\patches\example-warm-paper"
```

- [ ] **Step 2: 写入 .gitignore**

```
public/
.quartz-cache/
node_modules/
.DS_Store
*.log
```

- [ ] **Step 3: 写入 LICENSE (MIT)**

```
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: 验证目录结构**

```powershell
Get-ChildItem -Recurse "D:\AI\Character\伯喈\quartz-publisher" | Select-Object FullName
```

预期：`.gitignore`, `LICENSE`, `templates/`, `references/`, `patches/example-warm-paper/` 均存在。

---

### Task 2: SKILL.md — §0 角色前置声明 + 核心原则 ⚠️

**Files:**
- Create: `SKILL.md`

**修订要点：** 审固三条哲学原则必须进 §0（伯喈① + 审固确认）。

- [ ] **Step 1: 写入 SKILL.md 头部 + §0（含审固哲学原则）**

```markdown
---
name: obsidian-quartz-curator
description: 将 Obsidian 知识库通过 Quartz 构建为可定制设计的静态网站。管理从布局选择、CSS 注入到部署上线的完整管线，通过结构化通信文件与设计智能体协作。
---

# Obsidian Quartz Curator

> v0.5 | 半自动管线 | 面向有 Quartz 基础的程序员用户

## §0 角色前置声明与核心原则

### 角色定义

本 Skill 涉及两个角色，以下为中性化称谓：

| 占位符 | 含义 | 说明 |
|--------|------|------|
| `{curator}` | 知识总管代理 | 执行本 Skill 的代理，负责管线操作 |
| `{designer}` | 设计智能体 | 负责 CSS 设计与视觉方向选择的外部智能体 |
| `{user}` | 用户 | 知识库所有者，拥有视觉终审权 |

> **注意：** SKILL.md 全文使用上述占位符。在实际对话中，`{curator}` 即当前执行本 Skill 的代理，`{designer}` 即负责 CSS 的智能体，`{user}` 即发起请求的用户。

### 核心原则

1. **视觉验收不可自动化。** 所有 CSS 变更在部署后必须经用户肉眼确认。
   代理只负责"把 CSS 放对位置、构建不出错"——
   好不好看、符不符合预期，由用户在浏览器中判断。
   美是个人体验，管线不替代审美。

2. **代码是情绪中立的传输层。** 从设计智能体到 Quartz 站点，
   管线的唯一职责是保真传输——不改动一个色值、不"优化"一处留白。
   代理不做审美判断。

3. **能力边界诚实标注。** v0.5 面向有 Quartz 基础的程序员用户。
   不宣称"一键生成"，不假装小白友好。
   当前为半自动管线：Step 3（preview-base 生成）和 Step 4（CSS 合并）
   需代理手动操作，脚本化是 v1.0 目标。

4. **用户视觉终审权不变。** 整个管线中用户只做一件事——
   打开 preview-base.html 或线上站点 → 看渲染效果 → 说行/不行。
   用户永远不读代码、不读 diff、不读数据表。
```

- [ ] **Step 2: 写入 §1 概述（含决策汇总定位）**

```markdown
## §1 概述

### 做什么

将 Obsidian 知识库通过 [Quartz](https://quartz.jzhao.xyz/) 构建为静态网站，支持：
- 从 6 种预设设计方向中选择视觉风格
- 通过 Quartz Component 开关控制页面功能
- 生成 preview-base.html 供设计智能体注入 CSS
- 将设计智能体输出的 CSS 合并到 custom.scss
- 部署到 GitHub Pages（或用户指定平台）

### 能力边界（v0.5）

本 Skill 的定位是 **Obsidian + Quartz 管线的编排层**，不是万能页面生成器。
用户知识库通过 Quartz 构建为网站，管线负责配置、CSS 注入、部署的协作流程。

v0.5 不包含：
- ❌ 一键全自动导出（export-preview.ts / translate-css.ts 脚本化 → v1.0）
- ❌ 字体回退自动检测（→ v1.0）
- ❌ CSS 变量可视化编辑器（→ 独立项目）
- ❌ 多项目/多站点支持（→ v1.x）
- ❌ 小白友好的一键生成体验

### 前置条件

- 用户拥有一个已初始化的 Quartz 项目（`npx quartz create` 完成）
- 用户的知识库内容已存在于 `content/` 目录
- Node.js 18+ 已安装
- 设计智能体可用（用于 CSS 设计）

### 用户工作流

用户在整个流程中只做一件事：**打开 preview-base.html → 看渲染效果 → 说行/不行。**

```
用户写 MD → 设计智能体做 CSS → 代理生成 preview-base.html
                                    ↓
                             用户打开浏览器看
                                    ↓
                       说「行」→ 代理部署上线
                       说「不行」→ 描述哪里不对 → 设计智能体再改
```

用户永远不读代码、不读 diff、不读数据表。
diff/数据表/checkbox 是代理和设计智能体的内部语言。
```

---

### Task 3: SKILL.md — §2 管线总览 + §3 详细操作（Step 1~4） ⚠️

**Files:**
- Modify: `SKILL.md` (append)

- [ ] **Step 1: 写入管线总览 + Step 1 详解**

```markdown
## §2 管线总览（6 步）

```
Step 1 ──→ Step 2 ──→ Step 3 ──→ Step 4 ──→ Step 5 ──→ Step 6
布局+功能    结构生成    预览基底    CSS合并     部署上线    视觉验收
(代理+用户)  (代理)     (代理)     (代理+设计)  (代理)     (用户)
```

| 步骤 | 谁 | 做什么 | 输出 | 自动化 |
|------|-----|--------|------|:--:|
| Step 1 | `{curator}` + `{user}` | 选择布局、设计方向、Component 开关 | 通信文件 `zone=layout` | ⚠️ 手动 |
| Step 2 | `{curator}` | 配置 quartz.config.ts / quartz.layout.ts | 可构建的 Quartz 项目 | ✅ 直接执行 |
| Step 3 | `{curator}` | 生成 preview-base.html | `preview-base.html` | ⚠️ 手动（v1.0 脚本化） |
| Step 4 | `{designer}` → `{curator}` | 设计智能体输出 CSS Patch → 代理合并到 custom.scss | 更新后的 custom.scss | ⚠️ 手动（v1.0 脚本化） |
| Step 5 | `{curator}` | `npx quartz build` → 部署 | 线上站点 URL | ✅ 直接执行 |
| Step 6 | `{user}` | 浏览器中肉眼验收视觉效果 | 通过 / 修改 | 📋 不可自动化 |

### Step 1 详解：布局与功能选择

代理向用户提问，收集以下决策（一次一个问题）：

**Q1: 布局**
- A. 左中右三栏（240px / 1fr / 280px）— 推荐，适合有目录+反向链接的知识库
- B. 左中两栏（240px / 1fr）— 适合不需要右侧栏的知识库

**Q2: 设计方向**
- 智慧树暖纸系（学术知识库推荐）
- editorial-monocle 编辑杂志风
- modern-minimal 现代极简
- human-approachable 亲和人性化
- tech-utility 技术工具风
- brutalist-experimental 粗野实验派

> 详细色板+字体参数见 `references/design-directions.md`
> 当前仅智慧树暖纸系有完整 CSS Patch（`patches/example-warm-paper/`），其余方向有数据表、Patch 待设计智能体补充。

**Q3: Component 开关**（勾选需要的功能模块）
见 `references/16-anchors-mapping.md`。每个 Component 可独立开启/关闭。

将以上决策写入通信文件的 `zone=layout` 区。
```

- [ ] **Step 2: 写入 Step 2~4 详细操作**

```markdown
## §3 详细操作

### Step 2: 结构生成

代理根据 Step 1 的决策，执行：

1. 读取 `templates/layout-three-column.md` 或 `templates/layout-two-column.md`
2. 将其中的 grid-template-areas 配置写入 `quartz/styles/custom.scss` 的 `@zone:layout` 区
3. 根据用户勾选的 Component 列表，修改 `quartz.config.ts` 中对应组件的 enabled 状态
4. 确认 `quartz.layout.ts` 中 RecentNotes、TagList 等展示型组件已启用（如果用户选择了）
5. 运行 `npx quartz build` 验证配置无误

### Step 3: 生成 preview-base.html ⚠️ 手动操作

代理执行以下序列（手动操作，v1.0 将脚本化）：

> 详细步骤见 `references/preview-base-steps.md`

1. 确保 `quartz.config.ts` 已按用户选择配置
2. 运行 `npx quartz build`
3. 复制 `public/index.html` → `preview-base.html`
4. 在 `preview-base.html` 的 `</head>` 前注入：
   ```html
   <style id="design-css"></style>
   ```
5. 内联所有 `<link rel="stylesheet">` 为 `<style>` 块
6. 内联关键 JS（搜索、暗色模式切换等）
7. 删除 `public/` 和 `.quartz-cache/`（为下次干净构建准备）

### Step 4: CSS 合并 ⚠️ 手动操作

这是跨智能体协作的核心步骤。

**代理侧操作：**

1. 将 `preview-base.html` 通过通信文件的 `zone=design` 区交给设计智能体
2. 等待设计智能体在 `zone=design` 区回复 CSS 变更
3. 设计智能体的 CSS 变更以 diff 格式交付（见 `references/diff-format-spec.md`）：
   ```
   *** Begin Patch
   *** Update File: quartz/styles/custom.scss
   @@ @zone:viewport
   -background: #ede3cf;
   +background: #faf9f6;
   *** End Patch
   ```
4. 代理将 Patch 应用到 `quartz/styles/custom.scss` 对应 `@zone` 锚点下
5. 如果设计方向被更换，全局搜索替换色值（参考 `references/design-directions.md` 中目标方向的 CSS 变量表）

**注意：**
- 代理不修改设计智能体输出的任何色值——代码是情绪中立的传输层
- 代理仅负责"把 CSS 放对位置"
- 伪元素统一使用单冒号（`:before` `:after`）——Quartz 兼容性要求
```

---

### Task 4: SKILL.md — §4 部署与验收（Step 5~6）+ §5 通信文件模板 ⚠️

**Files:**
- Modify: `SKILL.md` (append)

- [ ] **Step 1: 写入 Step 5~6 + 通信模板**

```markdown
## §4 部署与验收

### Step 5: 部署上线

1. 执行部署前检查清单：`references/deployment-checklist.md`——逐条打勾
2. 运行 `npx quartz build`
3. 部署到目标平台（默认 GitHub Pages）：
   ```bash
   npx quartz sync
   ```
4. 将线上 URL 写入通信文件的 `zone=review` 区

### Step 6: 视觉验收

- `{user}` 在浏览器中打开线上 URL
- 肉眼确认：布局是否正确、色值是否协调、字体是否加载、移动端是否可读
- 通过 → 管线结束
- 不通过 → `{user}` 描述问题 → 回到 Step 4（设计智能体修改 CSS）

## §5 通信文件模板

代理在项目根目录创建 `design-collab.md`（或用户指定名称），内容如下：

```markdown
# 设计协作 · [项目名]

> `{curator}` → `{designer}`

## zone=layout

[代理在此描述：选定的布局（三栏/两栏）、勾选的 Component 列表、preview-base.html 路径]

## zone=design

[设计智能体在此回复：确认收到 / 疑问 / CSS diff 补丁]

## zone=review

[代理部署后在此贴线上链接，等待设计智能体确认]

## zone=issues

[双方在此记录待办/问题]
```

> 完整独立模板见 `templates/communication-template.md`
```

---

### Task 5: SKILL.md — §6 参考文件索引 + §7 版本路线 ⚠️

**Files:**
- Modify: `SKILL.md` (append)

- [ ] **Step 1: 写入 §6 §7 收尾**

```markdown
## §6 参考文件索引

| 文件 | 用途 |
|------|------|
| `references/16-anchors-mapping.md` | 16 锚点 → Quartz Component 映射表 |
| `references/deployment-checklist.md` | 部署前 5+3 检查清单 |
| `references/preview-base-steps.md` | preview-base.html 生成详细步骤 |
| `references/design-directions.md` | 6 设计方向数据表（色板+字体+约束） |
| `references/diff-format-spec.md` | CSS 变更 diff 格式规范 |
| `templates/communication-template.md` | zone 四区通信模板 |
| `templates/layout-three-column.md` | 左中右三栏布局配置 |
| `templates/layout-two-column.md` | 左中两栏布局配置 |
| `patches/example-warm-paper/` | 完整 CSS Patch 示例（展示 diff 格式和 @zone 分块规范） |

## §7 版本路线

| 版本 | 内容 |
|------|------|
| **v0.5**（当前） | SKILL.md + 全部模板/参考文件 + example-warm-paper Patch 示例 + ⚠️ 半自动管线（Step 3/4 手动） |
| **v0.6~0.7** | 其余 5 方向 Patch 补全 + translate-css.ts 脚本化 |
| **v1.0** | export-preview.ts 脚本化 + translate-css.ts 完善 + 字体回退检测 + ✅ 全自动管线 |
| **v1.x** | 多项目/多站点支持 |

---

*obsidian-quartz-curator · v0.5 · Codex Skill*
```

- [ ] **Step 2: 验证 SKILL.md 完整性**

自检清单：
- [ ] §0 角色前置声明 + 审固四条核心原则（含视觉验收不可自动化 / 代码情绪中立 / 能力边界 / 用户终审权）
- [ ] §1 概述（做什么 / 能力边界 / 前置条件 / 用户工作流）
- [ ] §2 管线总览（6 步 + 自动化标记 + Step 1 详解）
- [ ] §3 详细操作（Step 2~4）
- [ ] §4 部署与验收（Step 5~6）
- [ ] §5 通信文件模板
- [ ] §6 参考文件索引
- [ ] §7 版本路线

---

### Task 6: 通信文件模板 ⚠️

**Files:**
- Create: `templates/communication-template.md`

- [ ] **Step 1: 写入通信模板**

```markdown
# 设计协作 · 通信文件模板

> 本文件是 `{curator}` 与 `{designer}` 之间的结构化通信载体。
> 以 Markdown 文件形式存放在项目根目录，双方通过 `@zone` 标注分区读写。

---

## zone=layout

<!-- `{curator}` 在此写入：布局选择、Component 开关、preview-base.html 路径 -->

**布局:** [三栏 / 两栏]

**设计方向:** [智慧树暖纸系 / editorial-monocle / ...]

**启用的 Component:**
- [ ] Explorer（左侧文件树）
- [ ] TableOfContents（右侧目录）
- [ ] Backlinks（反向链接）
- [ ] Graph（关系图谱）
- [ ] RecentNotes（最近更新）
- [ ] TagList（标签列表）
- ...（完整列表见 references/16-anchors-mapping.md）

**preview-base.html 路径:** `./preview-base.html`

---

## zone=design

<!-- `{designer}` 在此写入：确认 / 疑问 / CSS diff 补丁 -->

```
*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ @zone:xxx
-old
+new
*** End Patch
```

---

## zone=review

<!-- `{curator}` 部署后在此写入：线上 URL -->

**线上地址:** https://xxx.github.io/xxx

**部署时间:** YYYY-MM-DD HH:MM

**待确认:**
- [ ] 布局是否正确
- [ ] 色值是否协调
- [ ] 字体是否加载
- [ ] 移动端是否可读

---

## zone=issues

<!-- 双方在此记录待办/问题 -->

- [ ] ...
```

---

### Task 7: 布局模板（三栏 + 两栏） ⚠️

**Files:**
- Create: `templates/layout-three-column.md`
- Create: `templates/layout-two-column.md`

- [ ] **Step 1: 写入三栏布局模板**

```markdown
# 左中右三栏布局

> 适用：有目录 + 反向链接 / 关系图谱的知识库
> Grid: 240px / 1fr / 280px

## quartz/styles/custom.scss — @zone:layout

```scss
/* @zone:layout */
.page {
  display: grid;
  grid-template: auto 1fr auto / 240px 1fr 280px;
  max-width: 100vw;
  min-height: 100vh;
}

.page-header {
  grid-column: 1 / -1;
}

.left.sidebar {
  grid-column: 1;
  overflow-y: auto;
}

.center {
  grid-column: 2;
  padding: 48px 40px;
  max-width: 100%;
}

.right.sidebar {
  grid-column: 3;
  overflow-y: auto;
}

.page-footer {
  grid-column: 1 / -1;
}
```

## quartz.config.ts — 三栏布局配置

```typescript
// 确保以下 Component 在配置中启用（根据用户选择）
Component.DesktopOnly(Component.Explorer()),       // 左侧
Component.DesktopOnly(Component.TableOfContents()), // 右侧
Component.Backlinks(),                              // 右侧
```
```

- [ ] **Step 2: 写入两栏布局模板**

```markdown
# 左中两栏布局

> 适用：不需要右侧栏的知识库
> Grid: 240px / 1fr

## quartz/styles/custom.scss — @zone:layout

```scss
/* @zone:layout */
.page {
  display: grid;
  grid-template: auto 1fr auto / 240px 1fr;
  max-width: 100vw;
  min-height: 100vh;
}

.page-header {
  grid-column: 1 / -1;
}

.left.sidebar {
  grid-column: 1;
  overflow-y: auto;
}

.center {
  grid-column: 2;
  padding: 48px 40px;
  max-width: 100%;
}

.page-footer {
  grid-column: 1 / -1;
}
```

## quartz.config.ts — 两栏布局配置

```typescript
// 禁用右侧栏相关 Component
// Component.TableOfContents() — 不启用
// Component.Backlinks() — 不启用
Component.DesktopOnly(Component.Explorer()), // 左侧
```
```

---

### Task 8: 参考文件（preview-base + 部署清单 + 锚点映射） ⚠️

**Files:**
- Create: `references/preview-base-steps.md`
- Create: `references/deployment-checklist.md`
- Create: `references/16-anchors-mapping.md`

> 三个独立参考文件合并为 1 个 Task，逻辑紧凑。

- [ ] **Step 1: 写入 preview-base 生成步骤**

```markdown
# preview-base.html 生成步骤

> v0.5 ⚠️ 手动操作 | v1.0 将由 export-preview.ts 脚本化

## 操作序列

### 1. 确认配置

确保 `quartz.config.ts` 已按用户选择配置 Component 开关。

### 2. 构建 Quartz

```bash
npx quartz build
```

### 3. 复制首页

```bash
cp public/index.html preview-base.html
```

### 4. 注入 style 占位

在 `preview-base.html` 的 `</head>` 前插入：

```html
<style id="design-css"></style>
```

### 5. 内联样式表

将所有 `<link rel="stylesheet" href="...">` 替换为内联 `<style>`：
- 读取每个 CSS 文件内容
- 替换 `<link>` 为 `<style>/* 文件内容 */</style>`

### 6. 内联关键 JS

将搜索、暗色模式切换等关键 JS 内联为 `<script>` 块。

### 7. 清理构建产物

```bash
rm -rf public/ .quartz-cache/
```

## 最终产物

`preview-base.html` — 一个自包含的 HTML 文件，包含：
- 完整 DOM 结构
- 内联 CSS（可用 `<style id="design-css">` 覆盖）
- 内联 JS（搜索等交互功能）
- 无需本地服务器即可在浏览器中打开
```

- [ ] **Step 2: 写入部署检查清单**

```markdown
# Quartz 部署前检查清单

> 代理在 `npx quartz build` 前逐条打勾

## 核心检查（5 条 — 不改不能发）

- [ ] 1. **fontOrigin: "local"** — 非 local 则中文字体丢失
- [ ] 2. **custom.scss 已覆盖 base.scss 的 grid-template-areas** — 否则布局不生效
- [ ] 3. **.sidebar padding 已清零** — 无残留 Quartz 默认 padding（"黄边"问题）
- [ ] 4. **所有伪元素使用单冒号** — `:after` 非 `::after`（Quartz 兼容性）
- [ ] 5. **`rm -rf public/ .quartz-cache/` 已执行** — 干净构建

## 扩展检查（3 条 — 建议执行）

- [ ] 6. 中文字体栈包含系统回退字体（SimSun / PingFang SC / Microsoft YaHei）
- [ ] 7. 移动端视口 `< 720px` 时布局可读
- [ ] 8. `content/index.md` 存在且有首页内容
```

- [ ] **Step 3: 写入 16 锚点映射表**

```markdown
# 16 锚点 → Quartz Component 映射表

> v0.5 | 14 个内置 Component + 2 个需额外注入

## 页面结构锚点

| # | 锚点 | Quartz Component | 状态 | 说明 |
|---|------|-----------------|:--:|------|
| 1 | viewport | — (全局样式) | ✅ | html, body 级别 CSS |
| 2 | paper | — (全局样式) | ✅ | 纸纹/背景纹理 |
| 3 | layout | — (Grid 重写) | ✅ | CSS Grid 布局定义 |
| 4 | topbar | Component.PageTitle() | ✅ | 顶栏（站点标题 + 导航） |
| 5 | left-sidebar | Component.Explorer() | ✅ | 左侧文件树 |
| 6 | center | Component.Content() | ✅ | 主内容区（必选） |
| 7 | right-sidebar | Component.TableOfContents() + Component.Backlinks() | ✅ | 右侧目录 + 反向链接 |
| 8 | footer | Component.Footer() | ✅ | 页脚 |

## 功能型锚点（可选用）

| # | 锚点 | Quartz Component | 状态 | 说明 |
|---|------|-----------------|:--:|------|
| 9 | search | Component.Search() | ✅ | 搜索功能 |
| 10 | graph | Component.Graph() | ✅ | 关系图谱 |
| 11 | backlinks | Component.Backlinks() | ✅ | 反向链接 |
| 12 | recent-notes | Component.RecentNotes() | ✅ | 最近更新列表 |
| 13 | tag-list | Component.TagList() | ✅ | 标签列表 |
| 14 | darkmode | Component.Darkmode() | ✅ | 暗色模式切换 |
| 15 | breadcrumbs | Component.Breadcrumbs() | ✅ | 面包屑导航 |
| 16 | spacer | Component.Spacer() | ✅ | 弹性空白区 |

## 需额外注入的锚点

| # | 锚点 | 注入方式 | 状态 | 说明 |
|---|------|---------|:--:|------|
| 17 | site-subtitle | markdown frontmatter + CSS | ⚠️ | 需在 quartz.config.ts 中注入自定义文本 |
| 18 | folder-count | JS 注入 Explorer.tsx | ⚠️ | 需修改 Explorer 组件源码 |

> ⚠️ = 不勾选时不渲染。✅ = 即插即用，在 quartz.config.ts 中开关。
```

---

### Task 9: design-directions.md — 整理已有文姬文件 ⚠️

**Files:**
- Create: `references/design-directions.md`

> **修订要点（伯喈③ + 审固确认）：** 不从头创建，而是基于已有 `方向对比表-文姬整理.md` 整理为标准化格式，去重叠。

- [ ] **Step 1: 读取已有文件，标准化输出**

以 `D:\AI\Character\伯喈\quartz-publisher\方向对比表-文姬整理.md` 为输入，整理为以下格式：

```markdown
# 设计方向数据表

> 供代理在 Step 1 向用户展示选型参考。来源：设计智能体。
> 每个方向定义 7 个 CSS 变量 + 字体配对 + 布局约束。

## 六方向速查

| 方向 | ID | 底色 | 墨色 | 淡墨 | 边线 | accent | 标题字体 | 正文字体 | Patch |
|------|----|------|------|------|------|--------|---------|---------|:--:|
| **智慧树暖纸** | wisdom-tree | #ede3cf | #1c1814 | #6b5f52 | #d4c9b0 | #b8860b 琥珀 | 宋体 | 宋体 | ✅ |
| 编辑杂志风 | editorial-monocle | #faf9f6 | #2d2a24 | #6b6358 | #e6e3db | #b85c3a 砖红 | serif | sans | 📋 |
| 现代极简 | modern-minimal | #fafbfb | #1d2125 | #777c82 | #e8eaec | #3b82f6 科技蓝 | sans | sans | 📋 |
| 亲和人性化 | human-approachable | #f8f9fa | #1e293b | #64748b | #e2e8f0 | #10b981 翡翠绿 | sans | sans | 📋 |
| 技术工具风 | tech-utility | #f8f9fb | #1e293b | #64748b | #e2e8f0 | #22c55e 终端绿 | sans | sans | 📋 |
| 粗野实验派 | brutalist-experimental | #f8f9fa | #1a1a1a | #595959 | #1a1a1a | #e03c28 警报红 | serif | mono | 📋 |

> ✅ = 完整 CSS Patch 可用 | 📋 = 数据表已有，Patch 待设计智能体补充

## 各方向 CSS 变量

### 智慧树暖纸系（wisdom-tree）

```css
:root {
  --bg:      #ede3cf;
  --surface: #f4efe2;
  --fg:      #1c1814;
  --muted:   #6b5f52;
  --border:  #d4c9b0;
  --accent:  #b8860b;
  --code-bg: #f4efe2;
}
```
- 字体：全站宋体（Noto Serif SC / Songti SC / SimSun）
- Patch：`patches/example-warm-paper/`（8 区完整示例）

### editorial-monocle 编辑杂志风

```css
:root {
  --bg:      #faf9f6;
  --surface: #ffffff;
  --fg:      #2d2a24;
  --muted:   #6b6358;
  --border:  #e6e3db;
  --accent:  #b85c3a;
  --code-bg: #f4f2ed;
}
```
- 字体：serif display + sans body
- Patch：📋 待设计智能体补充

### modern-minimal 现代极简

```css
:root {
  --bg:      #fafbfb;
  --surface: #ffffff;
  --fg:      #1d2125;
  --muted:   #777c82;
  --border:  #e8eaec;
  --accent:  #3b82f6;
  --code-bg: #f4f5f7;
}
```
- 字体：system sans 全站统一
- Patch：📋 待设计智能体补充

### human-approachable 亲和人性化

```css
:root {
  --bg:      #f8f9fa;
  --surface: #ffffff;
  --fg:      #1e293b;
  --muted:   #64748b;
  --border:  #e2e8f0;
  --accent:  #10b981;
  --code-bg: #f1f5f9;
}
```
- 字体：sans display + system body
- Patch：📋 待设计智能体补充

### tech-utility 技术工具风

```css
:root {
  --bg:      #f8f9fb;
  --surface: #ffffff;
  --fg:      #1e293b;
  --muted:   #64748b;
  --border:  #e2e8f0;
  --accent:  #22c55e;
  --code-bg: #f1f5f9;
}
```
- 字体：sans 全站 + mono 代码
- Patch：📋 待设计智能体补充

### brutalist-experimental 粗野实验派

```css
:root {
  --bg:      #f8f9fa;
  --surface: #ffffff;
  --fg:      #1a1a1a;
  --muted:   #595959;
  --border:  #1a1a1a;
  --accent:  #e03c28;
  --code-bg: #f0f0f0;
}
```
- 字体：serif display + mono body
- Patch：📋 待设计智能体补充

## 方向匹配建议

| 知识库类型 | 推荐方向 | 备选 |
|-----------|---------|------|
| 学术/研究笔记 | **智慧树** 或 editorial-monocle | brutalist-experimental |
| 技术文档/API | tech-utility | modern-minimal |
| 个人博客/散文 | editorial-monocle | human-approachable |
| 团队内部文档 | modern-minimal | tech-utility |
| 设计作品集 | brutalist-experimental | editorial-monocle |
| 数字展览/策展 | **智慧树** 或 editorial-monocle | brutalist-experimental |
```

---

### Task 10: diff-format-spec.md — 先检查 SKILL.md §5 覆盖，仅补缺 ⚠️

**Files:**
- Create: `references/diff-format-spec.md`（仅在 SKILL.md 未覆盖时创建）

> **修订要点（伯喈③ + 审固确认）：** 先检查 SKILL.md §5 是否已覆盖 diff 格式规范，避免重复。仅补缺失部分。

- [ ] **Step 1: 检查 SKILL.md §5 是否已覆盖 diff 规范**

SKILL.md §5（通信文件模板）中已包含 diff Patch 的格式示例。检查以下要点是否已在 SKILL.md 中覆盖：

| 检查项 | SKILL.md §5 是否覆盖？ |
|--------|:--:|
| `*** Begin Patch` / `*** End Patch` 格式 | ✅ §5 Step 4 有完整示例 |
| `@@ @zone:xxx` 目标锚点标注 | ✅ §5 Step 4 有示例 |
| `-` 删除 / `+` 新增 符号 | ✅ §5 Step 4 有示例 |
| 色值全部 HEX | ❌ 未明确 |
| 伪元素单冒号 | ❌ 在 §3 Step 4 注意中提到，但 §5 未重复 |
| 不加 `!important` | ❌ 未明确 |
| 一个 zone 一个 Patch 块 | ❌ 未明确 |
| 8 个 zone 锚点参考清单 | ❌ 未覆盖 |

结论：基本格式已在 SKILL.md §5 覆盖，但约束规则（HEX / 单冒号 / 无 !important / 一区一块）和 zone 清单需要独立文件补充。

- [ ] **Step 2: 仅写补充内容**

```markdown
# CSS 变更 diff 格式规范

> 设计智能体 → 知识总管代理的 CSS 交付格式
> 基本格式示例见 SKILL.md §5 Step 4，本文件补充约束规则和 zone 参考。

## 约束规则

1. **一个 zone 一个 Patch 块。** 不要在一个 Patch 中修改多个 zone。
2. **色值全部 HEX。** 不用 rgb() / hsl()。
3. **伪元素单冒号。** `:before` `:after` 非 `::before` `::after`。
4. **不加 `!important`。** 用选择器优先级覆盖，不用强制覆盖。
5. **每个 Patch 以 `@@ @zone:xxx` 标注目标锚点。** 代理据此定位 custom.scss 中的插入位置。

## 8 个 zone 锚点参考

| @zone | 对应区域 |
|-------|---------|
| @zone:viewport | html, body 全局样式 |
| @zone:paper | 纸纹/背景纹理 |
| @zone:layout | CSS Grid 布局 |
| @zone:topbar | 顶栏 |
| @zone:left-sidebar | 左侧文件树 |
| @zone:center | 主内容区（含首页特殊样式） |
| @zone:right-sidebar | 右侧目录+反向链接 |
| @zone:footer | 页脚 |
```

---

### Task 11: CSS Patch 文件 — 拆分文姬 8-zone + 融合首页 CSS ⚠️

**Files:**
- Create: `patches/example-warm-paper/zone1-viewport.patch`
- Create: `patches/example-warm-paper/zone2-paper.patch`
- Create: `patches/example-warm-paper/zone3-layout.patch`
- Create: `patches/example-warm-paper/zone4-topbar.patch`
- Create: `patches/example-warm-paper/zone5-left-sidebar.patch`
- Create: `patches/example-warm-paper/zone6-center.patch`
- Create: `patches/example-warm-paper/zone7-right-sidebar.patch`
- Create: `patches/example-warm-paper/zone8-footer.patch`

> **修订要点：**
> - 伯喈⑤+审固确认：合并原 Task 11~14（锚点/方向/diff/Patch）→ 本 Task 仅处理 Patch 拆分
> - 审固⑥：目录名 `wisdom-tree-warm-paper` → `example-warm-paper`，明确标注为"完整 CSS Patch 示例"
> - 文姬 `8zone-css-patches-文姬.md` 为输入源

- [ ] **Step 1: 从文姬文件提取 8 个 Patch**

以 `D:\AI\Character\伯喈\quartz-publisher\8zone-css-patches-文姬.md` 为输入，将每个 `*** Begin Patch ... *** End Patch` 块提取为独立 `.patch` 文件：

| 源 Zone | 目标文件 |
|---------|---------|
| Zone 1: viewport | `patches/example-warm-paper/zone1-viewport.patch` |
| Zone 2: paper | `patches/example-warm-paper/zone2-paper.patch` |
| Zone 3: layout | `patches/example-warm-paper/zone3-layout.patch` |
| Zone 4: topbar | `patches/example-warm-paper/zone4-topbar.patch` |
| Zone 5: left-sidebar | `patches/example-warm-paper/zone5-left-sidebar.patch` |
| Zone 6: center | `patches/example-warm-paper/zone6-center.patch` |
| Zone 7: right-sidebar | `patches/example-warm-paper/zone7-right-sidebar.patch` |
| Zone 8: footer | `patches/example-warm-paper/zone8-footer.patch` |

Zone 1~5, 7~8 内容原样保留（文姬产出已是高质量终稿）。

- [ ] **Step 2: Zone 6 融合首页 CSS**

在 zone6-center.patch 中追加文姬「首页功能规划」的 4 个 CSS 块：
- `.home-stats` — Hero 统计 strip
- `.project-cards` / `.project-card` — 2×2 项目入口卡片
- `.recent-notes` — 最近更新列表
- `.tag-cloud` — 标签云

融合后 Zone 6 Patch 结构：

```
*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ @zone:center
+.center article { ... }     ← 文姬原 Zone 6 正文样式
+
+/* === 首页元素 === */
+
+.home-stats { ... }         ← 文姬首页 CSS
+.project-cards { ... }
+.recent-notes { ... }
+.tag-cloud { ... }
*** End Patch
```

- [ ] **Step 3: 首页 Markdown 模板写入注释**

在 zone6-center.patch 末尾添加 HTML 注释块，包含首页 Markdown 模板引用：

```html
<!--
  首页 Markdown 模板（写入 content/index.md）：
  完整模板见：D:\AI\Character\伯喈\quartz-publisher\首页功能规划-文姬方案.md §3.2
  
  ## 探索项目
  <div class="project-cards">
    <a href="..." class="project-card">
      <div class="card-icon">策</div>
      <div class="card-title">项目名</div>
      <div class="card-desc">描述</div>
    </a>
  </div>
-->
```

- [ ] **Step 4: 验证 8 个 Patch 文件**

```powershell
Get-ChildItem "D:\AI\Character\伯喈\quartz-publisher\patches\example-warm-paper" | Select-Object Name, Length
```

预期：8 个文件，每个 > 100 字节。

---

### Task 12: README.md ⚠️

**Files:**
- Create: `README.md`

- [ ] **Step 1: 写入 README**

```markdown
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
3. 代理引导你完成 6 步管线：选择布局 → 选择设计方向 → 生成预览 → CSS 设计 → 部署 → 验收

## 版本

**v0.5** — 半自动管线，面向有 Quartz 基础的程序员用户。
- 6 种设计方向（1 种含完整 CSS Patch 示例，5 种有数据表待设计智能体补全）
- 2 种布局模板（三栏 / 两栏）
- 结构化通信文件（zone 四区）
- `patches/example-warm-paper/` 为完整 CSS Patch 示例，展示 diff 格式和 @zone 分块规范

## 许可证

MIT
```

---

### Task 13: 最终审查与交叉验证 ⚠️

**Files:**
- 审查: 全部文件

> **修订要点（审固⑧）：** 核对表增加主公两条原则 M1（视觉终审权）、M2（代码不带情绪）。

- [ ] **Step 1: 文件完整性检查**

```powershell
Get-ChildItem -Recurse -File "D:\AI\Character\伯喈\quartz-publisher" | Select-Object FullName, Length
```

对照文件结构表，确认全部文件存在且非空。

- [ ] **Step 2: 审固 8 条要求逐项核对**

| # | 审固要求 | 对应文件 | ✓ |
|---|---------|---------|:--:|
| 1 | 用语中性化 | SKILL.md §0 | |
| 2 | 脚本状态诚实标注 | SKILL.md §1 (不做什么) + §2 (自动化标记) + §7 | |
| 3 | 原始需求差异标注（Quartz 驱动） | SKILL.md §1 (能力边界) | |
| 4 | preview-base 生成步骤 | references/preview-base-steps.md | |
| 5 | 沟通文件模板 | templates/communication-template.md + SKILL.md §5 | |
| 6 | checkbox 检查清单 | references/deployment-checklist.md | |
| 7 | 锚点状态标注（✅/⚠️） | references/16-anchors-mapping.md | |
| 8 | README+LICENSE+.gitignore | 对应文件 | |

- [ ] **Step 3: 审固三条哲学原则核对**

| # | 哲学原则 | SKILL.md 位置 | ✓ |
|---|---------|-------------|:--:|
| P1 | 视觉验收不可自动化 | §0 核心原则 1 | |
| P2 | 代码是情绪中立的传输层 | §0 核心原则 2 + §3 Step 4 注意 | |
| P3 | 能力边界诚实标注 | §0 核心原则 3 + §1 能力边界 | |

- [ ] **Step 4: 主公原则核对（新增）**

| # | 主公原则 | 验证方式 | ✓ |
|---|---------|---------|:--:|
| M1 | **视觉终审权不变** — 所有 CSS 变更部署后必须经用户肉眼确认 | SKILL.md §0 核心原则 1 + §1 用户工作流 | |
| M2 | **美是个人体验，代码不带情绪** — 管线不做审美判断 | SKILL.md §0 核心原则 2 + §4 Step 6 | |

- [ ] **Step 5: 文姬产出融合核对**

| 文姬文件 | 融合位置 | ✓ |
|---------|---------|:--:|
| 8zone-css-patches | patches/example-warm-paper/ (8 个 .patch) | |
| 方向对比表 | references/design-directions.md（整理后） | |
| 首页 CSS（4 块） | patches/example-warm-paper/zone6-center.patch（融合） | |
| 首页 Markdown 模板 | zone6-center.patch 注释区 | |

- [ ] **Step 6: v0.5 边界标记核对**

| Task | 自动化状态 | 验证方式 | ✓ |
|------|:--:|---------|:--:|
| Step 3 preview-base 生成 | ⚠️ 手动 | SKILL.md + preview-base-steps.md 标注 v1.0 脚本化 | |
| Step 4 CSS 合并 | ⚠️ 手动 | SKILL.md + diff-format-spec.md 标注 v1.0 脚本化 | |
| Step 5 部署 | ✅ 已可用 | SKILL.md 标注直接执行 | |
| 其余 5 方向 Patch | 📋 待补充 | design-directions.md 标注 📋 | |
| example-warm-paper/ | ✅ 当前可用 | 8 个 .patch 文件存在 | |

- [ ] **Step 7: 对文姬的缺口记录**

在通信文件 `zone=issues` 区或独立记录以下待设计智能体补充项：
- [ ] 其余 5 个设计方向的 8-zone Patch（当前仅 example-warm-paper 可用；方向表已有色值，按 diff-format-spec.md 规范出 Patch）
- [ ] 首页 Markdown 模板中项目卡片的具体链接路径（当前为占位符）
- [ ] 确认 `--wj-` 前缀在 custom.scss 中的使用策略（当前 Patch 使用直接色值）

---

*明远 · 开发规划（修订版）· 2026-06-02*
*修订来源：伯喈 5 条 + 审固 3 条*

---


## 补丁 v2（精简版）：主公两道审核机制（审固+严律审核通过 · 2026-06-02）

> 伯喈提案 → 明远 v1 补丁（5 步）→ 审固精简判断 → 严律二次审核 → **最终方案：仅改 SKILL.md 2 处。**

---

### 改动 1：SKILL.md §1 用户工作流 — 标注两次审核

将当前「用户工作流」段落替换为：

```markdown
### 用户工作流（两次审核）

用户在整个流程中做两次审核，只靠肉眼，不读代码：

- **第一关（部署前）：** 打开 preview-base.html → 「视觉对不对」→ 通过进 Step 4，不通过回 Step 3
- **第二关（部署后）：** 打开线上站 → 「和预览一致吗」→ 通过完成，不通过代理排查

diff/数据表/checkbox 是代理和设计智能体的内部语言，用户不接触。
```

### 改动 2：SKILL.md §2 Step 6 — 验收循环替换为两道审核

将当前 Step 6 完整替换为：

```markdown
### Step 6: 两道审核

#### 第一关：preview-base 审核（部署前）

1. 用户在浏览器中打开 preview-base.html
2. 肉眼确认：布局、色值、字体、设计方向是否符合预期
3. 通过 → 进入 Step 4（CSS 合并）→ Step 5（部署）
4. 不通过 → 用户描述问题 → 回到 Step 3（设计智能体改 CSS）

#### 第二关：线上站审核（部署后，根本审核）

1. 用户打开线上站 URL
2. 对比 preview-base.html 与线上站——视觉是否一致？
3. 通过 → 发布完成，管线结束
4. 不通过 → 定位问题来源（三种之一）：

| # | 问题 | 根因 | 修复 |
|---|------|------|------|
| 1 | 线上站和 preview-base 视觉不一致 | 代理 Quartz 转译出错 | 代理排查 → 修复 → 重新部署 |
| 2 | 某个 @zone 样式没生效 | 代理锚点映射理解错误 | 代理核查 @@ @zone:xxx ↔ /* @zone:xxx */ |
| 3 | preview-base 本身就不对 | 设计智能体 CSS 写错 | 第一关已拦截——不会到达第二关 |

> 当两个前提条件满足（锚点对应严格执行 + DOM 同源），问题 2/3 概率趋近于零，只剩问题 1。

#### 循环规则

- 纯样式问题 → 回到 Step 3（设计智能体改 CSS）
- 结构/功能变更 → 回到 Step 1（重新选择布局/功能）
```

---

### v0.5 不做的 3 项（→ v0.6）

| # | 原补丁内容 | 审固/严律判断 | 去向 |
|---|-----------|:--:|------|
| 1 | SKILL.md §7 checklist 收敛机制 | ❌ 砍 | → v0.6 |
| 2 | 新建 references/two-stage-review.md | ❌ 砍（Step 6 已完整） | → v0.6 评估 |
| 3 | deployment-checklist.md 加收敛标注 | ❌ 砍 | → v0.6 |

---

### 执行分工

| 步骤 | 谁 | 做什么 |
|:--:|-----|--------|
| 1 | 审固+严律 | ✅ 已审核——本补丁即最终方案 |
| 2 | 伯喈 | 修改 SKILL.md 2 处（§1 + §2 Step 6） |
| 3 | 严律 | 复审 2 处修改 |

---

*明远 · 补丁 v2 · 2026-06-02*
