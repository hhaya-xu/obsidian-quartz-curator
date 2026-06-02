# 两栏布局 · 左中

> 适用于：quartz.config.ts + quartz/styles/custom.scss
> 预览效果：左侧导航 / 中间正文（无右栏）

---

## quartz.config.ts · Component 清单

在 `defaultContentPageLayout` 中开启以下组件：

```ts
// quartz.config.ts

Component.ArticleTitle(),
Component.ContentMeta(),
Component.TagsList(),
Component.MobileOnly(Component.TableOfContents()),
Component.Explorer(),         // 左侧导航
Component.Search(),
Component.Darkmode(),
Component.Footer(),
```

**关键：必须排除 Graph 和 Backlinks**

```ts
// 两栏布局中无右栏，需将 Graph / Backlinks 设为 false 或移除
// Component.Graph(),         ← 排除
// Component.Backlinks(),     ← 排除
```

若右栏中不需要 TableOfContents（桌面端目录），也一并移除 `Component.DesktopOnly(Component.TableOfContents())`。

---

## quartz/styles/custom.scss · Grid 覆盖

<!-- ⚠️ base.scss 默认 Grid 不同，必须用 !important 覆盖 -->
<!-- ⚠️ .sidebar 默认有 padding，必须清零 -->

```scss
/* 在 quartz/styles/custom.scss 中添加 */

#quartz-body {
  grid-template-areas:
    "header header"
    "left center"
    "footer footer" !important;
  grid-template-columns: 260px 1fr !important;
}

.page-header {
  grid-column: 1 / -1;
  position: sticky;
  top: 0;
  z-index: 20;
}

.left.sidebar {
  grid-area: left;
  padding: 0 !important;
}

.center {
  grid-area: center;
  overflow-y: auto;
}

footer {
  grid-column: 1 / -1;
}
```

---

## 与三栏布局对比

| 项目 | 两栏 | 三栏 |
|------|------|------|
| grid-template-areas | `header header` / `left center` / `footer footer` | `header header header` / `left center right` / `footer footer footer` |
| grid-template-columns | `260px 1fr` | `260px 1fr 320px` |
| Graph / Backlinks | 排除 | 放在右栏 |
| DesktopOnly(TableOfContents) | 可选移除 | 放在右栏 |
| 适用场景 | 博客、笔记展示 | 文档站、知识库 |

---

## 完整 quartz.config.ts 关键片段

```ts
// quartz.config.ts

const defaultContentPageLayout: PageLayout = {
  before: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagsList(),
    Component.MobileOnly(Component.TableOfContents()),
  ],
  after: [
    // 两栏布局：无右栏组件
    // Component.DesktopOnly(Component.TableOfContents()),
    // Component.Graph(),
    // Component.Backlinks(),
  ],
}

export default {
  defaultContentPageLayout,
  // ...其他配置
}
```

---

## 注意事项

- `base.scss` 默认 Grid 布局可能与自定义不兼容，必须使用 `!important` 覆盖。
- `.sidebar` 默认带有 `padding`，若不归零会出现内容偏移。
- 左侧导航固定 `260px`，中间内容区自适应填充剩余空间。
- 若未来需要右栏，参考 `layout-three-column.md` 升级为三栏配置。
