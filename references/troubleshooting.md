# GitHub + Quartz 经验顾问

> ⚠️ 遇到 GitHub/Quartz 问题时，先检索本文。未覆盖的问题探索解决后，追加到对应章节。

---

## 一、GitHub 踩坑录

### 1.1 国内 HTTPS 推送被阻断 | → checklist §14

**现象：** `git push` 报 `Recv failure: Connection was reset`

**原因：** 国内网络对 GitHub HTTPS 协议间歇性阻断。

**解决：** 改用 SSH。
```bash
git remote set-url origin git@github.com:用户/仓库.git
git push -u origin main --force
```

**前提：** 需先配置 SSH Key（GitHub Settings → SSH and GPG keys）。

---

### 1.2 删除 .git 后 git config 丢失 | → checklist §12

- **检查：** git config user.name 返回空

**现象：** `git commit` 报 `Author identity unknown`

**原因：** `Remove-Item .git -Recurse` 后，本地仓库级 git config 被清空。

**解决：** 重新 init 后第一时间设置：
```bash
git config user.email "邮箱"
git config user.name "用户名"
```

**已写入：** deployment-checklist 第 12 项。

---

### 1.3 远程仓库历史冲突导致 push 失败

**现象：** `git push --force` 报 `remote unpack failed: index-pack failed`

**原因：** 远程仓库残留了旧提交的 Git 对象，与新 init 的仓库历史冲突。

**解决：** 彻底重建——删除 `.git`，重新 `git init`，重新 add/commit/push。
```bash
Remove-Item -Recurse -Force .git
git init
git config user.email "xxx"
git config user.name "xxx"
git add -A
git commit -m "clean start"
git remote add origin git@github.com:用户/仓库.git
git branch -M main
git push -u origin main --force
```

---

### 1.4 GitHub Actions Node 版本不兼容 | → checklist §8

**现象：** Actions 构建失败，日志无明确错误。

**原因：** `setup-node@v6` 用 Node 24 可能与 Quartz 依赖不完全兼容。

**解决：** `.github/workflows/deploy.yml` 固定 `node-version: 22`。

**已写入：** deployment-checklist 额外坑。

---

### 1.5 CNAME 残留导致新项目部署失败 | → checklist §13

**现象：** Actions 构建成功但部署红叉（`deploy` job 失败）。

**原因：** workflow 中含有其他项目的 `echo "xxx" > public/CNAME` 行。

**解决：** 搜索 `.github/workflows/deploy.yml` 中 `CNAME` 关键字，删除无关行。

**已写入：** deployment-checklist 第 13 项。

---

### 1.6 分支名混乱（v5 vs main）

**现象：** push 时推到了错误的分支。

**原因：** 重新 init 时 `git branch -M main` 未执行，或远程默认分支是 `v5`。

**解决：**
```bash
git branch -M main
git push -u origin main --force
```

---

## 二、Quartz 踩坑录

### 2.1 Google Fonts 国内加载超时 | → checklist §1

**现象：** 页面白屏或字体不渲染。

**原因：** `quartz.config.ts` 默认 `theme.fontOrigin: "googleFonts"`，Google Fonts 国内被墙。

**解决：** 改为 `fontOrigin: "local"`。

---

### 2.2 Grid 布局：顶栏无法全宽 | → checklist §2

**现象：** 顶栏无法从浏览器左边缘延伸到右边缘。

**原因：** `base.scss` 定义的 `grid-template-areas` 将 header 限制在中间列。

**解决：** `custom.scss` 覆盖：
```scss
#quartz-body {
  grid-template-areas: none !important;
}
.page-header {
  grid-column: 1 / -1;
}
```

**已写入：** deployment-checklist 第 2 项。

---

### 2.3 Sidebar 内边距残留 | → checklist §3

**现象：** 左右栏内容不贴边，有内边距。

**原因：** `base.scss` 中 `.page > #quartz-body .sidebar` 定义了 `padding: 6rem 2rem 2rem 2rem`（具体度 0,2,1）。

**解决：**
```scss
.left.sidebar, .right.sidebar {
  padding: 0 !important;
}
```
需要 `!important`，因为 base.scss 选择器具体度更高。

**已写入：** deployment-checklist 第 3 项。

---

### 2.4 Dart Sass 伪元素兼容 | → checklist §4

