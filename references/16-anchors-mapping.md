## @theme 变量池（preview-base.html prototype 专用）

视觉设计官在 prototype 阶段应使用以下语义化变量，而非硬编码 HEX。
伯喈翻译时自动映射为 SCSS 变量。

| 变量名            | 用途            | 示例值（暖纸学术）          |
| ----------------- | --------------- | --------------------------- |
| `--color-paper`   | 页面底色        | #ede3cf                     |
| `--color-ink`     | 正文墨色        | #2b2b2b                     |
| `--color-accent`  | 强调色/金色点缀 | #c9a96e                     |
| `--color-muted`   | 次要文字        | #8b8680                     |
| `--color-border`  | 分隔线          | #d9d0c0                     |
| `--color-surface` | 卡片/区块底色   | #f5efe0                     |
| `--color-hover`   | hover 高亮      | #e8ddc8                     |
| `--font-body`     | 正文字体        | "Noto Serif SC", serif      |
| `--font-heading`  | 标题字体        | "Noto Serif SC", serif      |
| `--font-ui`       | 界面字体        | "Inter", sans-serif         |
| `--font-code`     | 代码字体        | "JetBrains Mono", monospace |

### 使用方式（prototype 中）

```css
@theme {
  --color-paper: #ede3cf;
  --color-ink: #2b2b2b;
  --font-body: "Noto Serif SC", serif;
}
.page {
  background: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-body);
}
```

### 伯喈翻译规则

- `var(--color-paper)` → SCSS 中对应 `$color-paper` 或直接写 HEX `#ede3cf`
- `var(--font-body)` → SCSS 中对应 `$font-body` 或直接写字体栈
- 翻译时不保留 `@theme` 块——它只存在于 prototype

---

# 16 锚点 → Quartz Component 映射表

> 本文档将 16 个设计锚点映射到对应的 Quartz Component、CSS 选择器和注入方式，供设计智能体定位和定制。

| #   | 锚点          | Quartz Component                 | CSS 选择器              | 注入方式        | 状态 |
| --- | ------------- | -------------------------------- | ----------------------- | --------------- | :--: |
| 1   | site-title    | `Component.PageTitle()`          | `.page-title`           | Quartz 内置     |  ✅  |
| 2   | site-subtitle | 自定义（`index.md` frontmatter） | `.site-subtitle`        | Markdown → HTML |  ⚠️  |
| 3   | search        | `Component.Search()`             | `.search-container`     | Quartz 内置     |  ✅  |
| 4   | theme-toggle  | `Component.Darkmode()`           | `.darkmode-toggle`      | Quartz 内置     |  ✅  |
| 5   | explorer      | `Component.Explorer()`           | `.explorer`             | Quartz 内置     |  ✅  |
| 6   | folder-count  | `Explorer.tsx` 注入              | `.folder-count`         | JS 注入         |  ⚠️  |
| 7   | article-title | `Component.ArticleTitle()`       | `.article-title`        | Quartz 内置     |  ✅  |
| 8   | content-meta  | `Component.ContentMeta()`        | `.content-meta`         | Quartz 内置     |  ✅  |
| 9   | breadcrumb    | `Component.Breadcrumbs()`        | `.breadcrumb-container` | Quartz 内置     |  ✅  |
| 10  | article-body  | 默认渲染                         | `article`               | Quartz 内置     |  ✅  |
| 11  | tags          | `Component.TagList()`            | `.tags`                 | Quartz 内置     |  ✅  |
| 12  | graph         | `Component.Graph()`              | `.graph`                | Quartz 内置     |  ✅  |
| 13  | backlinks     | `Component.Backlinks()`          | `.backlinks`            | Quartz 内置     |  ✅  |
| 14  | toc           | `Component.TableOfContents()`    | `.toc`                  | Quartz 内置     |  ✅  |
| 15  | copyright     | `Component.Footer()`             | `footer`                | Quartz 内置     |  ✅  |
| 16  | build-info    | `Component.Footer()`             | `.footer-copyright`     | Quartz 内置     |  ✅  |

## 状态说明

- **✅ 内置**：Quartz 原生组件，通过 `quartz.config.ts` 的 `layout` 配置控制显示/隐藏和排序。
- **⚠️ 需手动**：Quartz 不原生支持，需要手动注入 HTML/CSS/JS 或通过自定义组件实现。

## 重要注释

- `data-zone` 属性仅存在于 `preview-base.html` 中，用于设计智能体定位锚点区域。线上构建后的站点不包含该属性。
- 所有 ✅ 组件的样式覆盖应在 `custom.scss` 中通过对应 CSS 选择器完成，不应修改 Quartz 核心组件源码。

_生成的 CSS Patch 必须通过 custom.scss 注入，不得直接修改 Quartz 内置 .scss 文件。_

---

## Quartz 真实 DOM 结构参考（v4.5.2 + custom.scss）

