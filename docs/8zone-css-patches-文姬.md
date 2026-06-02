# 8 Zone CSS 补丁 — 智慧树暖纸系

> 每个 zone 一个 `*** Begin Patch` 块。
> 程序员依次应用到 `custom.scss` 对应 `@zone` 锚点下。
> 色值全部 HEX、伪元素单冒号、不加 `!important`。

---

## Zone 1: viewport

*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ @zone:viewport
+html, body {
+  background: #ede3cf;
+  color: #1c1814;
+  font-family: "Noto Serif SC", "Songti SC", "SimSun", "PingFang SC", "Microsoft YaHei", serif;
+  font-size: 17px;
+  line-height: 1.75;
+  -webkit-font-smoothing: antialiased;
+  -moz-osx-font-smoothing: grayscale;
+}
*** End Patch

---

## Zone 2: paper

*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ @zone:paper
+body:before {
+  content: "";
+  position: fixed;
+  inset: 0;
+  z-index: 0;
+  pointer-events: none;
+  opacity: 0.6;
+  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E");
+}
*** End Patch

---

## Zone 3: layout

*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ @zone:layout
+.page {
+  display: grid;
+  grid-template: auto 1fr auto / 240px 1fr 280px;
+  max-width: 100vw;
+  min-height: 100vh;
+}
+
+.left.sidebar {
+  background: #f4efe2;
+  border-right: 1px solid #d4c9b0;
+  padding: 24px 20px;
+  overflow-y: auto;
+}
+
+.center {
+  padding: 48px 40px;
+  max-width: 100%;
+}
+
+.right.sidebar {
+  background: #f4efe2;
+  border-left: 1px solid #d4c9b0;
+  padding: 48px 20px;
+  overflow-y: auto;
+}
*** End Patch

---

## Zone 4: topbar

*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ @zone:topbar
+.page-header {
+  background: #0a0a0f;
+  height: 72px;
+  padding: 0 40px;
+  display: flex;
+  align-items: center;
+  backdrop-filter: blur(12px);
+}
+
+.topbar__sitetitle {
+  font-family: "Noto Serif SC", serif;
+  font-size: 19px;
+  color: #c4a85c;
+  text-decoration: none;
+}
+
+.topbar-nav a {
+  font-family: "Geist Mono", ui-monospace, monospace;
+  font-size: 11px;
+  text-transform: uppercase;
+  color: #6b5f52;
+  text-decoration: none;
+  margin-left: 1.4rem;
+  letter-spacing: 0.06em;
+}
+
+.topbar-nav a:hover {
+  color: #c4a85c;
+}
+
+.search-button {
+  background: #0a0a0f;
+  border: 0.5px solid #c4a85c33;
+  color: #c4a85c;
+  border-radius: 4px;
+  padding: 4px 12px;
+  font-size: 13px;
+}
*** End Patch

---

## Zone 5: left-sidebar

