-- Migration 07: Nâng cấp lưu trữ tối đa 5 ảnh cho Hàng hóa và bổ sung cột Mô tả
-- Tuân thủ 3 nguyên tắc vàng CSDL trong AGENTS.md: Chỉ cộng thêm bảng/cột mới, không DROP/đổi tên cột cũ.

USE [QuanLyKhoPhuQuocLTW];
GO

-- 1. Bổ sung cột MoTa vào bảng HangHoa (nếu chưa có)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.HangHoa') AND name = 'MoTa')
BEGIN
    ALTER TABLE [dbo].[HangHoa] ADD [MoTa] NVARCHAR(MAX) NULL;
END
GO

-- 2. Tạo bảng HinhAnhHangHoa để lưu trữ tối đa 5 ảnh trực tiếp trong CSDL (nếu chưa có)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'HinhAnhHangHoa')
BEGIN
    CREATE TABLE [dbo].[HinhAnhHangHoa] (
        [MaHinhAnh] INT IDENTITY(1,1) PRIMARY KEY,
        [MaHang] INT NOT NULL CONSTRAINT [FK_HinhAnhHangHoa_HangHoa] REFERENCES [dbo].[HangHoa]([MaHang]) ON DELETE CASCADE,
        [DuLieuAnh] VARBINARY(MAX) NOT NULL,
        [ThuTu] INT NOT NULL CONSTRAINT [DF_HinhAnhHangHoa_ThuTu] DEFAULT (0),
        [LaAnhChinh] BIT NOT NULL CONSTRAINT [DF_HinhAnhHangHoa_LaAnhChinh] DEFAULT (0),
        [NgayTao] DATETIME NULL CONSTRAINT [DF_HinhAnhHangHoa_NgayTao] DEFAULT (GETDATE())
    );

    CREATE INDEX [IX_HinhAnhHangHoa_MaHang] ON [dbo].[HinhAnhHangHoa]([MaHang]);
END
GO
