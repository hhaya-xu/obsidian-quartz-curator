# Obsidian Quartz Curator v1.1

## 新站与旧站入口

新站或尚未注册的站点先使用私有 Profile 完成隔离认证：

```powershell
oqc certify --profile <私有Profile路径>
oqc certify --profile <私有Profile路径> --visual-approval-ref <批准记录>
```

仅已有有效认证锁但缺少内容基线的旧站使用：

```powershell
oqc publish --profile <私有Profile路径> --adopt-existing
```

注册完成后的日常路径只使用站点别名：

```powershell
oqc status --site <站点别名>
oqc publish --site <站点别名> --changed --push
```

Profile 仅供馆长 bootstrap；它不进入公开包。认证、视觉批准、站点发布批准和 OQC 产品发布批准彼此独立。遇到 incident 或阻断应停止并提交体验汇报，不把技术通过当作发布批准。

OQC 把严格的站点认证与高频的内容发布分开。Node.js 22+ 环境安装后，知识库管理者日常只使用站点别名：

```powershell
oqc status --site <站点别名>
oqc publish --site <站点别名> --changed --push
```

只有 `status` 返回 `READY` 才继续。`BASELINE_REQUIRED`、`BLOCKED_CERTIFICATION` 或任何 incident 都应停止并交给馆长或伯喈。

### Approval sequencing

The first certification performs technical verification and waits for visual approval. The second certification only references the existing approval record supplied by 主公. Technical verification, visual approval, site publication approval, and product release approval are separate decisions; passing tests never grants any approval.

## 四种发布模式

- `--changed`：发布相对真实基线发生变化的内容；
- `--manifest <file>`：发布显式清单，仍受内容排除政策约束；
- `--surface-only`：只发布已认证表面，不读取 Vault；
- `--adopt-existing`：旧站首次接入，只写私有基线和本地站点注册表。

四种模式互斥。Profile、认证、旧站 adopt 和 Git 恢复属于馆长职责。Vault 永远是本地原件权威；公开副本可脱敏，但不得反写 Vault。

## 认证边界

`oqc certify` 在隔离 fixture 完成技术门禁，获得外部视觉批准后才安装表面。认证成功后依次建立内容基线、登记别名并最后写锁。技术验证、视觉批准、站点发布批准和 OQC 产品发布批准相互独立。

GitHub SSH 仅在网络类故障时尝试一次同仓库 HTTPS；身份认证、非快进和远端漂移不回退，不改 origin，不 force push，不重复 commit。
