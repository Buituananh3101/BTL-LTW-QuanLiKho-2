-- Migration 06: Bổ sung Vị trí, Trọng lượng, Thuộc tính động và Định mức tồn cao nhất
-- Tuân thủ 3 nguyên tắc vàng CSDL trong AGENTS.md: Chỉ cộng thêm cột mới, không DROP/đổi tên cột cũ.

USE [QuanLyKhoPhuQuocLTW];
GO

-- 1. Thêm cột ViTri, TrongLuong, DonViTrongLuong, ThuocTinh vào bảng HangHoa
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.HangHoa') AND name = 'ViTri')
BEGIN
    ALTER TABLE [dbo].[HangHoa] ADD [ViTri] NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.HangHoa') AND name = 'TrongLuong')
BEGIN
    ALTER TABLE [dbo].[HangHoa] ADD [TrongLuong] DECIMAL(18, 2) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.HangHoa') AND name = 'DonViTrongLuong')
BEGIN
    ALTER TABLE [dbo].[HangHoa] ADD [DonViTrongLuong] VARCHAR(10) NULL CONSTRAINT [DF_HangHoa_DonViTrongLuong] DEFAULT ('g');
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.HangHoa') AND name = 'ThuocTinh')
BEGIN
    ALTER TABLE [dbo].[HangHoa] ADD [ThuocTinh] NVARCHAR(MAX) NULL;
END
GO

-- 2. Thêm cột TonCaoNhat vào bảng NguongTonKho (Định mức tồn cao nhất)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.NguongTonKho') AND name = 'TonCaoNhat')
BEGIN
    ALTER TABLE [dbo].[NguongTonKho] ADD [TonCaoNhat] DECIMAL(18, 2) NULL CONSTRAINT [DF_NguongTonKho_TonCaoNhat] DEFAULT (999999999);
END
GO
