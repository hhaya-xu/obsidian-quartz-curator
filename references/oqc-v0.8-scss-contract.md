# oqc-v0.8-scss-contract.md

> SCSS 选择器契约文档
> 版本：v0.1（P0 早期草案）
> 2026-07-16 · 文姬 · P0-T6
> THREAD_HASH_ID：OQC-V08-P0-T6
> 状态：[STATE: REVIEW] · 待伯喈 review + 编译验证

---

## 〇、目的

本文档基于 P0-T1~T5 输出的 5 个 TSX 组件的精确 DOM 结构，起草 oqc- 前缀选择器契约。

**这不是 custom.scss。** 本文档是伯喈与文姬之间的"契约"——伯喈确认选择器锚点正确后，本文档成为 P1-T4（文姬首次改 custom.scss）的起跳板。

---

## 一、全局继承（v0.7 → v0.8）

以下区块直接从 v0.7 custom.scss 继承，**P0 不动**：

### 1.1 变量体系

```scss
:root {
  --color-paper: #ede3cf;
  --color-surface: #f4efe2;
  --color-ink: #1c1814;
  --color-muted: #6b5f52;
  --color-border: #d4c9b0;
  --color-accent: #b8860b;
  --color-hover: #e8ddc8;
}
```

### 1.2 视口锁定 + 纸纹

```scss
html,
body {
  margin: 0;
  padding: 0;
  height: 100vh;
  overflow: hidden;
}

#quartz-root {
  height: 100vh;
  overflow: hidden;
}

body {
  background: linear-gradient(
    175deg,
    #ede3cf 0%,
    #e9dfca 35%,
    #e5dac3 65%,
    #ede3cf 100%
  );
  /* 纸纹 SVG 从 v0.7 原样继承 */
}
body::before {
  /* 纸纹噪点 SVG，同 v0.7 */
}
```

---

## 二、P0 组件 · SCSS 选择器契约（核心）

### 2.1 OneColumnLayout

**伯喈 TSX 输出 DOM：**

```html
<div class="oqc-layout oqc-layout-1col" data-layout="1col"></div>
```

**文姬 SCSS 选择器草案：**

```scss
/* @zone:layout */
.oqc-layout-1col,
[data-layout="1col"] {
  display: grid;
  /* 默认单栏：auto 1fr auto（header / content / footer） */
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 1fr;
  min-height: 100vh;
}
```

### 2.2 TwoColumnLeft

**伯喈 TSX 输出 DOM：**

```html
<div class="oqc-layout oqc-layout-2col-l" data-layout="2col-l">
  <aside data-zone="left"></aside>
  <main data-zone="center"></main>
</div>
```

**文姬 SCSS 选择器草案：**

```scss
/* @zone:layout */
[data-layout="2col-l"] {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: 1fr auto;
}

/* @zone:left-sidebar */
aside[data-zone="left"] {
  position: sticky;
  top: 72px;
  height: calc(100vh - 72px);
  overflow-y: auto;
  padding: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}

/* @zone:center */
main[data-zone="center"] {
  overflow-y: auto;
  height: calc(100vh - 72px);
  padding: 2rem 3rem 3rem;
}
```

### 2.3 TwoColumnRight

**伯喈 TSX 输出 DOM：**

```html
<div class="oqc-layout oqc-layout-2col-r" data-layout="2col-r">
  <main data-zone="center"></main>
  <aside data-zone="right"></aside>
</div>
```

**文姬 SCSS 选择器草案：**

```scss
/* @zone:layout */
[data-layout="2col-r"] {
  display: grid;
  grid-template-columns: 1fr 320px;
  grid-template-rows: 1fr auto;
}

/* @zone:center */
[data-layout="2col-r"] main[data-zone="center"] {
  overflow-y: auto;
}

/* @zone:right-sidebar */
[data-layout="2col-r"] aside[data-zone="right"] {
  position: sticky;
  top: 72px;
  height: calc(100vh - 72px);
  overflow-y: auto;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
}
```

### 2.4 SiteTitle

**伯喈 TSX 输出 DOM：**

```html
<h1 class="oqc-site-title">
  <a href=".">示例知识库</a>
</h1>
```

**文姬 SCSS 选择器草案：**

```scss
/* @zone:site-title */
.oqc-site-title {
  margin: 0;
  padding: 0 20px 12px;
  font-family: "Noto Serif SC", serif;
  font-size: 1.35rem;
  font-weight: 700;
}

.oqc-site-title a {
  color: var(--color-ink);
  text-decoration: none;
  letter-spacing: 0.02em;
  transition: color 0.18s;
}

.oqc-site-title a:hover {
  color: var(--color-accent);
}
```

### 2.5 DarkmodeToggle

**伯喈 TSX 输出 DOM（WRAPPER 策略）：**

```html
<div id="darkmode-toggle" class="oqc-darkmode-btn">
  <!-- 内层复用原生 Darkmode 组件，保留 darkmode.inline.js 绑定 -->
  <button class="darkmode">
    <svg class="dayIcon">...</svg>
    <svg class="nightIcon">...</svg>
  </button>
</div>
```

**文姬 SCSS 选择器草案：**

```scss
/* @zone:theme-toggle */
#darkmode-toggle.oqc-darkmode-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

#darkmode-toggle.oqc-darkmode-btn:hover {
  background: rgba(196, 168, 92, 0.08);
}

/* 内层原生 Darkmode 按钮 —— 仅保留 class 选择器（与 darkmode.inline.js 不冲突） */
#darkmode-toggle.oqc-darkmode-btn button.darkmode {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0;
}

#darkmode-toggle.oqc-darkmode-btn svg {
  width: 16px;
  height: 16px;
  fill: var(--color-muted);
  transition: fill 0.2s;
}

#darkmode-toggle.oqc-darkmode-btn:hover svg {
  fill: var(--color-accent);
}
```

