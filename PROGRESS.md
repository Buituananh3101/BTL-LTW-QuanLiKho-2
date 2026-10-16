# Tiến độ dự án

Cập nhật lần cuối: 2026-10-13 – Thiết lập Backlog 19 vấn đề cần xử lý tại `docs/van-de-can-xu-ly.md`

---

## Đã xong
- **Cấu trúc Giao diện & Layout KiotViet**: Dựng layout chuẩn với Topbar cố định, Warehouse Switcher, Mega menu ngang KiotViet – [`_Layout.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Layout.cshtml), [`_Header.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml), [`_MainMenu.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_MainMenu.cshtml) – 2026-10-12
- **Quản lý Hàng hóa**: Danh sách hàng hóa, lọc nhiều tiêu chí, phân trang AJAX, modal thêm/sửa qua JSON, upload ảnh base64, định mức tồn kho (Xem đặc tả chuẩn tại [`docs/specs/danh-sach-hang-hoa.md`](./docs/specs/danh-sach-hang-hoa.md)) – [`HangHoaController.cs`](./BTL-LTW-QuanLiKho-2/Controllers/HangHoaController.cs), [`Views/HangHoa/`](./BTL-LTW-QuanLiKho-2/Views/HangHoa/) – 2026-10-12
- **Quản lý Kiểm kho (Module mẫu)**: Lập phiếu kiểm kho, tìm hàng F3/autocomplete, nạp hàng theo nhóm, lưu tạm, cân bằng kho sinh `PhieuDieuChinh`, đọc tồn `vw_TonKhoHienTai`, ghi `NhatKyThaoTac`, khóa phiếu đã cân bằng (Xem đặc tả chuẩn tại [`docs/specs/kiem-kho.md`](./docs/specs/kiem-kho.md)) – [`PhieuKiemKeController.cs`](./BTL-LTW-QuanLiKho-2/Controllers/PhieuKiemKeController.cs), [`Views/PhieuKiemKe/`](./BTL-LTW-QuanLiKho-2/Views/PhieuKiemKe/) – 2026-10-12
- **Hệ thống Luật & Trí nhớ AI (Giai đoạn 1 & 2)**: Khảo sát đối chiếu CSDL/code thật, thiết lập `AGENTS.md`, 5 file quy tắc trong `.agent/rules/`, đặc tả mẫu `docs/specs/`, sổ quyết định `docs/quyet-dinh.md` – 2026-10-13
- **Khởi tạo Backlog 19 vấn đề**: Tạo [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md) phân nhóm rõ ràng (Nghiêm trọng, Quan trọng, Nhỏ) – 2026-10-13
- **Hoàn tất 100% Nhóm 1: Nghiêm trọng ([ISSUE-01] đến [ISSUE-05])**: Sửa view nuốt dữ liệu, chặn tồn âm (`TonKhoService`), tách `vw_BienDongKho` có ngày tháng, tối ưu RAM ảnh, chuẩn hóa POS tự sinh phiếu xuất (`BanHangService`) – 2026-10-13
- **Hoàn tất 100% Nhóm 2: Quan trọng ([ISSUE-06] đến [ISSUE-13])**: Chốt Database First (`migrations/sql/`), thêm `GiaVon`, đóng băng đơn giá kiểm kho, đổi tên `HangHoaController`, đổi tên `TaiKhoanKho`, luật 1 ĐVT, retry chống trùng mã hàng, Cookie Auth (`AccountController`), nạp claims – 2026-10-13
- **Hoàn tất 100% Nhóm 3: Nhỏ & Dọn dẹp tài liệu ([ISSUE-14] đến [ISSUE-19])**: Chuyển toàn bộ link sang tương đối, chuẩn hóa hủy chứng từ theo kiến trúc View, chuẩn hóa `ApiResponse` JSON, dọn sạch 5 view lab rác trong `Views/Shared/`, xóa `_ViewStart` thừa, xuất bản script seed demo chuẩn `DuLieuMau.sql` (`05_dulieumau_seed.sql`) – 2026-10-13
- **ĐÓNG HOÀN TOÀN 19/19 VẤN ĐỀ BACKLOG KỸ THUẬT (100%)** tại [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md) – 2026-10-13

---

## Đang làm
- **Chuẩn bị xây dựng Phân hệ Nhập kho**: Soạn thảo tài liệu đặc tả `docs/specs/nhap-kho.md` từ khuôn mẫu `_mau-dac-ta.md`, chuẩn bị các ViewModel và `PhieuNhapController`.

---

## Việc kế tiếp (Xếp theo thứ tự ưu tiên)
1. Lập tài liệu đặc tả chi tiết `docs/specs/nhap-kho.md` theo chuẩn Kiểm kho.
2. Xây dựng ViewModel cho Nhập kho (`NhapKhoIndexVM`, `NhapKhoFormVM`, `NhapKhoLineVM`, `SaveGoodsReceiptRequest`...).
3. Xây dựng `PhieuNhapController` (Index, Create, Details, In phiếu, Hủy phiếu) tích hợp `TonKhoService.KiemTraHuyPhieuNhapAsync`.
4. Dựng giao diện `Views/PhieuNhap/` (Index, Create, Details, `_PhieuNhapTable.cshtml`) chuẩn phong cách KiotViet.
5. Xây dựng phân hệ Xuất kho (Xuất bán POS, Xuất nội bộ, Xuất hủy) và Chuyển kho.

---

## Nợ kỹ thuật / cần dọn
- Chi tiết toàn bộ 19 vấn đề được theo dõi tập trung tại: [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md). Hiện đã hoàn thành **19/19 vấn đề (100% toàn bộ Backlog đã được giải quyết)**. Hệ thống sạch nợ kỹ thuật và sẵn sàng mở rộng các phân hệ nghiệp vụ tiếp theo!

---

## Nhật ký phiên
- **2026-10-13 (Phiên 6 - Sáng)**:
   - Giải quyết trọn vẹn 100% toàn bộ 6 lỗi của NHÓM 3: NHỎ & DỌN DẸP TÀI LIỆU ([ISSUE-14] đến [ISSUE-19]):
     - [ISSUE-14]: Chuyển 100% đường dẫn tuyệt đối sang tương đối trong toàn bộ tài liệu và luật.
     - [ISSUE-15]: Xóa bỏ khái niệm "bút toán đảo" trong `docs/specs/_mau-dac-ta.md`, chuẩn hóa cơ chế hủy chứng từ bằng trạng thái 'HUY'.
     - [ISSUE-16]: Chuẩn hóa phản hồi JSON qua `ApiResponse` & `ApiResponse<T>` trong `ViewModels/ApiResponse.cs`, bổ sung quy chuẩn vào luật code.
     - [ISSUE-17]: Xóa bỏ 5 file template Lab cũ trong `Views/Shared/` (`MyLayout.cshtml`, `Main.cshtml`, `LeftMenu.cshtml`, `TopNav.cshtml`, `Footer.cshtml`).
     - [ISSUE-18]: Xóa file thừa `Views/HangHoa/_ViewStart.cshtml`.
     - [ISSUE-19]: Xuất bản và xác thực script seed demo `DuLieuMau.sql` (`migrations/sql/05_dulieumau_seed.sql`), nạp sẵn 3 tài khoản demo SHA-256 (`quanly`, `thukho`, `banhang` / `123456`), 3 kho, quyền kho, danh mục, NCC, khách hàng, 11+ mặt hàng đa dạng và tồn kho đầu kỳ chuẩn.
   - Biên dịch kiểm tra: 0 lỗi. Đóng hoàn toàn 19/19 vấn đề Backlog tại [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md).
- **2026-10-13 (Phiên 5 - Sáng)**:
   - Giải quyết trọn vẹn 100% toàn bộ 8 lỗi của NHÓM 2: QUAN TRỌNG ([ISSUE-06] đến [ISSUE-13]):
     - [ISSUE-06]: Tạo `migrations/sql/` đánh số phiên bản DDL.
     - [ISSUE-07]: Bổ sung `GiaVon` cho HangHoa và `DonGia` cho `ChiTietPhieuKiemKe`, đóng băng giá trị tài sản khi kiểm kho.
     - [ISSUE-08]: Đổi tên `HangHoasController` -> `HangHoaController` và view sang `Views/HangHoa`.
     - [ISSUE-09]: Đổi tên bảng `TaiKhoan_Kho` -> `TaiKhoanKho` trong CSDL và DbContext.
     - [ISSUE-10]: Chuẩn hóa quy định 1 ĐVT cơ bản duy nhất.
     - [ISSUE-11]: Triển khai retry 3 lần chống Race Condition trùng mã hàng `MaHangNoiBo`.
     - [ISSUE-12]: Tích hợp Cookie Authentication, `AccountController`, nạp Claims chuẩn, xóa bỏ toàn bộ hardcode user/kho.
     - [ISSUE-13]: Sắp xếp lại thứ tự ưu tiên phân hệ Nhập kho trong `PROGRESS.md`.
   - Kiểm tra biên dịch dự án: 0 lỗi. Tích `[x]` hoàn thành 13/19 vấn đề tại [`docs/van-de-can-xu-ly.md`](./docs/van-de-can-xu-ly.md).
- **2026-10-13 (Phiên 4 - Sáng)**: Xử lý [ISSUE-05] (Luồng POS tự sinh PhieuXuat qua `BanHangService`, chặn tồn âm, hoàn tồn khi hủy).
- **2026-10-13 (Phiên 3 - Sáng)**: Nâng cấp Đánh dấu sao (Star) bảng hàng hóa; Xử lý 4 lỗi nghiêm trọng [ISSUE-01] đến [ISSUE-04] (NOT NULL phiếu xuất, `vw_BienDongKho`, `TonKhoService`, tối ưu RAM ảnh).
- **2026-10-13 (Phiên 1 & 2 - Sáng)**: Khởi tạo hệ thống luật AI (`AGENTS.md`, 5 file rules, specs, decisions), phân tích và thiết lập Backlog 19 vấn đề kỹ thuật.

