> ⚠️ 代理必须逐条输出到终端，全部 ☑ 后方可推送。

# Quartz 部署前检查清单

> 部署到 GitHub Pages 或自有服务器前的必检项。以下每一条都是踩过的坑，逐条确认可避免 90% 的部署故障。

## 五条铁律

- [ ] **1. 字体源为 local**
  - 检查：`quartz.config.ts` → `theme.typography.fontOrigin: "local"`
  - 原因：Google Fonts 在国内被 GFW 封锁，`"google"` 会导致字体加载超时、页面白屏
  - 验证：F12 → Network → 确认无 `fonts.googleapis.com` 请求
  - → troubleshooting.md §2.1

- [ ] **2. Grid 布局已覆盖 base.scss**
  - 检查：`custom.scss` 中有 `grid-template-areas` 覆盖规则
  - 原因：`base.scss` 默认 Grid 只给 `header` 分配中间一列，顶栏无法从浏览器左边缘延伸到右边缘
  - 验证：线上站顶栏从浏览器左边缘到右边缘，无空白缺口
  - → troubleshooting.md §2.2

- [ ] **3. Sidebar padding 清零**
  - 检查：`custom.scss` 中有 `.left.sidebar, .right.sidebar { padding: 0 !important; }`
  - 原因：`base.scss` 给 `.sidebar` 加了默认 padding，会破坏自定义 sidebar 布局
  - 验证：左右栏内边距为 0
  - → troubleshooting.md §2.3

- [ ] **4. 伪元素用单冒号**
  - 检查：所有伪元素写 `:after` / `:before`（非 `::after` / `::before`）
  - 原因：Quartz 使用的 Dart Sass 对双冒号伪元素兼容不稳定，部分规则会静默丢弃
  - → troubleshooting.md §2.4

- [ ] **5. 构建缓存已清除**
  - 检查：`public/` 和 `.quartz-cache/` 目录已删除
  - 原因：修改 TS/TSX 组件后不删缓存，可能残留旧编译产物导致改动不生效
  - 命令：
    ```powershell
    Remove-Item -Recurse -Force public, .quartz-cache -ErrorAction SilentlyContinue
    ```
  - → troubleshooting.md §2.5

## 扩展检查

- [ ] **6. body margin 8px 覆盖**
  - 现象：顶栏不贴浏览器边缘，有 8px 白边
  - 原因：浏览器默认 `body { margin: 8px }`，Quartz 未覆盖
  - 修复：`custom.scss` 中添加 `body { margin: 0; }`
  - → troubleshooting.md §2.6

- [ ] **7. 中文文件名 URL 编码**
  - 现象：中文文件名的笔记 → 404
  - 原因：Quartz 对中文路径的 URL 编码处理不完整
  - 修复：避免使用中文文件名，或在 `quartz.config.ts` 中配置 slug 映射
  - → troubleshooting.md §2.7

- [ ] **8. GitHub Actions Node 版本（仅 GitHub Pages 用户）**
  - 现象：GitHub Actions 部署构建失败
  - 原因：`setup-node` 使用 Node 24 可能与 Quartz 依赖不完全兼容
  - 修复：`.github/workflows/deploy.yml` 中固定 `node-version: 22`
  - → troubleshooting.md §1.4

- [ ] **9. 中文字体栈含系统回退**
  - 检查：font-family 末尾包含 SimSun / PingFang SC / Microsoft YaHei 等系统原生中文字体
  - 原因：Web 字体可能加载失败，系统回退确保中文在任何情况下可读
  - 验证：浏览器 DevTools → 禁用所有 Web 字体 → 中文仍正常显示

- [ ] **10. 移动端视口 <720px 可读**
  - 检查：缩小浏览器至 375px 宽度，无横向滚动条，正文字号 ≥ 14px
  - 原因：Quartz 默认移动端 Grid 与桌面端不同，自定义布局可能破坏响应式
  - 验证：Chrome DevTools → Device Mode → iPhone SE → 全部内容可见可读

- [ ] **11. content/index.md 存在且有内容**
  - 检查：content/index.md 文件存在且非空白
  - 原因：Quartz 首页由此文件渲染，缺失则首页 404
  - 验证：线上站首页正常显示，非空白页

> **B 分支（新建）额外步骤：** GitHub 仓库创建 + Settings → Pages → GitHub Actions source + git remote add origin。

- [ ] **12. 新仓库 git 用户已配置**（B 分支必检）
  - 检查：`git config user.name` 和 `git config user.email` 均非空
  - 原因：新仓库无 git 配置会导致 commit 失败
  - 修复：`git config user.name "xxx"` + `git config user.email "xxx@xxx"`
  - → troubleshooting.md §1.2

- [ ] **13. deploy.yml 无旧项目残留**
  - 检查：`.github/workflows/deploy.yml` 中无其他项目的 CNAME 或自定义域名
  - 原因：从已有项目复制骨架时可能带入旧配置
  - 修复：搜索 `CNAME` 关键字，删除无关行
  - → troubleshooting.md §1.5

- [ ] **14. 国内用户优先用 SSH（非 HTTPS）推送**
  - 检查：`git remote get-url origin` 返回 `git@github.com:...`（SSH 格式）
  - 原因：国内网络 HTTPS 推送频繁被重置（Recv failure: Connection was reset），SSH 稳定
  - 修复：`git remote set-url origin git@github.com:用户/仓库.git`
  - 前提：需先配置 SSH Key → GitHub Settings → SSH and GPG keys
  - → troubleshooting.md §1.1

> **平台经验：** Cloudflare Pages 已测试——注册繁琐、国内不稳定，不推荐。本 Skill 默认 GitHub Pages，仅当用户明确拒绝 GitHub 时才讨论替代方案。

---

_部署前逐条打勾确认，可避免反复调试。_
