-- Migration 09: Bổ sung DaDanhDau vào bảng PhieuKiemKe
-- Tuân thủ 3 nguyên tắc vàng CSDL trong AGENTS.md: Chỉ cộng thêm cột mới, không DROP/đổi tên cột cũ.

USE [QuanLyKhoPhuQuocLTW];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Thêm cột DaDanhDau vào bảng PhieuKiemKe
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuKiemKe') AND name = 'DaDanhDau')
BEGIN
    ALTER TABLE [dbo].[PhieuKiemKe] 
    ADD [DaDanhDau] BIT NOT NULL CONSTRAINT [DF_PhieuKiemKe_DaDanhDau] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột DaDanhDau vào bảng PhieuKiemKe.';
END
ELSE
BEGIN
    PRINT N'[SKIP] Cột DaDanhDau đã tồn tại.';
END
GO