**现象：** 某些 CSS 规则不生效。

**原因：** Quartz 使用的 Dart Sass 对双冒号伪元素（`::after`、`::before`）兼容不稳定，部分规则静默丢弃。

**解决：** 所有伪元素用单冒号：`:after`、`:before`。

**已写入：** deployment-checklist 第 4 项。

---

### 2.5 构建缓存导致改动不生效 | → checklist §5

**现象：** 修改 TSX 组件后线上无变化。

**原因：** `.quartz-cache/` 和 `public/` 残留旧编译产物。

**解决：** 每次修改 TS/TSX 后清除：
```bash
Remove-Item -Recurse -Force public, .quartz-cache -ErrorAction SilentlyContinue
npx quartz build
```

---

### 2.6 Body margin 8px | → checklist §6

**现象：** 顶栏不贴浏览器边缘，有 8px 白边。

**原因：** 浏览器默认 `body { margin: 8px }`，Quartz 的 `base.scss` 未覆盖。

**解决：** `custom.scss` 添加 `body { margin: 0; }`

**已写入：** deployment-checklist 额外坑。

---

### 2.7 中文文件名 URL | → checklist §7 编码 → 404

**现象：** 中文文件名的笔记访问 404。

**原因：** Quartz 对中文路径 URL 编码处理不完整。

**解决：**
1. 避免中文文件名（推荐）
2. 或配置 `quartz.config.ts` 的 slug 映射

---

### 2.8 custom.scss `@import` 不生效

**现象：** `@import "fonts.scss"` 不加载。

**原因：** Quartz 的 Dart Sass 编译管线独立处理 `custom.scss`，`@import` 指向的文件不在编译路径中。

**解决：** 所有样式直接写在 `custom.scss` 中，或通过 Quartz 的 transformer 注入。

---

### 2.9 组件禁用 ≠ CSS 移除

**现象：** `quartz.layout.ts` 设组件为空数组，但页面仍有该组件的 CSS。

**原因：** Quartz 构建会将所有组件 CSS 打包进 `index.css`，与 layout 配置无关。

**解决：** 用 `custom.scss` 的 `display: none` 隐藏不需要的组件壳。
```scss
.page-header, .page-footer, .left.sidebar, .right.sidebar {
  display: none !important;
}
```

---

### 2.10 `npm create quartz` 不存在

**现象：** `npm create quartz@latest` 返回 404。

**原因：** Quartz v4 没有 npm 初始化命令。

**正确方式：**
```bash
git clone --depth 1 https://github.com/jackyzha0/quartz.git <dir>
cd <dir>
npm install
```

---

### 2.11 网络受限时获取 Quartz 框架的替代方案

**现象：** `git clone https://github.com/jackyzha0/quartz.git` 超时。

**替代方案：** 从已有 Quartz 项目复制框架文件（仅复制以下，不复制 content 和自定义文件）：
- `.github/` `quartz/`
- `package.json` `package-lock.json` `tsconfig.json`
- `*.d.ts` `.gitignore` `.prettierrc`
- `.node-version` `.npmrc` `Dockerfile`

**不复制：** `content/` `quartz.config.ts` `quartz.layout.ts` `quartz/styles/custom.scss` `CNAME` `node_modules/`

---

## 三、编码教训

### 3.1 PowerShell String.Replace 对中文静默失败

**现象：** `$content.Replace('旧文本','新文本')` 对含中文的字符串静默不替换，`Set-Content` 写入的是未修改的旧内容。

**原因：** PowerShell 5.x 的 `String.Replace()` 对多字节 UTF-8 字符处理不稳定，不是 `Set-Content` 的问题。

**解决：** 使用 .NET API：
```powershell
$txt = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$txt = $txt.Replace('old', 'new')
[System.IO.File]::WriteAllText($file, $txt, [System.Text.UTF8Encoding]::new($false))
```

---

*obsidian-quartz-curator 经验顾问 · v0.5b*


## 附录：追加模板

代理探索出新问题后，按此格式追加到对应章节（N=章节号，M=该章节内序号，如 1.7 表示 GitHub 第 7 条）：

- **检查：** 一行命令判断是否命中
- **现象：** 一行描述
- **原因：** 一行根因
- **修复：** 命令或配置修改

追加后更新文件顶部日期。