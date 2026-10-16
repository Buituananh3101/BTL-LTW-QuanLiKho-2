-- =========================================================================================
-- FILE CẬP NHẬT CƠ SỞ DỮ LIỆU: migrations/sql/04_rename_taikhoankho.sql
-- Dự án: Quản lý kho hàng nhiều kho (QuanLyKhoPhuQuocLTW)
-- Giải quyết: [ISSUE-09] Đổi tên bảng TaiKhoan_Kho thành TaiKhoanKho chuẩn PascalCase
-- =========================================================================================

USE QuanLyKhoPhuQuocLTW;
GO

PRINT N'=== BẮT ĐẦU NÂNG CẤP SCHEMA: ĐỔI TÊN BẢNG TAIKHOAN_KHO -> TAIKHOANKHO ===';
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TaiKhoan_Kho')
BEGIN
    EXEC sp_rename 'TaiKhoan_Kho', 'TaiKhoanKho';
    PRINT N'[OK] Đã đổi tên bảng TaiKhoan_Kho thành TaiKhoanKho.';
END
ELSE
BEGIN
    PRINT N'[SKIP] Bảng TaiKhoanKho đã tồn tại hoặc bảng TaiKhoan_Kho không tồn tại.';
END
GO
