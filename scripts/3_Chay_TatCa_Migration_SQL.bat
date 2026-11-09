@echo off
chcp 65001 >nul
title Chạy tất cả Migration SQL KhoPro
echo ========================================================
echo   KHO PRO - CHẠY TẤT CẢ FILE MIGRATION SQL TUẦN TỰ
echo ========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp03_Chay_TatCa_Migration_SQL.ps1"
echo.
pause
