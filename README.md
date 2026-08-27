# Obsidian Quartz Curator (OQC) v1

OQC 将 Obsidian Vault 审计、Quartz 结构注入、双主题视觉、真实浏览器验收和 GitHub Pages 发布组织为一条可复核的工作流。

## 快速开始

1. 复制 `site-profile.example.json` 为本机 Profile；
2. 填写知识库、Quartz 工程、站点标题、仓库和 `baseUrl`；
3. 运行 `node scripts/render-site-profile.mjs --profile <profile.json> --target <quartz-project>`；
4. 将 `overlay/` 按相对路径覆盖到 Quartz 4.5.2 工程；
5. 运行 TypeScript、Quartz 测试与正式构建；
6. 使用真实浏览器完成桌面、手机和交互验收；
7. 分别取得视觉批准和发布批准后再推送。

详细约束见 `SKILL.md`，故障排查见 `references/`。
