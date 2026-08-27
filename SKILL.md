---
name: obsidian-quartz-curator
description: 审计 Obsidian Vault，通过可配置 Profile 将其转译为 Quartz 站点，并以真实浏览器证据区分技术、视觉与发布裁决。
version: 1.0.0
---

# obsidian-quartz-curator v1.0

OQC 是面向多个 Obsidian 知识库的 Quartz 转译与发布技能。它把知识内容、站点配置、视觉 overlay 和发布仓库分离，使同一套工程能力可以重复服务不同 Vault。

## 输入与权威

开始前明确四类输入：只读 Vault、目标 Quartz 版本、`site-profile`、视觉权威。当前磁盘、构建产物、文件哈希与真实浏览器行为是执行权威；旧会话和历史报告仅作证据。未经授权不得改写原始 Vault、既有发布历史或冻结版本。

三个裁决必须分开记录：

- 技术门禁：构建、合同和浏览器交互是否通过。
- `visualApproval`：视觉负责人或用户是否明确通过。
- `releaseApproval`：是否明确授权提交、推送或上线。

前一项通过不自动授予后一项。

## Vault 审计

以只读方式检查 Markdown、附件、内部链接、frontmatter、首页入口、忽略规则和可能泄露的私密内容。形成纳入、排除、修复建议和阻断项清单。同步内容时复制到临时 fixture 或目标站点的 `content/`，不在源 Vault 内做构建性改写。

## Profile

复制 `site-profile.example.json` 形成站点专属配置，填写站点标题、副标题、语言、基础路径、仓库地址及主题权威。使用：

```powershell
node scripts/render-site-profile.mjs --profile path/to/site-profile.json --target path/to/quartz
```

生成 `quartz.config.ts` 与 `quartz.layout.ts` 后再构建。站点专属名称、路径和仓库不得写回通用 overlay。

## overlay

将 `overlay/quartz/` 按相对路径覆盖到目标 Quartz 工程。overlay 只承载通用 DOM、样式、组件与资源路径适配；配置由 Profile 生成，内容来自 Vault。覆盖前后记录 manifest，避免误写目标范围之外的文件。

## fixture

在隔离的临时 Quartz 工作区中装载固定 fixture。fixture 至少包含：长文、H2/H3、引用、有序列表、内部链接、Mermaid、图谱入口及足够的 Explorer 层级。每轮证据写入独立目录，不覆盖历史轮次。

## 构建

固定 Quartz 与 Node 版本后依次运行格式、类型、合同测试和生产构建。保存命令、退出码、日志、产物摘要及输入哈希。构建通过只代表技术前置成立，不代表视觉或发布通过。

## 真实浏览器

启动真实本地站点，以桌面和手机视口验证：首页、长文、Search、Explorer、Darkmode、Graph、Popover、Mermaid、SPA 导航、刷新持久化与基础路径资源。验收依据必须包括真实点击或键盘操作、最终可见状态、控制台错误、页面错误、请求失败和截图，不以直接调用脚本或静态 DOM 存在替代交互。

## 视觉裁决

视觉复核比较浅色与暗色权威、布局、排印、组件层级和响应式表现。技术自动化可指出溢出、遮挡或状态缺失，但只有明确的人类结论才能将 `visualApproval` 设为 `true`。未通过时创建新证据轮次并保留旧轮次。

## 发布裁决

仅在技术门禁通过、`visualApproval=true` 且用户明确给出发布授权后，才可将 `releaseApproval` 设为 `true`。发布前再次扫描本地绝对路径、凭据、私密内容、临时证据和站点专属残留；审阅暂存差异并生成发行 manifest。

## GitHub Pages

发布仓库保持干净，只包含公开技能包或站点产物。沿用既有远端历史时禁止强推；提交后创建语义版本标签，并核对远端分支与标签。站点仓库的 Pages 工作流、基础路径和资源地址必须与 Profile 一致。没有发布授权时只准备本地候选，不执行 push。

## 故障恢复

失败时停止在最近一个可验证状态，记录失败命令、日志、输入哈希、已完成门禁和安全恢复入口。不要覆盖已冻结证据，不要用回退旧输入来伪造新合同通过。浏览器或构建进程结束后清理本轮临时目录、会话和端口。

## 版本升级

新版本从上一冻结版本复制到新的开发目录，在独立测试与 fixture 中验证；上一版本只读。升级应更新 `VERSION`、`CHANGELOG.md`、`RELEASE.md`、Profile schema、合同测试和 manifest。稳定成果进入版本化成果目录，公开内容再同步到独立发行仓库。

`references/` 中的旧版 HTML 视觉流程仅供追溯，不是 v1.0 的默认发布路径。
