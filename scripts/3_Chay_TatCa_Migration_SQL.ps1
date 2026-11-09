# ========================================================================
# Script Chạy Toàn Bộ File Migration SQL (Tuần tự từ 01 đến 18)
# Dành cho trường hợp không dùng file backup .bak
# ========================================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   📦 KHOPRO - CHẠY TẤT CẢ FILE MIGRATION SQL" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$repoRoot = Split-Path -Parent $PSScriptRoot
$migrationDir = Join-Path $repoRoot "migrations\sql"

$instances = @(".\SQLEXPRESS", ".", "localhost", "(localdb)\MSSQLLocalDB")
$connectedServer = $null

foreach ($inst in $instances) {
    try {
        $out = sqlcmd -S $inst -E -C -Q "SELECT 1" 2>$null
        if ($LASTEXITCODE -eq 0) {
            $connectedServer = $inst
            Write-Host "  -> Tìm thấy SQL Server tại: $inst" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $connectedServer) {
    Write-Host "[LỖI] Không thể kết nối tới SQL Server nào." -ForegroundColor Red
    exit 1
}

$sqlFiles = Get-ChildItem -Path $migrationDir -Filter "*.sql" | Sort-Object Name

Write-Host ""
Write-Host "Tìm thấy $($sqlFiles.Count) file migration SQL trong thư mục migrations\sql:" -ForegroundColor White
$sqlFiles | ForEach-Object { Write-Host "  • $($_.Name)" -ForegroundColor Gray }
Write-Host ""

$count = 0
foreach ($file in $sqlFiles) {
    $count++
    Write-Host "[$count/$($sqlFiles.Count)] Đang chạy: $($file.Name)..." -NoNewline
    try {
        $res = sqlcmd -S $connectedServer -E -C -f 65001 -i $file.FullName
        Write-Host " [OK]" -ForegroundColor Green
    } catch {
        Write-Host " [LỖI]" -ForegroundColor Red
        Write-Host "  Chi tiết lỗi: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "   ✅ ĐÃ CHẠY HOÀN TẤT TẤT CẢ MIGRATION SQL!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
