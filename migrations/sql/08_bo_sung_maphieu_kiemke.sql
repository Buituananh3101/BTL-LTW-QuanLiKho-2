-- Migration 08: Bổ sung MaPhieu vào bảng PhieuKiemKe
-- Tuân thủ 3 nguyên tắc vàng CSDL trong AGENTS.md: Chỉ cộng thêm cột mới, không DROP/đổi tên cột cũ.

USE [QuanLyKhoPhuQuocLTW];
GO

-- 1. Thêm cột MaPhieu vào bảng PhieuKiemKe
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PhieuKiemKe') AND name = 'MaPhieu')
BEGIN
    ALTER TABLE [dbo].[PhieuKiemKe] ADD [MaPhieu] VARCHAR(30) NULL;
    PRINT N'[OK] Đã thêm cột MaPhieu vào bảng PhieuKiemKe.';
END
ELSE
BEGIN
    PRINT N'[SKIP] Cột MaPhieu đã tồn tại.';
END
GO

-- 2. Đồng bộ dữ liệu cũ: Điền mã mặc định PKK00000X cho các phiếu hiện có
UPDATE [dbo].[PhieuKiemKe]
SET [MaPhieu] = 'PKK' + RIGHT('000000' + CAST(MaPhieuKiemKe AS VARCHAR(10)), 6)
WHERE [MaPhieu] IS NULL;
GO

-- 3. Tạo index duy nhất có điều kiện (Filtered Unique Index) để chống trùng lặp mã kiểm kho
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_PhieuKiemKe_MaPhieu' AND object_id = OBJECT_ID('dbo.PhieuKiemKe'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_PhieuKiemKe_MaPhieu] 
    ON [dbo].[PhieuKiemKe]([MaPhieu]) 
    WHERE [MaPhieu] IS NOT NULL;
    PRINT N'[OK] Đã tạo Unique Index UQ_PhieuKiemKe_MaPhieu.';
END
GO
