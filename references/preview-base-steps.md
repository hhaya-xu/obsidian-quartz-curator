# preview-base.html 生成步骤

> v0.6 修正版 | 2026-07-04 | 核心修正：不再从 public/index.html 复制

## 原则

**先视觉审核 → 再首次 Quartz 编译。** preview-base.html 是伯喈手写的干净 HTML 骨架，用于文姬注入 CSS 后在浏览器中预览审核。审核通过后才进入 Phase 3（样式析出 + 首次 npx quartz build）。

---

## 步骤 1：确认布局选择

与主公确认布局（左中右三栏/左中两栏/左中+右栏放底部）和各区域功能勾选。记录到通信文件 zone=layout。

---

## 步骤 2：手写干净 HTML 骨架

伯喈按以下规则手写 preview-base.html：

1. 按 Step 1 选择的布局搭建 DOM 结构，class 名与 Quartz 组件一致
2. 每个区域打 \`data-zone\` 属性（对应 16-anchors-mapping.md 的 16 个锚点）
3. \`<head>\` 中注入 Tailwind Play CDN + 空 \`<style id="design-css"></style>\`
4. 干净可读（换行缩进，非单行压缩）
5. **不含 Quartz JS 运行时**（无搜索脚本、图谱、mermaid 等）
6. 演示内容用 \`<!-- demo:start -->...<!-- demo:end -->\` 包裹
7. 保存到 \`construction-site/preview-base.html\`

**此时尚未运行 npx quartz build。**

---

## 步骤 3：Tailwind CDN + style 占位

在 \`</head>\` 前注入：

\`\`\`html

<script src="https://cdn.tailwindcss.com"></script>
<style id="design-css">
/* 视觉设计官的所有 CSS 写入此标签内，按 @zone 分区 */
</style>

\`\`\`

---

## 步骤 4：文姬设计（Phase 2）

文姬在 \`<style id="design-css">\` 中写 CSS。Tailwind CDN 辅助探索风格。用嗅探算法从通信文件获取任务上下文。

---

## 步骤 5：主公审核

主公在浏览器中打开 preview-base.html（双击即可，file:// 协议），审核视觉效果。通过后进入 Phase 3。

---

## 步骤 6：Phase 3 — 样式析出 + 首次编译

伯喈从 \`<style id="design-css">\` 提取 CSS → 清理 demo 内容 → Apply 到 custom.scss → 首次 npx quartz build。

---

## 与旧版的区别

| 旧版 (pre-v0.6)           | 新版 (v0.6)                                |
| ------------------------- | ------------------------------------------ |
| 从 public/index.html 复制 | 伯喈手写干净骨架                           |
| 先编译后审核              | 先审核后编译                               |
| 含 Quartz JS 运行时       | 纯 HTML 骨架                               |
| 需内联外部资源            | 无需内联（干净骨架不依赖 Quartz 静态资源） |
| 单行压缩                  | 格式化、可读                               |

---

_preview-base-steps.md · v0.6 修正 · 2026-07-04_