*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ @zone:left-sidebar
+.title-button {
+  font-family: "Geist Mono", ui-monospace, monospace;
+  font-size: 10px;
+  text-transform: uppercase;
+  color: #6b5f52;
+  letter-spacing: 0.08em;
+  margin-bottom: 20px;
+}
+
+.title-button:after {
+  content: "";
+  display: inline-block;
+  width: calc(100% - 12px);
+  height: 0.5px;
+  background: #d4c9b0;
+  margin-left: 12px;
+  vertical-align: middle;
+}
+
+svg.folder-icon {
+  width: 14px;
+  height: 14px;
+  color: #b8860b;
+  min-width: 14px;
+  margin-right: 8px;
+}
+
+.folder-container {
+  padding: 8px 0 4px;
+  margin-bottom: 20px;
+  border-radius: 5px;
+  border-bottom: 0.5px solid #d4c9b0;
+}
+
+.folder-container:hover {
+  background: #f4efe2;
+}
+
+.folder-container:hover .folder-title {
+  color: #b8860b;
+}
+
+.folder-title {
+  font-family: "Geist Mono", ui-monospace, monospace;
+  font-size: 12px;
+  text-transform: uppercase;
+  color: #6b5f52;
+  letter-spacing: 0.06em;
+}
+
+.folder-outer > ul {
+  margin: 0;
+  padding-left: 0;
+  border-left: 1px solid #d4c9b0;
+}
+
+.explorer-content ul li > a {
+  font-size: 13.5px;
+  color: #4a3f35;
+  padding: 4px 8px;
+  display: block;
+  text-decoration: none;
+  border-left: 2px solid transparent;
+  border-radius: 4px;
+}
+
+.explorer-content ul li > a:hover {
+  background: rgba(184,134,11,0.06);
+  border-left-color: #b8860b;
+  color: #1c1814;
+}
+
+.explorer-content ul li > a:before {
+  content: "\203A";
+  color: #b8860b;
+  margin-right: 6px;
+}
+
+/* sub-entries */
+.folder-outer > ul li > a {
+  font-size: 13px;
+  color: #6b5f52;
+  padding-left: 16px;
+  border-left: 1px solid #d4c9b0;
+}
+
+.folder-outer > ul li > a:hover {
+  color: #1c1814;
+  border-left-color: #b8860b;
+  background: rgba(184,134,11,0.06);
+}
+
+.folder-count {
+  font-family: "Geist Mono", monospace;
+  font-size: 9.5px;
+  color: #a09484;
+  margin-left: auto;
+  padding-left: 8px;
+  opacity: 0.8;
+}
+
+/* scrollbar */
+.left.sidebar::-webkit-scrollbar {
+  width: 4px;
+}
+
+.left.sidebar::-webkit-scrollbar-track {
+  background: transparent;
+}
+
+.left.sidebar::-webkit-scrollbar-thumb {
+  background: #d4c9b0;
+  border-radius: 2px;
+}
+
+.left.sidebar::-webkit-scrollbar-thumb:hover {
+  background: #b8860b;
+}
+
+.left.sidebar {
+  scrollbar-width: thin;
+  scrollbar-color: #d4c9b0 transparent;
+}
*** End Patch

---

## Zone 6: center

*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ @zone:center
+.center article {
+  max-width: 680px;
+  margin: 0 auto;
+  font-size: 17px;
+  line-height: 1.85;
+  color: #1c1814;
+}
+
+.center article h1 {
+  font-size: 36px;
+  font-weight: 500;
+  color: #1c1814;
+  margin: 0 0 16px;
+  letter-spacing: -0.01em;
+}
+
+.center article h2 {
+  font-size: 24px;
+  font-weight: 500;
+  color: #1c1814;
+  margin: 48px 0 16px;
+  padding-bottom: 8px;
+  border-bottom: 0.5px solid #d4c9b0;
+}
+
+.center article h3 {
+  font-size: 19px;
+  font-weight: 500;
+  color: #4a3f35;
+  margin: 32px 0 12px;
+}
+
+.center article p {
+  margin: 0 0 20px;
+}
+
+.center article a {
+  color: #b8860b;
+  text-decoration: none;
+  border-bottom: 0.5px solid rgba(184,134,11,0.3);
+}
+
+.center article a:hover {
+  color: #9a6f09;
+  border-bottom-color: #b8860b;
+}
+
+.center article blockquote {
+  border-left: 3px solid #b8860b;
+  background: #f4efe2;
+  margin: 24px 0;
+  padding: 16px 20px;
+  border-radius: 0 6px 6px 0;
+  color: #4a3f35;
+  font-style: italic;
+}
+
+.center article pre {
+  background: #f4efe2;
+  border: 0.5px solid #d4c9b0;
+  border-radius: 4px;
+  padding: 16px 20px;
+  overflow-x: auto;
+  font-family: "Geist Mono", ui-monospace, monospace;
+  font-size: 14px;
+  line-height: 1.6;
+}
+
+.center article code {
+  font-family: "Geist Mono", ui-monospace, monospace;
+  font-size: 14px;
+  background: #f4efe2;
+  padding: 2px 6px;
+  border-radius: 3px;
+  border: 0.5px solid #d4c9b0;
+}
+
+.center article pre code {
+  background: none;
+  padding: 0;
+  border: 0;
+}
+
+.content-meta {
+  display: block;
+  font-family: "Geist Mono", monospace;
+  font-size: 10.5px;
+  color: #6b5f52;
+  margin-bottom: 32px;
+}
*** End Patch

