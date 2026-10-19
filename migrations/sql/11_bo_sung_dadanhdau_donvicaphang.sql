-- Migration 11: Bổ sung DaDanhDau vào bảng DonViCapHang
-- Phục vụ phân hệ Nhà cung cấp (đánh dấu sao yêu thích và lọc theo nhà cung cấp đánh dấu sao)
-- Tuân thủ 3 nguyên tắc vàng CSDL trong AGENTS.md: Chỉ cộng thêm cột mới, không DROP/đổi tên cột cũ.

USE [QuanLyKhoPhuQuocLTW];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Thêm cột DaDanhDau vào bảng DonViCapHang
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DonViCapHang') AND name = 'DaDanhDau')
BEGIN
    ALTER TABLE [dbo].[DonViCapHang] 
    ADD [DaDanhDau] BIT NOT NULL CONSTRAINT [DF_DonViCapHang_DaDanhDau] DEFAULT 0;
    PRINT N'[OK] Đã thêm cột DaDanhDau vào bảng DonViCapHang.';
END
ELSE
BEGIN
    PRINT N'[SKIP] Cột DaDanhDau đã tồn tại.';
END
GO
