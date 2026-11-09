@echo off
chcp 65001 >nul
title Khôi phục Cơ sở dữ liệu KhoPro
echo ========================================================
echo   KHO PRO - KHÔI PHỤC CƠ SỞ DỮ LIỆU TỰ ĐỘNG
echo ========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp01_KhoiPhuc_CSDL.ps1"
echo.
pause
