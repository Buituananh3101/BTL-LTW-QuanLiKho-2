# Tiến độ dự án

Cập nhật lần cuối: 2026-10-13 – Thiết lập hoàn chỉnh hệ thống Luật & Trí nhớ cho dự án

---

## Đã xong
- **Cấu trúc Giao diện & Layout KiotViet**: Dựng layout chuẩn với Topbar cố định, Warehouse Switcher, Mega menu ngang KiotViet – [`Views/Shared/_Layout.cshtml`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Views/Shared/_Layout.cshtml), [`_Header.cshtml`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml), [`_MainMenu.cshtml`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Views/Shared/_MainMenu.cshtml) – 2026-10-12
- **Quản lý Hàng hóa**: Danh sách hàng hóa, lọc nhiều tiêu chí, phân trang AJAX, modal thêm/sửa qua JSON, upload ảnh base64, định mức tồn kho – [`Controllers/HangHoasController.cs`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Controllers/HangHoasController.cs), [`Views/HangHoas/`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Views/HangHoas/) – 2026-10-12
- **Quản lý Kiểm kho (Module mẫu)**: Lập phiếu kiểm kho, tìm hàng F3/autocomplete, nạp hàng theo nhóm, lưu tạm, cân bằng kho sinh `PhieuDieuChinh`, đọc tồn `vw_TonKhoHienTai`, ghi `NhatKyThaoTac`, khóa phiếu đã cân bằng – [`Controllers/PhieuKiemKeController.cs`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Controllers/PhieuKiemKeController.cs), [`Views/PhieuKiemKe/`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Views/PhieuKiemKe/) – 2026-10-12
- **Hệ thống Luật & Trí nhớ AI (Giai đoạn 1 & 2)**: Khảo sát đối chiếu CSDL/code thật, thiết lập `AGENTS.md`, 5 file quy tắc trong `.agent/rules/`, đặc tả mẫu `docs/specs/`, sổ quyết định `docs/quyet-dinh.md` – 2026-10-13

---

## Đang làm
- **Nâng cấp CSDL theo đề xuất đã duyệt**: Chuẩn bị script SQL và cập nhật EF Core Model theo 3 Nguyên tắc vàng (`HangHoa.GiaVon`, mở rộng `PhieuXuat`, bảng `TaiKhoan_Kho`).

---

## Việc kế tiếp (Xếp theo thứ tự ưu tiên)
1. Chạy script nâng cấp CSDL (`GiaVon`, `LoaiPhieuXuat`, `TaiKhoan_Kho`) và đồng bộ Entity trong C#.
2. Xây dựng dịch vụ `InventoryService` dùng chung đóng gói các thao tác đọc tồn và biến động kho.
3. Xây dựng tính năng Xác thực & Đăng nhập (`AccountController`, Cookie Auth, nạp Claims).
4. Phân quyền theo kho dựa trên bảng `TaiKhoan_Kho` và tích hợp vào `WarehouseSwitcher`.
5. Xây dựng phân hệ Nhập kho (`PhieuNhapController`, `Views/PhieuNhap/`).
6. Xây dựng phân hệ Xuất kho (Xuất bán, Xuất dùng nội bộ, Xuất hủy).
7. Xây dựng phân hệ Chuyển kho giữa các kho (`PhieuChuyenKhoController`).

---

## Nợ kỹ thuật / cần dọn
- Dọn dẹp các file template lab cũ không dùng trong `Views/Shared/`: `MyLayout.cshtml`, `Main.cshtml`, `LeftMenu.cshtml`, `TopNav.cshtml`, `Footer.cshtml`.
- Dọn dẹp file `Views/HangHoas/_ViewStart.cshtml` (trùng lặp với `Views/_ViewStart.cshtml`).
- Dọn dẹp các file CSS/JS tàn dư của template cũ: `wwwroot/css/css/styles.css`, `wwwroot/js/js/scripts.js`.
- Cân nhắc đổi tên `HangHoasController` và thư mục `Views/HangHoas` về dạng số ít (`HangHoaController`, `Views/HangHoa`) để đồng bộ với `PhieuKiemKeController`.
- Xử lý các cảnh báo CS8602 (Dereference of a possibly null reference) trong `PhieuKiemKeController.cs`.

---

## Cần xác nhận với Tuấn Anh
- Chốt thực hiện chạy script nâng cấp CSDL theo 4 đề xuất đã thống nhất ngay trong phiên kế tiếp.

---

## Nhật ký phiên
- **2026-10-13 (Phiên 2 - Sáng)**:
  - Hoàn thành khảo sát Giai đoạn 1, đối chiếu chi tiết 24 bảng CSDL và mô hình code.
  - Nhận phê duyệt từ Tuấn Anh; thống nhất áp dụng 3 "Nguyên tắc vàng" khi AI sửa CSDL.
  - Tạo thành công toàn bộ hệ thống file luật và trí nhớ: `AGENTS.md`, 5 file quy tắc trong `.agent/rules/`, đặc tả `docs/specs/`, sổ quyết định `docs/quyet-dinh.md` và `PROGRESS.md`.
- **2026-10-13 (Phiên 1 - Sáng)**:
  - Khởi động dự án, phân tích bối cảnh và đề xuất giải pháp duy trì ngữ cảnh giữa các phiên chat.
