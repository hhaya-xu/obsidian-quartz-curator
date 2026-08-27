# DOM 选择器验证

> 目标：确保 CSS patch 中的每个选择器都能命中 Quartz 构建产物的真实 DOM。
> 原则：不猜 DOM。build 后验证，验证不过的立刻修正。

---

## 为什么需要这一步

Quartz 的 HTML 由其 JSX 模板系统生成，CSS 类名取决于 Quartz 版本、配置、布局选择。
上一版本依赖"智慧树项目经验"中的选择器——这在同一个项目中有效，但换一个 Quartz 版本或配置就可能失效。

**CSS 写得再漂亮，选择器打不到 DOM 上就等于白写。**

---

## 执行时机

在 `preview-base-steps.md` 的 Step 2（`npx quartz build` 完成）之后、Step 3（复制为 preview-base）之前。

---

## 选择器验证清单

以下选择器**预期**出现在 Quartz 构建产物 `public/index.html` 中：

### ============================================================

# 动态读取 16-anchors-mapping.md 获取选择器（权威源）

# ============================================================

$mappingFile = "references\16-anchors-mapping.md"
if (-not (Test-Path $mappingFile)) {
    Write-Error "映射表不存在: $mappingFile"
    exit 1
}
$mapping = [System.IO.File]::ReadAllText($mappingFile, [System.Text.Encoding]::UTF8)

$allSelectors = [System.Collections.ArrayList]@()

# 从 Markdown 表第 4 列提取所有组件选择器

foreach ($line in ($mapping -split "`r`n|`n")) {
    if ($line -match '^\|\s*\d+\s*\|\s*[a-z][-a-z]*\s*\|\s*(?:[^|]+)\|\s*`\.?([^`]+)`') {
$s = $Matches[1].Trim()
        if ($s -notin $allSelectors) {
            [void]$allSelectors.Add($s)
}
}
}

# 补充结构级选择器（必有的框架级元素）

$structuralSelectors = @(
    "#quartz-root",
    "#quartz-body",
    ".page",
    "#quartz-header",
    ".sidebar.left",
    ".center",
    ".sidebar.right",
    "footer"
)
foreach ($s in $structuralSelectors) {
    if ($s -notin $allSelectors) {
        [void]$allSelectors.Add($s)
}
}

Write-Host "从 16-anchors-mapping.md 加载了 $($allSelectors.Count) 个选择器"

# 逐个验证

$pass = 0
$fail = 0
foreach ($sel in $allSelectors) {
    $found = $html -match [regex]::Escape($sel)
$mark = if ($found) { $pass++; "✅" } else { $fail++; "❌" }
    Write-Host "$mark $sel"
}

Write-Host "`n=== 结果: $pass 命中, $fail 失败 ===" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })

## 验证失败时的处理流程

```
选择器未命中
    ↓
打开 public/index.html
    ↓
搜索对应功能的关键词（如搜索"文件夹"找 explorer 区域）
    ↓
确认 Quartz 实际使用的 class/id
    ↓
修正 SKILL.md §1 16-anchors-mapping.md 中的映射
    ↓
修正 patches/ 中对应方向的 CSS patch 选择器
    ↓
重新验证
```

---

## 注意事项

1. `.right.sidebar` 仅在三栏布局时存在，两栏布局时标记为"未启用"而非失败
2. 组件选择器是否"必须"取决于用户的 Q3 功能选择——此脚本先全量检查，代理根据用户选择判断是否阻塞
3. Quartz 大版本升级时（如 v4→v5），结构选择器可能全部失效，需完整重新映射

## 验证脚本（PowerShell）

```powershell
param(
    [string]$HtmlFile = ".\public\index.html",
    [string]$MappingFile = "references\16-anchors-mapping.md"
)
$html = [System.IO.File]::ReadAllText($HtmlFile, [System.Text.Encoding]::UTF8)
$mapRaw = [System.IO.File]::ReadAllText($MappingFile, [System.Text.Encoding]::UTF8)
$selectors = [System.Collections.ArrayList]@()
foreach ($line in ($mapRaw -split "\r?\n")) {
    if ($line -match '^\|\s*\d+\s*\|\s*[a-z][-a-z]*\s*\|\s*(?:[^|]+)\|\s*`.?([^`]+)`') {
        [void]$selectors.Add($Matches[1].Trim())
    }
}
@(".page","#quartz-header",".sidebar.left",".center",".sidebar.right","footer") | ForEach-Object {
    if ($_ -notin $selectors) { [void]$selectors.Add($_) }
}
$pass = 0; $fail = 0
foreach ($sel in $selectors) {
    if ($sel.StartsWith("#")) {
        $name = $sel.Substring(1)
        $found = $html -match "id=[\u0027\u0022]$name[\u0027\u0022]"
    } elseif ($sel.StartsWith(".")) {
        $name = $sel.Substring(1)
        $found = $html -match "class=[\u0027\u0022][^\u0027\u0022]*\b$name\b"
    } else {
        $found = $html -match "<$sel[\s>]"
    }
    $mark = if ($found) { $pass++; "\u2705" } else { $fail++; "\u274C" }
    Write-Host "$mark $sel"
}
Write-Host "\n=== $pass hit, $fail miss ==="
```
