-- ========================================================================
-- MIGRATION SCRIPT 18: CẬP NHẬT CHUẨN UNICODE CHO CỘT NGUOITAO, KHUVUC, PHUONGXA
-- Sửa lỗi font chữ do chạy sqlcmd thiếu cờ -f 65001 trong migration 16
-- ========================================================================

USE [QuanLyKhoPhuQuocLTW];
GO

-- 1. Sửa NguoiTao
UPDATE [dbo].[KhachHang]
SET [NguoiTao] = N'Quản trị viên'
WHERE [NguoiTao] LIKE N'Qu%n%' OR [NguoiTao] LIKE N'%vi%' OR [NguoiTao] LIKE N'%tr%';

-- 2. Sửa KhuVuc
UPDATE [dbo].[KhachHang]
SET [KhuVuc] = N'Kiên Giang'
WHERE [KhuVuc] LIKE N'%Giang%' OR [KhuVuc] LIKE N'Ki%';

-- 3. Sửa PhuongXa
UPDATE [dbo].[KhachHang]
SET [PhuongXa] = N'Phường Dương Đông'
WHERE [PhuongXa] LIKE N'%D%ng%' OR [PhuongXa] LIKE N'Ph%';

PRINT N'Đã cập nhật chuẩn tiếng Việt Unicode cho NguoiTao, KhuVuc, PhuongXa trong KhachHang.';
GO
