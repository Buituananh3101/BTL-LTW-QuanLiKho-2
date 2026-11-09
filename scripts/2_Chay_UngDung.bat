@echo off
chcp 65001 >nul
title Khởi chạy ứng dụng KhoPro
echo ========================================================
echo   📦 KHOPRO - KHỞI CHẠY ỨNG DỤNG WEB QUẢN LÝ KHO
echo ========================================================
echo.
echo [TÀI KHOẢN ĐĂNG NHẬP MẪU]:
echo   - Quản lý:   quanly   / 123456
echo   - Thủ kho:   thukho   / 123456
echo   - Bán hàng:  banhang  / 123456
echo.
echo [ĐỊA CHỈ TRUY CẬP]:
echo   - Mặc định:  http://localhost:7087 hoặc https://localhost:7215
echo.
echo Đang biên dịch và khởi chạy... (Nhấn Ctrl + C để dừng)
echo ========================================================
echo.
cd /d "%~dp0.."
dotnet run --project BTL-LTW-QuanLiKho-2\BTL-LTW-QuanLiKho-2.csproj
pause
