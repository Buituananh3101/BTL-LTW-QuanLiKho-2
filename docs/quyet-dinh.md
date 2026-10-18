# Sổ Quyết định Kỹ thuật & Nghiệp vụ (Architecture & Business Decisions)

> **Mục đích**: Ghi lại mọi quyết định quan trọng đã được thống nhất để các phiên làm việc tiếp theo không hỏi lại hoặc làm mâu thuẫn với các quyết định trước. Mỗi dòng ghi theo định dạng: `[Ngày] – [Quyết định] – [Lý do]`.

---

- **2026-10-12** – Chọn phong cách giao diện KiotViet cho toàn bộ hệ thống – Mang lại trải nghiệm thực tế, chuyên nghiệp, quen thuộc với người quản lý kho và đáp ứng đầy đủ yêu cầu bài tập lớn.
- **2026-10-12** – Sử dụng duy nhất một Layout chính `_Layout.cshtml` qua `_ViewStart.cshtml` (ngoại lệ: `_LoginLayout.cshtml`) – Tránh lặp lại mã trong các View con, giữ khung trang cố định (Topbar + Menu + Body).
- **2026-10-12** – Phiếu kiểm kho đã cân bằng KHÔNG bao giờ được hủy – Tồn kho sau đó đã được các giao dịch bán hàng, xuất kho sử dụng làm căn cứ. Hủy phiếu cũ sẽ làm sai lệch chuỗi số liệu; nếu kiểm sai phải lập phiếu kiểm mới.
- **2026-10-12** – Khi bấm Hoàn thành/Cân bằng phiếu kiểm phải đọc lại tồn sổ sách tại thời điểm cân bằng và đóng băng đơn giá vốn – Đảm bảo chênh lệch phản ánh đúng tồn thực tế mới nhất và giá trị tài sản thất thoát/dư thừa không bị nhảy khi giá tương lai biến động.
- **2026-10-13** – Tồn kho tính động qua View SQL `vw_TonKhoHienTai` và `vw_BienDongKho`, không dùng bảng tĩnh – Loại bỏ rủi ro lệch tồn và Race Condition; view chi tiết có ngày tháng phục vụ lập Thẻ kho và Báo cáo Nhập-Xuất-Tồn theo kỳ.
- **2026-10-13** – Áp dụng 3 "Nguyên tắc vàng" CSDL & Quản lý Script có version trong `migrations/sql/` – CSDL chỉ cộng thêm, không xóa/đổi tên cột cũ; đồng bộ code và script SQL tức thì; đánh số migration tuần tự (`01_init`, `02_update`...).
- **2026-10-13** – Xây dựng dịch vụ `ITonKhoService` đóng gói kiểm tra chặn tồn âm – Ngăn chặn mọi giao dịch xuất, hủy nhập hoặc cân bằng kiểm kê dẫn đến âm kho; cung cấp thông báo tiếng Việt thân thiện, rõ ràng.
- **2026-10-13** – Sử dụng LINQ Projection loại bỏ việc nạp byte[] `VARBINARY(MAX)` vào RAM server khi tra cứu hàng hóa – Giảm 99% RAM server khi hiển thị bảng danh sách sản phẩm có hình ảnh.
- **2026-10-13** – POS tự động sinh kèm Phiếu xuất kho `DA_XAC_NHAN` trong cùng 1 transaction qua `BanHangService` – Đảm bảo bán hàng tại quầy trừ kho chính xác 100%, chặn tồn âm và tự động hoàn tồn khi hủy đơn bán.
- **2026-10-13** – Đổi tên `HangHoaController` và bảng `TaiKhoanKho` chuẩn PascalCase tiếng Việt không dấu – Tuân thủ đồng bộ quy ước ngôn ngữ và đặt tên của toàn bộ dự án.
- **2026-10-13** – Quản lý hàng hóa và tồn kho theo 1 Đơn vị tính cơ bản duy nhất – Không dùng đơn vị tính quy đổi phụ để bảo đảm độ chính xác tuyệt đối, tránh phát sinh số lẻ tồn kho.
- **2026-10-13** – Khắc phục Race Condition khi sinh mã tự động `MaHangNoiBo` – Dò mã số lớn nhất kết hợp cơ chế retry tự động 3 lần khi bắt gặp `DbUpdateException` trùng khóa unique.
- **2026-10-13** – Tích hợp Cookie Authentication & Claims, loại bỏ dữ liệu giả lập – Xây dựng `AccountController`, bảo vệ Controller bằng `[Authorize]`, đọc thông tin người dùng trực tiếp từ Claims.
- **2026-10-13** – Chuẩn hóa đường dẫn tương đối và hủy chứng từ qua trạng thái 'HUY' – Không sinh bút toán đảo ngược; khi hủy chứng từ chỉ cập nhật `TrangThai = 'HUY'`, View tồn kho tự động loại trừ.
- **2026-10-13** – Chuẩn hóa định dạng phản hồi `ApiResponse<T>` JSON và xóa bỏ 5 file template Lab cũ – Thống nhất cấu trúc phản hồi AJAX, dọn sạch mã nguồn rác trong `Views/Shared/`.
- **2026-10-13** – Xuất bản script seed dữ liệu mẫu `DuLieuMau.sql` (`05_dulieumau_seed.sql`) – Nạp sẵn 3 tài khoản demo SHA-256 (`quanly`, `thukho`, `banhang` / `123456`), 3 kho, danh mục, NCC, khách hàng và 11+ mặt hàng có sẵn tồn đầu kỳ.
- **2026-10-13 (Phiên 7)** – Chuyển bộ chọn kho sang `WarehouseSwitcherViewComponent` – Loại bỏ hoàn toàn `@inject DbContext` trong Header, tự động lọc danh sách kho theo phân quyền tài khoản qua bảng `TaiKhoanKho`, cập nhật kho làm việc qua action `SwitchWarehouse`.
- **2026-10-13 (Phiên 8)** – Tách layout đăng nhập `_LoginLayout.cshtml` – Layout chuyên biệt cho auth; dùng SHA-256 thuần qua `PasswordHelper.cs` không dùng NuGet ngoài.
- **2026-10-13 (Phiên 9)** – Chuẩn hóa tài liệu đặc tả bắt buộc có File Map và Sequence Matrix – Đưa quy tắc đồng bộ đặc tả vào Mục 3 và Luật 12 của `AGENTS.md`.
- **2026-10-13 (Phiên 10)** – Xây dựng 4 Trụ cột Foundation – `BaseKhoController`, `INhatKyThaoTacService`, `MaChungTuHelper`, modular `ViewModels/`, `f3-product-search.js`.
- **2026-10-13 (Phiên 11)** – Kiểm toán & tối ưu kiến trúc – Chuẩn hóa `ClaimsPrincipalExtensions`, bọc Transaction, sửa liên kết và đồng bộ 100% rules.
- **2026-10-14 (Phiên 13)** – Bổ sung Vị trí, Trọng lượng, Định mức Min-Max chuẩn KiotViet – Cột `ThuocTinh` lưu JSON array; `TonCaoNhat` lưu tại `NguongTonKho`.
- **2026-10-15 (Phiên 16)** – Chuẩn hóa Kiến trúc Danh mục CRUD & Tách Excel Service – Khung tái sử dụng `BaseFilterParams`, `PagedResult<T>`, `_Pagination.cshtml`, `kiot-filter.js`.
- **2026-10-16 (Phiên 44)** – Đóng gói các mảnh ghép Lego độc lập (Lego Framework) – `DateRangeHelper`, `_KiotDateFilter.cshtml`, `KiotToast`, `initColumnToggle`, `bindStarToggle`.
- **2026-10-16 (Phiên 45)** – Đóng gói Khối Form & Combobox Sửa Trực Tiếp (Lego Form Components) – `KiotNumber`, `KiotCollapsible`, `KiotSplitButton`, `KiotPrompt` (`_KiotPromptModal.cshtml`), `initCombobox`.
- **2026-10-16 (Phiên 75)** – Đóng gói Master-Detail Accordion, Action Buttons & Tùy chọn Cột Bảng (`kiot-filter.js`, `site.css`) – Đóng gói `KiotFilter.initRowDetail` (bung drawer, đồng bộ `colspan`, viền khép kín `.last-visible-col`, chuyển tab), `KiotFilter.initEntityActions` (Sửa, Xóa, Đổi trạng thái) và nâng cấp `KiotFilter.initColumnToggle` (options, defaultCols, extraCols). Chuẩn hóa CSS `.kiot-detail-*`, `.kiot-attr-grid`, `.kiot-attr-col` (320px/card) dùng chung toàn hệ thống.
- **2026-10-18 (Phiên 119)** – Xây dựng phân hệ Trả hàng nhập (Purchase Returns) & Tích hợp biến động kho qua View – Tạo bảng `PhieuTraHangNhap` & `ChiTietPhieuTraHangNhap` (tiền tố mã `THN{id:D6}`); tích hợp nhánh `TRA_HANG_NHAP` vào `vw_BienDongKho` làm giảm tồn kho khi `TrangThai = 'DA_TRA_HANG'`; khi Hủy (`'HUY'`), View tự động loại trừ giúp hoàn tồn kho tự động; chặn xuất âm kho qua `ITonKhoService.KiemTraXuatKhoAsync`; giao diện chuẩn prototype 2 cột (cột phải 440px trượt mượt 0.25s qua F4, popup chọn ngày giờ `.dtpop`, tìm F3 autocomplete).


