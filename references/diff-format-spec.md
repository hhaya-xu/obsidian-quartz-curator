# CSS 变更 Diff 格式规范

> 定义设计智能体输出 CSS 变更的标准格式。所有 CSS Patch 必须严格遵循此规范，确保 `apply_patch` 工具可精确解析和应用。

## 交付格式

### 外层包裹

每个 Patch 文件以 `*** Begin Patch` 开始，以 `*** End Patch` 结束。

```
*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ ... @@
*** End Patch
```

### 文件指定

使用 `*** Update File:` 指令指定目标文件路径，路径相对于 Quartz 项目根目录。

```
*** Update File: quartz/styles/custom.scss
```

### 变更块

每个 `@zone` 锚点独立分块。变更块以搜索上下文（`@@ ... @@`）开始，后跟 `-` 旧行和 `+` 新行。

```
@@ /* @zone:site-title */ @@
-  .page-title {
-    font-size: 1rem;
-  }
+  .page-title {
+    font-size: 1.25rem;
+    font-weight: 700;
+    color: var(--fg);
+    font-family: var(--wj-font-display);
+  }
```

---

## 格式约束

### 1. 色值用 HEX

所有颜色值必须使用 6 位 HEX 格式（如 `#ede3cf`），禁止使用 `rgb()`、`hsl()`、颜色名称或 3 位缩写。

```scss
/* ✅ 正确 */
color: #b8860b;

/* ❌ 错误 */
color: darkgoldenrod;
color: rgb(184, 134, 11);
color: #b80;
```

### 2. 伪元素用单冒号

所有伪元素选择器使用单冒号语法（`:after` / `:before`），禁止双冒号。

```scss
/* ✅ 正确 */
.page-title:after { content: ""; }

/* ❌ 错误 */
.page-title::after { content: ""; }
```

### 3. 变量统一 `--wj-` 前缀

Patch 中的 CSS 自定义属性使用 `--wj-` 前缀。在应用 Patch 后，由设计智能体或转译代理将 `--wj-` 变量替换为对应的 Quartz 内置变量。

```scss
/* Patch 中使用 */
color: var(--wj-bg);
font-family: var(--wj-font-display);

/* 转译后（由代理完成） */
color: var(--bg);
font-family: "Noto Serif SC", serif;
```

`--wj-` 变量映射表由设计智能体维护，不包含在 Patch 中。

### 4. @zone 锚点命名

每个 CSS Patch 块必须对应 `custom.scss` 中的 `/* @zone:xxx */` 注释。锚点名称来自 `16-anchors-mapping.md`。

```scss
/* 在 custom.scss 中 */
/* @zone:site-title */
/* @zone:search */
/* @zone:article-body */
```

Patch 中的变更块搜索上下文必须包含对应的 `@zone` 注释，确保定位精确。

---

## 完整示例（idempotent 格式）

> **关键：锚点注释必须同时出现在 `-` 和 `+` 行中。**
> 这样 Apply 后锚点不消失，验收循环中可重复 Apply 不会失败。



以下是一个完整的 CSS Patch 文件，修改 site-title 和 article-body 两个锚点：

```
*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ /* @zone:site-title */ @@
-  .page-title {
-    font-size: 1rem;
-  }
+  .page-title {
+    font-size: 1.25rem;
+    font-weight: 700;
+    color: var(--wj-fg);
+    font-family: var(--wj-font-display);
+  }
*** End Patch

*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ /* @zone:article-body */ @@
-  article {
-    line-height: 1.6;
-  }
+  article {
+    line-height: 1.8;
+    color: var(--wj-fg);
+    background: var(--wj-bg);
+    font-family: var(--wj-font-body);
+  }
*** End Patch
```

---

## 约束速查

| 规则 | 要求 | 原因 |
|------|------|------|
| 外层包裹 | `*** Begin/End Patch` | Codex `apply_patch` 工具解析协议 |
| 文件指定 | `*** Update File:` + 相对路径 | 明确目标文件 |
| 锚点分块 | 每个 `@zone` 独立一个 Patch | 精确定位、独立回滚 |
| 变更格式 | `-` 旧行 / `+` 新行 | 标准 unified diff 格式 |
| 色值 | 6 位 HEX | 可读性、Greppable、无歧义 |
| 伪元素 | 单冒号 | Dart Sass 兼容 |
| 变量前缀 | `--wj-` | 与 Quartz 原生变量隔离 |
| 锚点注释 | `/* @zone:xxx */` | 设计智能体定位标记 |

---

*所有 CSS Patch 必须逐条满足以上约束方可交付。*

---

## `--wj-*` 变量替换规则

设计智能体在 preview-base.html 中使用 `--wj-` 前缀的 CSS 变量。代理转译到 custom.scss 时必须替换为对应的 Quartz 变量名。

| 设计智能体变量 | 替换为 | HEX 值（暖纸系） | 用途 |
|---------------|--------|-----------------|------|
| `--wj-bg` | `--bg` | #ede3cf | 纸底 |
| `--wj-surface` | `--surface` | #f4efe2 | 纸面 |
| `--wj-fg` | `--fg` | #1c1814 | 墨 |
| `--wj-muted` | `--muted` | #6b5f52 | 墨淡 |
| `--wj-border` | `--border` | #d4c9b0 | 线 |
| `--wj-accent` | `--accent` | #b8860b | 琥珀 |
| `--wj-code-bg` | `--code-bg` | #f4efe2 | 代码底 |

> 替换操作是 Step 4 CSS 转译的标准步骤。v1.0 `translate-css.ts` 脚本化时将作为核心逻辑。
