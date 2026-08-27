# 三栏布局 · 左中右

> 适用于：quartz.config.ts + quartz/styles/custom.scss
> 预览效果：左侧导航 / 中间正文 / 右侧目录 + 关系图

---

## quartz.config.ts · Component 清单

在 `defaultContentPageLayout` 中开启以下组件：

```ts
// quartz.config.ts

Component.ArticleTitle(),
Component.ContentMeta(),
Component.TagsList(),
Component.MobileOnly(Component.TableOfContents()),
Component.Explorer(),        // 左侧导航
Component.DesktopOnly(Component.TableOfContents()),  // 右侧目录
Component.Graph(),            // 右侧关系图
Component.Backlinks(),        // 右侧反向链接
Component.Search(),
Component.Darkmode(),
Component.Footer(),
```

---

## quartz/styles/custom.scss · Grid 覆盖

<!-- ⚠️ base.scss 默认 Grid 不同，必须用 !important 覆盖 -->
<!-- ⚠️ .sidebar 默认有 padding，必须清零 -->

```scss
/* 在 quartz/styles/custom.scss 中添加 */

#quartz-body {
  grid-template-areas:
    "header header header"
    "left center right"
    "footer footer footer" !important;
  grid-template-columns: 260px 1fr 320px !important;
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

.right.sidebar {
  grid-area: right;
  padding: 0 !important;
}

footer {
  grid-column: 1 / -1;
}
```

---

> **与 Patch 的关系：** 本模板使用 `#quartz-body` + `grid-template-areas`（具名区域，推荐方式）。
> `patches/example-warm-paper/zone3-layout.patch` 使用 `.page` + `grid-template` shorthand（智慧树项目的实际实现）。
> 两种方式均可实现三栏布局：
>
> - `grid-template-areas`：可读性好，适合自定义 Layout
> - `grid-template` shorthand：紧凑，适合 Patch 交付
> - 代理在 Step 4 转译时需统一为其中一种方式。建议以本模板的 `grid-template-areas` 为规范，Patch 仅作示例参考。

## 注意事项

- `base.scss` 默认使用两栏 Grid 布局（`"left center"`），三栏需要 `!important` 强制覆盖。
- `.sidebar` 默认带有 `padding`，若不归零会出现内容偏移。
- 右侧栏宽度固定 `320px`，左侧导航 `260px`，中间内容区自适应。
- `TableOfContents` 使用 `MobileOnly()` 和 `DesktopOnly()` 分别放置于中间和右侧。
- `Graph` 和 `Backlinks` 放在右侧栏，与目录形成信息聚合区域。
