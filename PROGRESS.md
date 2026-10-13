# Tiến độ dự án

Cập nhật lần cuối: 2026-10-13 – Thiết lập Backlog 19 vấn đề cần xử lý tại `docs/van-de-can-xu-ly.md`

---

## Đã xong
- **Cấu trúc Giao diện & Layout KiotViet**: Dựng layout chuẩn với Topbar cố định, Warehouse Switcher, Mega menu ngang KiotViet – [`_Layout.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Layout.cshtml), [`_Header.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml), [`_MainMenu.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_MainMenu.cshtml) – 2026-10-12
- **Quản lý Hàng hóa**: Danh sách hàng hóa, lọc nhiều tiêu chí, phân trang AJAX, modal thêm/sửa qua JSON, upload ảnh base64, định mức tồn kho – [`HangHoasController.cs`](./BTL-LTW-QuanLiKho-2/Controllers/HangHoasController.cs), [`Views/HangHoas/`](./BTL-LTW-QuanLiKho-2/Views/HangHoas/) – 2026-10-12
- **Quản lý Kiểm kho (Module mẫu)**: Lập phiếu kiểm kho, tìm hàng F3/autocomplete, nạp hàng theo nhóm, lưu tạm, cân bằng kho sinh `PhieuDieuChinh`, đọc tồn `vw_TonKhoHienTai`, ghi `NhatKyThaoTac`, khóa phiếu đã cân bằng – [`PhieuKiemKeController.cs`](./BTL-LTW-QuanLiKho-2/Controllers/PhieuKiemKeController.cs), [`Views/PhieuKiemKe/`](./BTL-LTW-QuanLiKho-2/Views/PhieuKiemKe/) – 2026-10-12
- **Hệ thống Luật & Trí nhớ AI (Giai đoạn 1 & 2)**: Khảo sát đối chiếu CSDL/code thật, thiết lập `AGENTS.md`, 5 file quy tắc trong `.agent/rules/`, đặc tả mẫu `docs/specs/`, sổ quyết định `docs/quyet-dinh.md` – 2026-10-13
- **Khởi tạo Backlog 19 vấn đề**: Tạo [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md) phân nhóm rõ ràng (Nghiêm trọng, Quan trọng, Nhỏ) – 2026-10-13
- **Khắc phục hoàn tất 100% Nhóm lỗi nghiêm trọng số 1 ([ISSUE-01] đến [ISSUE-05])**:
  - [ISSUE-01]: Đặt `NOT NULL` cho `PhieuXuat.MaKho` và `ChiTietPhieuXuat.MaHang`, loại bỏ hoàn toàn lọc ngầm nuốt dữ liệu trong View CSDL.
  - [ISSUE-02]: Xây dựng dịch vụ `ITonKhoService` / `TonKhoService`, đóng gói hàm kiểm tra chặn tồn âm cho xuất kho, hủy nhập kho và cân bằng kiểm kê.
  - [ISSUE-03]: Tách View CSDL thành 2 tầng: `vw_BienDongKho` (lưu ngày tháng, mã chứng từ phục vụ Báo cáo Nhập-Xuất-Tồn & Thẻ kho) và `vw_TonKhoHienTai`. Đồng bộ `VwBienDongKho` vào DbContext.
  - [ISSUE-04]: Tối ưu LINQ Projection trong `HangHoasController.cs`, chỉ lấy `HasImage = x.HinhAnh != null`, xóa bỏ triệt để lỗi tràn RAM khi đọc dữ liệu ảnh `VARBINARY(MAX)`.
  - [ISSUE-05]: Chuẩn hóa luồng Bán hàng POS và biến động tồn kho. Xây dựng dịch vụ `IBanHangService` / `BanHangService`, đảm bảo đơn bán tại quầy tự động sinh `PhieuXuat` (`DA_XAC_NHAN`, `XUAT_BAN`) trong cùng 1 transaction, tích hợp `TonKhoService.KiemTraXuatKhoAsync` chặn tồn âm, và tự động hoàn trả tồn kho khi hủy đơn. Bổ sung luật bất biến tại `.agent/rules/02-nghiep-vu-kho.md`.

---

## Đang làm
- **Chuẩn bị xử lý các vấn đề Nhóm 2: QUAN TRỌNG (Kiến trúc, CSDL & Quy tắc nghiệp vụ - [ISSUE-06] đến [ISSUE-13])**.

---

## Việc kế tiếp (Xếp theo thứ tự ưu tiên đã điều chỉnh)
1. Xử lý [ISSUE-06]: Chốt phương pháp phát triển CSDL & Quản lý Script thư mục `migrations/sql/`.
2. Xử lý [ISSUE-07]: Bổ sung `GiaVon` và lưu đơn giá chốt tại thời điểm kiểm vào `ChiTietPhieuKiemKe`.
3. Xử lý [ISSUE-08], [ISSUE-17], [ISSUE-18]: Đổi tên `HangHoasController` -> `HangHoaController` và dọn các file rác lab cũ.
4. Xử lý [ISSUE-09]: Đổi tên bảng `TaiKhoan_Kho` thành `TaiKhoanKho` và hoàn thiện logic phân quyền kho.
5. Xử lý [ISSUE-10]: Quy định rõ về Đơn vị tính cơ bản duy nhất.
6. Xây dựng phân hệ Nhập kho (`PhieuNhapController`, `Views/PhieuNhap/`) theo khuôn mẫu Kiểm kho.

---

## Nợ kỹ thuật / cần dọn
- Chi tiết toàn bộ 19 vấn đề được theo dõi tập trung tại: [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md). Hiện đã hoàn thành 5/19 vấn đề (100% Nhóm 1).

---

## Cần xác nhận với Tuấn Anh
- Bắt đầu chuyển sang xử lý Nhóm 2: Bắt đầu từ [ISSUE-06] (Quản lý script CSDL) hay [ISSUE-07] (Giá vốn & Lưu đơn giá kiểm kho).

---

## Nhật ký phiên
- **2026-10-13 (Phiên 4 - Sáng)**:
   - Xử lý dứt điểm [ISSUE-05] (Luồng Bán hàng POS kết nối PhieuXuat): Xây dựng `IBanHangService` / `BanHangService`, cơ chế tự động sinh `PhieuXuat` (`DA_XAC_NHAN`, `XUAT_BAN`) trong cùng transaction, chặn tồn âm và tự động hoàn tồn khi hủy đơn.
   - Bổ sung quy tắc bất biến mục 9 vào `.agent/rules/02-nghiep-vu-kho.md` và ghi nhận quyết định kiến trúc tại `docs/quyet-dinh.md`.
   - Biên dịch kiểm tra toàn dự án: 0 lỗi. Đánh dấu tích `[x]` hoàn tất 100% Nhóm lỗi nghiêm trọng số 1 (5/5 lỗi).
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