---

## Zone 7: right-sidebar

*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ @zone:right-sidebar
+.toc button.toc-header h3 {
+  font-family: "Geist Mono", ui-monospace, monospace;
+  font-size: 10px;
+  text-transform: uppercase;
+  color: #6b5f52;
+  letter-spacing: 0.08em;
+}
+
+.toc ul li a {
+  font-size: 13px;
+  color: #6b5f52;
+  text-decoration: none;
+  display: block;
+  padding: 3px 0;
+  border-left: 2px solid transparent;
+  padding-left: 8px;
+}
+
+.toc ul li a:hover,
+.toc ul li a.active {
+  color: #b8860b;
+  border-left-color: #b8860b;
+}
+
+.graph .graph-outer {
+  border: 0.5px solid #d4c9b0;
+  border-radius: 4px;
+  background: #f4efe2;
+}
+
+.backlinks h3 {
+  font-family: "Geist Mono", monospace;
+  font-size: 10px;
+  text-transform: uppercase;
+  color: #6b5f52;
+  letter-spacing: 0.08em;
+}
+
+.backlinks a {
+  color: #b8860b;
+  text-decoration: none;
+  font-size: 13px;
+}
+
+.backlinks a:hover {
+  color: #9a6f09;
+}
*** End Patch

---

## Zone 8: footer

*** Begin Patch
*** Update File: quartz/styles/custom.scss
@@ @zone:footer
+.page-footer {
+  background: #e4dfd1;
+  border-top: 0.5px solid #d4c9b0;
+  padding: 12px 40px;
+  font-family: "Geist Mono", monospace;
+  font-size: 10.5px;
+  color: #6b5f52;
+  text-align: center;
+}
+
+.page-footer a {
+  color: #6b5f52;
+  text-decoration: none;
+}
+
+.page-footer a:hover {
+  color: #b8860b;
+}
*** End Patch

---

## 应用说明

### 程序员的 8 分钟操作步骤

1. 打开 `quartz/styles/custom.scss`
2. 找到 `@zone:viewport` → 复制 Zone 1 补丁 → 粘贴替换该区块
3. 重复 Zone 2-8
4. 执行 `npx quartz build`
5. 执行 `npx quartz build --serve` → 浏览器 `localhost:8080` 验证
6. `git add -A && git commit -m "style: 智慧树暖纸系 8-zone" && git push`

### 部署前自检清单

- [ ] 字体本地可用 — 宋体 (Songti SC / SimSun) 为系统出厂字体
- [ ] Grid 三栏布局 — 240px / 1fr / 280px 不超视口
- [ ] sidebar padding 已设 — 左栏 24+20, 右栏 48+20
- [ ] 伪元素单冒号 — 全补丁使用 `:before` / `:after`
- [ ] 清浏览器缓存 — `Ctrl+Shift+R` 硬刷新验证

### `--wj-` 前缀说明

文姬在 preview-base 中使用 `--wj-bg`、`--wj-fg` 等前缀避免与 Quartz 原生变量冲突。
本补丁中已全部替换为直接色值——无需额外处理。
如需自行修改色值，全局搜索替换即可。

---

*文姬 · 2026-06-03 · 供审固、伯喈判断 L1/L2 实现路径*
