<#
.SYNOPSIS
    OQC 样式析出脚本 —— 自动对比 preview-base.html 新旧版本，提取 CSS 变更，生成 SCSS 补丁。
.DESCRIPTION
    读取新旧 preview-base.html，diff <style id="design-css"> 内的 CSS 变更，
    通过 @zone 映射表转为 Quartz 选择器，输出 idempotent SCSS 补丁。
.PARAMETER NewFile
    主公确认后的新版 preview-base.html 路径（默认：construction-site/preview-base.html）
.PARAMETER OldFile
    上一轮副本路径（默认：construction-site/preview-base.prev.html）
.PARAMETER MappingFile
    @zone 映射表路径（默认：references/16-anchors-mapping.md）
.PARAMETER OutputPatch
    输出补丁路径（默认：patches/style-diff.patch）
.EXAMPLE
    .\style-extraction.ps1
    .\style-extraction.ps1 -NewFile "other/preview.html" -OldFile "other/preview.old.html"
#>

param(
    [string]$NewFile = "construction-site\preview-base.html",
    [string]$OldFile = "construction-site\preview-base.prev.html",
    [string]$MappingFile = "references\16-anchors-mapping.md",
    [string]$OutputPatch = "patches\style-diff.patch"
)

$ErrorActionPreference = "Stop"

# ============================================================
# 白名单：22 个已知 @zone 名称（16 个组件 + 6 个结构级）
# ============================================================
$KNOWN_ZONES = @(
    "site-title", "site-subtitle", "search", "theme-toggle",
    "explorer", "folder-count", "article-title", "content-meta",
    "breadcrumb", "article-body", "tags", "graph",
    "backlinks", "toc", "copyright", "build-info",
    "viewport", "topbar", "left-sidebar", "center", "right-sidebar", "footer"
)

# ============================================================
# 步骤 1：验证输入
# ============================================================
if (-not (Test-Path $NewFile)) {
    Write-Error "新版 preview-base.html 不存在: $NewFile"
    exit 1
}
if (-not (Test-Path $MappingFile)) {
    Write-Error "@zone 映射表不存在: $MappingFile"
    exit 1
}
$hasOld = Test-Path $OldFile

# ============================================================
# 步骤 2：提取 <style id="design-css"> 内容
# ============================================================
function Get-DesignCSS {
    param([string]$HtmlPath)
    $html = [System.IO.File]::ReadAllText($HtmlPath, [System.Text.Encoding]::UTF8)
    if ($html -match '<style[^>]*id="design-css"[^>]*>(.*?)</style>') {
        return $Matches[1].Trim()
    }
    return ""
}

$newCSS = Get-DesignCSS $NewFile
if (-not $newCSS) {
    Write-Warning "<style id='design-css'> 为空或不存在于 $NewFile"
    exit 0
}

$oldCSS = if ($hasOld) { Get-DesignCSS $OldFile } else { "" }

# ============================================================
# 步骤 3：按 @zone 分区
# ============================================================
function Split-ByZone {
    param([string]$CSS)
    $zones = [ordered]@{}
    $currentZone = "__global__"
    foreach ($line in ($CSS -split "`r`n|`n")) {
        # 行首锚定 + 行尾锚定 + 白名单校验 —— 防止文姬注释中的 @zone 误匹配
        if ($line -match '^\s*/\*\s*@zone:(\S+)\s*\*/\s*$') {
            $candidate = $Matches[1]
            if ($KNOWN_ZONES -contains $candidate) {
                $currentZone = $candidate
            }
        }
        if (-not $zones.ContainsKey($currentZone)) {
            $zones[$currentZone] = [System.Collections.ArrayList]@()
        }
        [void]$zones[$currentZone].Add($line)
    }
    return $zones
}

$newZones = Split-ByZone $newCSS
$oldZones = if ($hasOld) { Split-ByZone $oldCSS } else { @{} }

# ============================================================
# 步骤 4：加载 @zone → Quartz 选择器映射表
# ============================================================
function Get-QuartzSelectorMap {
    param([string]$Path)
    $map = @{}
    $content = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    # 解析 Markdown 表行：| # | zone_name | Component | `.selector` | method | status |
    # 提取第 2 列（zone 名）和第 4 列（CSS 选择器）
    $lines = $content -split "`r`n|`n"
    foreach ($line in $lines) {
        if ($line -match '^\|\s*(\d+)\s*\|\s*([a-z][-a-z]*)\s*\|\s*(?:[^|]+)\|\s*`\.?([^`]+)`') {
            $zoneName = $Matches[2]
            $selector = $Matches[3].Trim()
            $map[$zoneName] = $selector
        }
    }
    # 补充结构级 zone 的手动映射（不在 16 锚点表中）
    if (-not $map.ContainsKey("viewport"))     { $map["viewport"]     = ".page" }
    if (-not $map.ContainsKey("topbar"))       { $map["topbar"]       = "#quartz-header" }
    if (-not $map.ContainsKey("left-sidebar")) { $map["left-sidebar"] = ".sidebar.left" }
    if (-not $map.ContainsKey("center"))       { $map["center"]       = ".center" }
    if (-not $map.ContainsKey("right-sidebar")){ $map["right-sidebar"]= ".sidebar.right" }
    if (-not $map.ContainsKey("footer"))       { $map["footer"]       = "footer" }
    return $map
}

