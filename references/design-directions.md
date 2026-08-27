# 设计方向数据表

> 6 套预设设计方向，每套列出 7 个 CSS 变量具体色值和推荐字体。
> 用数据不用形容词。`example-warm-paper`（智慧树暖纸系）是唯一有完整 CSS Patch 的方向。

## 快速对比

| 方向         | ID                     | --bg        | --accent    | 字体       | 适用场景   |
| ------------ | ---------------------- | ----------- | ----------- | ---------- | ---------- |
| 编辑杂志风   | editorial-monocle      | #faf9f6     | #b85c3a     | serif+sans | 策展、学术 |
| 现代极简     | modern-minimal         | #fafbfb     | #3b82f6     | sans       | SaaS 文档  |
| 亲和人性化   | human-approachable     | #f8f9fa     | #10b981     | sans       | 教育、工具 |
| 技术工具风   | tech-utility           | #f8f9fb     | #22c55e     | sans+mono  | 运维、代码 |
| 粗野实验派   | brutalist-experimental | #f8f9fa     | #e03c28     | serif+mono | 艺术、出版 |
| **暖纸学术** | **example-warm-paper** | **#ede3cf** | **#b8860b** | **宋体**   | **知识库** |

---

## 1. editorial-monocle（编辑杂志风）

```css
--bg: #faf9f6 --surface: #ffffff --fg: #2d2a24 --muted: #6b6358
  --border: #e6e3db --accent: #b85c3a --code-bg: #f4f2ed;
```

- 标题字体：serif display
- 正文字体：sans-serif
- 约束：无阴影、无圆角、accent 最多用 2 次

## 2. modern-minimal（现代极简）

```css
--bg: #fafbfb --surface: #ffffff --fg: #1d2125 --muted: #777c82
  --border: #e8eaec --accent: #3b82f6 --code-bg: #f4f5f7;
```

- 字体：system sans-serif 全站统一
- 约束：hairline 边框(0.5px)、mono 数字

## 3. human-approachable（亲和人性化）

```css
--bg: #f8f9fa --surface: #ffffff --fg: #1e293b --muted: #64748b
  --border: #e2e8f0 --accent: #10b981 --code-bg: #f1f5f9;
```

- 字体：sans-serif
- 约束：大圆角 12-18px、微妙阴影

## 4. tech-utility（技术工具风）

```css
--bg: #f8f9fb --surface: #ffffff --fg: #1e293b --muted: #64748b
  --border: #e2e8f0 --accent: #22c55e --code-bg: #f1f5f9;
```

- 标题/正文：sans-serif 全站
- 代码字体：monospace
- 约束：密集表格、tabular-nums

## 5. brutalist-experimental（粗野实验派）

```css
--bg: #f8f9fa --surface: #ffffff --fg: #1a1a1a --muted: #595959
  --border: #1a1a1a --accent: #e03c28 --code-bg: #f0f0f0;
```

- 标题字体：serif 超大字号
- 正文字体：monospace
- 约束：0-2px 圆角、粗边框 1.5-2px

## 6. example-warm-paper（暖纸学术）✅ 有完整 Patch

```css
--bg: #ede3cf --surface: #f4efe2 --fg: #1c1814 --muted: #6b5f52
  --border: #d4c9b0 --accent: #b8860b --code-bg: #f4efe2;
```

- 字体：全站宋体（Noto Serif SC / Songti SC / SimSun）
- 布局示例：Quartz 三栏
- **Patch 目录：** `patches/example-warm-paper/`（8 个 @zone .patch 文件）

---

## 方向匹配建议

| 知识库类型    | 推荐               | 备选               |
| ------------- | ------------------ | ------------------ |
| 学术/研究笔记 | example-warm-paper | editorial-monocle  |
| 技术文档      | tech-utility       | modern-minimal     |
| 个人博客      | editorial-monocle  | human-approachable |
| 团队文档      | modern-minimal     | tech-utility       |
| 数字策展      | example-warm-paper | editorial-monocle  |

---

> **注意：** example-warm-paper 是唯一有完整 8-zone CSS Patch 的方向。
> 其余 5 个方向仅有此数据表。选择非 example-warm-paper 方向时，
> 需设计智能体参照 `patches/example-warm-paper/` 的 diff 格式创建对应 Patch。
