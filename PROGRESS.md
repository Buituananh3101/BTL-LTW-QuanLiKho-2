# Tiến độ dự án

Cập nhật lần cuối: 2026-10-13 – Thiết lập Backlog 19 vấn đề cần xử lý tại `docs/van-de-can-xu-ly.md`

---

## Đã xong
- **Cấu trúc Giao diện & Layout KiotViet**: Dựng layout chuẩn với Topbar cố định, Warehouse Switcher, Mega menu ngang KiotViet – [`_Layout.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Layout.cshtml), [`_Header.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml), [`_MainMenu.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_MainMenu.cshtml) – 2026-10-12
- **Quản lý Hàng hóa**: Danh sách hàng hóa, lọc nhiều tiêu chí, phân trang AJAX, modal thêm/sửa qua JSON, upload ảnh base64, định mức tồn kho – [`HangHoasController.cs`](./BTL-LTW-QuanLiKho-2/Controllers/HangHoasController.cs), [`Views/HangHoas/`](./BTL-LTW-QuanLiKho-2/Views/HangHoas/) – 2026-10-12
- **Quản lý Kiểm kho (Module mẫu)**: Lập phiếu kiểm kho, tìm hàng F3/autocomplete, nạp hàng theo nhóm, lưu tạm, cân bằng kho sinh `PhieuDieuChinh`, đọc tồn `vw_TonKhoHienTai`, ghi `NhatKyThaoTac`, khóa phiếu đã cân bằng – [`PhieuKiemKeController.cs`](./BTL-LTW-QuanLiKho-2/Controllers/PhieuKiemKeController.cs), [`Views/PhieuKiemKe/`](./BTL-LTW-QuanLiKho-2/Views/PhieuKiemKe/) – 2026-10-12
- **Hệ thống Luật & Trí nhớ AI (Giai đoạn 1 & 2)**: Khảo sát đối chiếu CSDL/code thật, thiết lập `AGENTS.md`, 5 file quy tắc trong `.agent/rules/`, đặc tả mẫu `docs/specs/`, sổ quyết định `docs/quyet-dinh.md` – 2026-10-13
- **Khởi tạo Backlog 19 vấn đề**: Tạo [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md) phân nhóm rõ ràng (Nghiêm trọng, Quan trọng, Nhỏ) – 2026-10-13

---

## Đang làm
- **Chuẩn bị khắc phục các lỗi CSDL & Kiến trúc**: Chuẩn bị xử lý các vấn đề thuộc Nhóm 1 trong [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md).

---

## Việc kế tiếp (Xếp theo thứ tự ưu tiên đã điều chỉnh)
1. Xử lý lỗi CSDL & View: Sửa lỗi View nuốt dữ liệu, chặn tồn âm, tách `vw_BienDongKho` có ngày tháng ([ISSUE-01], [ISSUE-02], [ISSUE-03]).
2. Bổ sung `GiaVon` vào `HangHoa` và lưu `DonGia` tại thời điểm kiểm vào `ChiTietPhieuKiemKe` ([ISSUE-07]).
3. Đổi tên `HangHoasController` -> `HangHoaController` và dọn các file rác lab cũ ([ISSUE-08], [ISSUE-17], [ISSUE-18]).
4. Khắc phục lỗi RAM tải ảnh binary `VARBINARY(MAX)` trong `HangHoaController` ([ISSUE-04]).
5. Xây dựng phân hệ Nhập kho (`PhieuNhapController`, `Views/PhieuNhap/`) theo khuôn mẫu Kiểm kho (Làm trước để có hàng thử nghiệm).
6. Xây dựng tính năng Xác thực & Đăng nhập (`AccountController`, Cookie Auth, nạp Claims).
7. Xây dựng phân hệ Xuất kho (Xuất bán POS, Xuất nội bộ, Xuất hủy) và Chuyển kho.

---

## Nợ kỹ thuật / cần dọn
- Chi tiết toàn bộ 19 vấn đề được theo dõi tập trung tại: [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md).

---

## Cần xác nhận với Tuấn Anh
- Thứ tự phiên tiếp theo: Bắt đầu xử lý Nhóm lỗi nghiêm trọng số 1 ([ISSUE-01] đến [ISSUE-04]).

---

## Nhật ký phiên
- **2026-10-13 (Phiên 2 - Sáng)**:
  - Khảo sát và đối chiếu toàn diện 24 bảng CSDL và mô hình code.
  - Tạo thành công hệ thống luật và trí nhớ: `AGENTS.md`, 5 file quy tắc trong `.agent/rules/`, đặc tả `docs/specs/`, sổ quyết định `docs/quyet-dinh.md`.
  - Phân tích và hệ thống hóa 19 vấn đề kỹ thuật sâu sắc (tồn âm, lỗi view, giá vốn, hiệu năng ảnh RAM) vào [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md).
  - Rút gọn `CLAUDE.md` thành file chuyển hướng ngắn gọn.
- **2026-10-13 (Phiên 1 - Sáng)**:
  - Khởi động dự án, phân tích bối cảnh và đề xuất giải pháp duy trì ngữ cảnh giữa các phiên chat.
