-- ========================================================================
-- MIGRATION SCRIPT 17: CẬP NHẬT CHUẨN UNICODE CHO BẢNG NHÓM KHÁCH HÀNG
-- Khắc phục lỗi encoding khi chạy script tạo dữ liệu ban đầu
-- ========================================================================

USE [QuanLyKhoPhuQuocLTW];
GO

UPDATE [dbo].[NhomKhachHang]
SET [TenNhom] = N'Khách VIP', [GhiChu] = N'Nhóm khách hàng thân thiết, doanh số lớn'
WHERE [MaNhomKhachHang] = 1;

UPDATE [dbo].[NhomKhachHang]
SET [TenNhom] = N'Khách sỉ', [GhiChu] = N'Đại lý và đối tác mua số lượng lớn'
WHERE [MaNhomKhachHang] = 2;

UPDATE [dbo].[NhomKhachHang]
SET [TenNhom] = N'Khách lẻ', [GhiChu] = N'Khách hàng tiêu dùng cá nhân thông thường'
WHERE [MaNhomKhachHang] = 3;

UPDATE [dbo].[NhomKhachHang]
SET [TenNhom] = N'Nhà hàng - Khách sạn', [GhiChu] = N'Đối tác du lịch và lưu trú tại Phú Quốc'
WHERE [MaNhomKhachHang] = 4;

UPDATE [dbo].[NhomKhachHang]
SET [TenNhom] = N'Đối tác dự án', [GhiChu] = N'Các đơn vị thi công và công trình xây dựng'
WHERE [MaNhomKhachHang] = 5;

PRINT N'Đã cập nhật tên nhóm khách hàng chuẩn tiếng Việt Unicode.';
GO
