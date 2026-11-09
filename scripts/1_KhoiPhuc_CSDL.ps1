# ========================================================================
# Script Khôi Phục CSDL Tự Động Cho KhoPro (BTL-LTW-QuanLiKho-2)
# ========================================================================
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   📦 KHOPRO - KHÔI PHỤC CƠ SỞ DỮ LIỆU TỰ ĐỘNG" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$repoRoot = Split-Path -Parent $PSScriptRoot
$bakPath = Join-Path $repoRoot "docs\QuanLyKhoPhuQuocLTW.bak"

if (-not (Test-Path $bakPath)) {
    Write-Host "[LỖI] Không tìm thấy file backup tại: $bakPath" -ForegroundColor Red
    exit 1
}

Write-Host "[1/3] Đang tìm kiếm máy chủ SQL Server khả dụng..." -ForegroundColor White
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
    Write-Host "[LỖI] Không thể kết nối tới SQL Server nào (đã thử .\SQLEXPRESS, ., localhost, (localdb)\MSSQLLocalDB)." -ForegroundColor Red
    Write-Host "Vui lòng đảm bảo SQL Server Service đang chạy trên máy của bạn." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2/3] Đang khôi phục CSDL từ file: $bakPath" -ForegroundColor White

$sql = @"
DECLARE @DataDir NVARCHAR(512) = CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS NVARCHAR(512));
DECLARE @LogDir  NVARCHAR(512) = CAST(SERVERPROPERTY('InstanceDefaultLogPath') AS NVARCHAR(512));

IF @DataDir IS NULL OR @DataDir = ''
    SET @DataDir = 'C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA\';
IF @LogDir IS NULL OR @LogDir = ''
    SET @LogDir = @DataDir;

DECLARE @DataFile NVARCHAR(512) = @DataDir + 'QuanLyKhoPhuQuocLTW.mdf';
DECLARE @LogFile  NVARCHAR(512) = @LogDir  + 'QuanLyKhoPhuQuocLTW_log.ldf';

-- Đóng các kết nối đang mở trước khi khôi phục đè
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'QuanLyKhoPhuQuocLTW')
BEGIN
    ALTER DATABASE [QuanLyKhoPhuQuocLTW] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
END

RESTORE DATABASE [QuanLyKhoPhuQuocLTW]
FROM DISK = N'$bakPath'
WITH MOVE N'QuanLyKhoPhuQuocLTW' TO @DataFile,
     MOVE N'QuanLyKhoPhuQuocLTW_log' TO @LogFile,
     REPLACE;

ALTER DATABASE [QuanLyKhoPhuQuocLTW] SET MULTI_USER;
"@

try {
    $res = sqlcmd -S $connectedServer -E -C -Q $sql
    Write-Host ""
    Write-Host "[3/3] Kiểm tra tính toàn vẹn CSDL sau khi khôi phục..." -ForegroundColor White
    $stats = sqlcmd -S $connectedServer -E -C -Q "USE QuanLyKhoPhuQuocLTW; SELECT count(*) AS TongBang FROM sys.tables; SELECT count(*) AS TongHangHoa FROM HangHoa; SELECT count(*) AS TongKhachHang FROM KhachHang;"
    $stats | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "   ✅ KHÔI PHỤC THÀNH CÔNG CSDL QuanLyKhoPhuQuocLTW!" -ForegroundColor Green
    Write-Host "   Máy chủ kết nối: $connectedServer" -ForegroundColor Cyan
    Write-Host "   Bây giờ bạn có thể chạy: scripts\2_Chay_UngDung.bat" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Green
} catch {
    Write-Host "[LỖI] Quá trình khôi phục gặp lỗi: $_" -ForegroundColor Red
    exit 1
}
