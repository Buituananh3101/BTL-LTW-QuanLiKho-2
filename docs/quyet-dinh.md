# Sổ Quyết định Kỹ thuật & Nghiệp vụ (Architecture & Business Decisions)

> **Mục đích**: Ghi lại mọi quyết định quan trọng đã được thống nhất để các phiên làm việc tiếp theo không hỏi lại hoặc làm mâu thuẫn với các quyết định trước. Mỗi dòng ghi theo định dạng: `[Ngày] – [Quyết định] – [Lý do]`.

---

- **2026-10-12** – Chọn chuẩn giao diện chuyên nghiệp cho toàn bộ hệ thống – Trải nghiệm thực tế, hiện đại.
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
- **2026-10-14 (Phiên 13)** – Bổ sung Vị trí, Trọng lượng, Định mức Min-Max chuẩn thực tế – Cột `ThuocTinh` lưu JSON array; `TonCaoNhat` lưu tại `NguongTonKho`.
- **2026-10-15 (Phiên 16)** – Chuẩn hóa Kiến trúc Danh mục CRUD & Tách Excel Service – Khung tái sử dụng `BaseFilterParams`, `PagedResult<T>`, `_Pagination.cshtml`, `app-filter.js`.
- **2026-10-16 (Phiên 44)** – Đóng gói các mảnh ghép Lego độc lập (Lego Framework) – `DateRangeHelper`, `_DateFilter.cshtml`, `AppToast`, `initColumnToggle`, `bindStarToggle`.
- **2026-10-16 (Phiên 45)** – Đóng gói Khối Form & Combobox Sửa Trực Tiếp (Lego Form Components) – `AppNumber`, `AppCollapsible`, `AppSplitButton`, `AppPrompt` (`_PromptModal.cshtml`), `initCombobox`.
- **2026-10-16 (Phiên 75)** – Đóng gói Master-Detail Accordion & Cột Bảng – Đóng gói `AppFilter.initRowDetail`, `AppFilter.initEntityActions` và nâng cấp `AppFilter.initColumnToggle`. Chuẩn hóa CSS `.kp-detail-*`.
- **2026-10-18 (Phiên 119)** – Phân hệ Trả hàng nhập (Purchase Returns) – Bảng `PhieuTraHangNhap` & `ChiTietPhieuTraHangNhap` (`THN{id:D6}`); tích hợp `vw_BienDongKho`; chặn tồn âm qua `ITonKhoService`.
- **2026-10-18 (Phiên 136)** – Đóng gói Lego DateTimePicker & ClosedXML Excel Engine – Đóng gói `AppFilter.initDateTimePicker` và `ExcelHelper.Export<T>` (Header xanh chuẩn mực, kẻ viền bảng, định dạng số/tiền/ngày).
- **2026-10-18 (Phiên 137)** – Nạp toàn cục `app-filter.js` trong `_Layout.cshtml` & chống tắt nhầm popup do DOM rerender – Nạp trước Scripts; chặn nổi bọt sự kiện `e.stopPropagation()` khi rerender lịch.
- **2026-10-18 (Phiên 138)** – Đóng gói Lego F3 Product Search & DocGrid Engine – Đóng gói `AppFilter.initProductSearch` & `AppFilter.initDocGrid`, hợp nhất 5 form chứng từ, xóa bỏ file tìm kiếm lẻ.
- **2026-10-18 (Phiên 139)** – Đóng gói Lego ImageUploader & Combobox Tree – Đóng gói `AppFilter.initImageUploader` (5 ảnh, nén Canvas nền trắng, drag-drop, paste Ctrl+V); `AppFilter.initCombobox` hiển thị cây phân cấp.
- **2026-10-18 (Phiên 140)** – Đóng gói Boilerplate Danh Sách (`KhoProListPage`) – `AppFilter.createListPage` (state tập trung, AJAX `loadTable`, phân trang, sort 3 trạng thái, drawer chi tiết, hotkeys F3/F4).
- **2026-10-18 (Phiên 143)** – Chuẩn hóa Xuất Nhập File Excel/CSV – Bỏ vòng lặp AJAX client-side, thay bằng API `ImportExcel` server-side (ClosedXML) hỗ trợ `.xlsx` và `.csv` cho Chuyển kho & Trả hàng nhập.
- **2026-10-19 (Phiên 149)** – Phân hệ Quản lý Chi nhánh Kho (`/Kho`) – CRUD chi nhánh kho qua `KhoController`; đồng bộ phân quyền nhân sự `TaiKhoanKho`; bảo vệ kho hoạt động duy nhất; kích hoạt menu `Thiết lập ➜ Kho`.
- **2026-10-19 (Phiên 151)** – Báo cáo Tồn kho theo kho (`/BaoCao/TonKho`) dạng Pivot Kho – Tính toán động từ `vw_TonKhoHienTai`; bảng Pivot sinh động cột theo kho; 4 thẻ Summary KPI; drawer chi tiết định mức; xuất Excel ClosedXML; lọc AJAX multi-select kho, nhóm hàng, tình trạng tồn.
- **2026-10-19 (Phiên 155)** – Báo cáo Thẻ kho (`/BaoCao/TheKho`) chuyên nghiệp – Tính toán động Tồn đầu kỳ, Tồn lũy kế và Tồn cuối kỳ từ `vw_BienDongKho`; 4 thẻ KPI Summary; tích hợp Autocomplete F3 chọn hàng, Lego `_DateFilter`, `_StatusFilter`, xuất Excel ClosedXML; nạp động Tab Thẻ kho trong Drawer Hàng hóa.
- **2026-10-19 (Phiên 161)** – Chuẩn hóa Hệ thống Z-Index Đa Tầng Toàn Hệ Thống – Loại bỏ `z-index: 1` trên `.app-main-body` tránh tạo stacking context giam cầm modal/overlay; chuẩn hóa dropdowns/autocompletes/popovers trong trang ở Layer 2 (150–500), Header/Mega Menu ở Layer 3 (1020), Modals/Drawers ở Layer 4 (1050–1065), Confirmation Prompts ở Layer 5 (1090–1095) và Toasts ở Layer 6 (9999).
- **2026-10-19 (Phiên 176)** – Đổi tên đề tài thành "Xây dựng ứng dụng Web quản lý kho hàng nội bộ đa chi nhánh" – Phản ánh chuẩn xác hàm lượng kỹ thuật (Web Application), bản chất WMS/ERP nội bộ doanh nghiệp và khoanh vùng phạm vi học thuật khi bảo vệ đồ án.
- **2026-10-19 (Phiên 181)** – Cập nhật Giảng viên hướng dẫn & Lớp học phần – GVHD: thầy Lại Mạnh Dũng; Lớp học phần: Nhóm 3 -- Lớp N05 -- K65 trên toàn bộ trang bìa và lời nói đầu.
- **2026-10-19 (Phiên 182)** – Tinh gọn Mục 3.2 Báo cáo LaTeX: Gỡ bỏ 3.2.4 (Lego UI) và 3.2.5 (Stacking Context) – Tập trung Mục 3.2 vào các cơ chế kiến trúc phần mềm cốt lõi (Cookie Authentication, BaseKhoController, ACID Transaction); tự động kéo phân hệ 3.3 lên liền mạch, giữ tổng 76 trang A4 chuẩn mực, 0 Overfull hbox.
- **2026-11-02 (Phiên 191)** – Hoàn thiện Tính toàn vẹn Số liệu và Đồng bộ AJAX Thẻ kho – Action `FilterTheKho` trả về `_TheKhoContent` đảm bảo Banner và 4 KPI summary không bị xóa mất khi lọc AJAX; tính `TonLuyKe` và KPI trên toàn bộ biến động trước khi lọc theo loại chứng từ để bảo toàn tính đúng đắn kế toán kho; cho phép hủy chọn mặt hàng; đồng bộ bộ lọc `TuKhoa` vào xuất Excel.
- **2026-11-02 (Phiên 217)** – Lược bỏ mục Tổng quan Dashboard và đưa Danh sách Hàng hóa làm màn hình khởi đầu trung tâm – Xóa nút Tổng quan khỏi Top Menu (_MainMenu) và Mobile Drawer (_Header); HomeController và AccountController tự động điều hướng về /HangHoa.
- **2026-11-03 (Phiên 232)** – Chuẩn hóa bộ nhận diện & Loại bỏ 100% từ khóa thương hiệu cũ – Chuyển toàn bộ tiền tố CSS sang `.kp-`, thư viện sang `app-filter.js`, đối tượng JS sang `App*`, ViewModels & Partials sang `DateFilter`/`MultiSelect`/`Status`/`Value` chuẩn thương hiệu hệ thống KhoPro.


- **2026-11-03 (Phiên 233)** – Tinh gọn cấu trúc: Tách modular ViewModels Xuất Hủy & Dọn dẹp JS cũ – Tách XuatHuyViewModels.cs thành 3 file chuyên biệt (XuatHuyFilterVM, XuatHuyFormVM, XuatHuyListItemVM) đồng bộ 100% với 9 phân hệ; xóa bỏ hoàn toàn tàn dư f3-product-search.js.
