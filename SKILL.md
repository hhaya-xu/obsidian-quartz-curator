---
name: obsidian-quartz-curator
description: |
  将 Obsidian 知识库通过 Quartz 构建为静态网站。
  引导代理完成：布局选择 → 功能勾选 → preview-base 生成 → CSS 设计协作 → 部署上线。
  通过结构化沟通文件实现知识总管代理与设计智能体的零依赖协作。
version: 0.5c
---
# obsidian-quartz-curator v0.5c

> 手动管线 | 逐步骤引导 | 基于 Quartz 的知识库发布协作技能

## §0 角色与原则

### 角色分工

本 Skill 涉及三个角色：

| 角色 | 身份 | 职责 |
|------|------|------|
| 知识总管代理 | 执行本 Skill 的代理 | 管线操作：Quartz 配置、构建、部署 |
| 设计智能体 | 负责 CSS 设计的外部智能体 | 用户可自命名。通过沟通文件协作 |
| 用户 | 知识库所有者 | 拥有视觉终审权，只看渲染效果不看代码 |

> 实际执行中，"知识总管代理"即当前执行本 Skill 的 Codex 代理。

### 设计原则

1. **视觉验收不可自动化。** 所有 CSS 变更在部署后必须经用户肉眼确认。
   代理只负责"把 CSS 放对位置、构建不出错"——好不好看、符不符合预期，由用户在浏览器中判断。

2. **代理与设计智能体严守边界。** 代理的 Quartz 知识是唯一权威——设计智能体写 CSS，
   代理决定"这个 CSS 转成什么 Quartz 格式"，设计智能体无权修改 quartz.config.ts 或组件。

3. **管线要有终点。** v0.5 阶段不追求自动化——代理手工跑通每步，
   积累经验为 v1.0 脚本化做准备。当前为手工管线，Step 3 用 preview-base 做视觉审阅，
   Step 4 用 diff 格式手动合并 CSS。v1.0 目标是脚本化 Apply。

4. **用户只看两样东西。** 整个流程中，用户只看：
   - preview-base.html（部署前审阅）
   - 线上站（部署后终审）
   用户永远不看代码、不看 diff、不看数据表。

## §1 概述

### 做什么