$selectorMap = Get-QuartzSelectorMap $MappingFile

# ============================================================
# 步骤 5：逐 zone 生成 idempotent SCSS diff
# ============================================================
$patchLines = [System.Collections.ArrayList]@()
[void]$patchLines.Add("*** Begin Patch")
[void]$patchLines.Add("*** Update File: quartz/styles/custom.scss")

$zoneCount = 0
foreach ($zone in $newZones.Keys) {
    if ($zone -eq "__global__") { continue }

    $newBlock = ($newZones[$zone] -join "`n").Trim()
    $oldBlock = ""
    if ($oldZones.ContainsKey($zone)) {
        $oldBlock = ($oldZones[$zone] -join "`n").Trim()
    }

    # 跳过无变化
    if ($hasOld -and ($newBlock -eq $oldBlock)) { continue }

    $zoneCount++
    $selector = if ($selectorMap.ContainsKey($zone)) { $selectorMap[$zone] } else { "__UNMAPPED__" }

    [void]$patchLines.Add("@@ /* @zone:$zone */ @@")

    # 移除 @zone 注释行和空行，提取纯 CSS 规则
    $newRules = ($newBlock -split "`r`n|`n") | Where-Object {
        $_ -notmatch '^\s*/\*\s*@zone:' -and $_.Trim() -ne ""
    }
    $oldRules = if ($oldBlock) {
        ($oldBlock -split "`r`n|`n") | Where-Object {
            $_ -notmatch '^\s*/\*\s*@zone:' -and $_.Trim() -ne ""
        }
    } else { @() }

    # - 行：旧 CSS（idempotent：锚点 + 完整规则块，保留多行结构）
    [void]$patchLines.Add("-/* @zone:$zone */")
    if ($oldRules.Count -gt 0) {
        [void]$patchLines.Add("-  ${selector} {")
        foreach ($rule in $oldRules) {
            $trimmed = $rule.Trim()
            if ($trimmed -and $trimmed -notmatch '^\s*//' -and $trimmed -ne '{' -and $trimmed -ne '}') {
                [void]$patchLines.Add("-    $trimmed")
            }
        }
        [void]$patchLines.Add("-  }")
    }

    # + 行：新 CSS（idempotent：锚点 + 完整规则块，保留多行结构）
    [void]$patchLines.Add("+/* @zone:$zone */")
    if ($newRules.Count -gt 0) {
        [void]$patchLines.Add("+  ${selector} {")
        foreach ($rule in $newRules) {
            $trimmed = $rule.Trim()
            if ($trimmed -and $trimmed -notmatch '^\s*//' -and $trimmed -ne '{' -and $trimmed -ne '}') {
                [void]$patchLines.Add("+    $trimmed")
            }
        }
        [void]$patchLines.Add("+  }")
    }
}

[void]$patchLines.Add("`n*** End Patch")

# ============================================================
# 步骤 6：输出补丁文件
# ============================================================
$patchDir = Split-Path $OutputPatch -Parent
if ($patchDir -and -not (Test-Path $patchDir)) {
    New-Item -ItemType Directory -Path $patchDir -Force | Out-Null
}

$patchContent = $patchLines -join "`n"
[System.IO.File]::WriteAllText($OutputPatch, $patchContent, [System.Text.UTF8Encoding]::new($false))

# ============================================================
# 步骤 7：输出摘要
# ============================================================
Write-Host "========================================"
Write-Host "  样式析出完成"
Write-Host "========================================"
Write-Host "新版: $NewFile"
Write-Host "旧版: $(if ($hasOld) { $OldFile } else { '(无，首次运行)' })"
Write-Host "变更 zone 数: $zoneCount"
Write-Host "输出补丁: $OutputPatch"
if ($zoneCount -eq 0) {
    Write-Host "结果: 无变更，无需 Apply"
} else {
    Write-Host "结果: 请审核补丁后 Apply 到 custom.scss"
}
Write-Host "========================================"
