# Sổ Quyết định Kỹ thuật & Nghiệp vụ (Architecture & Business Decisions)

> **Mục đích**: Ghi lại mọi quyết định quan trọng đã được thống nhất để các phiên làm việc tiếp theo không hỏi lại hoặc làm mâu thuẫn với các quyết định trước. Mỗi dòng ghi theo định dạng: `[Ngày] – [Quyết định] – [Lý do]`.

---

- **2026-10-12** – Chọn phong cách giao diện KiotViet cho toàn bộ hệ thống – Trải nghiệm thực tế, chuyên nghiệp.
- **2026-10-12** – Sử dụng duy nhất Layout chính `_Layout.cshtml` qua `_ViewStart.cshtml` (ngoại lệ: `_LoginLayout.cshtml`).
- **2026-10-12** – Phiếu kiểm kho đã cân bằng KHÔNG bao giờ được hủy – Tồn kho đã làm căn cứ; sai phải lập phiếu mới.
- **2026-10-12** – Hoàn thành phiếu kiểm phải đọc lại tồn sổ sách và đóng băng đơn giá vốn.
- **2026-10-13** – Tồn kho tính động qua View SQL `vw_TonKhoHienTai` và `vw_BienDongKho` – Loại bỏ rủi ro lệch tồn và Race Condition.
- **2026-10-13** – 3 "Nguyên tắc vàng" CSDL & Script version trong `migrations/sql/` – Chỉ cộng thêm, đồng bộ tức thì.
- **2026-10-13** – Dịch vụ `ITonKhoService` đóng gói kiểm tra chặn tồn âm mọi giao dịch xuất, hủy nhập, cân bằng.
- **2026-10-13** – LINQ Projection loại bỏ việc nạp byte[] `VARBINARY(MAX)` vào RAM server – Giảm 99% RAM.
- **2026-10-13** – POS tự động sinh kèm Phiếu xuất kho `DA_XAC_NHAN` trong cùng 1 transaction qua `BanHangService`.
- **2026-10-13** – Đổi tên `HangHoaController` và bảng `TaiKhoanKho` chuẩn PascalCase tiếng Việt không dấu.
- **2026-10-13** – Quản lý hàng hóa và tồn kho theo 1 Đơn vị tính cơ bản duy nhất – Tránh phát sinh số lẻ tồn.
- **2026-10-13** – Khắc phục Race Condition khi sinh mã tự động `MaHangNoiBo` – Dò mã lớn nhất kèm retry 3 lần.
- **2026-10-13** – Tích hợp Cookie Authentication & Claims, bảo vệ qua `[Authorize]` trên `BaseKhoController`.
- **2026-10-13** – Hủy chứng từ qua trạng thái 'HUY' – View tồn kho tự loại trừ mà không cần bút toán đảo.
- **2026-10-13** – Chuẩn hóa định dạng phản hồi `ApiResponse<T>` JSON và xóa bỏ toàn bộ template Lab cũ.
- **2026-10-13** – Script `DuLieuMau.sql` nạp sẵn 3 tài khoản demo SHA-256 (`quanly`, `thukho`, `banhang`), 3 kho, 11+ mặt hàng có tồn.
- **2026-10-13 (Phiên 7)** – Chuyển bộ chọn kho sang `WarehouseSwitcherViewComponent`, cập nhật qua `SwitchWarehouse`.
- **2026-10-13 (Phiên 8)** – Tách layout đăng nhập `_LoginLayout.cshtml`, băm SHA-256 thuần qua `PasswordHelper.cs`.
- **2026-10-13 (Phiên 9)** – Chuẩn hóa tài liệu đặc tả bắt buộc có File Map và Sequence Matrix theo Luật 12.
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
- **2026-10-18 (Phiên 139)** – Đóng gói Lego ImageUploader & Nâng cấp Combobox Tree Phân Cấp – Đóng gói `KiotFilter.initImageUploader` (quản lý 5 ảnh: 1 chính + 4 phụ, nén Canvas lót nền trắng chống nền đen PNG/WebP, kéo thả drag-drop, paste clipboard Ctrl+V, đổi ảnh chính, xóa kèm KiotConfirm); rút gọn 300+ dòng trong `hang-hoa-form.js`; nâng cấp `KiotFilter.initCombobox` hiển thị phân cấp cây danh mục `item.level` với thụt lề 16px và icon `└─`.
- **2026-10-18 (Phiên 140)** – Đóng gói Khung Điều Khiển Trang Danh Sách Boilerplate (`KiotListPage`) – Đóng gói `KiotFilter.createListPage` (quản lý state tập trung `F`, nạp bảng AJAX `loadTable`, phân trang AJAX `.page-ajax`, sắp xếp cột 3 trạng thái, lọc bookmark sao, toggle cột, phục hồi drawer chi tiết, hotkeys F3/F4); tái cấu trúc `chuyen-kho-index.js` và `phieu-kiem-ke-index.js`, giảm hơn 50% dòng code trùng lặp.