---

## 三、data-layout 响应式机制

审固要求：废除 has() hack，通过 DOM 层 data-layout 控制。

### 3.1 响应式断点

| 断点 | 宽度           | 布局行为                |
| ---- | -------------- | ----------------------- |
| 桌面 | >= 1200px      | 按 data-layout 正常渲染 |
| 平板 | 768px ~ 1199px | 左栏收拢，右栏下移      |
| 手机 | < 768px        | 全部单栏堆叠            |

### 3.2 两栏 → 单栏示例

```scss
@media (max-width: 1199px) {
  [data-layout="2col-l"] {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  [data-layout="2col-l"] aside[data-zone="left"] {
    position: relative;
    top: auto;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  [data-layout="2col-l"] main[data-zone="center"] {
    height: auto;
    overflow-y: visible;
  }
}

@media (max-width: 767px) {
  main[data-zone="center"] {
    padding: 1rem 0.8rem 2rem;
  }
}
```

### 3.3 三栏 → 两栏 → 单栏（未来 P3 使用）

```scss
/* P3 时才启用 */
@media (max-width: 1199px) {
  [data-layout="3col"] {
    grid-template-columns: 260px 1fr; /* 隐藏右栏 */
  }
}
@media (max-width: 767px) {
  [data-layout="3col"] {
    grid-template-columns: 1fr; /* 全部单栏 */
  }
}
```

---

## 四、P1 待迁移组件 · 选择器占位（结构已预留，选择器待定）

以下组件的 TSX 由伯喈在 P1-T1~T3 实现。文姬在 P1-T4 将以下选择器从 Quartz 原生 class 迁移到 oqc- 前缀。

### 4.1 SearchToggle（P1-T1）

```scss
/* @zone:search — 待 P1-T4 迁移 */
/* 伯喈 WRAPPER 策略：外层替换，保留 class="search" + id="search-button" */
```

### 4.2 ExplorerTree（P1-T1）

```scss
/* @zone:explorer — 待 P1-T4 迁移 */
/* 伯喈 WRAPPER 策略：外层替换，保留 data-behavior/data-collapsed/data-savestate */
```

### 4.3 ArticleTitle（P1-T2）

```scss
/* @zone:article-title — 待 P1-T4 迁移 */
/* 伯喈 REPLACE 策略：完全自定义 DOM */
```

### 4.4 ContentMeta（P1-T2）

```scss
/* @zone:content-meta — 待 P1-T4 迁移 */
/* 伯喈 REPLACE 策略：完全自定义 DOM */
```

### 4.5 TagList（P1-T3）

```scss
/* @zone:tags — 待 P1-T4 迁移 */
/* 伯喈 REPLACE 策略：完全自定义 DOM */
```

### 4.6 ArticleBody（P1-T3）

```scss
/* @zone:article-body — 待 P1-T4 迁移 */
/* 伯喈 REPLACE 策略：完全自定义 DOM —— article.oqc-article */
```

---

## 五、P2 待迁移组件 · 选择器占位

以下由伯喈在 P2-T1~T4 实现，文姬在 P2-T5 迁移。

- Breadcrumbs（oqc-breadcrumbs）
- TableOfContents（oqc-toc / oqc-toc-toggle）⚠️ 保留 TOC 折叠 JS
- BacklinksList（oqc-backlinks）
- GraphView（oqc-graph）⚠️ 保留 D3 渲染
- RecentNotes（oqc-recent-notes）
- Footer 系列（oqc-footer-copyright / oqc-footer-links / oqc-footer-build-info）

---

## 六、P3 待迁移组件 · 选择器占位

以下由伯喈在 P3-T1~T2 实现，文姬在 P3-T3 全量收口。

- ThreeColumn（oqc-layout-3col / data-layout="3col"）
- HeaderLayout（oqc-layout-header）
- FooterLayout（oqc-layout-footer）
- HOC：Stack（oqc-stack / data-stack-parent）
- HOC：Section（oqc-section / oqc-section-title）
- HOC：Conditional

---

## 七、暖纸学术色系保留清单（v0.7 → v0.8 不动）

| 色值      | 用途          | CSS 变量          |
| --------- | ------------- | ----------------- |
| `#ede3cf` | 页面底色      | `--color-paper`   |
| `#f4efe2` | 卡片/侧栏底色 | `--color-surface` |
| `#1c1814` | 正文字色      | `--color-ink`     |
| `#6b5f52` | 次要文字      | `--color-muted`   |
| `#d4c9b0` | 边框色        | `--color-border`  |
| `#b8860b` | 强调色/琥珀色 | `--color-accent`  |
| `#e8ddc8` | hover 高亮    | `--color-hover`   |
| `#0a0a0f` | 顶栏底色      | （暗色模块）      |
| `#c4a85c` | 顶栏金色文字  | （暗色模块）      |

字体栈不变：`"Noto Serif SC", serif`（正文/标题） + `"Inter", sans-serif`（UI） + `"JetBrains Mono", monospace`（代码）。

---

## 八、伯喈验证步骤

收到本文档后请执行：

1. [ ] 逐一检查 P0 5 个选择器草案与 TSX 实际输出是否一致
2. [ ] 确认 `#darkmode-toggle` + `button.darkmode` 的双锚点策略无误
3. [ ] 确认 `data-layout` 属性值（1col / 2col-l / 2col-r）与 TSX 一致
4. [ ] `npx quartz build` 验证编译通过
5. [ ] 回复 [STATE: PASSED] → 文姬即确认契约成立 → P1-T1 可启动

---

_[STATE: REVIEW] · 文姬 · 2026-07-16_
_[NEXT]: 伯喈 / review 契约 + 编译验证 → P1 启动_
