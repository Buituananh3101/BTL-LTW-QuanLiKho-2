# Sổ Quyết định Kỹ thuật & Nghiệp vụ (Architecture & Business Decisions)

> **Mục đích**: Ghi lại mọi quyết định quan trọng đã được thống nhất để các phiên làm việc tiếp theo không hỏi lại hoặc làm mâu thuẫn với các quyết định trước. Mỗi dòng ghi theo định dạng: `[Ngày] – [Quyết định] – [Lý do]`.

---

- **2026-10-12** – Chọn phong cách giao diện KiotViet cho toàn bộ hệ thống – Trải nghiệm thực tế, chuyên nghiệp, quen thuộc với người quản lý kho.
- **2026-10-12** – Sử dụng duy nhất một Layout chính `_Layout.cshtml` qua `_ViewStart.cshtml` (ngoại lệ: `_LoginLayout.cshtml`) – Tránh lặp lại mã trong các View con, giữ khung trang cố định.
- **2026-10-12** – Phiếu kiểm kho đã cân bằng KHÔNG bao giờ được hủy – Tồn kho đã được các giao dịch căn cứ; nếu kiểm sai phải lập phiếu kiểm mới.
- **2026-10-12** – Khi bấm Hoàn thành/Cân bằng phiếu kiểm phải đọc lại tồn sổ sách và đóng băng đơn giá vốn – Đảm bảo chênh lệch phản ánh đúng tồn thực tế và giá trị không bị nhảy khi giá tương lai biến động.
- **2026-10-13** – Tồn kho tính động qua View SQL `vw_TonKhoHienTai` và `vw_BienDongKho` – Loại bỏ rủi ro lệch tồn và Race Condition; phục vụ Thẻ kho và Báo cáo Nhập-Xuất-Tồn theo kỳ.
- **2026-10-13** – Áp dụng 3 "Nguyên tắc vàng" CSDL & Script có version trong `migrations/sql/` – Chỉ cộng thêm, không xóa/đổi tên cột cũ; đồng bộ code và SQL tức thì; đánh số tuần tự.
- **2026-10-13** – Xây dựng dịch vụ `ITonKhoService` đóng gói kiểm tra chặn tồn âm – Ngăn chặn mọi giao dịch xuất, hủy nhập hoặc cân bằng dẫn đến âm kho; thông báo tiếng Việt thân thiện.
- **2026-10-13** – LINQ Projection loại bỏ việc nạp byte[] `VARBINARY(MAX)` vào RAM server – Giảm 99% RAM server khi hiển thị bảng danh sách sản phẩm có hình ảnh.
- **2026-10-13** – POS tự động sinh kèm Phiếu xuất kho `DA_XAC_NHAN` trong cùng 1 transaction qua `BanHangService` – Đảm bảo trừ kho chính xác 100%, chặn tồn âm và tự động hoàn tồn khi hủy đơn.
- **2026-10-13** – Đổi tên `HangHoaController` và bảng `TaiKhoanKho` chuẩn PascalCase tiếng Việt không dấu – Tuân thủ đồng bộ quy ước ngôn ngữ và đặt tên của dự án.
- **2026-10-13** – Quản lý hàng hóa và tồn kho theo 1 Đơn vị tính cơ bản duy nhất – Bảo đảm độ chính xác tuyệt đối, tránh phát sinh số lẻ tồn kho.
- **2026-10-13** – Khắc phục Race Condition khi sinh mã tự động `MaHangNoiBo` – Dò mã số lớn nhất kết hợp retry 3 lần khi bắt gặp `DbUpdateException` trùng khóa unique.
- **2026-10-13** – Tích hợp Cookie Authentication & Claims, loại bỏ dữ liệu giả lập – Xây dựng `AccountController`, bảo vệ bằng `[Authorize]`, đọc thông tin người dùng từ Claims.
- **2026-10-13** – Chuẩn hóa đường dẫn tương đối và hủy chứng từ qua trạng thái 'HUY' – Không sinh bút toán đảo ngược; chỉ cập nhật `TrangThai = 'HUY'`, View tồn kho tự loại trừ.
- **2026-10-13** – Chuẩn hóa định dạng phản hồi `ApiResponse<T>` JSON và xóa bỏ template Lab cũ – Thống nhất cấu trúc phản hồi AJAX, dọn sạch mã nguồn rác trong `Views/Shared/`.
- **2026-10-13** – Xuất bản script seed dữ liệu mẫu `DuLieuMau.sql` – Nạp sẵn 3 tài khoản demo SHA-256 (`quanly`, `thukho`, `banhang` / `123456`), 3 kho, danh mục, NCC, khách hàng và 11+ mặt hàng có tồn.
- **2026-10-13 (Phiên 7)** – Chuyển bộ chọn kho sang `WarehouseSwitcherViewComponent` – Loại bỏ `@inject DbContext` trong Header, lọc kho theo phân quyền `TaiKhoanKho`, cập nhật qua `SwitchWarehouse`.
- **2026-10-13 (Phiên 8)** – Tách layout đăng nhập `_LoginLayout.cshtml` – Layout chuyên biệt cho auth; dùng SHA-256 thuần qua `PasswordHelper.cs` không dùng NuGet ngoài.
- **2026-10-13 (Phiên 9)** – Chuẩn hóa tài liệu đặc tả bắt buộc có File Map và Sequence Matrix – Đưa quy tắc đồng bộ đặc tả vào Mục 3 và Luật 12 của `AGENTS.md`.
- **2026-10-13 (Phiên 10)** – Xây dựng 4 Trụ cột Foundation – `BaseKhoController`, `INhatKyThaoTacService`, `MaChungTuHelper`, modular `ViewModels/`, `f3-product-search.js`.
- **2026-10-13 (Phiên 11)** – Kiểm toán & tối ưu kiến trúc – Chuẩn hóa `ClaimsPrincipalExtensions`, bọc Transaction, sửa liên kết và đồng bộ 100% rules.
- **2026-10-14 (Phiên 13)** – Bổ sung Vị trí, Trọng lượng, Định mức Min-Max chuẩn KiotViet – Cột `ThuocTinh` lưu JSON array; `TonCaoNhat` lưu tại `NguongTonKho`.
- **2026-10-15 (Phiên 16)** – Chuẩn hóa Kiến trúc Danh mục CRUD & Tách Excel Service – Khung tái sử dụng `BaseFilterParams`, `PagedResult<T>`, `_Pagination.cshtml`, `kiot-filter.js`.
- **2026-10-16 (Phiên 44)** – Đóng gói các mảnh ghép Lego độc lập (Lego Framework) – `DateRangeHelper`, `_KiotDateFilter.cshtml`, `KiotToast`, `initColumnToggle`, `bindStarToggle`.
- **2026-10-16 (Phiên 45)** – Đóng gói Khối Form & Combobox Sửa Trực Tiếp (Lego Form Components) – `KiotNumber`, `KiotCollapsible`, `KiotSplitButton`, `KiotPrompt` (`_KiotPromptModal.cshtml`), `initCombobox`.
- **2026-10-16 (Phiên 75)** – Đóng gói Master-Detail Accordion, Action Buttons & Tùy chọn Cột Bảng (`kiot-filter.js`, `site.css`) – Đóng gói `KiotFilter.initRowDetail` (bung drawer, đồng bộ `colspan`, viền khép kín `.last-visible-col`, chuyển tab), `KiotFilter.initEntityActions` (Sửa, Xóa, Đổi trạng thái) và nâng cấp `KiotFilter.initColumnToggle` (options, defaultCols, extraCols). Chuẩn hóa CSS `.kiot-detail-*`, `.kiot-attr-grid`, `.kiot-attr-col` (320px/card) dùng chung toàn hệ thống.
- **2026-10-18 (Phiên 119)** – Xây dựng phân hệ Trả hàng nhập (Purchase Returns) & Tích hợp biến động kho – Bảng `PhieuTraHangNhap` & `ChiTietPhieuTraHangNhap` (`THN{id:D6}`); tích hợp `vw_BienDongKho` giảm tồn khi `DA_TRA_HANG`; hoàn tồn tự động khi `HUY`; chặn tồn âm qua `ITonKhoService`; giao diện chuẩn KiotViet 2 cột.
- **2026-10-18 (Phiên 136)** – Đóng gói Lego DateTimePicker & ClosedXML Excel Engine – Đóng gói `KiotFilter.initDateTimePicker` (thay thế mã vẽ lịch/giờ thủ công ở 5 form chứng từ) và `ExcelHelper.Export<T>` (bộ máy xuất Excel ClosedXML generic tự động Header xanh KiotViet, kẻ viền bảng, định dạng số/tiền/ngày, co giãn cột cho 5 Controller/Service).
- **2026-10-18 (Phiên 137)** – Nạp toàn cục `kiot-filter.js` trong `_Layout.cshtml` & chống tắt nhầm popup do DOM rerender – `_Layout.cshtml` nạp `kiot-filter.js` trước `RenderSectionAsync("Scripts")` để các trang Form kế thừa toàn bộ Lego; chặn nổi bọt sự kiện `e.stopPropagation()` khi rerender popup lịch.
- **2026-10-18 (Phiên 138)** – Đóng gói Lego F3 Product Search & DocGrid Engine – Đóng gói `KiotFilter.initProductSearch` & `KiotFilter.initDocGrid`, hợp nhất toàn bộ 5 form chứng từ (Kiểm, Nhập, Xuất, Chuyển, Trả hàng), xóa bỏ hoàn toàn các file tìm kiếm lẻ tẻ.