> 2026-07-05 新增。基于 `public/index.html` 实际构建输出提取。
> 用途：确保 `preview-base.html` 骨架与 Quartz 真实输出标签一致，防止 CSS 选择器命中错误标签。

| 锚点          | data-zone       | Quartz 真实 DOM 标签结构                                                                                                                                                                                                   |
| ------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| viewport      | `viewport`      | `<body data-slug="index"> → <div id="quartz-root" class="page">`                                                                                                                                                           |
| topbar        | `topbar`        | `<div class="page-header"><div class="popover-hint">...</div></div>`                                                                                                                                                       |
| breadcrumb    | `breadcrumb`    | `<nav class="breadcrumb-container"><div class="breadcrumb-element"><a>`                                                                                                                                                    |
| article-title | `article-title` | `<h1 class="article-title">`                                                                                                                                                                                               |
| site-subtitle | `site-subtitle` | `<p class="site-subtitle">`（Quartz 自定义组件读出）                                                                                                                                                                       |
| content-meta  | `content-meta`  | `<p show-comma="true" class="content-meta"><time>…</time><span>`                                                                                                                                                           |
| tags          | `tags`          | `<ul class="tags"><li><a class="internal tag-link">`                                                                                                                                                                       |
| left-sidebar  | `left-sidebar`  | `<div class="left sidebar">`                                                                                                                                                                                               |
| site-title    | `site-title`    | `<h2 class="page-title"><a href=".">`                                                                                                                                                                                      |
| search        | `search`        | `<div class="search"><button class="search-button"><svg>…<p>…</p></button><div class="search-container"><div class="search-space"><input class="search-bar">…`                                                             |
| theme-toggle  | `theme-toggle`  | `<button class="darkmode"><svg class="dayIcon">…</svg><svg class="nightIcon">…</svg></button>`                                                                                                                             |
| explorer      | `explorer`      | `<div class="explorer desktop-only" data-behavior="link" data-collapsed="collapsed">…<button class="explorer-toggle">…<div id="explorer-0"><div class="folder-outer"><ul><li class="folder-li"><div class="folder-title">` |
| center        | `center`        | `<div class="center">`                                                                                                                                                                                                     |
| article-body  | `article-body`  | `<article class="popover-hint">…<h2 id="…">…<a role="anchor">…</a></h2>…`                                                                                                                                                  |
| graph         | `graph`         | `<div class="graph"><h3>…</h3><div class="graph-outer">…`                                                                                                                                                                  |
| backlinks     | `backlinks`     | `<div class="backlinks"><h3>…</h3><ul class="overflow"><li><a class="internal">`                                                                                                                                           |
| toc           | `toc`           | `<div class="toc desktop-only"><button type="button" class="toc-header"><h3>…</h3><svg class="fold">…</svg></button><div class="toc-content"><ul class="overflow"><li class="depth-0"><a>`                                 |
| right-sidebar | `right-sidebar` | `<div class="right sidebar">`（左中两栏下为空）                                                                                                                                                                            |
| footer        | `footer`        | '<footer class=""><p>…<a>…</a>…</p><ul><li><a>'                                                                                                                                                                            |
| copyright     | `copyright`     | '<footer class=""><p>…</p>' 内的文本（Quartz Footer 组件固定文案）                                                                                                                                                         |
| build-info    | `build-info`    | '<footer class=""><ul><li><a href="…">…</a></li></ul>' 内的链接                                                                                                                                                            |

### 关键发现

1. **footer 结构差异最大**：线上版 '<footer><p>…<ul><li><a>' vs 旧版预览 '<footer><span><span>'。Quartz Footer 组件不通过 CSS 变量控制文案，需改 TSX 或接受默认格式。
2. **tags 使用 '<ul><li><a>' 而非 '<div><span>'**：'<a>' 标签有 Quartz 内部链接类 '.internal.tag-link'，CSS 选择器需精准匹配。
3. **search 很复杂**：'<button>' + '<svg>' + '<div class="search-container">' + '<input class="search-bar">' 四层嵌套，不能简化为单个 '<input>'。
4. **explorer 是动态组件**：带 'data-behavior', 'data-collapsed', 'data-savestate' 属性，静态预览中只能使用手写 '<ul><li>' 占位。
5. **article 标题自带 anchor**：Quartz 自动为每个 '<h2>'/'<h3>' 附加 '<a role="anchor" class="internal"><svg>…</svg></a>' 链接锚点。
6. **'right sidebar' 在左中两栏布局下为空 '<div>'**：CSS 中 '.right.sidebar { display: none }' 或类似规则隐藏。

### CSS 选择器编写规则

编写 SCSS 或 custom.scss 时，必须使用 Quartz 真实 DOM 中的选择器，不能假设标签。例如：

- ❌ '.tags span' → ✅ '.tags li a.tag-link'
- ❌ 'footer span.footer-copyright' → ✅ 'footer p'
- ❌ '#search-input' → ✅ '.search-bar'
- ❌ '.darkmode-toggle button' → ✅ 'button.darkmode'
