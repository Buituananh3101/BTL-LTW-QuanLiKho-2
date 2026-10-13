# Tiến độ dự án

Cập nhật lần cuối: 2026-10-13 – Thiết lập Backlog 19 vấn đề cần xử lý tại `docs/van-de-can-xu-ly.md`

---

## Đã xong
- **Cấu trúc Giao diện & Layout KiotViet**: Dựng layout chuẩn với Topbar cố định, Warehouse Switcher, Mega menu ngang KiotViet – [`_Layout.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Layout.cshtml), [`_Header.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml), [`_MainMenu.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_MainMenu.cshtml) – 2026-10-12
- **Quản lý Hàng hóa**: Danh sách hàng hóa, lọc nhiều tiêu chí, phân trang AJAX, modal thêm/sửa qua JSON, upload ảnh base64, định mức tồn kho – [`HangHoasController.cs`](./BTL-LTW-QuanLiKho-2/Controllers/HangHoasController.cs), [`Views/HangHoas/`](./BTL-LTW-QuanLiKho-2/Views/HangHoas/) – 2026-10-12
- **Quản lý Kiểm kho (Module mẫu)**: Lập phiếu kiểm kho, tìm hàng F3/autocomplete, nạp hàng theo nhóm, lưu tạm, cân bằng kho sinh `PhieuDieuChinh`, đọc tồn `vw_TonKhoHienTai`, ghi `NhatKyThaoTac`, khóa phiếu đã cân bằng – [`PhieuKiemKeController.cs`](./BTL-LTW-QuanLiKho-2/Controllers/PhieuKiemKeController.cs), [`Views/PhieuKiemKe/`](./BTL-LTW-QuanLiKho-2/Views/PhieuKiemKe/) – 2026-10-12
- **Hệ thống Luật & Trí nhớ AI (Giai đoạn 1 & 2)**: Khảo sát đối chiếu CSDL/code thật, thiết lập `AGENTS.md`, 5 file quy tắc trong `.agent/rules/`, đặc tả mẫu `docs/specs/`, sổ quyết định `docs/quyet-dinh.md` – 2026-10-13
- **Khởi tạo Backlog 19 vấn đề**: Tạo [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md) phân nhóm rõ ràng (Nghiêm trọng, Quan trọng, Nhỏ) – 2026-10-13
- **Khắc phục hoàn tất Nhóm lỗi nghiêm trọng số 1 ([ISSUE-01] đến [ISSUE-04])**:
  - [ISSUE-01]: Đặt `NOT NULL` cho `PhieuXuat.MaKho` và `ChiTietPhieuXuat.MaHang`, loại bỏ hoàn toàn lọc ngầm nuốt dữ liệu trong View CSDL.
  - [ISSUE-02]: Xây dựng dịch vụ `ITonKhoService` / `TonKhoService`, đóng gói hàm kiểm tra chặn tồn âm cho xuất kho, hủy nhập kho và cân bằng kiểm kê.
  - [ISSUE-03]: Tách View CSDL thành 2 tầng: `vw_BienDongKho` (lưu ngày tháng, mã chứng từ phục vụ Báo cáo Nhập-Xuất-Tồn & Thẻ kho) và `vw_TonKhoHienTai`. Đồng bộ `VwBienDongKho` vào DbContext.
  - [ISSUE-04]: Tối ưu LINQ Projection trong `HangHoasController.cs`, chỉ lấy `HasImage = x.HinhAnh != null`, xóa bỏ triệt để lỗi tràn RAM khi đọc dữ liệu ảnh `VARBINARY(MAX)`.

---

## Đang làm
- **Chuẩn bị xử lý [ISSUE-05] (Luồng POS kết nối PhieuXuat) và các vấn đề Nhóm 2 (Kiến trúc & CSDL)**.

---

## Việc kế tiếp (Xếp theo thứ tự ưu tiên đã điều chỉnh)
1. Xử lý [ISSUE-05]: Đảm bảo đơn bán tại quầy (POS) tự động sinh kèm `PhieuXuat` để trừ kho chính xác.
2. Bổ sung lưu `DonGia` tại thời điểm kiểm vào `ChiTietPhieuKiemKe` ([ISSUE-07]).
3. Đổi tên `HangHoasController` -> `HangHoaController` và dọn các file rác lab cũ ([ISSUE-08], [ISSUE-17], [ISSUE-18]).
4. Xây dựng phân hệ Nhập kho (`PhieuNhapController`, `Views/PhieuNhap/`) theo khuôn mẫu Kiểm kho (Làm trước để có hàng thử nghiệm).
5. Xây dựng tính năng Xác thực & Đăng nhập (`AccountController`, Cookie Auth, nạp Claims).
6. Xây dựng phân hệ Xuất kho (Xuất bán POS, Xuất nội bộ, Xuất hủy) và Chuyển kho.

---

## Nợ kỹ thuật / cần dọn
- Chi tiết toàn bộ 19 vấn đề được theo dõi tập trung tại: [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md).

---

## Cần xác nhận với Tuấn Anh
- Tiếp tục xử lý [ISSUE-05] hoặc chuyển sang Nhóm 2 ([ISSUE-06] đến [ISSUE-13]).

---

## Nhật ký phiên
- **2026-10-13 (Phiên 3 - Sáng)**:
  - Nâng cấp chức năng Đánh dấu sao (Star) bảng hàng hóa KiotViet (bật/tắt sao từng dòng, lọc theo sao tại header, thêm cột `DaDanhDau` vào CSDL).
  - Khắc phục trọn vẹn 4 lỗi nghiêm trọng Nhóm 1 ([ISSUE-01] đến [ISSUE-04]): Ràng buộc NOT NULL cho phiếu xuất, tạo `vw_BienDongKho` có ngày tháng, xây dựng `TonKhoService` chặn tồn âm, tối ưu LINQ Projection triệt tiêu lỗi tràn RAM do ảnh `VARBINARY(MAX)`.
  - Kiểm tra biên dịch dự án thành công 100% với 0 lỗi. Cập nhật tích `[x]` tại [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md).
- **2026-10-13 (Phiên 2 - Sáng)**:
  - Khảo sát và đối chiếu toàn diện 24 bảng CSDL và mô hình code.
  - Tạo thành công hệ thống luật và trí nhớ: `AGENTS.md`, 5 file quy tắc trong `.agent/rules/`, đặc tả `docs/specs/`, sổ quyết định `docs/quyet-dinh.md`.
  - Phân tích và hệ thống hóa 19 vấn đề kỹ thuật sâu sắc (tồn âm, lỗi view, giá vốn, hiệu năng ảnh RAM) vào [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md).
  - Rút gọn `CLAUDE.md` thành file chuyển hướng ngắn gọn.
- **2026-10-13 (Phiên 1 - Sáng)**:
  - Khởi động dự án, phân tích bối cảnh và đề xuất giải pháp duy trì ngữ cảnh giữa các phiên chat.