将 Obsidian 知识库通过 [Quartz](https://quartz.jzhao.xyz/) 构建为网站：
- 按 6 个预制品类引导代理完成布局选择
- 通过 Quartz Component 开关控制页面功能（16 个可选元素）
- 生成 preview-base.html 供设计智能体撰写 CSS
- 用 diff 格式将设计智能体的 CSS 合并到 custom.scss
- 部署到 GitHub Pages（或用户指定平台）

### 能力边界（v0.5）

本 Skill 的定位是 **Obsidian + Quartz 的发布协作层**。它假设：
用户知识库通过 Quartz 构建为网站，管线负责配置、CSS 注入、部署的协作流程。

v0.5c 不包含：
- ❌ 一键全自动（export-preview.ts / translate-css.ts 等脚本——规划 v1.0）
- ❌ 自动颜色映射（暂为手动——v1.0 目标）
- ❌ CSS 校验/自动修复（暂无——未来目标）
- ❌ 多项目/多站点支持（规划 v1.x）
- ❌ 小组件一键开关（需要更多验证）
- ❌ folder-count JS 注入（CSS 层定位 + JS 注入需要进一步研究）

### 前置条件

- 用户拥有一份初始化完成的 Quartz 项目
- 用户有知识库内容
- ⚠️ 字体源设为 local（Google Fonts 国内不可用）
- 代理掌握 Quartz 的基本构建命令（npx quartz build）
### Step 0: 建站场景

代理首问：**你要在已有知识库中建站，还是从零创建新知识库站点？**

| 场景 | 用户状态 | 后续流程 |
|------|---------|---------|
| A. 已有知识库 | Obsidian vault + Quartz + GitHub 已就绪 | Step 0a(验证) → Step 0b(项目名) → Step 0c(验证) → Step 1 |
| B. 从零创建 | 什么都没有，需要协助搭建 | Step 0a(创建vault) → Step 0b(项目名) → Step 0c(创建Quartz+仓库) → Step 1 |

> 场景选择写入沟通文件 zone=layout 顶部：`场景：A 已有 / B 新建`。

---

### Step 0a: 知识库路径

代理询问：**你的 Obsidian vault 路径是什么？还是需要我帮你创建？**

| 用户应答 | 代理操作 | 记录 |
|---------|---------|------|
| 输入路径 | 1. 递归向上查找 .obsidian 目录 2. 验证 content/ 存在 | ✅ 路径 |
| 帮我创建 | 创建目录结构 + .obsidian/ + content/ | ✅ 路径 |
| 略过 | 不阻塞，进入 Step 0b | ⚠️ 待补充 |

---

### Step 0b: 项目名称

代理询问：**你的项目叫什么名字？**

| 用户应答 | 代理操作 |
|---------|---------|
| 有名称 | 记录项目名，进 Step 0c |
| 没有 | 标记 ⚠️ 待补充，先略过，后面补 |

---

### Step 0c: 部署目标

> **默认：GitHub Pages。** 这是我们唯一完整测试并确认国内可用的免费方案。
> 代理不主动推荐其他平台——除非用户明确拒绝 GitHub。

代理询问：**部署到 GitHub Pages？还是你有其他偏好？（也可以略过，先设计页面）**

| 用户应答 | 代理操作 | 记录 |
|------|------|------|
| GitHub Pages（默认） | B 分支：1. 协助创建仓库（Public）→ Settings → Pages → GitHub Actions 2. git clone jackyzha0/quartz.git（纯净框架）3. 断开原仓库关联 4. git init + git config + git remote add 5. npm install 6. 极简初始化：quartz.layout.ts 组件清零，custom.scss 压平 Quartz 壳，content/index.md 一行 hello world 7. 国内配 SSH Key 8. 框架文件清单：只复制 .github/ quartz/ package.json *.d.ts .gitignore .prettierrc，不复制 content/ quartz.config.ts quartz.layout.ts custom.scss CNAME node_modules/ | ✅ URL |
| 用户指定其他 | 三步降级：①记录URL ②⚠️告知未经测试 ③确认用户接受后继续 | ✅ 已记录 |
| 略过 | 不阻塞，Step 5 降级为「仅构建不推送」 | ⚠️ 待补充 |

---

### Step 1: 布局与功能选择

代理询问用户 3 个问题：

**Q1: 选择布局？**
- A. 左中右三栏 — 适合有知识图谱、反向链接的知识库
- B. 左中两栏 — 适合博客型知识库

**Q2a: 你有设计智能体吗？**
- 有 → 叫什么名字？（将写入沟通文件）
- 没有 → Step 3~4 降级为用户手动写 CSS

**Q2b: 沟通文件路径**

> 当用户有设计智能体时，代理与设计智能体通过一个共享 Markdown 文件协作。
> 代理必须先向用户说明：
> - 这个文件的用途：你和设计智能体在这里交换 CSS 设计、验收结果、问题记录
> - 后续怎么用：设计智能体写 CSS → 你看效果 → 代理转译部署 → 验收

| 用户应答 | 代理操作 |
|---------|---------|
| 指定路径 | 使用该路径 |
| 让我生成（推荐） | 在知识库目录创建 `construction-site/`，生成标准化 3 件套：`oqc-通信文件.md` + `preview-base.html` + `操作指南.md` |

> ⚠️ 生成时角色名动态替换规则：Codex 代理名用当前会话代号，设计智能体名用 Q2a 获取的实际名称（未指定则默认「设计智能体」）。

---

### Q2c: preview-base 文件说明

> 进入 Q3 功能选择之前，代理必须先向用户说明 preview-base.html 的概念：
> - 这是一个可视化预览文件，用浏览器直接打开就能看到网页效果
> - 生成位置：`项目目录/原型页面/preview-base.html`
> - 用途：你在这里审阅设计智能体的 CSS 效果，**满意后再部署上线**——不用反复 push 看效果
> - 设计智能体把 CSS 写进 preview-base，你看完说了「可以」，代理才 push 到线上

---

**Q3: 功能选择（逐区引导）**

> Q3 执行规则（代理必须严格遵守）：

```
1. 根据 Q1 选择输出对应分支的区域总览：

   分支 A（三栏）：① 顶栏 → ② 左栏 → ③ 中栏 → ④ 右栏 → ⑤ 页脚 → ⑥ 全局
   分支 B（两栏）：① 顶栏 → ② 左栏 → ③ 中栏 → ④ 页脚 → ⑤ 全局
   （两栏时，原右栏项自动归入左栏末尾）

2. FOR EACH 区域：
   a. 先列出该区域全部选项（按主次排序），再提示：「选 A 全部 / B 全部不要 / C 逐项选择」
      （选项按实际使用主次排序）
   b. A/B → 直接记录，进下一区
   c. C → 列出功能项，逐项等用户确认
   d. 记录到 zone=layout（按区域分段）

3. 全部区域完成后，输出汇总确认 + 映射效果图（效果图必须与 Q1 所选布局一致：三栏出三栏图，两栏出两栏图）
   → 用户确认 → 写入 zone=layout，进 Step 2
   → 不满意 → 回到第 2 步，逐区重选
```

#### 分支 A 区域选项（三栏布局）

| 区域 | 选项（按主次排序） |
|------|------|
| ① 顶栏 | 站标题 → 副标题 → 主导航栏 → 搜索入口 → 主题切换 |
| ② 左栏 | 目录树 → 文件夹计数 |
| ③ 中栏 | Hero 区 → 文章标题 → 面包屑 → 日期+阅读时间 → 正文 → 标签列表 → 项目入口卡片 → 最近更新 → 标签云 |
| ④ 右栏 | 知识图谱 → 反向链接 → 页内目录 |
| ⑤ 页脚 | 版权信息 → 构建信息 |
| ⑥ 全局 | 整体风格 → 响应式适配 → 无障碍 |

> 全局区选项说明（代理在 ⑤ 全局 时必须展示）：
> - **整体风格：** 站点色板与字体体系。后期由设计智能体提供 6 套模板，或引入 OpenDesign 现成模板
> - **响应式适配：** 手机/平板/桌面 5 断点适配
> - **无障碍：** ARIA 标注 + 键盘导航 + 资源加载优先级

#### 分支 B 区域选项（两栏布局）

| 区域 | 选项（按主次排序） |
|------|------|
| ① 顶栏 | 站标题 → 副标题 → 主导航栏 → 搜索入口 → 主题切换 |
| ② 左栏 | 目录树 → 文件夹计数 → 知识图谱 → 反向链接 → 页内目录 |
| ③ 中栏 | Hero 区 → 文章标题 → 面包屑 → 日期+阅读时间 → 正文 → 标签列表 → 项目入口卡片 → 最近更新 → 标签云 |
| ④ 页脚 | 版权信息 → 构建信息 |
| ⑤ 全局 | 整体风格 → 响应式适配 → 无障碍 |

> 文姬模块对照（仅供代理内部参考，不展示给用户）：
> A=Hero, B=项目卡片, C=最近更新, D=标签云, E=搜索入口, F=暗色模式, G=响应式, H=无障碍

---

### Step 2: 生成 preview-base.html
### Step 2: 生成 preview-base.html
> v0.5c 手动操作，详细步骤见 `references/preview-base-steps.md`

1. 确认 `quartz.config.ts` 已按 Step 1 配置
2. 执行 `npx quartz build`
3. 复制 `public/index.html` 为 `preview-base.html`
4. 在 `</head>` 前注入 `<style id="design-css"></style>`（空标签，等待设计智能体填充）
5. 修正外部 CSS/JS 路径为 file:// 可访问路径
6. **初次执行时自动注入**（后续执行跳过）：
   - 在 `custom.scss` 中注入 6 个 `/* @zone:xxx */` 锚点（viewport / topbar / left-sidebar / center / right-sidebar / footer）
   - 在 `custom.scss` 追加 `.breadcrumb-container { display: none !important; }`

输出：`preview-base.html`（用户可用浏览器直接打开审阅）

---

### Step 3: 迭代设计

> 设计智能体（如文姬）读取 preview-base.html，按流程撰写 CSS，通过沟通文件回传。

#### 3.1 启动设计智能体

1. 代理在沟通文件中写入 `zone=layout` 信息（布局选择 + 功能清单）
2. 通知设计智能体读取三个文件：
   - `操作指南.md`（理解工作流）
   - `preview-base.html`（理解页面框架）
   - `oqc-通信文件.md`（读取 layout 信息）
3. 设计智能体在沟通文件中写入 `zone=handshake · 已就绪` 确认

#### 3.2 风格询问（设计智能体必须执行，不可跳过）

设计智能体在产出 CSS 前，**必须**向用户询问：

```
zone=style-inquiry · 等待用户回应

① 整体风格：温暖纸质 / 极简白 / 暗色学术 / 东方禅意 / 现代杂志 / 其他
② 参考网页 URL（可多个）
③ 设计"咒语"（自然语言描述，可选）
④ 现成模板/色板（可选）
```

用户回答后，设计智能体才可开始撰写 CSS。

#### 3.3 CSS 撰写规范（设计智能体遵守）

- **所有 CSS 写入沟通文件**（不是直接改 preview-base.html）
- **按 @zone 分区**（viewport / topbar / left-sidebar / center / footer）
- **只写装饰性 CSS**：颜色、字体、间距、边框、阴影、圆角、hover 效果
- **不写结构 CSS**：Grid、position、display、z-index 等（代理已在 preview-base 中搭好框架）
- 完成后标注 `zone=design · 完成`

#### 3.4 代理注入 + 用户审核

1. 代理从沟通文件读取 zone=design 的 CSS
2. 注入 `preview-base.html` 的 `<style id="design-css">` 标签
3. 用户浏览器打开 `preview-base.html` 审核
4. 通过 → 进 Step 4
5. 不通过 → 用户描述问题 → 设计智能体修改 CSS → 重复 3.3-3.4

> ⚠️ 此阶段不急于 push。先在本地把 preview-base 打磨到用户满意。

---

### Step 4: CSS 转换与合并

> 将设计智能体的 CSS 合并到 `custom.scss`。

1. 从沟通文件读取各 @zone 的 CSS 块
2. 在 `custom.scss` 中找到对应 `/* @zone:xxx */` 锚点
3. 用 diff 格式替换（详见 `references/diff-format-spec.md`）：
   - 移除旧 CSS（`-` 行）
   - 写入新 CSS（`+` 行）
   - 保留 @zone 锚点（保证二次 Apply 不失败）
4. 执行 `npx quartz build` 构建验证

---

### Step 5: 构建与部署

> ⚠️ 强制：推送前逐条输出 deployment-checklist 每项 ☑ 状态。

1. 清除缓存：`Remove-Item -Recurse -Force public, .quartz-cache`
2. 执行 `npx quartz build`
3. 逐条检查 `references/deployment-checklist.md` 14 项
4. 全部 ☑ → `git add -A && git commit && git push`
5. GitHub Actions 自动部署到 GitHub Pages

---

### Step 6: 线上验收（两关审核）

#### 第一关：preview-base 审核（部署前）

1. 用户在浏览器中打开 preview-base.html
2. 「视觉对不对」→ 通过进 Step 4 → Step 5（部署）
3. 不通过 → 用户描述问题 → 回到 Step 3（设计智能体改 CSS）

#### 第二关：线上站审核（部署后，根本审核）

1. 用户打开线上站 URL
2. 「和预览一致吗」→ 通过完成
3. 不一致 → 代理排查三类问题：

| 类别 | 现象 | 排查方向 |
|------|------|---------|
| 1 | 线上站和 preview-base 视觉不一致 | 代理 Quartz 转译出错 |
| 2 | 某个 @zone 样式没生效 | 代理锚点映射理解错误 |
| 3 | preview-base 本身就不对 | 设计智能体 CSS 写错（第一关已拦截） |

> 循环：样式问题 → 回 Step 3。结构/功能变更 → 回 Step 1。

---
## §4 沟通文件格式

> 代理与设计智能体通过共享 Markdown 文件协作。格式详见 `templates/communication-template.md`。

## §5 快速开始

1. 在 Quartz 项目目录中启动 Codex
2. 说：「用 obsidian-quartz-curator 发布我的知识库」
3. 代理引导完成 9 步管线（3 个前置步骤 + 6 个核心步骤）

## §6 版本路线

- v0.5c（当前）：手动管线，逐步骤引导
- v1.0（规划）：脚本化 Apply，验收循环自动化

## §7 依赖的参考文件

> ⚠️ 强制规则：遇到 GitHub/Quartz 报错时，先检索 `references/troubleshooting.md`。未覆盖的问题解决后追加到对应章节。

代理在执行各步骤时应加载以下参考文件：

| 所有步骤（遇到问题时） | `references/troubleshooting.md` |
| 步骤 | 参考文件 |
|------|---------|
| Step 0/0a/0b/0c | `templates/communication-template.md` |
| Step 1 | `references/16-anchors-mapping.md` |
| Step 2 | `references/preview-base-steps.md` |
| Step 3 | `references/design-directions.md`, `patches/example-warm-paper/`, `templates/操作指南.md` |
| Step 4 | `references/diff-format-spec.md`, `references/deployment-checklist.md` |
| Step 5 | `references/deployment-checklist.md` |
| Step 6 | `templates/communication-template.md` |

---

*obsidian-quartz-curator v0.5c*

