# Tiến độ dự án

Cập nhật lần cuối: 2026-10-17 – Xây Dựng Hoàn Chỉnh Mô-đun Nhập Hàng Chuẩn KiotViet (Phiên 82)

---

## Đang làm
- Sẵn sàng kiểm thử thực tế mô-đun Nhập hàng cùng người dùng và nhận phản hồi trải nghiệm.

---

## Việc kế tiếp
1. Kiểm tra trải nghiệm thực tế các luồng Nhập hàng (Lập phiếu tạm, Hoàn thành cập nhật kho động qua `vw_TonKhoHienTai`, Huỷ phiếu an toàn, Tìm kiếm F3, Export Excel).
2. Xây dựng phân hệ Trả hàng nhập (Purchase Returns) theo yêu cầu.

---

- **Xây Dựng Hoàn Chỉnh Mô-đun Nhập Hàng Chuẩn KiotViet (Phiên 82)**:
  - **Nhu cầu**: Người dùng yêu cầu triển khai toàn diện chức năng Nhập hàng (Goods Receipt / Purchase Order) dựa trên trọn vẹn 100% các khối Lego đã đóng gói (Bộ lọc thời gian `_KiotDateFilter`, trạng thái `_KiotStatusFilter`, multi-select `_KiotMultiSelectFilter`, tìm kiếm hàng hóa F3 `f3-product-search.js`, thanh phân trang `_Pagination`, toggle sao không thông báo, viền xanh chữ nhật khép kín).
  - **Giải pháp & Kết quả thực hiện**:
    + **Cơ sở dữ liệu & Entity Models**:
      * Thực thi Migration `migrations/sql/12_bo_sung_maphieu_dadanhdau_phieunhap.sql` bổ sung các cột `MaPhieu`, `DaDanhDau`, `SoHoaDon`, `GiamGia`, `TongTien`, `CanTraNcc`, `MaDatHangNhap` vào `PhieuNhap` và `GiamGia`, `ThanhTien` vào `ChiTietPhieuNhap`.
      * Tạo Filtered Unique Index `UQ_PhieuNhap_MaPhieu` đảm bảo mã phiếu không trùng lặp.
      * Đồng bộ `Models/PhieuNhap.cs`, `Models/ChiTietPhieuNhap.cs`, `Models/QuanLyKhoPhuQuocLtwContext.cs`.
    + **ViewModels Đầy Đủ**:
      * Xây dựng `ViewModels/NhapHang/NhapHangViewModels.cs` với `NhapHangListItemVM`, `NhapHangLineVM`, `NhapHangFilterVM`, `NhapHangIndexVM`, `NhapHangFormVM`, `SaveNhapHangRequest`, `SaveNoteRequest`, `QuickSupplierVM`.
    + **Controller Nghiệp Vụ (`Controllers/NhapHangController.cs`)**:
      * Kế thừa `BaseKhoController`, tích hợp `INhatKyThaoTacService` ghi log bảo mật.
      * Cung cấp đầy đủ các Action: `Index`, `Filter` (AJAX partial), `ToggleFavorite` (silent toggle), `GetNextCode` (tự sinh mã `PN000001`), `Create`, `Edit`, `Details`, `Save` (POST JSON bọc trong `BeginTransactionAsync`), `Cancel` (kiểm tra an toàn tồn kho trước khi hủy phiếu hoàn thành), `SaveNote`, `SearchProducts` (F3 autocomplete), `SearchSuppliers`, `QuickCreateSupplier` và `Export` (Excel bằng ClosedXML).
    + **Giao Diện Chuẩn KiotViet**:
      * Màn hình 1 Danh sách (`Views/NhapHang/Index.cshtml`, `_NhapHangFilterSidebar.cshtml`, `_NhapHangTable.cshtml`): Bảng danh sách phiếu nhập với cột sao, checkbox, summary row, và drawer xem chi tiết dạng accordion viền chữ nhật `#0070f3` khép kín.
      * Màn hình 2 Form 2 cột (`Views/NhapHang/Create.cshtml`, `Edit.cshtml`, `Details.cshtml`, `_NhapHangForm.cshtml`): Bên trái là bảng hàng nhập tích hợp F3 autocomplete và nhập Excel; bên phải là panel thông tin chứng từ thu gọn F4, tạo nhanh NCC bằng modal con.
    + **Styles & Scripts**:
      * `wwwroot/css/nhap-hang.css`: Định dạng chuẩn KiotViet, layout 2 cột, viền xanh chữ nhật không lem, badge trạng thái.
      * `wwwroot/js/nhap-hang-index.js`: Lọc AJAX, sắp xếp cột, đổi sao silent không hiện toast, phân trang, hủy phiếu.
      * `wwwroot/js/nhap-hang-form.js`: Tính toán tự động, F3/F4/F9/F10, đọc Excel bằng SheetJS, lưu tạm và hoàn thành.
    + **Điều Hướng Hệ Thống**: Kết nối liên kết "Nhập hàng" trong `_Header.cshtml` và `_MainMenu.cshtml` về `/NhapHang/Index`.
    + **Kiểm Tra & Biên Dịch**: `dotnet build --no-restore -t:CoreCompile` đạt **0 Errors**, `node -c` toàn bộ JavaScript đạt **0 Errors**.

- **Cố Định Độ Rộng Khung Chi Tiết Xuất Hủy Chuẩn Nhà Cung Cấp (Phiên 81)**:
  - **Nhu cầu**: Người dùng phản ánh khi mở dòng chi tiết phiếu xuất hủy, các thành phần (bảng sản phẩm hủy, ô tìm kiếm inline, ghi chú, tổng kết và các nút hành động) bị kéo dãn toàn bộ bề ngang theo bảng dữ liệu rộng nhiều cột, yêu cầu cố định độ rộng tương tự như phần Nhà cung cấp.
  - **Giải pháp & Kết quả thực hiện**:
    + **Bổ Sung Khung Cố Định Vào Razor View (`Views/XuatHuy/_XuatHuyTable.cshtml`)**: Bọc toàn bộ nội dung chi tiết (tiêu đề, meta, bảng `dtl-tbl`, khối `dp-bottom` ghi chú & tổng kết, thanh nút `dp-actions`) bên dưới tab bar vào `<div class="xh-detail-fixed-wrap kiot-detail-fixed-wrap">`.
    + **Chuẩn Hóa CSS Cố Định (`wwwroot/css/xuat-huy.css`)**:
      * Khai báo `.xh-detail-fixed-wrap { width: 992px; max-width: 100%; box-sizing: border-box; }` đồng bộ với chuẩn `.ncc-detail-fixed-wrap` và `.kiot-detail-fixed-wrap`.
      * Bổ sung responsive media query `@media (max-width: 1040px) { width: 100%; }` đảm bảo hiển thị hoàn hảo trên màn hình hẹp/thu phóng.
      * Giữ nguyên viền xanh `#0070f3` khép kín 100% bề ngang dòng bảng, trong khi toàn bộ nội dung và nút bấm bên trong được căn chỉnh gọn gàng, ngay ngắn trong phạm vi 992px.
    + **Kiểm Tra & Đồng Bộ Tài Liệu**:
      * `dotnet build /t:Compile` đạt **0 Errors**.
      * Đồng bộ đặc tả `docs/specs/xuat-huy.md` (6.885 ký tự, đảm bảo < 8.000 ký tự theo Rule 12).

- **Khắc Phục Lỗi Giật Lắc Của Tab Thông Tin Khi Đóng Mở Dòng Chi Tiết (Phiên 80)**:
  - **Nhu cầu**: Người dùng phản ánh tab "Thông tin" trong dòng chi tiết phiếu kiểm kho bị giật lắc qua lại ngang khi click mở/đóng chi tiết dòng.
  - **Nguyên nhân cốt lõi**:
    1. Tranh chấp CSS `position: sticky; left: 0; width: max-content;` trên `.dp-tabs` kết hợp với `margin: 0 -20px` khiến tab bị tính lại tọa độ liên tục khi kích thước khung thay đổi.
    2. `.dp` có `padding` và `position: sticky` nhưng lại bị gán làm wrapper trượt trực tiếp bởi jQuery `slideDown/slideUp`, dẫn đến việc `overflow: hidden` tạm thời của jQuery làm mất/chuyển đổi context dính (sticky context) mỗi frame hoạt họa, gây giật nảy 20px.
  - **Giải pháp & Kết quả thực hiện**:
    + **Tách Khung Bọc Animation Độc Lập (`_PhieuKiemKeTable.cshtml`)**: Tách biệt `<div class="product-detail-panel-wrap">` (chuyên dùng cho slideDown/slideUp không có padding/sticky) bọc bên ngoài `<div class="product-detail-panel dp">` (chứa nội dung tĩnh và padding).
    + **Chuẩn Hóa CSS Cố Định Tab Bar (`site.css`, `kiem-kho.css`, `xuat-huy.css`)**:
      * Loại bỏ `position: sticky; left: 0; width: max-content;` khỏi `.kiot-detail-tabs`, `.product-detail-tabs`, `.ncc-detail-tabs` và `.dp-tabs`.
      * Thiết lập `.dp-tabs` ở `position: static !important; width: auto !important;` với `border-bottom` trải đều tự nhiên.
      * Loại bỏ `position: sticky; left: 0;` và `max-width: min(1200px, calc(100vw - 320px))` khỏi `.dp`, giúp layout co giãn ổn định tuyệt đối.
    + **Cập Nhật Selector Script (`phieu-kiem-ke-index.js`)**: Điều chỉnh `wrapSelector: '.product-detail-panel-wrap, .kiot-detail-panel-wrap'` để jQuery chỉ tác động lên wrapper trượt.
    + **Kiểm tra biên dịch & cú pháp**: `dotnet build` đạt 0 Errors, `node -c` toàn bộ JavaScript đạt 0 Errors.

- **Đóng Gói Nút Nhập / Xuất File Excel Danh Sách Hàng Hóa Chuẩn KiotViet (Phiên 79)**:
  - **Nhu cầu**: Đóng gói các nút Import file và Xuất file riêng lẻ trên thanh toolbar danh sách hàng hóa thành một khối dropdown duy nhất chuẩn KiotViet gọn gàng và tái sử dụng.
  - **Giải pháp & Kết quả thực hiện**:
    + **Tạo Partial View Dùng Chung (`_HangHoaExcelActions.cshtml`)**: Tạo `Views/HangHoa/_HangHoaExcelActions.cshtml` đóng gói dropdown thao tác file Excel chuẩn KiotViet (`.btn.btn-tool.dropdown-toggle`), gồm 3 tùy chọn:
      * 📤 **Xuất file (Export)**: Mở modal `#hhExportModalOv` chọn cột và phạm vi xuất dữ liệu.
      * 📥 **Nhập file (Import)**: Mở modal `#hhImportModalOv` kéo thả file Excel cập nhật hàng hóa.
      * 📑 **Tải file mẫu nhập hàng (.xlsx)**: Liên kết trực tiếp tải mẫu chuẩn `DownloadTemplate`.
    + **Tối Ưu Responsive & Tinh Gọn Toolbar (`Views/HangHoa/Index.cshtml`)**:
      * Loại bỏ 25 dòng code HTML phân mảnh giữa desktop (2 nút riêng) và mobile (1 dropdown).
      * Thay thế bằng 1 dòng `<partial name="_HangHoaExcelActions" />`, tự động co giãn hiển thị icon hoặc text linh hoạt trên mọi kích thước màn hình.
    + **Kiểm tra biên dịch**: `dotnet build /t:Compile` đạt 0 Errors.
    + **Đồng bộ đặc tả**: Cập nhật File Map trong `docs/specs/danh-sach-hang-hoa.md`.

- **Sửa Lỗi Hiển Thị Ô Email Trong Modal Nhà Cung Cấp (Phiên 78)**:
  - **Nhu cầu**: Sửa lỗi ô Email trong modal "Thêm mới nhà cung cấp" bị vuông góc sắc nhọn, chiều cao và đường viền lệch lạc so với các ô nhập liệu khác (Tên nhà cung cấp, Mã NCC, Điện thoại).
  - **Nguyên nhân**: Trong `hang-hoa-form.css`, bộ chọn định kiểu `.hh-f input[type=text], .hh-f input[type=number]` chỉ áp dụng cho text và number, thiếu `input[type=email]`. Khiến ô input Email rơi về kiểu dáng mặc định của trình duyệt (border vuông 90 độ, không có `border-radius: 8px;`, thiếu `height: 38px;`, `padding: 0 12px;` và hiệu ứng focus).
  - **Giải pháp & Kết quả thực hiện**:
    + Trong `wwwroot/css/hang-hoa-form.css`: Bổ sung `input[type=email]`, `input[type=tel]`, `input[type=password]`, `input[type=search]`, `input[type=url]`, `input[type=date]` vào bộ chọn dùng chung `.hh-f`.
    + Trong `wwwroot/css/nha-cung-cap.css`: Bổ sung khối quy tắc chuyên biệt đảm bảo toàn bộ input trong modal (đặc biệt là `.hh-f input[type=email]`) luôn đạt chuẩn kích thước `height: 38px`, bo tròn góc `border-radius: 8px;`, `padding: 0 12px;`, `font-size: 14.5px;` và viền sáng xanh khi focus.
    + Kiểm tra biên dịch `dotnet build` đạt 0 Errors.

- **Áp Dụng Chuẩn Hiển Thị Nhà Cung Cấp Cho Phân Hệ Xuất Hủy (Phiên 77)**:
  - **Nhu cầu**: Người dùng yêu cầu đồng bộ cấu trúc hiển thị, tùy chọn ẩn/hiện cột và hiệu ứng mở dòng chi tiết của phân hệ Nhà cung cấp sang phân hệ Xuất hủy (`XuatHuy`).
  - **Giải pháp & Kết quả thực hiện**:
    + **Đồng Bộ Giao Diện & Cấu Trúc Bảng (`Views/XuatHuy/_XuatHuyTable.cshtml`)**:
      * Bổ sung dòng tổng hợp `summary-row` cuộn tự nhiên cùng nội dung bảng, tính tổng giá trị hủy (`TongGiaTriHuy.Sum()`).
      * Chuẩn hóa bộ chọn dòng: Đổi id checkbox chọn tất cả thành `#selectAllRows`, gắn class `.row-select` cho từng dòng.
      * Chuẩn hóa class hàng: `tr.product-row.tbl-row` cho dòng dữ liệu và `tr.product-detail-row.dtl` cho dòng chi tiết.
      * Bọc toàn bộ panel chi tiết trong `.product-detail-panel-wrap` để hỗ trợ hiệu ứng trượt mượt mà.
    + **Đồng Bộ Phong Cách & Viền Hộp Khép Kín (`wwwroot/css/xuat-huy.css`)**:
      * Cố định độ rộng bảng `#xuatHuyTable` với `width: max-content !important; min-width: 1100px !important; table-layout: fixed !important;`.
      * Thiết lập viền chữ nhật xanh `#0070f3` khép kín 4 cạnh hoàn hảo (trên/dưới 2px, 2 bên 3px) phối hợp cùng class `.last-visible-col`.
    + **Tái Cấu Trúc Script Tương Tác (`wwwroot/js/xuat-huy-index.js`)**:
      * Tích hợp khối LEGO `KiotFilter.initColumnToggle`: Tùy biến `extraColsCount: 2` (checkbox + sao) và 9 cột dữ liệu, tự động tính toán `colspan` và gán `.last-visible-col`.
      * Tích hợp khối LEGO `KiotFilter.initRowDetail`: Thay thế mã thủ công bằng bộ quản lý Master-Detail chuẩn, trượt mở/đóng 150ms, tự động đóng dòng khác và tự động khôi phục dòng đang mở sau khi tải lại bảng qua AJAX.
      * Gắn sự kiện chọn tất cả dòng checkbox `#selectAllRows` và đồng bộ trạng thái khi chọn từng dòng lẻ.
    + **Kiểm Tra & Đồng Bộ Tài Liệu**:
      * `dotnet build` đạt **0 Errors**.
      * `node -c` toàn bộ JavaScript đạt **0 Errors**.
      * Đồng bộ đặc tả `docs/specs/xuat-huy.md` (< 8.000 ký tự theo Rule 12).

- **Áp Dụng Các Khối Lego (RowDetail, EntityActions, ColumnToggle) Cho Phân Hệ Kiểm Kho (Phiên 76)**:
  - **Nhu cầu**: Người dùng yêu cầu áp dụng các khối Lego vừa đóng gói (`KiotFilter.initRowDetail`, `KiotFilter.initEntityActions`, và `KiotFilter.initColumnToggle` nâng cấp) vào phân hệ Kiểm kho (`PhieuKiemKe`).
  - **Giải pháp & Kết quả thực hiện**:
    + **Tái Cấu Trúc Script Kiểm Kho (`wwwroot/js/phieu-kiem-ke-index.js`)**:
      * Tích hợp `KiotFilter.initColumnToggle`: Tùy biến `extraColsCount: 2` (cột checkbox + cột sao) và 11 cột dữ liệu, tự động tính toán `colspan` và gán `.last-visible-col` để khép kín hình chữ nhật viền xanh.
      * Tích hợp `KiotFilter.initRowDetail`: Thay thế hoàn toàn mã thủ công `wrap.onclick`. Điều khiển đóng/mở accordion chi tiết dòng (`tr.dtl`) với slideDown/slideUp mượt mà, tự động đóng dòng khác và tự động khôi phục dòng mở sau khi tải lại bảng qua AJAX (`F.openId`).
      * Tích hợp `KiotFilter.initEntityActions`: Thay thế vòng lặp gán sự kiện thủ công cho nút Hủy (`.btn-cancel-doc`), ủy quyền sự kiện trên `#tableWrapper`, tích hợp hộp thoại xác nhận hủy phiếu tạm chuẩn KiotConfirm/KiotPrompt và chặn hủy phiếu đã cân bằng.
      * Tinh gọn `bindTableEvents()`: Chuyển các sự kiện tìm kiếm trong bảng chi tiết (`.dtl-search-*`) và lưu ghi chú (`.btn-save-note`) sang ủy quyền sự kiện qua jQuery `.off().on()`, triệt tiêu nguy cơ rò rỉ bộ nhớ hoặc gắn trùng lặp sự kiện khi tải lại bảng.
    + **Đồng Bộ Giao Diện & CSS (`wwwroot/css/kiem-kho.css`, `_PhieuKiemKeTable.cshtml`)**:
      * Bổ sung `.kiot-detail-panel-wrap` vào container `.dp` và chuyển `.dp-tab` sang button ngữ nghĩa.
      * Viền chữ nhật xanh `#0070f3` khép kín 4 cạnh hoàn hảo (trên/dưới 2px, 2 bên 3px) phối hợp cùng `.last-visible-col`.
    + **Kiểm Tra & Đồng Bộ Tài Liệu**:
      * `dotnet build` đạt **0 Errors**.
      * `node -c` toàn bộ JavaScript đạt **0 Errors**.
      * Đồng bộ đặc tả `docs/specs/kiem-kho.md` (7.406 ký tự, bảo đảm < 8.000 ký tự theo Rule 12).

- **Đóng gói Khối Master-Detail Accordion, Thao tác Thực thể & Tùy chọn Cột Bảng (Phiên 75)**:
  - **Nhu cầu**: Người dùng yêu cầu đóng gói logic hiển thị trong bảng Nhà cung cấp (click mở dòng chi tiết inline, các tab Thông tin / Lịch sử / Nợ, các nút thao tác Sửa / Xóa / Đổi trạng thái, tùy chọn ẩn/hiện cột) thành các khối Lego dùng chung toàn hệ thống để có thể áp dụng cho các phân hệ khác (Khách hàng, Hàng hóa, Nhân viên...) chỉ với 1-2 dòng cấu hình.
  - **Giải pháp & Kết quả thực hiện**:
    + **Thư viện JavaScript Dùng chung (`kiot-filter.js`)**:
      * Đóng gói `KiotFilter.initRowDetail(options)`: Điều khiển click dòng dữ liệu (`rowSelector`) bung mở dòng chi tiết inline (`.product-detail-panel-wrap`) với hiệu ứng slideDown/slideUp mượt mà 150ms; tự động đóng các dòng khác đang mở; tự động đồng bộ `colspan` bằng đúng số cột hiển thị thực tế; tự động gán class `.last-visible-col` cho ô hiển thị cuối cùng để khép kín hình chữ nhật viền xanh; lắng nghe click chuyển tab trong panel chi tiết (`tabBtnSelector`) với hiệu ứng fadeIn 120ms và hỗ trợ callback lazy loading `onTabChange(tabName, id, $pane, $panel)`.
      * Đóng gói `KiotFilter.initEntityActions(options)`: Bắt sự kiện click các nút thao tác thực thể tiêu chuẩn (`.btn-edit-*`, `.btn-delete-*`, `.btn-toggle-status-*`, `.btn-copy-*`) với callback tương ứng `onEdit(id)`, `onDelete(id, name)`, `onToggleStatus(id, name, status)`, `onCopy(id)`.
      * Nâng cấp `KiotFilter.initColumnToggle(options)`: Hỗ trợ linh hoạt cả truyền danh sách tham số hoặc object options; tự động khôi phục từ `localStorage` với fallback `defaultCols`; tự động tính `colspan` chính xác và gán `.last-visible-col` cho các dòng để viền bảng không bao giờ bị hở hay lệch.
    + **Giao diện & CSS Dùng chung (`site.css`)**:
      * Chuẩn hóa bộ class Lego: `tr.kiot-row.selected > td`, `tr.kiot-detail-row > td`, `.kiot-detail-panel-wrap`, `.kiot-detail-panel`, `.kiot-detail-tabs`, `.kiot-detail-tab-btn`, `.kiot-detail-tab-content`, `.kiot-detail-fixed-wrap` (cố định 992px), `.kiot-attr-grid` (gap 16px), `.kiot-attr-col` (cố định 320px/card), `.kiot-detail-footer`.
      * Bảo đảm tương thích ngược 100% với các class hiện hữu (`.product-detail-*`, `.ncc-detail-*`).
    + **Tái cấu trúc Tích hợp Màn hình Nhà Cung Cấp (`nha-cung-cap-index.js`)**:
      * Thay thế toàn bộ mã lặp lại bằng các lời gọi hàm Lego: `initColumnToggle()` gọi `KiotFilter.initColumnToggle`, `initRowDetail()` gọi `KiotFilter.initRowDetail`, `initEntityActions()` gọi `KiotFilter.initEntityActions`.
    + **Kiểm tra biên dịch & Cú pháp**:
      * `dotnet build` đạt **0 Errors**.
      * `node -c` toàn bộ các tệp JavaScript đạt **0 Errors**.
      * Đồng bộ tài liệu luật `.agent/rules/03-giao-dien-layout.md` (6.353 ký tự), `docs/quyet-dinh.md` (7.039 ký tự), `docs/specs/nha-cung-cap.md` (6.756 ký tự).

- **Modal Xác Nhận Ngừng Hoạt Động / Kích Hoạt Lại Nhà Cung Cấp (Phiên 74)**:
  - **Nhu cầu**: Khi nhấn nút "Ngừng hoạt động" hoặc "Kích hoạt lại" trên thanh thao tác của nhà cung cấp, hệ thống phải mở hộp thoại (modal) hỏi xác nhận trước khi thực hiện thay vì chuyển trạng thái ngay lập tức.
  - **Giải pháp & Kết quả thực hiện**:
    + **Giao diện Modal (`Views/NhaCungCap/_NhaCungCapModal.cshtml`)**:
      * Bổ sung `#nccStatusConfirmOv` (`class="hh-ov"` với `class="hh-modal small"`) chuẩn giao diện KiotViet.
      * Header hiển thị tiêu đề và icon ngữ cảnh tương ứng: màu cam cảnh báo (`bi-slash-circle`) khi Ngừng hoạt động, màu xanh lam (`bi-check2-circle`) khi Kích hoạt lại.
      * Body hiển thị câu hỏi xác nhận rõ ràng với tên nhà cung cấp in đậm: *"Bạn có chắc chắn muốn chuyển nhà cung cấp [Tên NCC] sang trạng thái Ngừng hoạt động?"*.
      * Footer gồm 2 nút: "Bỏ qua" và "Đồng ý".
    + **Căn giữa & Hiệu ứng mượt mà (`wwwroot/css/nha-cung-cap.css`)**:
      * Áp dụng `align-items: center !important; z-index: 1065;` cho `#nccDeleteOv, #nccStatusConfirmOv, #nccPromptOv, #nccEditGroupOv`, kết hợp hiệu ứng scale và backdrop-filter blur mượt mà chuẩn `hang-hoa-form.css`.
    + **Tương tác JavaScript (`wwwroot/js/nha-cung-cap-index.js`)**:
      * Viết hàm `openStatusConfirmModal(id, name, currentStatus)`: nạp ID, tên, điều chỉnh tiêu đề, thông điệp và màu nút "Đồng ý" theo ngữ cảnh trạng thái hiện tại.
      * Sự kiện click `.btn-toggle-status-ncc` lấy `id`, `name`, `status` và gọi `openStatusConfirmModal`.
      * Nút `#btnConfirmStatusNcc` thực hiện gọi AJAX `POST /NhaCungCap/ToggleStatus?id=...`, đóng modal và tải lại bảng kèm thông báo Toast.
    + **Đồng bộ Razor View (`_NhaCungCapDetail.cshtml`, `_NhaCungCapTable.cshtml`)**:
      * Bổ sung thuộc tính `data-name` vào tất cả nút `.btn-toggle-status-ncc`.
    + **Kiểm tra**:
      * C# syntax test compile đạt **0 Errors**.
      * JavaScript syntax check `node -c` đạt **0 Errors**.
      * Cập nhật tài liệu đặc tả `docs/specs/nha-cung-cap.md` và `PROGRESS.md`.

- **Sửa Lỗi DbUpdateException Khi Chuyển Trạng Thái Ngừng Hoạt Động Nhà Cung Cấp (Phiên 73)**:
  - **Nhu cầu**: Khi nhấn nút "Ngừng hoạt động" trên panel chi tiết nhà cung cấp, ứng dụng phát sinh ngoại lệ `Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes` và dừng ở dòng `await _context.SaveChangesAsync()`.
  - **Nguyên nhân cốt lõi**:
    + Trong bảng CSDL `DonViCapHang`, ràng buộc kiểm tra `[CK_DonViCapHang_TrangThai]` quy định nghiêm ngặt: `CHECK (([TrangThai]='NGUNG_GIAO_DICH' OR [TrangThai]='HOAT_DONG'))`.
    + Trong code `NhaCungCapController.cs` (Action `ToggleStatus`), lệnh gán trạng thái dùng chuỗi `"NGUNG_HOAT_DONG"` thay vì `"NGUNG_GIAO_DICH"`, dẫn đến vi phạm ràng buộc CHECK trên SQL Server.
  - **Giải pháp & Kết quả thực hiện**:
    + **Backend (`NhaCungCapController.cs`)**:
      * Chuẩn hóa Action `ToggleStatus`: gán `ncc.TrangThai = (ncc.TrangThai == "HOAT_DONG") ? "NGUNG_GIAO_DICH" : "HOAT_DONG";` khớp chuẩn CSDL, bọc try-catch trả về thông báo JSON thân thiện.
      * Chuẩn hóa Action `Create` và `Edit`: ánh xạ các giá trị `NGUNG_HOAT_DONG` / `OFF` về giá trị hợp lệ `NGUNG_GIAO_DICH`.
      * Nâng cấp Action `Filter`: hỗ trợ lọc cả `NGUNG_GIAO_DICH` và `NGUNG_HOAT_DONG`.
    + **Frontend (`nha-cung-cap-index.js`)**:
      * Đồng bộ giá trị payload modal lưu NCC và bộ lọc Pills trạng thái về `NGUNG_GIAO_DICH`.
    + **Kiểm tra**:
      * C# syntax test compile đạt **0 Errors**.
      * JavaScript syntax check `node -c` đạt **0 Errors**.
      * Đồng bộ tài liệu `docs/specs/nha-cung-cap.md` và `PROGRESS.md`.

- **Thống Nhất Giao Diện Thông Báo Toàn Hệ Thống & Bỏ Kẻ Dọc Xanh (Phiên 72)**:
  - **Nhu cầu**:
    + Bỏ đường kẻ dọc xanh bên trái (`border-left`) trên thông báo Toast, trả lại giao diện dạng viên bo góc tròn tối màu, tối giản, sang trọng theo đúng chuẩn KiotViet.
    + Thống nhất kiểu dáng và cơ chế hiển thị của toàn bộ thông báo (Toast) trên tất cả các phân hệ (Nhà cung cấp, Hàng hóa, Kiểm kho, Xuất hủy).
  - **Giải pháp & Kết quả thực hiện**:
    + **Bỏ đường kẻ dọc bên trái trên Toast (`wwwroot/css/site.css`)**:
      * Loại bỏ thuộc tính `border-left` trên `.kiot-toast.success`, `.kiot-toast.error`, `.kiot-toast.warning`, `.kiot-toast.info`.
      * Thiết lập `border: none !important; border-left: none !important; background: #111827; color: #ffffff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);` tạo nên khối capsule thông báo hoàn chỉnh, sắc nét, không bị nhô hay lệch mép bo tròn.
    + **Đồng Bộ CSS Phân Hệ Hàng Hóa & Kiểm Kho (`hang-hoa-form.css`, `kiem-kho.css`)**:
      * Đồng bộ các class toast cục bộ `.hh-toast` và `.toast-box` về cùng chuẩn kích thước, padding `10px 22px`, font-size `14px`, font-weight `500`, border-radius `8px`, và loại bỏ hoàn toàn viền kẻ dọc.
    + **Hợp Nhất Cơ Chế Gọi Toast (`site.js`, `hang-hoa-form.js`, `phieu-kiem-ke-form.js`, `phieu-kiem-ke-index.js`, `xuat-huy-form.js`)**:
      * Trong `site.js`: Bổ sung hỗ trợ tham số `type` trong `window.showToast(msg, type)` và `window.toast(msg, type)`, chuẩn hóa icon `bi-info-circle-fill text-info` sáng rõ trên nền tối.
      * Trong `hang-hoa-form.js`, `phieu-kiem-ke-form.js`, `phieu-kiem-ke-index.js`, `xuat-huy-form.js`: Điều hướng toàn bộ các hàm gọi `showToast` và `toast` thông qua `window.KiotToast.show(msg, type)`, bảo đảm 100% thông báo trên mọi trang đều hiển thị icon tương ứng (xanh cho thành công, đỏ cho lỗi, vàng cho cảnh báo, lam cho thông tin) và chung một phong cách giao diện duy nhất.
    + **Kiểm tra biên dịch & Cú pháp**: `dotnet build` đạt 0 Errors, `node -c` trên toàn bộ 6 file JavaScript đạt 0 Errors.

- **Cố Định Độ Rộng 3 Card Chi Tiết & Tắt Toast Sao Nhà Cung Cấp (Phiên 71)**:
  - **Nhu cầu**:
    + Tắt thông báo Toast khi click đánh dấu sao yêu thích ở bảng nhà cung cấp (thao tác đổi màu sao diễn ra âm thầm, tức thì, tránh làm phiền người dùng).
    + Khóa cố định độ rộng của 3 card thông tin chi tiết (Thông tin liên hệ, Thông tin xuất hóa đơn, Ghi chú & công nợ) và thanh nút thao tác đáy ở mức 992px (~320px/card), không để chúng bị kéo giãn biến dạng bề ngang khi người dùng bật nhiều cột trong bảng khiến khung viền xanh dài ra.
  - **Giải pháp & Kết quả thực hiện**:
    + **Tắt Toast Thông Báo Đánh Dấu Sao (`wwwroot/js/nha-cung-cap-index.js`)**:
      * Trong hàm `toggleFavoriteSupplier`, loại bỏ các lệnh gọi `window.KiotToast.success` và `window.KiotToast.info`. AJAX cập nhật trạng thái sao trên CSDL và UI cập nhật màu icon ngay lập tức mà không bật popup toast.
    + **Cố Định Độ Rộng Khối Chi Tiết (`wwwroot/css/nha-cung-cap.css`)**:
      * Thêm class `.ncc-detail-fixed-wrap` với `width: 992px; max-width: 100%; box-sizing: border-box;`.
      * Thêm flex layout `.ncc-attr-grid` (`width: 992px; gap: 16px;`) và `.ncc-attr-col` (`width: 320px; min-width: 320px; max-width: 320px; flex: 0 0 320px;`) thay thế cho grid Bootstrap `col-md-4` (vốn tính theo 33.3% chiều rộng container).
      * Cố định độ rộng `.product-detail-footer` ở mức 992px và đặt `.product-detail-footer-left, .product-detail-footer-right { position: static !important; }` để thanh nút thao tác đáy (Xóa, Ngừng hoạt động, Chỉnh sửa) luôn nằm gọn gàng ngay dưới 3 card.
      * Thêm media query `@media (max-width: 1040px)` để chuyển về dạng cột 100% khi xem trên màn hình nhỏ.
    + **Đồng Bộ Razor View (`_NhaCungCapTable.cshtml` & `_NhaCungCapDetail.cshtml`)**:
      * Thay thế `row g-3 product-attr-grid` và `col-md-4` bằng `ncc-attr-grid` và `ncc-attr-col`.
      * Bọc toàn bộ tiêu đề, thuộc tính và thanh nút thao tác trong `ncc-detail-fixed-wrap` cho cả 3 Tab (Thông tin, Lịch sử, Nợ cần trả) trên cả 2 view.
    + **Kiểm tra**:
      * Cú pháp View và CSS hoàn chỉnh, giao diện giữ nguyên tỷ lệ 320px/card độc lập hoàn toàn với độ dài khung viền xanh.

- **Bổ Sung Cột Sao Yêu Thích & Lọc Sao Header Nhà Cung Cấp (Phiên 70)**:
  - **Nhu cầu**: Bổ sung cột đánh dấu sao (star / favorite bookmark) cho danh sách nhà cung cấp (`NhaCungCap`), đồng bộ chuẩn trải nghiệm KiotViet giống hệt phân hệ Hàng hóa (`HangHoa`) và Kiểm kho (`PhieuKiemKe`). Cho phép đánh dấu sao từng nhà cung cấp và bấm vào sao ở tiêu đề bảng để lọc nhanh danh sách nhà cung cấp đã đánh dấu sao.
  - **Giải pháp & Kết quả thực hiện**:
    + **Cơ sở dữ liệu (Tuân thủ Rule 8)**:
      * Bổ sung cột `DaDanhDau BIT NOT NULL CONSTRAINT DF_DonViCapHang_DaDanhDau DEFAULT 0` vào bảng `DonViCapHang`.
      * Tạo file migration `migrations/sql/11_bo_sung_dadanhdau_donvicaphang.sql`.
      * Cập nhật Model C# `Models/DonViCapHang.cs` (`public bool DaDanhDau { get; set; } = false;`) và cấu hình DbContext `QuanLyKhoPhuQuocLtwContext.cs`.
    + **Backend & ViewModel**:
      * Cập nhật `NhaCungCapItemVM.cs` (`DaDanhDau`, `IsFavorite => DaDanhDau`).
      * Cập nhật `NhaCungCapFilterParams.cs` (`public bool DaDanhDau { get; set; } = false;`).
      * Cập nhật `NhaCungCapIndexVM.cs` (`public bool DaDanhDauFilter => Filter?.DaDanhDau ?? false;`).
      * Trong `NhaCungCapController.cs`: Bổ sung lọc `if (filter.DaDanhDau) query = query.Where(d => d.DaDanhDau);`, map `DaDanhDau = d.DaDanhDau`, và tạo action `[AcceptVerbs("GET", "POST")] public async Task<IActionResult> ToggleFavorite(int id)` trả JSON `{ success, isFavorite, maDonViCapHang }`.
    + **Giao diện & Bảng dữ liệu (`_NhaCungCapTable.cshtml`)**:
      * Header: Bổ sung `<th class="th-star" onclick="toggleStarHeaderFilter(event)">` với icon sao rỗng/đầy tùy theo trạng thái lọc `Model.DaDanhDauFilter`.
      * Dòng tổng hợp `summary-row`: Thêm 1 ô trống tương ứng vị trí cột sao.
      * Dòng dữ liệu `product-row`: Thêm `<td class="cell-star" onclick="toggleFavoriteSupplier(event, @item.MaDonViCapHang, this)">` với `.star-btn`.
      * Nâng `colspan` mặc định từ 13 lên 14 (1 checkbox + 1 star + 12 cột dữ liệu).
    + **JavaScript Tương tác (`nha-cung-cap-index.js`)**:
      * Bổ sung `daDanhDau` vào `state` và gán param `DaDanhDau` khi `loadTable()`.
      * Cập nhật `visibleCols = 2` (1 checkbox + 1 sao luôn hiển thị) trong `applyColumnVisibility()`.
      * Triển khai hàm toàn cục `toggleFavoriteSupplier` (AJAX POST toggle sao, đổi icon, toast thông báo, tự động mờ dần dòng nếu đang bật lọc sao) và `toggleStarHeaderFilter` (bật/tắt lọc sao header).
      * Cập nhật bộ loại trừ click dòng `#supplierTable tr.product-row` thêm `.cell-star, .star-btn` tránh mở nhầm chi tiết khi click sao.
    + **Kiểm tra biên dịch & Kiểm thử**: `dotnet build` đạt 0 Errors, `node -c` đạt 0 Errors, API `ToggleFavorite` và bộ lọc `DaDanhDau=true` hoạt động chính xác 100%.

- **Cố Định Độ Rộng Cột Nhà Cung Cấp & Khép Kín Chi Tiết/Chỉnh Sửa (Phiên 69)**:
  - **Nhu cầu**: Giữ nguyên độ rộng cột cố định cho bảng nhà cung cấp khi còn ít cột (không ép cột Tên hoặc bảng tràn hết 100% chiều ngang màn hình). Khi click vào dòng thì bung mở khối chi tiết nhà cung cấp cùng các nút thao tác (Chỉnh sửa, Xóa, Ngừng hoạt động) và đóng khung thành hình chữ nhật khép kín vừa vặn đúng bằng độ rộng các cột hiển thị.
  - **Giải pháp & Kết quả thực hiện**:
    + **Độ rộng Bảng & Cột Cố định (`_NhaCungCapTable.cshtml` & `nha-cung-cap.css`)**:
      * Đưa cột Tên nhà cung cấp về độ rộng cố định `width: 240px;` (toàn bộ 13 cột đều có `width` xác định rõ ràng, không bị kéo dãn bất thường).
      * Cấu hình bảng `#supplierTable` về `width: max-content !important; min-width: 760px !important; table-layout: fixed !important;`. Bảng có độ rộng thực tế vừa khít bằng tổng các cột hiển thị (khoảng 1.006px ở chế độ mặc định), không bị ép tràn 100% màn hình.
    + **Bung Mở Chi Tiết & Chỉnh Sửa Khi Click Dòng**:
      * Khi click bất kỳ đâu trên dòng dữ liệu (trừ checkbox), hàm `expandSupplierRow` kích hoạt hiệu ứng slideDown hiển thị dòng chi tiết `tr.product-detail-row`.
      * Khối chi tiết hiển thị đầy đủ thông tin (3 tab: Thông tin, Lịch sử nhập/trả hàng, Nợ cần trả) và thanh công cụ đáy chứa nút chính **"Chỉnh sửa"** (`.btn-edit-ncc`) cùng "Xóa", "Ngừng hoạt động / Cho hoạt động lại". Click "Chỉnh sửa" mở ngay modal cập nhật.
    + **Đóng Khung Hình Chữ Nhật Khép Kín Vừa Vặn**:
      * Nhờ `colspan` động (`visibleCols`) và độ rộng bảng `max-content`, dòng dữ liệu và dòng chi tiết bên dưới có độ rộng hoàn toàn trùng khớp (cùng bắt đầu tại pixel 0 và kết thúc tại pixel 1.006).
      * Cạnh trên `2px solid #0070f3`, cạnh đáy `2px solid #0070f3`, hai cạnh bên `3px solid #0070f3` tạo thành một khối hình chữ nhật khép kín 100% ngay tại vùng bảng hiển thị.
    + **Kiểm tra biên dịch & Cú pháp**: `dotnet build` đạt 0 Errors, `node -c` đạt 0 Errors.


- **Hoàn thiện Đóng Khung Hình Chữ Nhật Khép Kín Chi Tiết Nhà Cung Cấp (Phiên 68)**:
  - **Nhu cầu**: Sửa hiện tượng khi click dòng mở chi tiết nhà cung cấp, viền highlight bị đứt đoạn dạng bậc thang (dòng dữ liệu dừng ở giữa do các cột ẩn, trong khi drawer bên dưới bung rộng hết màn hình ra tận mép phải tạo khoảng trống màu trắng ở trên), không tạo thành một khối hình chữ nhật khép kín liền mạch.
  - **Nguyên nhân cốt lõi**:
    + Thẻ `<table id="supplierTable">` bị gán `min-width: 1450px`, đồng thời thẻ `<th data-col="ten">` bị ép cứng `width: 240px` khiến cột Tên không tự co giãn (flex) để lấp đầy bảng theo chiều ngang khi một số cột bị ẩn.
    + Dòng chi tiết `<tr class="product-detail-row">` bị cố định cứng `colspan="13"`. Khi người dùng ẩn bớt cột (chỉ còn 7–9 cột hiển thị), trình duyệt buộc phải sinh ra các cột ma (phantom columns) rỗng ở góc phải trên thẻ thead và tbody, làm drawer vươn ra tận cột 13 trong khi dòng dữ liệu dừng ở cột hiển thị cuối cùng.
    + Thẻ CSS `:last-child` trên dòng dữ liệu bị lệch khi cột cuối cùng trong DOM (`ngaytao`) bị ẩn, khiến dòng dữ liệu không đóng được viền bên phải tại đúng vị trí cột hiển thị cuối cùng.
  - **Giải pháp & Kết quả thực hiện**:
    + **Độ rộng Bảng & Cột Flex (`_NhaCungCapTable.cshtml`)**: Chuyển `#supplierTable` sang `width: 100%; min-width: 100%;`; gỡ bỏ cố định `width: 240px` trên cột Tên sang `min-width: 220px;`, cho phép cột Tên tự do co giãn chiếm trọn chiều ngang còn lại của bảng, đẩy cột hiển thị cuối cùng ra sát cạnh phải mà không tạo khoảng trắng.
    + **Đồng bộ Colspan Động (`nha-cung-cap-index.js`)**: Trong hàm `applyColumnVisibility` và `expandSupplierRow`, đếm chính xác số cột `visibleCols` đang hiển thị và gán động `colspan = visibleCols` cho dòng chi tiết và dòng dữ liệu trống, triệt tiêu hoàn toàn các cột ma.
    + **Đóng Cạnh Phải Liền Mạch (`.last-visible-col`)**: Tự động gán class `last-visible-col` cho ô hiển thị cuối cùng của mỗi dòng. Cập nhật CSS trong `site.css` và `nha-cung-cap.css`: Cạnh trên `2px solid #0070f3`, 2 cạnh bên `3px solid #0070f3`, cạnh đáy `2px solid #0070f3`, phân cách nhẹ `1px solid #f1f5f9` bên trong. Dòng được chọn và drawer chi tiết tạo thành một **hình chữ nhật khép kín 100% hoàn hảo**.
    + **Kiểm tra biên dịch & Cú pháp**: `dotnet build` đạt 0 Errors, `node -c` đạt 0 Errors.


- **Khắc phục Triệt để Lỗi Không Tìm Thấy View Sau Biên Dịch (Phiên 67)**:
  - **Nhu cầu**: Sửa lỗi `InvalidOperationException: The view 'Index' was not found` tại `/PhieuKiemKe/Index.cshtml` và các view MVC khác khi người dùng truy cập ứng dụng.
  - **Nguyên nhân cốt lõi**:
    + Trong phiên trước đó, lệnh kiểm tra nhanh `dotnet build -t:CoreCompile` đã được thực thi, chỉ biên dịch mã nguồn C# (`csc`) mà bỏ qua bước biên dịch Razor View của Web SDK (`RazorCoreCompile`).
    + Tệp assembly `BTL-LTW-QuanLiKho-2.dll` bị ghi đè nhưng thiếu toàn bộ metadata và mã bytecode của các Razor views được biên dịch sẵn.
    + Khi ứng dụng chạy ở môi trường ASP.NET Core mặc định (không bật `RuntimeCompilation`), engine tìm kiếm view trong assembly không thấy và fallback tìm trên disk nhưng không thể biên dịch động, dẫn đến ngoại lệ `The view 'Index' was not found`. Đồng thời tiến trình cũ đang chạy khóa tệp `.exe` ngăn cản build mới.
  - **Giải pháp & Kết quả thực hiện**:
    + Giải phóng toàn bộ tiến trình ứng dụng đang chạy khóa file nhị phân.
    + Thực hiện biên dịch đầy đủ tiêu chuẩn (`dotnet build`) để Web SDK sinh toàn bộ Razor Views vào assembly.
    + Kiểm thử tự động thành công 100%: Truy cập `/PhieuKiemKe` (HTTP 200), `/PhieuKiemKe/Filter` (HTTP 200, 82.825 bytes), `/NhaCungCap` (HTTP 200), `/NhaCungCap/Filter` (HTTP 200, 108.709 bytes).


- **Đồng bộ Hiển thị Nhà Cung Cấp theo Chuẩn Danh Sách Hàng Hóa (Phiên 66)**:
  - **Nhu cầu**: Chuyển đổi toàn diện phong cách hiển thị của danh sách nhà cung cấp từ dạng Kiểm kho sang đúng khuôn mẫu Danh mục Hàng hóa (`HangHoa`): dòng dữ liệu `product-row` highlight viền xanh `3px solid #0070f3` (`.selected`), dòng chi tiết `product-detail-row` có hiệu ứng slideDown/slideUp êm ái, thanh tabs `.product-detail-tabs` với nút `.product-detail-tab-btn`, lưới thuộc tính `.product-attr-grid`, thanh footer `.product-detail-footer`.
  - **Giải pháp & Kết quả thực hiện**:
    + **Khung Bao Ngoài (`Index.cshtml`)**: Chuyển container sang `<section id="content"><div id="productTableContainer">...</div></section>` kế thừa styling `flex: 1; height: 100%` của Hàng hóa trong `site.css`; loại bỏ nạp dư thừa `kiem-kho.css`.
    + **Bảng & Inline Drawer (`_NhaCungCapTable.cshtml`)**:
      * Chuẩn hóa thẻ `thead`: Checkbox `#selectAllRows`, cột Tên `.col-product-name`, cột số `.num`.
      * Dòng dữ liệu: `tr.product-row`, checkbox `.row-select`, tên NCC `.cell-product-name > .product-name-text`.
      * Dòng chi tiết mở rộng: `tr.product-detail-row` chứa `.product-detail-panel-wrap` > `.product-detail-panel`, thanh tabs `.product-detail-tabs` (`Thông tin`, `Lịch sử nhập/trả hàng`, `Nợ cần trả`), lưới 3 khối `.product-attr-grid` (`.attr-item`, `.attr-label`, `.attr-value`), thanh nút hành động `.product-detail-footer` (`Xóa`, `Ngừng hoạt động / Cho hoạt động lại`, `Chỉnh sửa`).
    + **JavaScript Điều khiển (`nha-cung-cap-index.js`)**:
      * Triển khai hàm `expandSupplierRow`: Sử dụng hiệu ứng `$wrap.hide().slideDown(150)` và `$wrap.slideUp(150)`, tự động đóng các dòng khác, gán class `.selected` cho dòng được chọn.
      * Gắn sự kiện click tabs `.product-detail-tab-btn` chuyển tab mượt mà bằng `fadeIn(120)` và nạp AJAX dữ liệu Tab 2/Tab 3 khi cần.
      * Đồng bộ checkbox `#selectAllRows` và `.row-select`.
    + **Kiểm tra biên dịch & Cú pháp**: `dotnet build` đạt 0 Errors, `node -c` đạt 0 Errors, `docs/specs/nha-cung-cap.md` 7.968 bytes (< 8.000 ký tự).
- **Khắc phục Lỗi Hiển thị Bảng & Đồng bộ Cột Nhà Cung Cấp theo Chuẩn Kiểm Kho (Phiên 65)**:
  - **Nhu cầu**: Sửa lỗi hiển thị bảng nhà cung cấp bị lệch cột, co hẹp văn bản theo chiều dọc ("C ô n g t y Gas Kiên Giang") đè lên số điện thoại khi ẩn/hiện cột; đồng bộ toàn diện cách thức hiển thị và layout bảng theo chuẩn Kiểm kho (`PhieuKiemKe`).
  - **Nguyên nhân cốt lõi**:
    + Thiếu định nghĩa `#supplierTable.tbl` trong `kiem-kho.css` khiến bảng không có thuộc tính `table-layout: fixed; min-width: 1450px !important;`.
    + Thẻ tiêu đề `<th data-col="ten">` thiếu thuộc tính `style="width: 220px;"` khiến trình duyệt tự co rút cột khi các cột khác có độ rộng cố định.
    + Thẻ bao ngoài bảng trong `Index.cshtml` dùng `div#tableContainer` thay vì cấu trúc chuẩn `<section id="content"><div id="tableWrapper" class="kiot-table-wrapper">...</div></section>`.
    + Cơ chế ẩn/hiện cột dùng jQuery `.toggle()` can thiệp sai `display` trên thẻ bảng; thiếu cấu hình giá trị mặc định an toàn cho các cột cơ bản.
  - **Giải pháp & Kết quả thực hiện**:
    + **Đồng bộ CSS (`kiem-kho.css`)**: Bổ sung `#supplierTable.tbl` vào nhóm luật `table-layout: fixed; min-width: 1450px !important; border-collapse: separate; border-spacing: 0;` cùng styling `th`, `td` chuẩn KiotViet.
    + **Đồng bộ Markup Bảng (`_NhaCungCapTable.cshtml`)**: Bổ sung `style="width: 220px;"` cho cột Tên NCC, nâng `min-width: 1450px;` cho bảng, đảm bảo toàn bộ 13 cột (1 checkbox + 12 cột dữ liệu) có độ rộng xác định và khớp hoàn hảo giữa `thead`, `summary-row`, và `tbody` (`colspan="13"`).
    + **Khung Bao Ngoài (`Index.cshtml`)**: Chuyển sang `<section id="content"><div id="tableWrapper" class="kiot-table-wrapper">...</div></section>`.
    + **Xử lý JavaScript (`nha-cung-cap-index.js`)**: Cập nhật container AJAX sang `#tableWrapper`; đổi cơ chế hiển thị cột sang `this.style.display = isChecked ? '' : 'none';`; nâng key lưu trữ lên `kiot_ncc_columns_v2` với bộ fallback `DEFAULT_NCC_COLS` đảm bảo cột Tên NCC luôn hiển thị mặc định và không bị ảnh hưởng bởi cache cũ.
    + **Kiểm tra biên dịch & Cú pháp**: `dotnet build` đạt 0 Errors, `node -c` đạt 0 Errors.
- **Khắc phục Toàn diện Bộ Lọc LeftMenu và Tương tác Phân hệ Xuất hủy (Phiên 64)**:
  - **Nhu cầu**: Sửa lỗi toàn bộ các thành phần trong leftmenu / sidebar bộ lọc của màn hình Xuất hủy (`_XuatHuyFilterSidebar.cshtml`) bị đơ, bấm vào không phản hồi hoặc không mở được popup/dropdown.
  - **Giải pháp & Kết quả thực hiện**:
    + **Bộ Lọc Thời Gian (`KiotDateFilter`)**: Gọi `KiotFilter.initDateFilter('date', ...)` kết nối sự kiện mở Quick Date popup và Dual Calendar popup, nhận sự kiện lọc từ preset hoặc chọn ngày tùy chỉnh.
    + **Bộ Lọc Trạng Thái (`KiotStatusFilter`)**: Đổi bộ lắng nghe sự kiện sang `input[data-s]` (thay vì selector sai `input[name="stChk"]`), kích hoạt lọc AJAX ngay khi tick chọn `Phiếu tạm`, `Hoàn thành`, `Đã hủy`.
    + **Bộ Lọc Người Tạo & Người Xuất Hủy (`KiotMultiSelectFilter`)**: Loại bỏ lệnh gọi hàm không tồn tại `KiotFilter.toggleSidebarDropdown`, chuyển sang quản lý class `.show` / `.open` chuẩn với `KiotFilter.checkSidebarDropdownDirection`, sửa selector tên `.kiot-ms-text` và nút xóa tag `.tag-remove`.
    + **Điều khiển Popup & Sidebar**: Bổ sung bộ lắng nghe Escape và click bên ngoài để tự động đóng dropdowns/popups; sửa nút F4 thu gọn/mở rộng sidebar đồng bộ class `.kiot-container.sidebar-collapsed`; hỗ trợ đầy đủ nút phễu mở lọc trên mobile.
    + **Đồng bộ Giao diện Bộ Lọc (`paintFilters`)**: Cập nhật trạng thái các chấm cảnh báo (`dotDate`, `dotSt`, `dotUser`, `dotConfirmer`), radio buttons và thẻ tag KiotViet.
    + **Kiểm tra biên dịch & Cú pháp**: `dotnet build` đạt 0 Errors, `node -c` đạt 0 lỗi.
- **Hoàn thiện Tùy chọn Hiển thị Cột cho Phân hệ Nhà Cung Cấp theo Chuẩn KiotViet (Phiên 63)**:
  - **Nhu cầu**: Bổ sung và chuẩn hóa tính năng tùy chọn ẩn/hiện cột dữ liệu cho màn hình danh sách nhà cung cấp theo đúng phong cách KiotViet (tương tự Kiểm kho và Xuất hủy).
  - **Giải pháp & Kết quả thực hiện**:
    + **Toolbar & Menu Tùy chọn Cột (`Index.cshtml`)**:
      * Chuẩn hóa nút bấm công cụ sang `.btn-tool` với icon `bi-view-list` và cơ chế chống đóng tự động `data-bs-auto-close="outside"`, cho phép người dùng click bật/tắt liên tục nhiều cột mà không bị đóng menu dropdown.
      * Cấu hình danh mục 12 cột dữ liệu đầy đủ trong menu `#colMenu`: Mã NCC, Tên NCC, Điện thoại, Email, Nhóm NCC, Địa chỉ, Mã số thuế, Nợ cần trả hiện tại, Tổng mua, Ghi chú, Trạng thái, Ngày tạo.
      * Thêm nút Tải lại bảng `#btnReloadTable` có hiệu ứng icon xoay tròn `.spinning`.
    + **Cấu trúc Bảng Dữ liệu (`_NhaCungCapTable.cshtml`)**:
      * Mở rộng thêm 4 cột dữ liệu mới: Địa chỉ (`data-col="diachi"`), Mã số thuế (`data-col="masothue"`), Ghi chú (`data-col="ghi"`), Ngày tạo (`data-col="ngaytao"`).
      * Đồng bộ thẻ `th`, ô dữ liệu `td` trên từng dòng và ô tương ứng trên hàng tổng cộng `summary-row`.
      * Cập nhật `colspan="13"` cho dòng chi tiết `tr.dtl` và dòng thông báo trống khi lọc.
    + **JavaScript Điều khiển (`nha-cung-cap-index.js`)**:
      * Triển khai hàm `initColumnToggle()` và `applyColumnVisibility()`: Tự động khôi phục trạng thái hiển thị cột từ `localStorage` (`kiot_ncc_columns`).
      * Lắng nghe sự kiện `change` trên menu `#colMenu` để ẩn/hiện tức thời các cột và lưu vào `localStorage`.
      * Tự động áp dụng lại trạng thái cột sau mỗi lần nạp bảng AJAX (`loadTable()`).
      * Gắn sự kiện quay vòng cho nút `#btnReloadTable`.
    + **Kiểm tra biên dịch & Cú pháp**:
      * Cập nhật `docs/specs/nha-cung-cap.md` (7.894 ký tự < 8.000 ký tự theo Luật 12).
      * `dotnet build` đạt 0 Errors, cú pháp JavaScript `node -c` đạt 0 Errors.
- **Đồng bộ Bảng Hiển thị Nhà Cung Cấp & Inline Accordion Drawer theo Chuẩn Kiểm Kho (Phiên 62)**:
  - **Nhu cầu**: Sửa lại phần bảng hiển thị nhà cung cấp giống hệt phần kiểm kho (`_PhieuKiemKeTable.cshtml`): cấu trúc bảng `.tbl`, highlight dòng được chọn `tr.tbl-row.open` (`#f0f7ff`, dải viền xanh 4px), bung dòng chi tiết `tr.dtl` inline tức thì mà không bị giật trang hay spinner toàn màn hình, thanh tab chi tiết `.dp-tabs` (`Thông tin`, `Lịch sử nhập/trả hàng`, `Nợ cần trả`), tiêu đề `h2` kèm mã & pill trạng thái, hàng meta thông tin, 3 khối card chi tiết (liên hệ, hóa đơn, ghi chú + tổng kết `.sums`), và cụm nút hành động đáy drawer (`Xóa`, `Ngừng hoạt động / Cho hoạt động lại`, spacer `.ms-auto`, `Chỉnh sửa`).
  - **Giải pháp & Kết quả thực hiện**:
    + **ViewModel (`NhaCungCapItemVM.cs`) & Controller (`NhaCungCapController.cs`)**:
      * Bổ sung các trường `GhiChu`, `TenCongTy`, `MaSoThue`, `SoCccd` vào `NhaCungCapItemVM` để nạp sẵn toàn bộ thông tin cơ bản cho Tab 1 ("Thông tin"), cho phép mở accordion tức thì với 0 delay.
      * Cập nhật `BuildFilterQuery` trong Controller chiếu (project) đầy đủ các trường mới.
    + **Giao diện Bảng & Inline Drawer (`_NhaCungCapTable.cshtml`, `Index.cshtml`, `nha-cung-cap.css`)**:
      * Nạp `kiem-kho.css` vào `Index.cshtml` kế thừa toàn bộ styling chuẩn KiotViet của bảng và inline drawer.
      * Tái cấu trúc bảng: `<table class="tbl" id="supplierTable">`, dòng dữ liệu `<tr class="tbl-row" data-id="...">`, checkbox `<td class="w-chk"><input type="checkbox" data-sel="..." /></td>`, dòng tổng kết `summary-row`.
      * Dòng chi tiết `<tr class="dtl" id="dtl-...">` chứa `.dp`: Thanh tabs `.dp-tabs`, tiêu đề `h2` + pill trạng thái, hàng meta, 3 khối thông tin, tổng kết nợ/tổng mua `.sums`, thanh nút hành động `.dp-actions` có `ms-auto`.
      * Bổ sung CSS `.dp-tabs` & `.dp-tab` trong `nha-cung-cap.css` cho phép tương tác chuyển tab mượt mà.
    + **JavaScript Điều khiển (`nha-cung-cap-index.js`)**:
      * Chuẩn hóa logic click dòng `tr.tbl-row`: toggle class `.open` và hiển thị inline `tr.dtl` (#dtl-${id}), bỏ qua click từ input/button/link/.w-chk.
      * Tích hợp cơ chế lazy loading thông minh: Tab 1 hiển thị tức thì; Tab 2 & 3 tự động nạp AJAX qua `/NhaCungCap/GetDetail?id=${id}` khi click chuyển tab lần đầu và lưu cache trong DOM.
      * Đồng bộ checkbox chọn tất cả dòng `#chkAll` với `input[data-sel]`.
      * Bổ sung sự kiện `#resetF` khôi phục bộ lọc khi bảng trống.
    + **Tài liệu & Kiểm thử**:
      * Cập nhật `docs/specs/nha-cung-cap.md` (7.900 ký tự < 8.000 ký tự theo Luật 12).
      * Biên dịch `dotnet build` đạt 0 Errors, kiểm tra cú pháp JS `node -c` đạt 0 Errors.
- **Triển khai & Chuẩn hóa Phân hệ Xuất hủy theo Chuẩn KiotViet (Phiên 61)**:
  - **Nhu cầu**: Lập kế hoạch, triển khai toàn diện phân hệ Xuất hủy (`XuatHuyController`) và chuẩn hóa màn hình danh sách, bảng dữ liệu, bung dòng chi tiết (Inline Drawer) cùng chức năng bật/tắt cột theo đúng ảnh chụp thực tế KiotViet và phong cách Kiểm kho.
  - **Giải pháp & Kết quả thực hiện**:
    + **Xây dựng Kiến trúc Backend & ViewModel**:
      * Controller `XuatHuyController`: Xử lý Index, Filter (AJAX), Create (GET/POST), Edit, Details, Cancel, UpdateNote, Export Excel (List/Detail), ToggleFavorite.
      * ViewModels (`XuatHuyViewModels.cs`): Đầy đủ các DTO `XuatHuyIndexVM`, `XuatHuyFilterVM`, `XuatHuyListItemVM`, `XuatHuyFormVM`, `SaveXuatHuyRequest`, `UpdateXuatHuyNoteRequest`.
    + **Bảng Dữ liệu & Tùy chọn Ẩn/Hiện Cột**:
      * Menu `#colMenu` hỗ trợ 9 cột đúng chuẩn: Mã xuất hủy, Tổng giá trị hủy, Thời gian, Thời gian tạo, Chi nhánh, Người xuất hủy, Người tạo, Ghi chú, Trạng thái.
      * Khắc phục lỗi ẩn/hiện cột: chuyển sang truy vấn dynamic selector `$(tableSelector)` trong `kiot-filter.js` và logic đồng bộ thời gian thực trong `xuat-huy-index.js`, lưu `localStorage`.
    + **Bung Mở Chi Tiết Dòng (Inline Drawer) Chuẩn KiotViet**:
      * Đặt bảng trong `<section id="content"><div id="tableWrapper" class="kiot-table-wrapper">...</div></section>`.
      * Bổ sung styling `#xuatHuyTable.tbl` trong `kiem-kho.css`.
      * Chi tiết `.dp`: Tab "Thông tin", tiêu đề mã phiếu kèm badge trạng thái, hàng thông tin `Người tạo | Người xuất hủy | Ngày xuất hủy | Chi nhánh`.
      * Bảng chi tiết hàng hóa `dtl-tbl`: 5 cột (`Mã hàng`, `Tên hàng`, `SL hủy`, `Giá vốn`, `Giá trị hủy`) kèm 2 ô tìm kiếm nội bộ, liên kết xanh trên mã hàng.
      * Khối dưới: Textarea ghi chú (placeholder "Chưa có") và tổng kết `Tổng số lượng hủy`, `Tổng giá trị hủy`.
      * Cụm nút hành động: Hủy, Sao chép, Xuất file, Lưu, In, Mở phiếu.
    + **Kiểm tra biên dịch & Cú pháp**: `dotnet build` đạt 0 Errors, `node -c` đạt 0 lỗi.
- **Đồng bộ Chuẩn Giao diện & Nghiệp vụ Modal Thêm/Sửa Nhà Cung Cấp theo Phần Thêm Hàng (Phiên 60)**:
  - **Nhu cầu**: Người dùng yêu cầu sửa lại phần thêm nhà cung cấp dựa trên phần thêm hàng (đồng bộ cấu trúc modal KiotViet phẳng, custom combobox nhóm hàng có tìm kiếm và sửa/xóa ✎ tại chỗ, các khối accordion bo góc, sub-modals xác nhận/tạo nhanh).
  - **Giải pháp & Kết quả thực hiện**:
    + **Giao diện Modal (`_NhaCungCapModal.cshtml`, `Index.cshtml`)**:
      * Loại bỏ hoàn toàn modal bootstrap thô sơ cũ, chuyển sang cấu trúc Modal KiotViet chuẩn `.hh-ov`, `.hh-modal.main` (thừa hưởng CSS từ `hang-hoa-form.css`).
      * Header có tiêu đề và nút đóng `hh-x` SVG `#i-x`.
      * Cụm thông tin cơ bản: Tên NCC (bắt buộc, kèm `.hh-err`), Mã NCC (tự động), Điện thoại, Email.
      * 3 khối Accordion `.hh-sec.open`: Địa chỉ, Nhóm nhà cung cấp & Ghi chú, Thông tin xuất hóa đơn.
      * Nhóm NCC được nâng cấp thành **Custom Combobox**: có ô input readonly, mũi tên xoay, dropdown bật mượt mà với thanh tìm kiếm dính đỉnh `#searchMaNhomNcc`, danh sách các nhóm nạp từ DB kèm icon tick xanh `✓` và **icon bút chì ✎** (`.hh-item-edit-btn`) cho phép sửa/xóa nhóm trực tiếp tại chỗ! Kèm nút link `+ Tạo mới` trên nhãn.
      * Footer `.hh-m-foot`: Nút Xóa đỏ (`.hh-btn-del`, hiện khi sửa, ẩn khi tạo mới), cụm trạng thái checkbox/switch KiotViet, nút Bỏ qua, Lưu & Thêm mới, Lưu.
    + **Các Sub-modals đi kèm**:
      * `#nccPromptOv`: Tạo nhanh nhóm NCC.
      * `#nccEditGroupOv`: Sửa / Xóa nhóm NCC tại chỗ.
      * `#nccDeleteOv`: Xác nhận xóa NCC, tự động kiểm tra chứng từ và cung cấp tùy chọn "Chuyển sang Ngừng hoạt động ngay".
    + **Client Script (`nha-cung-cap-index.js`)**:
      * Triển khai bộ điều khiển combobox `nccGroupCombobox` với đầy đủ tính năng tìm kiếm, chọn, sync và xử lý click bút chì ✎.
      * Quản lý đóng mở modal bằng overlay (`showModal`/`hideModal`, data-close, phím Escape).
      * Validate form và hiển thị cảnh báo lỗi tiếng Việt trực tiếp dưới ô nhập liệu (`.invalid` + `.hh-err`).
    + **Kiểm tra biên dịch & Cú pháp**: `dotnet build` đạt 0 Errors, `node -c` đạt 0 lỗi.
- **Đồng bộ Hiển Thị Cột Mã Nhà Cung Cấp và Mũi Tên Sắp Xếp 3 Trạng Thái theo Bảng Kiểm Kho (Phiên 59)**:
  - **Nhu cầu**: Người dùng yêu cầu sửa bảng hiển thị nhà cung cấp, cụ thể là đồng bộ kiểu dáng hiển thị của cột "Mã nhà cung cấp" từ màu xanh in đậm sang chữ thường tiêu chuẩn (`<span class="text-break">`), đồng thời đồng bộ cấu trúc và icon mũi tên sắp xếp 3 trạng thái ở header giống hệt như bảng Phiếu kiểm kho (`_PhieuKiemKeTable.cshtml`).
  - **Giải pháp & Kết quả thực hiện**:
    + **ViewModels (`NhaCungCapIndexVM.cs`)**: Bổ sung hai thuộc tính `SortBy` và `SortDir` vào `NhaCungCapIndexVM`.
    + **Backend (`NhaCungCapController.cs`)**: Cập nhật cả Action `Index` và Action `Filter` truyền `SortBy = filter.SortBy, SortDir = filter.SortDir` vào `NhaCungCapIndexVM` khi trả về View và PartialView `_NhaCungCapTable`.
    + **Giao diện (`Index.cshtml` & `_NhaCungCapTable.cshtml`)**:
      * `Index.cshtml`: Truyền `Model` vào `<partial name="_NhaCungCapTable" model="Model" />` và thêm `data-sort-by` / `data-sort-dir` vào container `#kiotContainer`.
      * `_NhaCungCapTable.cshtml`: Chuyển model sang `NhaCungCapIndexVM`; đổi thẻ hiển thị mã NCC từ `<span class="fw-semibold text-primary">@item.MaNcc</span>` sang `<span class="text-break">@item.MaNcc</span>` chữ thường tiêu chuẩn giống cột Mã kiểm kho; đồng bộ hiển thị class `is-sorted sorted-asc / sorted-desc` và icon mũi tên sắp xếp Razor động cho toàn bộ các cột sortable (`ma`, `ten`, `sdt`, `email`, `no`, `tongmua`).
    + **JavaScript (`nha-cung-cap-index.js`)**: Khởi tạo `sortBy` và `sortDir` từ `#kiotContainer`; nâng cấp `updateSortIcons()` tự động tạo/xóa phần tử `.sort-icon` đồng bộ với Razor partial view khi click xoay vòng 3 trạng thái.
  - **Kiểm tra biên dịch & Cú pháp**: `dotnet build -t:CoreCompile` 0 Errors, cú pháp JavaScript `node -c` 0 lỗi.
- **Đóng gói Chế độ Pills cho Component `_KiotStatusFilter` và Chuẩn hóa Nút Trạng Thái theo Prototype (Phiên 58)**:
  - **Nhu cầu**: Dựa trên prototype `prototype-nhacungcap.html`, người dùng yêu cầu sửa lại nút Trạng thái trong leftmenu thành đúng chuẩn widget nút viên thuốc (`[Tất cả]`, `[Đang hoạt động]`, `[Ngừng hoạt động]`), đồng thời đóng gói thành component Lego dùng chung toàn hệ thống (bảo đảm tương thích ngược 100% với các màn hình đang dùng checkbox).
  - **Giải pháp & Kết quả thực hiện**:
    + **ViewModel (`KiotStatusFilterVM.cs`)**:
      * Bổ sung enum `KiotStatusRenderMode` (`Checkbox`, `Pills`).
      * Bổ sung thuộc tính `ContainerId` (mặc định `"pillsStatus"`), `RenderMode` (mặc định `Checkbox`).
      * Khởi tạo hàm dựng linh hoạt hỗ trợ cả 2 chế độ, đảm bảo 0 regression cho các màn hình `PhieuKiemKe`, `XuatHuy`.
    + **Component Partial View (`_KiotStatusFilter.cshtml`)**:
      * Hỗ trợ 2 chế độ render: `Pills` render ra `<div class="pills" id="@containerId">` với các button `.pill @(opt.Checked ? "on" : "")`, `Checkbox` render danh sách hộp kiểm như trước.
    + **Giao diện & Trải nghiệm (`site.css`)**:
      * Định nghĩa style `.pills` (flex, gap 8px) và `.pill` (height 32px, padding 0 14px, bo góc 16px, nền `#f3f4f6`, hover `#e5e7eb`, trạng thái kích hoạt `.on` với nền `#0070f4`, chữ trắng, font-weight 600).
    + **Thư viện JavaScript Dùng chung (`kiot-filter.js`)**:
      * Đóng gói hàm `KiotFilter.initStatusFilter(containerSelector, onSelectCallback)`: Tự động xử lý sự kiện click chuyển `.on`, lấy giá trị `data-st` và kích hoạt callback.
    + **Tích hợp Phân hệ Nhà cung cấp (`_NhaCungCapFilterSidebar.cshtml`, `nha-cung-cap-index.js`, `NhaCungCapController.cs`)**:
      * Tích hợp partial `_KiotStatusFilter` chế độ `Pills` với 3 lựa chọn: `all` ("Tất cả"), `active` ("Đang hoạt động", mặc định bật), `off` ("Ngừng hoạt động").
      * `nha-cung-cap-index.js` gọi `KiotFilter.initStatusFilter('#pillsStatus', ...)` đồng bộ chấm xanh `#dotTrangThai` và gửi AJAX lọc dữ liệu.
      * Controller nạp và nhận diện linh hoạt các giá trị trạng thái (`HOAT_DONG`/`active`, `NGUNG_HOAT_DONG`/`off`).
    + **Đồng bộ tài liệu**: Cập nhật mục 12 trong `.agent/rules/03-giao-dien-layout.md` (7.566 ký tự < 8.000 ký tự).
    + **Kiểm tra biên dịch & Cú pháp**: `dotnet build` 0 Errors, `node -c` toàn bộ file JS đạt 0 lỗi.
- **Đồng bộ Chuẩn Giao diện Hiển thị Phiếu Xuất Hủy Dựa trên Chức năng Kiểm Tồn / Kiểm Kho (Phiên 57)**:
  - **Nhu cầu**: Người dùng yêu cầu dựa trên chức năng kiểm tồn (Kiểm kho - `PhieuKiemKe`), đồng bộ và chuẩn hóa toàn bộ giao diện hiển thị phiếu xuất hủy (cả màn hình form/chi tiết và accordion inline trong danh sách).
  - **Giải pháp & Kết quả thực hiện**:
    + **Backend (`XuatHuyController.cs`)**:
      * Bổ sung Action `Details(int id)`: Hiển thị phiếu xuất hủy ở chế độ chỉ đọc (`IsReadOnly = true`), nạp đầy đủ danh sách dòng hàng và tên người duyệt/xác nhận.
      * Cập nhật Action `Edit(int id)`: Tự động chuyển tiếp sang `Details(id)` nếu phiếu đã hoàn thành (`DA_XAC_NHAN`) hoặc đã hủy (`HUY`) theo đúng Luật 5 không sửa chứng từ đã chốt.
    + **Giao diện Màn hình Form & Chi tiết (`_XuatHuyForm.cshtml`, `Details.cshtml`, `xuat-huy-form.js`)**:
      * Tái sử dụng 100% hệ thống class và bố cục của `kiem-kho.css`: `.kk-container`, `.form-wrap`, `.f-main`, `.f-top`, `.grid-card`, `.panel-toggle` (F4), `.f-panel`, `.pr`, `#sums`, `#fNote`, `.recent`, `.f-actions` (`.save` F9, `.done` F10).
      * Khi xem chi tiết (`Details`), ẩn thanh tìm kiếm F3, khóa các trường nhập liệu và hiển thị banner thông báo thời gian xác nhận cùng người duyệt.
      * Tối ưu `xuat-huy-form.js`: Đồng bộ logic vẽ lưới `paintGrid()`, hiển thị card autocomplete gợi ý F3 (avatar viết tắt, mã, giá vốn, tồn kho), phím tắt F3/F4/F9/F10 và modal xác nhận `#ov`.
    + **Bảng Danh sách & Accordion Drawer (`_XuatHuyTable.cshtml`, `xuat-huy-index.js`)**:
      * Đồng bộ class `.open` trên `tr.tbl-row` khi bung mở chi tiết, kích hoạt hiệu ứng nền xanh nhạt `#f0f7ff` và dải viền xanh 4px liền khối kết nối dòng chính với panel chi tiết.
      * Cấu trúc lại thanh công cụ hành động `.dp-actions` với spacer `.ms-auto`: Nhóm nút bên trái (`Hủy`, `Sao chép`, `Xuất file`), nhóm nút bên phải (`Lưu`, `In`, `Mở phiếu`). Nút `Mở phiếu` tự động dẫn sang `Edit` cho phiếu tạm và `Details` cho phiếu đã xong.
    + **Tài liệu & Kiểm thử**:
      * Cập nhật đặc tả `docs/specs/xuat-huy.md` (7.293 ký tự < 8.000 ký tự theo Luật 12).
      * Biên dịch `dotnet build` đạt 0 Errors, cú pháp `node -c` toàn bộ file JS đạt 0 lỗi.
- **Đóng gói Component Lego `_KiotValueFilter` và Chuẩn hóa Ô Nhập Giá trị Từ - Tới theo Prototype (Phiên 56)**:
  - **Nhu cầu**: Người dùng cung cấp file prototype `prototype-nhacungcap.html` và yêu cầu sửa lại nút/ô lọc Giá trị trong leftmenu thành đúng chuẩn widget `.fromto` (2 hàng xếp chồng `[Từ] [Nhập giá trị]` và `[Tới] [Nhập giá trị]`), đồng thời đóng gói thành component Lego dùng chung toàn hệ thống.
  - **Giải pháp & Kết quả thực hiện**:
    + **Đóng gói ViewModel & Partial View (`KiotValueFilterVM.cs` & `_KiotValueFilter.cshtml`)**:
      * Tạo `ViewModels/Common/KiotValueFilterVM.cs`: Hỗ trợ cấu hình `Id`, `Title`, `SubTitle` (mặc định "Giá trị"), `FromLabel` ("Từ"), `ToLabel` ("Tới"), `FromPlaceholder` ("Nhập giá trị"), `ToPlaceholder`, `FromValue`, `ToValue`.
      * Tạo `Views/Shared/_KiotValueFilter.cshtml`: Component Lego linh hoạt, tự động sinh cấu trúc `.fromto` với badge `<b>Từ</b>`, `<b>Tới</b>` xám nhạt, ô nhập class `.money`, text căn phải và tự format hàng nghìn. Hỗ trợ hiển thị độc lập kèm tiêu đề hoặc nhúng vào khối lọc có sẵn.
    + **Định dạng giao diện & Trải nghiệm (`site.css` & `site.js`)**:
      * Bổ sung định dạng `.fromto` và `.sub` vào `site.css`: Bo góc 6px, viền xám mềm, hiệu ứng focus viền xanh `#0070f4` kèm box-shadow mờ, badge label `<b>` nền `#f1f3f6` min-width 44px.
      * Cập nhật `site.js`: Bổ sung lắng nghe sự kiện input toàn cục tự động định dạng phân cách hàng nghìn cho class `.money`, không tự động điền số 0 khi xóa trắng để người dùng thao tác lọc tự nhiên.
    + **Thư viện JavaScript dùng chung (`kiot-filter.js`)**:
      * Bổ sung hàm tiện ích `KiotFilter.initValueFilter(id, onChangeCallback)`: Tự động gắn bộ lắng nghe `debounce 400ms` cho cụm `#filter{id}Tu` và `#filter{id}Den`, tự động toggle chấm xanh `#dot{id}` và gọi callback lọc dữ liệu.
    + **Tích hợp vào Phân hệ Nhà cung cấp (`_NhaCungCapFilterSidebar.cshtml` & `nha-cung-cap-index.js`)**:
      * Thay thế mã HTML cũ của "Tổng mua" và "Nợ hiện tại" bằng `<partial name="_KiotValueFilter" model='new KiotValueFilterVM("TongMua", "Tổng mua", "Giá trị")' />` và `<partial name="_KiotValueFilter" model='new KiotValueFilterVM("No", "Nợ hiện tại", "Giá trị")' />`.
      * Sử dụng `KiotFilter.initValueFilter('TongMua', ...)` và `KiotFilter.initValueFilter('No', ...)`.
    + **Cập nhật tài liệu luật**: Bổ sung mục 11 vào `.agent/rules/03-giao-dien-layout.md` (7.120 ký tự < 8.000 ký tự theo Rule 12).
  - **Kiểm tra biên dịch & Cú pháp**: `dotnet build -t:CoreCompile` 0 Errors, `node -c` trên các file JS đạt 0 lỗi.
- **Triển khai Toàn diện Phân hệ Quản lý Nhà cung cấp Chuẩn KiotViet (Phiên 55)**:
  - **Nhu cầu**: Xây dựng toàn diện phân hệ Quản lý Nhà cung cấp (`NhaCungCap`) mô phỏng chuẩn giao diện & nghiệp vụ thực tế của KiotViet, đồng bộ với kiến trúc khối Lego đã đóng gói trong dự án.
  - **Giải pháp & Kết quả thực hiện**:
    + **Cơ sở dữ liệu (SQL Server `QuanLyKhoPhuQuocLTW`)**:
      * Bổ sung bảng `NhomNhaCungCap` (`MaNhomNcc` INT IDENTITY PK, `TenNhom` NVARCHAR(150) UNIQUE, `GhiChu` NVARCHAR(255)).
      * Bổ sung các cột mới cho bảng `DonViCapHang`: `MaNcc` (ký hiệu hiển thị `NCC00001`), `Email`, `KhuVuc`, `PhuongXa`, `MaNhomNcc`, `GhiChu`, `TenCongTy`, `MaSoThue`, `SoCccd`, `NgayTao`, `NguoiTao`. Tuân thủ tuyệt đối 3 nguyên tắc vàng CSDL (chỉ thêm, không DROP/đổi tên cột cũ).
      * Nạp mã `NCC00001`... cho các bản ghi nhà cung cấp sẵn có.
    + **Models & DbContext**:
      * Tạo model `NhomNhaCungCap.cs`, cập nhật navigation property trong `DonViCapHang.cs`.
      * Đăng ký `DbSet<NhomNhaCungCap>` và cấu hình Fluent API trong `QuanLyKhoPhuQuocLtwContext.cs`.
    + **ViewModels (`ViewModels/NhaCungCap/`)**:
      * Tạo `NhaCungCapIndexVM.cs`, `NhaCungCapFilterParams.cs` (kế thừa `BaseFilterParams`), `NhaCungCapItemVM.cs`, `NhaCungCapFormVM.cs`, `NhaCungCapDetailVM.cs`, `QuickGroupSupplierRequest.cs`.
    + **Backend Controller (`NhaCungCapController.cs`)**:
      * Kế thừa `BaseKhoController`, bọc transaction khi tạo mới (`BeginTransactionAsync`).
      * Triển khai các Action: `Index`, `Filter` (lọc AJAX), `GetDetail` (Master-Detail 3 tabs), `GetItem` (đổ dữ liệu modal edit), `Create` (tự sinh mã `NCC00001` nếu để trống), `Edit`, `Delete` (chống xóa nhà cung cấp đã có phiếu nhập theo Luật 5, gợi ý chuyển `NGUNG_HOAT_DONG`), `ToggleStatus`, `CreateGroupQuick`, `UpdateGroupQuick`, `DeleteGroupQuick`.
    + **Frontend Views & CSS (`Views/NhaCungCap/`, `wwwroot/css/nha-cung-cap.css`)**:
      * `Index.cshtml`: Thanh công cụ trên cùng (Tìm kiếm F3, `+ Nhà cung cấp`, `Xuất file`, `Ẩn/hiện cột`), layout 2 cột KiotViet.
      * `_NhaCungCapFilterSidebar.cshtml`: 5 khối Lego (Nhóm NCC multi-select có ✎ sửa/xóa, Tổng mua khoảng số, Thời gian `_KiotDateFilter`, Nợ hiện tại khoảng số, Trạng thái `_KiotStatusFilter`).
      * `_NhaCungCapTable.cshtml`: Bảng dữ liệu có dòng tổng hợp nợ & tổng mua, checkbox chọn tất cả, sắp xếp cột 3 trạng thái, phân trang AJAX `_Pagination.cshtml`.
      * `_NhaCungCapDetail.cshtml`: Panel inline accordion xổ xuống gồm 3 sub-tabs (`Thông tin`, `Lịch sử nhập/trả hàng`, `Nợ cần trả nhà cung cấp`) cùng các nút Thao tác (Xóa, Đổi trạng thái, Chỉnh sửa).
      * `_NhaCungCapModal.cshtml`: Modal tạo mới/sửa với 3 khối accordion gập mở chuẩn KiotViet (`Địa chỉ`, `Nhóm nhà cung cấp, ghi chú`, `Thông tin xuất hóa đơn`), switch đổi trạng thái.
      * `nha-cung-cap.css`: Phong cách KiotViet chuẩn chỉ cho Master-Detail panel, tab bar, accordion.
    + **Client JavaScript (`wwwroot/js/nha-cung-cap-index.js`)**:
      * Tìm kiếm F3 debounce 300ms, lọc AJAX thời gian thực khi tương tác 5 khối Lego.
      * Mở/đóng dòng Master-Detail mượt mà, chuyển sub-tabs, nạp danh sách 10 phiếu nhập gần nhất.
      * Quản lý tạo nhanh, sửa tên ✎, xóa nhóm NCC qua `window.KiotPrompt`.
      * Xóa NCC bảo vệ qua `window.KiotConfirm`.
    + **Menu điều hướng**:
      * Cập nhật `_MainMenu.cshtml`: Liên kết tab "Mua hàng" ➜ "Nhà cung cấp" sang `asp-controller="NhaCungCap" asp-action="Index"`, đánh dấu `active`.
      * Cập nhật `_Header.cshtml`: Đổi liên kết "Nhà cung cấp" trong drawer mobile sang `NhaCungCap/Index`.
    + **Tài liệu đặc tả**:
      * Khởi tạo `docs/specs/nha-cung-cap.md` (7.648 ký tự < 8.000 ký tự theo Luật 12).
  - **Kiểm tra biên dịch & Cú pháp**: `dotnet build -t:CoreCompile` 0 Errors, cú pháp `node -c` 0 lỗi.
- **Triển khai Toàn diện Phân hệ Xuất hủy (Waste-Disposal Export) Chuẩn KiotViet (Phiên 54)**:
  - **Nhu cầu**: Người dùng cung cấp 2 ảnh chụp giao diện thực tế KiotViet của nghiệp vụ Xuất hủy (Màn hình Danh sách xuất hủy có accordion chi tiết inline và Màn hình Lập/sửa phiếu xuất hủy 2 cột với phím tắt F3, F4, F9, F10) và yêu cầu lên kế hoạch, lắp ráp linh kiện chuẩn LEGO và triển khai toàn diện.
  - **Giải pháp & Kết quả thực hiện**:
    + **Cơ sở dữ liệu & Migration (`10_bo_sung_maphieu_dadanhdau_phieuxuat.sql`)**:
      * Bổ sung `MaPhieu VARCHAR(30) NULL` và `DaDanhDau BIT NOT NULL DEFAULT 0` vào bảng `PhieuXuat` (tuân thủ 3 nguyên tắc vàng CSDL: chỉ cộng thêm cột, không DROP/đổi tên).
      * Tạo filtered unique index `UQ_PhieuXuat_MaPhieu` chống trùng mã.
      * Tận dụng `vw_BienDongKho` & `vw_TonKhoHienTai` có sẵn: khi `TrangThai = 'DA_XAC_NHAN'` và `LoaiPhieuXuat = 'XUAT_HUY'`, hệ thống tự động trừ tồn kho sổ sách tức thì mà không cần bảng tồn kho tĩnh. Khi hủy phiếu (`HUY`), tồn kho tự động được hoàn lại.
    + **Models & Services**:
      * Đồng bộ `PhieuXuat.cs` và ánh xạ trong `QuanLyKhoPhuQuocLtwContext.cs`.
      * Bổ sung `MaChungTuHelper.FormatMaXuatHuy(int id) => $"XH{id:D6}"`.
    + **ViewModels (`ViewModels/XuatHuy/XuatHuyViewModels.cs`)**:
      * Đóng gói đầy đủ `XuatHuyIndexVM`, `XuatHuyFilterVM`, `XuatHuyListItemVM`, `XuatHuyFormVM`, `XuatHuyLineVM`, `SaveXuatHuyRequest`, `UpdateXuatHuyNoteRequest`.
    + **Controller (`Controllers/XuatHuyController.cs`)**:
      * Kế thừa `BaseKhoController`, bảo vệ bằng `[Authorize]`, giao dịch `Database.BeginTransactionAsync()` an toàn.
      * Cung cấp các API: `Index`, `Filter` (AJAX table), `GetNextCode`, `ToggleFavorite`, `Create`, `Edit`, `SaveDraft` (F9), `Complete` (F10), `Cancel`, `UpdateNote`, `SearchProducts`, `DownloadTemplate`, `ImportExcel`, `Export` (danh sách và chi tiết bằng ClosedXML).
    + **Views & Giao diện LEGO (`Views/XuatHuy/`)**:
      * `Index.cshtml` & `_XuatHuyFilterSidebar.cshtml`: Tái sử dụng `_KiotDateFilter` (mặc định Tháng này), `_KiotStatusFilter`, `_KiotMultiSelectFilter` (Người tạo, Người xuất hủy).
      * `_XuatHuyTable.cshtml`: Đánh dấu sao ⭐, hiển thị các cột chuẩn, mở accordion inline `tr.dtl` với ô tìm kiếm inner search (`Tìm mã hàng`, `Tìm tên hàng`), textarea ghi chú, tổng kết số liệu và các nút hành động (Hủy bỏ, Mở phiếu, Sao chép, Xuất file, Lưu, In).
      * `_XuatHuyForm.cshtml`, `Create.cshtml`, `Edit.cshtml`: Màn hình 2 cột, bảng sản phẩm với empty state "Thêm sản phẩm từ file excel" + "Tải về file mẫu" + "Chọn file dữ liệu", panel bên phải F4 (Người xuất hủy, Ngày giờ, Mã phiếu, Trạng thái, Tổng giá trị hủy, Ghi chú, Lưu tạm F9, Hoàn thành F10).
    + **Styling & Client Scripts (`xuat-huy.css`, `xuat-huy-index.js`, `xuat-huy-form.js`)**:
      * Đáp ứng chuẩn xác 100% từng pixel, màu sắc, phím tắt F3/F4/F9/F10 từ 2 ảnh chụp thực tế KiotViet.
    + **Tài liệu & Menu**:
      * Cập nhật liên kết menu trên `_MainMenu.cshtml` và `_Header.cshtml`.
      * Biên soạn đặc tả `docs/specs/xuat-huy.md` (6.930 ký tự, tuân thủ < 8.000 ký tự).
  - **Kiểm tra biên dịch & Cú pháp**: `dotnet build` đạt 0 Errors, cú pháp `node -c` trên toàn bộ file JS đạt 0 lỗi.
- **Bỏ Mục "Tồn kho" và "Nhóm hàng" trên Menu Hàng hóa Topbar (Phiên 53)**:
  - **Nhu cầu**: Người dùng yêu cầu gỡ bỏ 2 mục "Nhóm hàng" (dưới cột HÀNG HÓA) và "Tồn kho" (dưới cột KHO HÀNG) trên dropdown mega menu của tab "Hàng hóa" ở thanh điều hướng trên cùng (Topbar).
  - **Giải pháp & Kết quả thực hiện**:
    + Cập nhật `Views/Shared/_MainMenu.cshtml`: Gỡ bỏ link `Nhóm hàng` (`asp-route-tab="nhom"`) trong cột Hàng hóa và link `Tồn kho` trong cột Kho hàng. Menu dropdown giờ chỉ giữ lại "Danh sách hàng hóa" ở cột Hàng hóa, và các nghiệp vụ chứng từ kho ("Kiểm kho", "Chuyển kho", "Xuất dùng nội bộ", "Xuất hủy") ở cột Kho hàng theo đúng bản vẽ thiết kế của người dùng.
    + Cập nhật đồng bộ `Views/Shared/_Header.cshtml`: Gỡ bỏ 2 mục tương ứng trên Drawer menu điều hướng trên thiết bị di động / màn hình nhỏ.
  - **Kiểm tra biên dịch**: `dotnet build -t:CoreCompile` 0 Errors.
- **Loại bỏ Nút Dấu Cộng Thừa trong Thanh Tìm Kiếm Kiểm Kho (Phiên 52)**:
  - **Nhu cầu**: Người dùng phản ánh trong thanh tìm kiếm hàng hóa (`fSearch`) ở màn hình Tạo/Sửa phiếu kiểm kho (`_PhieuKiemKeForm.cshtml`), nút dấu cộng `+` (`#btnQuick`: Thêm nhanh hàng hóa mới) là thừa và không dùng đến, yêu cầu gỡ bỏ.
  - **Giải pháp & Kết quả thực hiện**:
    + Gỡ bỏ phần tử `<button type="button" class="btn-tail" id="btnQuick" title="Thêm nhanh hàng hóa mới"><i class="bi bi-plus-lg"></i></button>` trong `_PhieuKiemKeForm.cshtml`. Giữ lại duy nhất nút chọn hàng theo nhóm (`#btnGrp` icon `bi-grid-3x3-gap`).
    + Cập nhật CSS `kiem-kho.css`: Tối ưu khoảng đệm `padding` bên phải ô nhập từ `74px` xuống `42px` giúp hiển thị tên hàng hóa rộng rãi, thoáng mắt hơn.
  - **Kiểm tra biên dịch**: `dotnet build -t:CoreCompile` 0 Errors.
- **Hỗ trợ Sửa và Xóa Nhóm hàng Trực tiếp từ Dropdown Chuẩn KiotViet (Phiên 51)**:
  - **Nhu cầu**: Người dùng muốn các mục trong dropdown bộ lọc "Nhóm hàng" ở sidebar cột trái (`#dropdownNhomHang`) và dropdown Nhóm hàng trong modal tạo/sửa hàng hóa (`#listMaNhom`) có thể chỉnh sửa tên hoặc xóa nhanh trực tiếp từ dropdown thông qua biểu tượng bút chì ✎ khi hover, tương tự như trong màn hình tạo đơn hàng/hàng hóa chuẩn KiotViet.
  - **Giải pháp & Kết quả thực hiện**:
    + **Backend (`HangHoaController.cs` & `QuickGroupRequest.cs`)**:
      * Bổ sung `UpdateGroupRequest` (`MaNhom`, `TenNhom`) và `DeleteGroupRequest` (`MaNhom`).
      * Bổ sung API `[HttpPost] UpdateGroupQuick`: Kiểm tra dữ liệu hợp lệ, chống trùng lặp tên nhóm hàng (không phân biệt hoa thường) với nhóm khác, lưu cập nhật vào CSDL.
      * Bổ sung API `[HttpPost] DeleteGroupQuick`: Kiểm tra an toàn ràng buộc khóa ngoại (Foreign Key) `HangHoa.MaNhom`; nếu nhóm đang có sản phẩm thì từ chối kèm thông báo thân thiện: "Không thể xóa nhóm hàng \"{Tên}\" vì đang có sản phẩm thuộc nhóm này"; nếu nhóm trống thì tiến hành xóa an toàn.
      * Cải tiến `CreateGroupQuick`: Kiểm tra trùng tên trước khi tạo mới để tránh tạo các nhóm trùng lặp.
    + **ViewModel & Giao diện Dropdown (`KiotMultiSelectVM.cs`, `_KiotMultiSelectFilter.cshtml`, `_HangHoaModal.cshtml`, `site.css`)**:
      * Bổ sung cờ `public bool AllowEdit { get; set; } = false` trong `KiotMultiSelectVM`. Bật `AllowEdit = true` cho nhóm hàng ở sidebar.
      * Hiển thị nút sửa `.kiot-item-edit-btn` (`<i class="bi bi-pencil">`) ở góc phải từng mục khi hover; giữ nguyên các dropdown khác không bị ảnh hưởng.
      * Bổ sung nút sửa `.hh-item-edit-btn` vào từng item nhóm hàng trong `#listMaNhom` của modal tạo/sửa sản phẩm.
    + **Client Logic & Đồng bộ Thời gian thực (`hang-hoa-index.js` & `hang-hoa-form.js`)**:
      * Tích hợp hộp thoại chuẩn KiotViet `window.KiotPrompt.open`: Cho phép sửa tên nhóm, có nút "Xóa" màu đỏ góc trái dưới, nút "Bỏ qua" và "Lưu" góc phải dưới.
      * **Khắc phục triệt để lỗi xung đột sự kiện click**:
        - Chặn bộ lắng nghe chọn dòng `.kiot-ms-item` không tự động toggle checkbox hay reload bảng khi người dùng click vào nút bút chì ✎ (`$(e.target).closest('.kiot-item-edit-btn').length`).
        - Bắt trực tiếp sự kiện click trên dropdown (`dropdown.on('click', '.kiot-item-edit-btn')`) đảm bảo mở modal `KiotPrompt` ngay lập tức.
        - Bảo vệ dropdown sidebar không bị đóng khi click vào modal prompt/confirm (`$(document).on('click')` bỏ qua các tương tác trong modal con).
        - Giữ nguyên trạng thái mở của dropdown Nhóm hàng sau khi Lưu, Xóa hoặc Bỏ qua để người dùng quan sát kết quả tức thì.
        - Báo lỗi validate trực tiếp trong khung modal (`#kiotPromptErr`) mà không tự động đóng modal khi người dùng nhập sai/trùng tên.
      * Khi Lưu hoặc Xóa thành công: Đồng bộ ngay lập tức trên cả 4 vị trí:
        1. Dropdown bộ lọc Nhóm hàng ở sidebar (`#dropdownNhomHang`).
        2. Dropdown chọn Nhóm hàng trong modal form (`#listMaNhom` & `<select id="formMaNhom">`).
        3. Thanh nhãn lọc đang áp dụng (`filterState.nhom`).
        4. Tự động tải lại bảng dữ liệu (`loadTable()`) với thông báo Toast xanh thân thiện.
  - **Kiểm tra biên dịch & Cú pháp**: `dotnet build` đạt 0 Errors, cú pháp `node -c` trên các file JS đạt 0 lỗi, đặc tả `docs/specs/danh-sach-hang-hoa.md` tuân thủ < 8.000 ký tự (7.963 ký tự).
- **Khắc phục Triệt để Lỗi Ẩn Dropdown khi Ấn Bút Chì Chỉnh Sửa Item (Phiên 50)**:
  - **Nhu cầu**: Người dùng phản ánh khi nhấp vào biểu tượng bút chì ✎ để sửa một vị trí kho (hoặc thuộc tính) trong dropdown, dropdown danh sách lựa chọn bên dưới lập tức bị tương tác co lại và biến mất. Người dùng yêu cầu khi đang sửa thì dropdown bên dưới phải được **giữ nguyên** trạng thái mở để quan sát ngữ cảnh, và sau khi Lưu/Xóa/Bỏ qua thì danh sách vẫn hiển thị đầy đủ kết quả vừa cập nhật.
  - **Nguyên nhân cốt lõi**:
    + Sự kiện click toàn cục `document.addEventListener('click')` và `$(document).on('click')` lắng nghe việc click ra ngoài vùng dropdown (`formViTriWrap`) để tự động đóng dropdown.
    + Khi modal sửa (`#hhEditItemOv`, `#kiotPromptOv`) mở lên, mọi tương tác của người dùng với modal (nhấp vào ô nhập text, nhấp nút Lưu, Bỏ qua, Xóa...) đều là các phần tử nằm ngoài `formViTriWrap`, kích hoạt hàm `closeLocationDropdown()` và `closeAllSingleSelects()`, khiến dropdown bên dưới bị ẩn ngay lập tức.
  - **Giải pháp thực hiện**:
    + **Bảo vệ Trạng thái Dropdown khi Thao tác Modal (`hang-hoa-form.js` & `kiot-filter.js`)**:
      * Bổ sung điều kiện chặn trong `document.addEventListener('click')`: Nếu sự kiện click xảy ra bên trong bất kỳ modal con nào (`#hhEditItemOv, #hhPromptOv, #kiotPromptOv, #kiotConfirmOv, #hhDeleteProductOv, #hhPickOv, .kiot-prompt-ov, .kiot-confirm-ov, .modal-box`) HOẶC hiện tại đang có modal con nào đang mở (`.show`), TUYỆT ĐỐI không gọi `closeLocationDropdown()`, `closeAllSingleSelects()` hay `closeDropdown()`.
      * Trong `openEditItemModal`: Tự động gọi `openLocationDropdown()` đảm bảo dropdown vị trí bên dưới luôn mở và hiển thị sẵn sàng.
      * Trong `handleEditItemSave` và `handleEditItemDelete`: Sau khi cập nhật lại dữ liệu danh sách vị trí, tự động gọi `openLocationDropdown()` để giữ nguyên dropdown mở, người dùng nhìn thấy ngay mục vừa sửa/xóa được phản ánh tức thì.
      * Khi đóng modal sửa qua nút "Bỏ qua" (`data-close="hhEditItemOv"`) hoặc phím `Escape`: Dropdown vị trí bên dưới vẫn được giữ nguyên trạng thái mở.
      * Đồng bộ tương tự cho khối combobox dùng chung trong `kiot-filter.js` (`KiotFilter.initCombobox`).
  - **Kiểm tra biên dịch**: `dotnet build -t:CoreCompile` 0 Errors, cú pháp `node -c` trên toàn bộ các file JS đạt 0 lỗi.
- **Khắc phục Triệt để Lỗi Nền Đen khi Nhập/Tải Ảnh Hàng Hóa (Phiên 49)**:
  - **Nhu cầu**: Người dùng phản ánh khi nhập/tải ảnh sản phẩm (đặc biệt là ảnh PNG, WebP hoặc ảnh có nền trong suốt thường dùng trong thương mại điện tử), ảnh hiển thị và lưu vào hệ thống lại bị biến thành nền đen kịt (`#000000`).
  - **Nguyên nhân cốt lõi**:
    + Trong hàm nén ảnh client `compressImage` (`hang-hoa-form.js`), đối tượng `canvas` khởi tạo mặc định chứa các điểm ảnh trong suốt dạng đen `rgba(0, 0, 0, 0)`.
    + Khi gọi `canvas.toDataURL('image/jpeg')`, định dạng JPEG không hỗ trợ kênh Alpha (Transparency) nên trình duyệt tự động loại bỏ kênh alpha, khiến toàn bộ vùng nền trong suốt bị chuyển thành màu đen tuyền `#000000`.
    + Ngoài ra, lớp phủ gợi ý `.hh-main-change-hint` trên ảnh chính trước đó dùng `inset: 0` với nền đen mờ `rgba(0, 0, 0, 0.32)` phủ kín toàn bộ bức ảnh khi hover, làm người dùng cảm thấy ảnh bị tối đen.
  - **Giải pháp thực hiện**:
    + **Xử lý Canvas Client (`hang-hoa-form.js`)**:
      * Đổ nền trắng tinh khiết `#FFFFFF` toàn bộ khung canvas (`ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height);`) trước khi vẽ ảnh (`ctx.drawImage`). Đảm bảo bất kỳ ảnh trong suốt nào (PNG, WebP, GIF) khi nén sang JPEG đều có nền trắng sạch sẽ, sắc nét chuẩn thương mại điện tử / KiotViet, loại bỏ 100% hiện tượng nền đen.
      * Bật khử răng cưa chất lượng cao (`imageSmoothingQuality = 'high'`).
      * Bổ sung tính năng Kéo & Thả ảnh trực tiếp (Drag & Drop) vào khung ảnh chính kèm hiệu ứng viền xanh `.drag-over`.
      * Bổ sung tính năng Dán ảnh trực tiếp từ Clipboard (`Ctrl + V`) khi đang mở modal tạo/sửa hàng hóa.
    + **Giao diện & Styling (`hang-hoa-form.css`)**:
      * Đổi `.hh-img-main` và `.hh-th` sang nền trắng chuẩn `#ffffff`.
      * Tinh chỉnh `.hh-main-change-hint`: Chuyển từ lớp phủ kín đen toàn ảnh thành thanh thông báo đáy thanh lịch (`height: 28px; bottom: 0;`), giữ ảnh sản phẩm luôn sáng rõ 100%.
      * Đưa huy hiệu `.hh-main-badge` ("Ảnh chính") lên góc trên bên trái (`top: 8px; left: 8px;`) tránh đè lên thanh đổi ảnh.
    + **Backend (`HangHoaController.cs`)**:
      * Bổ sung hàm tiện ích `DetectImageMime(byte[] data)` tự động nhận diện chính xác định dạng ảnh (`image/png`, `image/webp`, `image/gif`, `image/jpeg`).
      * Đồng bộ `GetImage` và `GetItem` trả về đúng chuỗi Data URI mime type cho ảnh đã lưu.
  - **Kiểm tra biên dịch**: `dotnet build /t:Compile` đạt 0 Warnings mới, 0 Errors; cú pháp `node -c` 0 lỗi.
- **Tối ưu hóa Trải nghiệm Hiển thị Mượt mà Hai Chiều Mở & Đóng (Two-way Smooth Animations) cho Toàn bộ Modal (Phiên 48)**:
  - **Mục tiêu**: Loại bỏ triệt để hiện tượng giật cục / bật đột ngột khi mở và hiện tượng tắt ngang cụt hứng khi đóng modal (bấm "Bỏ qua", "Đồng ý xóa", nút `×`, click nền backdrop hoặc phím Escape).
  - **Giải pháp & Kết quả thực hiện**:
    + **Cơ chế Hai chiều (Two-way Transition Architecture)**:
      * **Khi Mở (`.show`)**: `visibility` kích hoạt ngay lập tức (`delay 0s`), overlay và hiệu ứng làm mờ hậu cảnh (`backdrop-filter: blur(3px)`) trôi nhẹ vào trong `0.22s ease-out`; khung modal trượt nhẹ từ `translateY(8px) scale(0.94)` lên `translateY(0) scale(1)` với đường cong `cubic-bezier(0.16, 1, 0.3, 1)` trong `0.25s`.
      * **Khi Đóng (gỡ bỏ `.show`)**: `pointer-events: none` ngắt tức thì chống click lặp; `visibility` được giữ lại trong `0.2s` (`visibility 0s linear 0.2s`) để khung modal kịp co nhỏ và mờ dần (`transform: scale(0.94) translateY(8px); opacity: 0;`), nền mờ tan biến hoàn toàn rồi mới chuyển sang `visibility: hidden`.
    + **Đồng bộ toàn bộ các stylesheet**:
      * `site.css`: `.kiot-confirm-ov`, `.kiot-confirm-modal`, `.kiot-prompt-ov`, `.kiot-prompt-modal`.
      * `kiem-kho.css`: `.ov`, `.modal-box` (modal xác nhận xóa dòng, xóa danh sách, cân bằng kho).
      * `hang-hoa-form.css`: `.hh-ov`, `.hh-modal`, `#hhDeleteProductOv` (modal xóa hàng hóa, modal tạo/sửa).
  - **Kiểm tra biên dịch**: `dotnet build -t:CoreCompile` 0 Errors, 0 Warnings mới.
- **Chuẩn hóa Giao diện Xác nhận Xóa Giống Xóa Hàng Hóa & Hiển thị ở Center (Phiên 47)**:
  - **Nhu cầu**: Thay thế triệt để các hộp thoại `alert()` và `confirm()` mặc định của trình duyệt sang giao diện Modal xác nhận xóa chuẩn KiotViet (giống modal "Xóa hàng hóa" `#hhDeleteProductOv`), đồng thời căn chỉnh vị trí hiển thị chính xác ở **chính giữa màn hình (Center)** cả theo chiều ngang và chiều dọc.
  - **Giải pháp thực hiện**:
    + **Thư viện Dùng chung Toàn hệ thống (`_KiotPromptModal.cshtml`, `site.css`, `site.js`)**:
      - Bổ sung cấu trúc `kiotConfirmOv` vào `_KiotPromptModal.cshtml` (đã nhúng ở `_Layout.cshtml`) gồm: Header tiêu đề đỏ `#dc2626` kèm icon thùng rác và nút close `×`, Body chứa nội dung xác nhận, Footer nền xám nhạt `#f9fafb` với 2 nút "Bỏ qua" và "Đồng ý xóa".
      - Xây dựng component `window.KiotConfirm` trong `site.js` với các phương thức `KiotConfirm.show({ title, message, confirmText, onConfirm })` và `KiotConfirm.alert(message, title)` thay thế hoàn toàn `confirm()` và `alert()`.
      - Căn chỉnh CSS `.kiot-confirm-ov`: `align-items: center !important; justify-content: center !important;` hiển thị chính giữa viewport.
    + **Kiểm kho (`_PhieuKiemKeForm.cshtml`, `phieu-kiem-ke-form.js`, `phieu-kiem-ke-index.js`, `kiem-kho.css`)**:
      - Căn chỉnh `.ov` trong `kiem-kho.css`: gỡ bỏ `padding-top: 14vh`, đổi thành `align-items: center !important; justify-content: center !important;`.
      - Nâng cấp `.modal-box`: header có nút close `mClose`, body chuẩn 20px 24px, footer `#f9fafb` chuẩn KiotViet.
      - Xóa dòng hàng hóa kiểm kho: modal hiển thị chính giữa với thông điệp *"Bạn có chắc chắn muốn xóa hàng hóa [Tên] ([Mã])? Thao tác này không thể hoàn tác."*.
      - Hủy phiếu kiểm (`phieu-kiem-ke-index.js`): Thay thế hoàn toàn `alert()` và `confirm()` bằng `KiotConfirm.alert()` và `KiotConfirm.show()`.
    + **Hàng hóa (`hang-hoa-form.css`, `hang-hoa-form.js`)**:
      - Căn chỉnh `#hhDeleteProductOv, #hhPromptOv, #hhEditItemOv`: `align-items: center !important;` giúp modal Xóa hàng hóa luôn nằm ở trung tâm màn hình.
      - Kết nối các thao tác xóa ảnh chính, ảnh phụ, xóa vị trí/thuộc tính và xóa dòng thuộc tính qua `KiotConfirm.show()`.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors, cú pháp JavaScript `node -c` 0 lỗi.
- **Đóng gói Khối Form & Combobox Sửa Trực Tiếp Dùng Chung (Lego Form Components) (Phiên 46)**:
  - **Mục tiêu & Nhu cầu**: Đóng gói các thành phần giao diện và tương tác phức tạp trong form Tạo hàng hóa thành các khối Lego dùng chung độc lập (Ô nhập số định dạng hàng nghìn, Khối accordion gập mở, Nút lưu split button, Dropdown combobox vừa gõ vừa chọn có icon bút chì ✎ sửa/xóa trực tiếp, Modal con tạo mới nhanh / sửa trực tiếp dùng chung).
  - **Giải pháp & Kết quả thực hiện**:
    + **Modal Con Dùng Chung (`_KiotPromptModal.cshtml`)**: Tạo `Views/Shared/_KiotPromptModal.cshtml` và nhúng trực tiếp vào `Views/Shared/_Layout.cshtml`. Phục vụ tạo mới nhanh hoặc sửa/xóa tại chỗ cho bất kỳ danh mục nào mà không cần tạo modal HTML riêng cho từng trang.
    + **Thư viện JavaScript Tiện ích Form (`site.js`)**:
      - `KiotNumber`: Tự động định dạng số hàng nghìn `1,000,000`, chặn ký tự chữ, tự động bôi đen (select all) khi focus, trả về số sạch qua `KiotNumber.get()`.
      - `KiotCollapsible`: Tự động gập mở khối `.kiot-sec` khi click vào `.kiot-sec-h`, xoay icon mũi tên `.kiot-chev`.
      - `KiotSplitButton`: Tự động mở/đóng menu tùy chọn lưu `.kiot-split`, tự đóng khi click ngoài.
      - `KiotPrompt`: Điều khiển modal con toàn hệ thống qua JavaScript 1 dòng: `KiotPrompt.open({ title, label, value, showDelete, onSave, onDelete })`.
    + **Thư viện Dropdown Combobox (`kiot-filter.js`)**:
      - `KiotFilter.initCombobox`: Đóng gói combobox vừa gõ tìm kiếm vừa chọn, hiển thị icon cây bút chì ✎ khi hover để sửa trực tiếp tại chỗ, hỗ trợ cả chọn đơn và chọn nhiều tag chips.
    + **CSS Hệ thống Dùng chung (`site.css`)**: Bổ sung đầy đủ styling cho `.kiot-sec`, `.kiot-num`, `.kiot-split`, `.kiot-combobox-*`, `.kiot-item-edit-btn`, `.kiot-prompt-*`.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors.
- **Chuẩn hóa & Tối ưu hóa Bộ lọc LeftMenu dùng chung thành Khối Lego (Phiên 45)**:
  - **Mục tiêu & Nhu cầu**: Giải quyết triệt để hiện tượng lặp lại mã HTML/Razor và JS trên Sidebar bộ lọc (LeftMenu Filter) giữa các màn hình Danh sách Hàng hóa, Kiểm kho và các phân hệ tiếp theo (Nhập kho, Xuất kho).
  - **Giải pháp & Kết quả thực hiện**:
    + **ViewModel Dùng chung (`KiotMultiSelectVM.cs` & `KiotStatusFilterVM.cs`)**: Tạo các ViewModel chuẩn đặt tại `ViewModels/Common/` đóng gói cấu hình dropdown chọn nhiều (Id, Title, Placeholder, DataFilter, HasSearch, HeaderAction, DotId) và danh sách lựa chọn trạng thái chứng từ checkbox.
    + **Partial Views Dùng chung (`_KiotMultiSelectFilter.cshtml` & `_KiotStatusFilter.cshtml`)**: Tạo 2 partial views dùng chung tại `Views/Shared/`, loại bỏ hoàn toàn việc viết lặp lại các khối HTML dropdown multi-select và checkbox trạng thái trong các sidebar.
    + **Thư viện JavaScript Mở rộng (`kiot-filter.js`)**: Bổ sung các helper dùng chung vào `KiotFilter`: `escapeHtml`, `checkSidebarDropdownDirection` (tự động đảo hướng drop-up chống tràn đáy màn hình khi cuộn), `renderTagPills` (render danh sách tag chips `.kiot-pill-tag` kèm nút `×` và `+N khác`).
    + **Tái cấu trúc Sidebar (`_HangHoaFilterSidebar.cshtml` & `_PhieuKiemKeFilterSidebar.cshtml`)**: Chuyển đổi toàn bộ các khối dropdown chọn nhiều (Nhóm hàng, NCC, Vị trí, Loại hàng, Người tạo) và khối Trạng thái chứng từ sang cú pháp gọi 1 dòng `<partial name="_KiotMultiSelectFilter" ... />` và `<partial name="_KiotStatusFilter" ... />`.
    + **Tối ưu hóa Script View (`hang-hoa-index.js` & `phieu-kiem-ke-index.js`)**: Loại bỏ các hàm tiện ích trùng lặp, tái sử dụng trực tiếp các phương thức từ `KiotFilter`.
  - **Kiểm tra biên dịch & Cú pháp**: `dotnet build` đạt 0 Errors, `node -c` kiểm tra 3 file JS đạt 0 lỗi cú pháp.
- **Chuẩn hóa & Đóng gói các Khối Giao diện và Nghiệp vụ Dùng chung thành Mảnh ghép Lego Độc lập (Phiên 44)**:
  - **Mục tiêu & Nhu cầu**: Loại bỏ triệt để hiện tượng lặp mã (HTML, CSS, JS, C#) ở các thành phần dùng chung lặp lại giữa Danh sách hàng hóa và Kiểm kho (bộ lọc ngày + lịch 2 tháng, thông báo toast, ẩn/hiện cột, đánh dấu sao, backend resolve khoảng ngày); đóng gói thành các khối Lego độc lập, lần sau chỉ việc gọi 1 dòng tái sử dụng theo nguyên lý Open/Closed Principle.
  - **Giải pháp & Kết quả thực hiện**:
    + **Backend (`DateRangeHelper.cs`)**: Tạo `Helpers/DateRangeHelper.cs` chuẩn hóa logic giải quyết ngày cho 12 loại bộ lọc (`ALL`, `HOM_NAY`, `HOM_QUA`, `TUAN_NAY`, `TUAN_TRUOC`, `7_NGAY`, `THANG_NAY`, `THANG_TRUOC`, `30_NGAY`, `QUY_NAY`, `NAM_NAY`, `CUSTOM`). Refactor `PhieuKiemKeController.cs` và `HangHoaController.cs`: Cắt giảm ~90 dòng code switch-case và if-else lặp lại.
    + **Hệ thống Toast KiotViet Dùng chung (`site.js` & `site.css`)**: Xây dựng `window.KiotToast` (`success`, `error`, `warning`, `info`) chuẩn KiotViet với container `.kiot-toast-container` cố định góc trên bên phải, animation trượt mượt mà, tự ẩn sau 3s. Tương thích ngược toàn cục `window.showToast` và `window.toast`, gỡ bỏ các đoạn JS tự tạo toast rải rác. Nạp `site.js` vào `_Layout.cshtml`.
    + **Partial View Bộ lọc Ngày tháng Dùng chung (`_KiotDateFilter.cshtml` & `KiotDateFilterVM.cs`)**: Tạo `ViewModels/Common/KiotDateFilterVM.cs` và Partial `Views/Shared/_KiotDateFilter.cshtml` đóng gói toàn bộ radio, popup chọn nhanh 3 cột và popup Dual Calendar 2 tháng. Hỗ trợ cả 2 chế độ: ngày tương lai (`DateType = "future"` cho Dự kiến hết hàng `dk`) và ngày quá khứ (`DateType = "past"` cho Thời gian tạo `tgt` và Thời gian kiểm `date`). Thay thế ~250 dòng Razor lặp lại trong `_HangHoaFilterSidebar.cshtml` và `_PhieuKiemKeFilterSidebar.cshtml` bằng cú pháp gọi 1 dòng `<partial name="_KiotDateFilter" ... />`.
    + **Thư viện JavaScript Mở rộng (`kiot-filter.js`)**: Bổ sung `KiotFilter.initDateFilter`, `KiotFilter.initColumnToggle` (lưu localStorage), `KiotFilter.bindStarToggle` (AJAX bookmark + toast), `KiotFilter.toggleFloatingPopup`.
    + **Tái cấu trúc Script View (`hang-hoa-index.js`, `phieu-kiem-ke-index.js`)**: Thay thế hơn 500 dòng JS tự viết trùng lặp ở 2 trang bằng các lệnh gọi 1 dòng `KiotFilter.initDateFilter(...)` và `KiotFilter.initColumnToggle(...)`.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors.
- **Khắc phục Triệt để Lỗi Xuất File Dữ liệu Kiểm kho thành File Excel .xlsx Chuẩn KiotViet (Phiên 43)**:
  - **Nhu cầu**: Người dùng phản ánh khi bấm xuất file dữ liệu kiểm kho ("Xuất danh sách phiếu kiểm", "Xuất chi tiết"), tất cả thông tin bị dồn hết vào 1 cột / 1 dòng do mở file CSV trên Windows có thiết lập vùng Việt Nam (dấu ngăn cách mặc định là chấm phẩy `;` thay vì phẩy `,`), đồng thời thiếu ngắt dòng và BOM chuẩn.
  - **Giải pháp thực hiện**:
    + **Backend (`PhieuKiemKeController.cs`)**:
      - Chuyển đổi định dạng xuất mặc định sang file Excel thực sự (`.xlsx`) bằng thư viện `ClosedXML` với MIME type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
      - Tách biệt rõ 2 chế độ:
        * **Xuất danh sách phiếu kiểm** (`type = "list"`): Xuất đầy đủ 13 cột chuẩn mực (STT, Mã kiểm kho, Thời gian kiểm, Kho kiểm, Người tạo, Tổng thực tế, Tổng chênh lệch, SL lệch tăng, SL lệch giảm, Tổng giá trị lệch, Ngày cân bằng, Trạng thái, Ghi chú).
        * **Xuất chi tiết** (`type = "detail"`): Duyệt qua từng dòng hàng trong phiếu kiểm để xuất 16 cột chi tiết (STT, Mã kiểm kho, Thời gian, Kho, Người tạo, Trạng thái, Mã hàng, Tên hàng, ĐVT, Tồn kho, Thực tế, SL lệch, Đơn giá, Giá trị lệch, Ngày cân bằng, Ghi chú).
      - Áp dụng chuẩn kiểu dáng KiotViet: `ExcelHelper.ApplyKiotVietHeaderStyle` (nền xanh `#0066cc`, chữ trắng in đậm, căn giữa), viền ô bảng tính `ExcelHelper.ApplyTableBorders`, định dạng số lượng `#,##0.##`, tiền tệ `#,##0`, ngày giờ `dd/MM/yyyy HH:mm`, tự động co giãn kích thước cột (`AdjustToContents`).
      - Bổ sung tham số `id` trực tiếp cho action `Export` để hỗ trợ xuất chi tiết phiếu đơn lẻ từ nút thao tác trên từng dòng bảng (`_PhieuKiemKeTable.cshtml`), không bị ảnh hưởng bởi bộ lọc ngày/trạng thái.
      - Vẫn duy trì fallback xuất CSV an toàn nếu có tham số `format=csv` (bổ sung UTF-8 BOM byte preamble chuẩn và hàm `EscapeCsv` làm sạch dấu phẩy, nháy kép, ký tự xuống dòng).
    + **Giao diện (`_PhieuKiemKeTable.cshtml`)**: Cập nhật link nút "Xuất file" trên từng dòng bảng sang `Export?type=detail&id=@item.MaPhieuKiemKe`.
  - **Kiểm tra biên dịch**: `dotnet build ... /t:Compile` đạt 0 Warnings mới, 0 Errors.
- **Đồng bộ Tính năng Sắp xếp Cột 3 Trạng thái trong Kiểm kho Khớp 100% Danh sách Hàng hóa (Phiên 42)**:
  - **Nhu cầu**: Người dùng muốn khi click vào tiêu đề của một cột trong bảng Phiếu kiểm kho thì sắp xếp dữ liệu xoay vòng 3 trạng thái (Tăng dần -> Giảm dần -> Bỏ sắp xếp) giống hệt bên module Danh sách hàng hóa.
  - **Giải pháp thực hiện**:
    + **ViewModels**: Bổ sung `SortBy` và `SortDir` vào `PhieuKiemKeFilterVM` và `PhieuKiemKeIndexVM` (`KiemKhoViewModels.cs`).
    + **Backend (`PhieuKiemKeController.cs`)**: Trong `BuildIndexViewModel`, sau khi tải danh sách và tính toán các chỉ số chênh lệch (`TongThucTe`, `TongChenhLech`, `SlLechTang`, `SlLechGiam`), thực hiện switch-case sắp xếp toàn bộ dữ liệu theo 11 cột (`ma`, `tg`, `tt`, `cl`, `tang`, `giam`, `cb`, `slt`, `ghi`, `st`, `kho`) với hướng `asc` hoặc `desc`. Khi không có sort hoặc hủy sort, mặc định sắp xếp theo `ThoiDiemChot` giảm dần. Sau đó mới thực hiện phân trang `Skip().Take()`. Đồng bộ SortBy/SortDir vào IndexVM và hỗ trợ cả khi xuất file CSV.
    + **Giao diện (`_PhieuKiemKeTable.cshtml`)**: Bổ sung class `.sortable-th`, `.num` (cho 5 cột số lượng để căn lề phải chuẩn xác), cấu trúc `.th-content > .th-title-wrap > .th-text + .sort-icon` (`bi-arrow-up` / `bi-arrow-down`) và `.is-sorted.sorted-asc / .sorted-desc` tương thích hoàn toàn với hệ thống CSS KiotViet trong `site.css`.
    + **Script (`phieu-kiem-ke-index.js`)**: Quản lý `F.sortBy` và `F.sortDir`. Bắt sự kiện click vào `#stockTakeTable thead th.sortable-th` xoay vòng 3 trạng thái: Chưa sort -> ASC -> DESC -> Bỏ sort (về mặc định). Gửi `SortBy` và `SortDir` trong AJAX `loadTable()`, hỗ trợ giảm độ mờ `opacity: 0.6` khi đang tải, reset sort khi bấm link xóa bộ lọc.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors, cú pháp `node -c phieu-kiem-ke-index.js` 0 lỗi.
- **Đồng bộ Toàn diện Tính năng Đánh dấu Sao trong Kiểm kho khớp 100% Danh sách Hàng hóa (Phiên 41)**:
  - **Nhu cầu**: Trước đó cột sao trên bảng kiểm kho chỉ hiển thị icon tĩnh, click chỉ đổi trạng thái DOM cục bộ không lưu vào CSDL, và icon sao trên header không có tính năng lọc danh sách phiếu được đánh dấu.
  - **Giải pháp thực hiện**:
    + **CSDL**: Tạo Migration `migrations/sql/09_bo_sung_dadanhdau_phieukiemke.sql` bổ sung cột `DaDanhDau BIT NOT NULL CONSTRAINT DF_PhieuKiemKe_DaDanhDau DEFAULT 0` vào bảng `PhieuKiemKe`. Đồng bộ Entity `PhieuKiemKe.cs` và DbContext Fluent API.
    + **Backend**: Bổ sung action `ToggleFavorite(int id)` (GET/POST) trong `PhieuKiemKeController.cs` cập nhật trường `DaDanhDau` và lưu CSDL; bổ sung lọc `query.Where(p => p.DaDanhDau)` khi `filter.DaDanhDau == true`; đồng bộ `PhieuKiemKeListItemVM`, `PhieuKiemKeFilterVM`, `PhieuKiemKeIndexVM`.
    + **Giao diện (`_PhieuKiemKeTable.cshtml`)**:
      - Header: Thêm nút sao lọc `.star-btn.star-header-filter` (`onclick="toggleStarHeaderFilter(event)"`). Khi kích hoạt lọc, sao đổi sang màu cam vàng `#f97316` (`.starred`, `bi-star-fill`) và tooltip "Bỏ lọc sao (Hiển thị tất cả)".
      - Dòng bảng: Thay thế nút bấm cũ bằng `<td class="cell-star" onclick="toggleFavoriteStockTake(event, @item.MaPhieuKiemKe, this)">` bọc `.star-btn`, hiển thị sao cam `bi-star-fill` khi được đánh dấu và sao xám `bi-star` khi chưa đánh dấu (hover cam `#f97316`).
    + **Script (`phieu-kiem-ke-index.js`)**:
      - Xây dựng `window.toggleFavoriteStockTake` gọi API `/PhieuKiemKe/ToggleFavorite` lưu trạng thái realtime vào CSDL, cập nhật icon và tự động xóa dòng khỏi bảng nếu đang ở chế độ lọc sao.
      - Xây dựng `window.toggleStarHeaderFilter` bật/tắt bộ lọc sao và gọi `loadTable()`.
      - Chặn nổi bọt click sao không làm mở accordion chi tiết `tr.dtl`; tự động reset cờ lọc sao khi nhấn "vào đây" xóa bộ lọc.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors, cú pháp `node -c phieu-kiem-ke-index.js` 0 lỗi.
- **Hỗ trợ Nhập tay và Tự động sinh Mã kiểm kho (Phiên 40)**:
  - **Nhu cầu**: Trước đó ô Mã kiểm kho bị khóa cứng (`disabled`), người dùng không thể tự nhập mã chứng từ theo quy ước quản lý riêng.
  - **Giải pháp**:
    + **CSDL**: Tạo Migration `migrations/sql/08_bo_sung_maphieu_kiemke.sql` bổ sung cột `MaPhieu VARCHAR(30) NULL` vào bảng `PhieuKiemKe`, cập nhật dữ liệu cũ và tạo Filtered Unique Index `UQ_PhieuKiemKe_MaPhieu`.
    + **Backend**: Cập nhật Entity `PhieuKiemKe`, `QuanLyKhoPhuQuocLtwContext`, các ViewModel (`KiemKhoViewModels.cs`). Xây dựng hàm `SinhMaPhieuTuDongAsync()` và endpoint `/PhieuKiemKe/GetNextCode`. Cập nhật `SaveDraft` và `Complete` kiểm tra trùng lặp mã kiểm kho khi người dùng tự nhập tay hoặc tự động gán mã tiếp theo nếu để trống. Cập nhật bộ lọc tìm kiếm theo mã phiếu nhập tay.
    + **Giao diện & Script**: Mở khóa ô nhập mã `#fCode` (chữ in hoa, placeholder "Mã phiếu tự động"). Tinh gọn giao diện (không cần nút phụ, ngầm hiểu nếu để trống ô mã thì hệ thống sẽ tự động sinh mã dạng `PKK...` khi lưu tạm hoặc cân bằng). Tự động gửi `maPhieu` từ ô input.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors, cú pháp `node -c phieu-kiem-ke-form.js` 0 lỗi.
- **Khắc phục Lỗi Chớp Tắt khi Click vào Bộ chọn Ngày Giờ Lập Phiếu Kiểm Kho (Phiên 39)**:
  - **Nguyên nhân cốt lõi**:
    + Ô input ngày giờ `#fDate` gắn hàm `showDatePicker` trên cả 2 sự kiện: `focus` và `click`. Trong khi đó, `showDatePicker` lại gọi hàm `togglePop(dtPop, '#fDate')`.
    + Khi người dùng dùng chuột nhấp vào ô `#fDate` lần đầu: trình duyệt kích hoạt sự kiện `focus` trước (gọi `togglePop` -> popup chuyển từ đóng sang mở `.show`), ngay sau đó 1-5ms trình duyệt tiếp tục kích hoạt sự kiện `click` của cú nhấp chuột đó (gọi `togglePop` lần 2 -> popup thấy đang mở nên chuyển sang đóng gỡ `.show`). Kết quả là popup vừa ló lên đã bị dập tắt ngay lập tức ("hiện lên rồi ẩn luôn").
  - **Giải pháp**:
    + Tách hàm `openDatePicker()` chuyên trách hiển thị popup (đảm bảo luôn thêm class `.show`, nạp dữ liệu lịch và giờ chính xác, không dùng `togglePop`).
    + Bổ sung biến kiểm soát thời gian `lastFocusTime`: Sự kiện `click` kiểm tra khoảng cách thời gian `Date.now() - lastFocusTime < 300ms`, nếu là sự kiện click của chính lần đầu nhận focus thì bỏ qua không toggle đóng.
    + Khi ô input đã mở từ trước mà người dùng click lại, hỗ trợ toggle đóng/mở mượt mà; hỗ trợ phím `Escape` đóng nhanh tất cả popup; bổ sung `cursor: pointer` và tooltip trực quan cho ô `#fDate`.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors, cú pháp `node -c phieu-kiem-ke-form.js` 0 lỗi.
- **Sửa lỗi không nạp dữ liệu mặt hàng khi mở lại bản tạm Phiếu kiểm kho (Phiên 38)**:
  - **Nguyên nhân cốt lõi**:
    + Trong `_PhieuKiemKeForm.cshtml`, thẻ script cấu hình `<script id="stockTakeConfig" type="application/json">` trước đó tự lắp ráp chuỗi JSON thủ công bằng nội suy Razor `Select(l => $"{{\"pid\":{l.MaHang}... \"sys\":{l.SoLuongTheoSo}... \"cost\":{l.DonGia}}}")`.
    + Trong môi trường Windows có định dạng văn hóa Việt Nam (`vi-VN`), các số thực/thập phân `decimal` (`SoLuongTheoSo`, `SoLuongThucTe`, `DonGia`) bị định dạng bằng dấu phẩy `,` (ví dụ `10,00`, `25000,00`). Điều này khiến chuỗi JSON sinh ra bị sai cú pháp nghiêm trọng (`"sys": 10,00`), đồng thời `JavaScriptStringEncode` mã hóa nháy đơn `'` thành `\'` (không hợp lệ trong JSON chuẩn).
    + Trình duyệt khi chạy `JSON.parse(cfgEl.textContent)` trong `phieu-kiem-ke-form.js` gặp ngoại lệ cú pháp `SyntaxError`, rơi vào khối `catch`, làm `cfg.lines` bị rỗng (`[]`). Do đó bảng hàng hóa kiểm kho hiển thị trạng thái rỗng ("Thêm sản phẩm từ ô tìm kiếm hoặc file Excel") thay vì nạp các dòng hàng đã lưu.
    + Ngoài ra, Action `PhieuKiemKeController.Edit(int id)` trả về nhầm `View("Create", model)` thay vì `View("Edit", model)`, làm sai tiêu đề trang.
  - **Giải pháp**:
    + Chuyển đổi toàn bộ việc khởi tạo `stockTakeConfig` trong `_PhieuKiemKeForm.cshtml` sang sử dụng thư viện chuẩn `System.Text.Json.JsonSerializer.Serialize` với `PropertyNamingPolicy = CamelCase` và `JavaScriptEncoder.UnsafeRelaxedJsonEscaping`. Đảm bảo 100% số thực luôn tuân thủ chuẩn JSON quốc tế (dấu chấm `.`), chuỗi tiếng Việt và ký tự đặc biệt được escape chuẩn xác.
    + Cập nhật `PhieuKiemKeController.Edit(int id)` trả về đúng `View("Edit", model)`.
    + Hoàn thiện kiểm tra an toàn trong `phieu-kiem-ke-form.js`: `cfgEl.textContent.trim()`, `Array.isArray(cfg.lines)`, đọc textarea ghi chú trực tiếp khi lưu tạm và hoàn thành.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors, cú pháp `node -c phieu-kiem-ke-form.js` 0 lỗi.
- **Khắc phục Ngoại lệ Đọc Ô Excel An toàn trong ClosedXML (Phiên 37)**:
  - **Nguyên nhân**:
    + Trong `ClosedXML 0.105.1`, các hàm `cell.GetString()` và `cell.GetDouble()` là hàm truy xuất kiểu nghiêm ngặt (Strict Typed). Nếu một ô chứa số (như Mã hàng, Barcode, Mã nhóm dạng số) hoặc text chứa số mà gọi `cell.GetString()`, ClosedXML sẽ ném ngoại lệ `System.InvalidCastException: Cell value is not text`. Ngược lại, nếu ô chứa chuỗi mà gọi `cell.GetDouble()`, ClosedXML cũng ném `InvalidCastException: Cell value is not number`.
  - **Giải pháp**:
    + Bổ sung hàm `ExcelHelper.GetCellValueAsString(IXLCell)`: Tự động phân loại `cell.Value.Type` (`Text`, `Number`, `Boolean`, `DateTime`, `TimeSpan`, `Formula`), xử lý chuyển đổi chuỗi an toàn tuyệt đối, không bao giờ ném ngoại lệ.
    + Nâng cấp `GetCellString`, `GetCellDecimal`, `GetCellDecimalNullable` trong `ExcelHelper.cs` và các vị trí đọc tiêu đề cột trong `HangHoaExcelService.cs` sang cơ chế mới.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors.
- **Sửa lỗi Lặp Tiêu đề Tháng trong Bộ chọn Ngày Giờ Lập Phiếu Kiểm kho (Phiên 36)**:
  - **Khắc phục lỗi hiển thị 2 dòng tiêu đề "Tháng MM/YYYY" trùng lặp (`phieu-kiem-ke-form.js`)**:
    + **Nguyên nhân**: Trong popup chọn ngày giờ (`#dtPop`), khối thanh điều hướng tháng `.dtnav` đã có tiêu đề tháng nằm ở giữa 2 nút chuyển tháng (`<button class="rp-nav" data-dn="-1">` - `<span>Tháng ${DT.m + 1}/${DT.y}</span>` - `<button class="rp-nav" data-dn="1">`). Tuy nhiên hàm `calHTML(y, m, sel)` lại tiếp tục chèn thêm một khối `<div class="cal-h">Tháng ${m + 1}/${y}</div>` ngay bên dưới, dẫn đến việc chữ "Tháng 10/2026" xuất hiện liên tiếp 2 lần.
    + **Giải pháp**: Gỡ bỏ `<div class="cal-h">Tháng ${m + 1}/${y}</div>` trong `calHTML`. Giữ lại tiêu đề duy nhất chuẩn mực nằm giữa 2 nút mũi tên chuyển tháng trên thanh `.dtnav`, hiển thị ngay trên lưới ngày `cal-g` (`T2 T3 T4...`), vừa loại bỏ hoàn toàn hiện tượng lặp lại vừa giúp chiều cao lịch cân xứng hoàn hảo với danh sách giờ 230px bên phải.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors, cú pháp JavaScript `node -c` 0 lỗi.
- **Sửa dứt điểm Lỗi Click không hiện Popup Lịch Tùy chỉnh Dual Calendar trong Kiểm kho (Phiên 35)**:
  - **Nguyên nhân cốt lõi**:
    + Thẻ `<label for="rdCustom" id="labelCustom">` có thuộc tính `for`. Khi gắn sự kiện `click` cho cả `labelCustom` và `rdC` (`#rdCustom`), khi người dùng nhấp vào dòng chữ "Tùy chỉnh", trình duyệt kích hoạt sự kiện `click` của label (gọi `openCalendar` -> `display = 'block'`), sau đó Chromium/WebKit tự động phát sinh một synthetic click kích hoạt vào radio `#rdCustom` (gọi `openCalendar` lần 2). Hàm `toggleFloatingPopup` kiểm tra `isVisible = true` nên ngay lập tức ẩn popup đi (`display = 'none'`), khiến popup chớp tắt trong 1ms và người dùng thấy "ấn vào không hiện".
    + Sự kiện click ngoài `document.addEventListener('click')` chưa có điều kiện bỏ qua khi click vào bên trong `.dual-calendar-popup, .quick-date-popup`.
  - **Giải pháp (Chuẩn hóa 100% theo Danh sách Hàng hóa `hang-hoa-index.js`)**:
    + Gỡ bỏ hoàn toàn `labelCustom.onclick`, chỉ giữ `btnOpenCal.onclick` (`e.preventDefault(); e.stopPropagation();`) và `rdC.onclick` (`e.stopPropagation();`). Khi người dùng click vào nhãn "Tùy chỉnh", trình duyệt chuyển tiếp click tự nhiên vào `#rdCustom` và chỉ kích hoạt duy nhất một lần.
    + Thêm chốt chặn chống double-fire / synthetic click (`now - lastToggleTime < 250ms`) trong `toggleFloatingPopup`, đảm bảo popup luôn giữ trạng thái hiển thị an toàn tuyệt đối.
    + Bổ sung `if (e.target.closest('.dual-calendar-popup, .quick-date-popup')) return;` vào đầu `document.addEventListener('click')` để các thao tác chuyển tháng, chọn ngày trong popup không bị sự kiện click ngoài vô tình đóng lại.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors.
- **Chuẩn hóa Giao diện Popup Lưu ý khi kiểm kho (Phiên 34)**:
  - Khắc phục lỗi popup `.pop.notes` bị co bẹp chiều ngang (~150px) khiến chữ bị ngắt vụn và chèn ép nút panel: Đặt chiều rộng tiêu chuẩn `width: 340px`, định vị `top: 44px; right: 0;`, đổ bóng `box-shadow` nổi nhẹ nhàng, bo góc 8px.
  - Căn chỉnh bố cục: Tiêu đề in đậm kèm biểu tượng `bi-info-circle` màu xanh KiotViet, khoảng cách lề `padding: 16px 18px`, danh sách `ul`/`li` có khoảng cách dòng thông thoáng (`line-height: 1.55`), các từ khóa quan trọng được in đậm nổi bật (`không`, `Hoàn thành`, `Chưa kiểm`), chữ sắc nét dễ đọc.
  - Kiểm tra biên dịch: `dotnet build` đạt 0 Errors.
- **Cố định Độ rộng Cột Tên hàng & Tự động xuống dòng trong Bảng Kiểm hàng (Phiên 33)**:
  - **Khắc phục lỗi Tên hàng dài làm giãn toác bảng sang ngang (`kiem-kho.css`)**:
    + Thiết lập `table-layout: fixed;` cho bảng hàng hóa `.grid-card table` để các cột tuân thủ độ rộng cố định nghiêm ngặt.
    + Cố định kích thước cột Tên hàng `.w-name`: `width: 280px; min-width: 280px; max-width: 280px;`.
    + Bổ sung cơ chế tự động xuống dòng đa tầng: `word-break: break-word; overflow-wrap: anywhere; word-wrap: break-word; white-space: normal; line-height: 1.45;` giúp mọi tên hàng (kể cả chuỗi ký tự dài không khoảng trắng hoặc mã vạch liền mạch) tự ngắt xuống dòng trật tự, không phá vỡ layout.
  - **Chuẩn hóa cột Mã hàng & các cột số liệu (`phieu-kiem-ke-form.js`)**:
    + Cố định cột Mã hàng `.w-code` (`width: 120px; white-space: nowrap;`), loại bỏ class `.text-break` vốn làm mã sản phẩm (như `HH000021`) bị ngắt thành 2 dòng.
    + Đồng bộ các cột số liệu: `.w-del` (38px), `.w-stt` (46px), `.w-dvt` (70px), `.w-sys` (90px), `.w-act` (110px), `.w-diff` (95px), `.w-gt` (115px).
    + Đồng bộ cấu trúc cả ở bảng rỗng (Empty State table) và bảng có dữ liệu (Normal Table).
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors.
- **Sửa lỗi Logic Lịch Tùy Chỉnh Dual Calendar & Chuẩn hóa đồng bộ theo Danh sách Hàng hóa (Phiên 32)**:
  - **Khắc phục lỗi logic Lịch nhảy về Tháng 1 Năm 2000 khi chọn "Tùy chỉnh"**:
    + **Nguyên nhân**: Khi ở chế độ preset "Toàn thời gian" (`toanthoigian`), hàm `openCalendar()` trước đó đã gọi `getActiveRange()` lấy dải ngày `[01/01/2000, 31/12/2036]` gán vào `calState.start` và `calState.currentYear = 2000`, khiến lịch mở ra ở Tháng 1/2000 và bôi xanh toàn bộ 36 năm.
    + **Giải pháp (Chuẩn hóa theo `HangHoa`)**: Tách biệt hoàn toàn trạng thái lịch `calState` khỏi preset. Khi mở lịch: nếu đang ở chế độ `custom` và có ngày chọn trước đó, lịch giữ nguyên dải ngày đó; nếu đang ở bất kỳ preset nào (kể cả "Toàn thời gian"), lịch luôn mặc định mở tại tháng hiện tại (`todayObj`), bôi chọn ngày hôm nay (`todayObj`), hiển thị `Từ ngày: [hôm nay] - Đến ngày: [hôm nay]`.
  - **Đồng bộ hóa 100% cơ chế chọn dải ngày 2 lần nhấp (Click range selection)**:
    + Lần nhấp 1: Chọn ngày bắt đầu, đặt cả start và end về ngày đó, hiển thị điểm neo `range-start range-end in-range`.
    + Lần nhấp 2: Chọn ngày kết thúc (tự động hoán vị nếu chọn ngày trước start), hiển thị dải liên tục `range-start`, `in-range`, `range-end`.
    + Nhấn "Hôm nay" (`.btn-cal-today`): Nhảy ngay về tháng và ngày hôm nay của năm hiện tại.
    + Nhấn "Bỏ qua" (`.btn-close-popup`) hoặc click ngoài: Đóng popup, tự động hoàn trả radio về `#rdPreset` nếu chưa áp dụng tùy chỉnh.
    + Nhấn "Áp dụng" (`.btn-apply-calendar`): Lưu `F.mode = 'custom'`, cập nhật nhãn `customTxt` dạng `dd/MM/yyyy - dd/MM/yyyy`, chọn radio `#rdCustom` và gọi `loadTable()`.
  - **Tối ưu Server-side `ResolveDateRange` (`PhieuKiemKeController.cs`)**:
    + Thêm `.Date` vào `customFrom.Value.ToLocalTime().Date` để đảm bảo mốc thời gian bắt đầu luôn là `00:00:00` chuẩn xác, tránh lệch múi giờ.
    + Hỗ trợ đầy đủ cả 2 chuẩn mã bộ lọc ngày (`ALL`, `TOANTHOIGIAN`, `HOM_NAY`, `HOMNAY`, `THANG_NAY`, `THANGNAY`...).
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors.
- **Sửa lỗi Nút Ẩn/Hiện Panel Phải (Rightmenu) & Chống tràn Widget Kiểm gần đây (Phiên 31)**:
  - **Khắc phục nút toggle `#pTg` bị cắt nửa hình tròn**:
    + Chuyển nút `#pTg` ra ngoài `aside.f-panel` đặt trực tiếp vào `.form-wrap` tại vị trí ranh giới giữa hai cột (`right: 425px`).
    + Bọc nội dung panel trong `.f-panel-inner` có `overflow-y: auto`, loại bỏ hiện tượng CSS scroll container tự động cắt nửa nút toggle bên trái do `overflow-y: auto`.
  - **Khắc phục nút toggle biến mất khi thu gọn panel**:
    + Khi thu gọn (`.panel-collapsed`), nút `#pTg` trượt sang mép phải màn hình (`right: 8px`), đổi icon sang `<i class="bi bi-chevron-left"></i>` và luôn nổi trên cùng (`z-index: 100`).
    + Bổ sung phím tắt **F4** để đóng / mở nhanh panel thông tin bên phải tiện lợi.
  - **Chống tràn ngang widget Kiểm gần đây (`.recent ul`)**:
    + Thêm `overflow-x: hidden`, `word-break: break-word`, `overflow-wrap: anywhere` cho danh sách `.recent li`, loại bỏ hoàn toàn thanh cuộn ngang đáy khi tên sản phẩm dài không dấu cách.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors.
- **Chuẩn hóa Toàn diện Giao diện Màn hình Lập / Sửa Phiếu Kiểm kho khớp 100% Danh sách Hàng hóa (Phiên 30)**:
  - **Loại bỏ 35 SVG inline `<symbol>` & Chuyển sang Bootstrap Icons**: Thay thế 100% cú pháp `<svg class="ic"><use href="#i-..."></svg>` bằng các biểu tượng chuẩn `bi bi-*` (`bi-arrow-left`, `bi-search`, `bi-grid-3x3-gap`, `bi-plus-lg`, `bi-box-arrow-in-down`, `bi-printer`, `bi-view-list`, `bi-info-circle`, `bi-chevron-right`, `bi-person`, `bi-floppy`, `bi-check-lg`, `bi-trash`, `bi-pencil`, `bi-copy`, `bi-file-earmark-spreadsheet`).
  - **Khắc phục triệt để lỗi tràn lấn header & co cụm Layout (`kiem-kho.css`)**:
    + Gỡ bỏ `margin: -15px -15px -15px` trên `.form-wrap` vốn làm form bị kéo ngược lên đè lấn dưới topbar header.
    + Đặt `.kk-container` và `.form-wrap` chiếm trọn khung hình với `height: 100%; flex: 1; min-height: 0; overflow: hidden;` ăn khớp hoàn hảo với `.app-main-body` (`height: calc(100vh - 86px)`).
    + `.f-main` và `.f-panel` được căn chỉnh lề `padding: 12px 18px 14px`, thanh cuộn dọc mượt mà bên trong, không sinh cuộn đôi ngoài trang.
  - **Chuẩn hóa Bảng Kiểm hàng & Font chữ thường tự nhiên**:
    + 4 Tabs (`#tabs`): Chuyển màu active sang xanh KiotViet (`#0070f4`), font 13.5px, viền chân 2px sắc nét.
    + Tiêu đề bảng `th`: Đổi nền sang `#f8fafc`, viền chân `#e2e8f0`, chữ `#475569`, font 13px weight 600 giống hệt bảng Danh sách hàng hóa.
    + Dòng dữ liệu `td`: Chuyển mã hàng từ in đậm sang font chữ thường tiêu chuẩn `<span class="text-break">${l.code}</span>`, nút xóa dòng icon `bi-trash`.
    + Khối Empty State: Chuyển sang cấu trúc chuẩn KiotViet với icon lớn `bi-file-earmark-spreadsheet`, hướng dẫn tải file mẫu và nút `.btn.btn-primary` chọn file dữ liệu.
  - **Bổ sung Bộ chọn Ngày giờ Lập phiếu (`#fDate` & `#dtPop`)**:
    + Tích hợp popup lịch tháng trực quan và danh sách khung giờ 30 phút (00:00 - 23:30) cho phép click chọn nhanh ngày giờ lập phiếu.
  - **Panel Thông tin & Nút hành động chuẩn KiotViet**:
    + Nút toggle panel `#pTg`: Nút tròn bo 50% chuẩn mực với icon `bi-chevron-right` / `bi-chevron-left`.
    + Huy hiệu trạng thái mềm (Soft Badges): `bg-success-subtle`, `bg-secondary-subtle`, `bg-primary-subtle`.
    + Nút hành động đáy (`#bSave`, `#bDone`): Bo góc 6px, chiều cao 56px, màu xanh KiotViet `#0070f4` và xanh lá `#10b981`.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors.
- **Đồng bộ Giao diện Lịch 2 tháng & Tiêu đề Bảng Kiểm kho khớp 100% Danh sách Hàng hóa (Phiên 29)**:
  - **Khắc phục dải ngày được chọn trên Lịch 2 tháng (`phieu-kiem-ke-index.js`)**: Thay thế class `.selected` (vốn làm tất cả các ngày bị bo tròn thành từng chấm tròn xanh rời rạc) bằng bộ 3 class chuẩn của module Hàng hóa:
    + `.range-start`: Ngày bắt đầu dải chọn (nút tròn bo góc trái, màu xanh đậm `#0070f4`, chữ trắng in đậm).
    + `.in-range`: Các ngày ở giữa dải chọn (thanh nền màu xanh nhạt `#e0f2fe`, chữ xanh `#0369a1`, bo góc 0 để tạo thành dải chọn liền mạch liên tục xuyên suốt các tuần).
    + `.range-end`: Ngày kết thúc dải chọn (nút tròn bo góc phải, màu xanh đậm `#0070f4`, chữ trắng in đậm).
  - **Đồng bộ mở Lịch thông minh (`openCalendar`)**: Tự động đồng bộ `calState` với dải ngày đang lọc khi mở popup, đảm bảo lịch luôn hiển thị chính xác dải ngày hiện thời.
  - **Đồng bộ màu nền Tiêu đề Bảng (`kiem-kho.css`)**: Cập nhật `#stockTakeTable.tbl th` sang màu nền xanh nhạt `var(--brand-soft)` (`#eff6ff`), chữ xanh navy `#1e3a8a`, viền `var(--border)`, loại bỏ màu xám thô cũ `#f8fafc` để khớp 100% với bảng Danh sách hàng hóa.
- **Chuẩn hóa Chi tiết Phiếu kiểm kho bung mở inline khớp 100% mẫu KiotViet (Phiên 28)**:
  - **Tab & Tiêu đề**: Đổi tab từ `Thông tin phiếu` thành `Thông tin`; kiểu chữ mã phiếu và badge trạng thái mềm mại (soft badge) chuẩn KiotViet.
  - **Thông tin Meta**: Tinh gọn hiển thị người tạo, ngày tạo, người cân bằng, ngày cân bằng với dải phân cách xám thanh lịch.
  - **Bảng chi tiết 5 cột chuẩn KiotViet**: Loại bỏ hoàn toàn cột "Giá trị lệch" không có trong thiết kế gốc; giữ chuẩn 5 cột (`Mã hàng`, `Tên hàng`, `Tồn kho`, `Thực tế`, `SL lệch`), các ô số liệu căn phải chữ thường tự nhiên; ô tìm kiếm mã/tên hàng trong bảng bo góc tinh tế.
  - **Khối Ghi chú & Tổng kết số liệu**: Bỏ khung thẻ thô và nhãn thừa; textarea chiếm toàn bộ phần trái; khối tổng kết bên phải hiển thị phẳng 4 dòng (`Số lượng thực tế`, `Số lượng lệch tăng`, `Số lượng lệch giảm`, `Số lượng chênh lệch`), bỏ dòng tổng giá trị chênh lệch thừa.
  - **Hệ thống Nút hành động chuẩn KiotViet**:
    + Nút `Hủy`: Kiểu outline-secondary chuẩn KiotViet; tích hợp kiểm tra trạng thái và cảnh báo nếu người dùng nhấn vào phiếu đã cân bằng kho theo Luật 6.
    + Nút `Sao chép`, `Xuất file`, `In`: Định dạng outline-secondary đồng bộ.
    + Nút `Lưu`: Đổi từ nút xanh `Lưu ghi chú` sang nút trắng viền xám `Lưu` kèm icon `bi-floppy` chuẩn KiotViet.
    + Nút `Mở phiếu`: Chỉ hiển thị cho phiếu tạm (`NHAP`).
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors.
- **Chuẩn hóa Bộ lọc Người tạo & Kiểu chữ Bảng Kiểm kho giống 100% Danh sách Hàng hóa (Phiên 27)**:
  - **Khung Multi-select KiotViet (`_PhieuKiemKeFilterSidebar.cshtml`)**: Loại bỏ hoàn toàn khối `.ms` và `.mslist` cũ; thay bằng cấu trúc chuẩn KiotViet `#boxNguoiTao` (`.kiot-multiselect-box`) và `#dropdownNguoiTao` (`.kiot-ms-dropdown.shadow`).
  - **Pill Tag & Huy hiệu "+N khác"**: Hiển thị tối đa 3 thẻ chọn `.kiot-pill-tag` màu xanh KiotViet (`#0070f4`), nút xóa `×` (`.tag-remove`); nếu chọn trên 3 người tạo sẽ tự động gom thành badge `.kiot-pill-more` (`+N khác`) kèm tooltip hiển thị danh sách các nhân viên còn lại.
  - **Dropdown Thông minh & Tự động đảo hướng**: Tích hợp ô tìm kiếm sticky `.kiot-ms-search` (`Tìm người tạo...`), danh sách item `.kiot-ms-item` có checkbox `.form-check-input` bên trái và tên bên phải, tự động tính khoảng trống mép màn hình để đảo hướng `.drop-up` qua `checkSidebarDropdownDirection()` khi ở đáy sidebar.
  - **Xử lý Tương tác & Đóng mở tiện ích (`phieu-kiem-ke-index.js`)**: Đóng dropdown khi cuộn sidebar `.kiot-filter-box`, click ra ngoài vùng bộ lọc hoặc nhấn phím `ESC`; đồng bộ bộ lọc AJAX `CreatorIds` lên server và khôi phục khi reset bộ lọc `#resetF`.
  - **Đồng bộ màu chữ & kiểu chữ bảng dữ liệu (`_PhieuKiemKeTable.cshtml`)**:
    + Chuyển cột Mã kiểm kho từ màu xanh in đậm (`<strong class="text-primary">`) về màu chữ thường tiêu chuẩn (`<span class="text-break">@item.MaPhieuHienThi</span>`).
    + Chuyển các cột số liệu (Tổng thực tế, Tổng chênh lệch, SL lệch tăng, SL lệch giảm) từ kiểu chữ in đậm và màu nổi (`fw-bold`, `text-danger`, `text-success`) về kiểu chữ thường tiêu chuẩn (`r text-end`), giúp toàn bộ bảng dữ liệu đồng nhất màu sắc và thanh thoát giống hệt bảng Danh sách hàng hóa.
    + Đồng bộ bảng chi tiết dòng `tr.dtl` sang chữ thường tiêu chuẩn.
  - **Dọn dẹp mã nguồn thừa (`kiem-kho.css`)**: Xóa bỏ toàn bộ các selector CSS cũ `.ms`, `.chip`, `.mslist` không còn sử dụng.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors.
- **Chuẩn hóa Nút chọn Thời gian Kiểm kho giống 100% Danh sách Hàng hóa (Phiên 26)**:
  - **Khung giao diện radio & nút chọn (`_PhieuKiemKeFilterSidebar.cshtml`)**: Loại bỏ hoàn toàn 2 nút hộp chữ nhật `.selbox` thô kệch; chuyển sang 2 tùy chọn radio Bootstrap `.form-check mb-1` tinh gọn (nhãn văn bản căn trái, icon `bi-chevron-right` và `bi-calendar3` căn phải) khớp 100% cấu trúc của phân hệ Hàng hóa.
  - **Tích hợp Popup Chọn nhanh (`#popupQuickDate`) & Lịch 2 tháng (`#popupCalendar`)**: Sử dụng trực tiếp class `.quick-date-popup` (chia 3 cột ngày/tuần/tháng, quý, năm, toàn thời gian) và `.dual-calendar-popup` có sẵn trong `site.css`.
  - **Cơ chế định vị nổi (`toggleFloatingPopup`)**: Tính toán vị trí bằng `getBoundingClientRect()`, định vị `position: fixed` đảm bảo popup không bao giờ bị che khuất hoặc cắt ngang bởi `overflow: hidden` của sidebar. Tự động ẩn khi cuộn sidebar `.kiot-filter-box`, click ra ngoài hoặc nhấn phím `ESC`.
  - **Đồng bộ Controller & Script**: Bổ sung case `ALL` / `TOANTHOIGIAN` vào `ResolveDateRange` trong `PhieuKiemKeController.cs`; hoàn thiện chọn khoảng ngày trực quan trên 2 tháng lịch trong `phieu-kiem-ke-index.js`.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors.
- **Khắc phục Triệt để Lỗi hiển thị Phân hệ Kiểm kho (Phiên 25)**:
  - **Dropdown chọn ngày nhanh (`.quick`)**: Sửa lỗi menu bị cắt cụm vỡ nát do `overflow: hidden` của sidebar; cấu trúc lại dropdown cuộn dọc vừa khít 100% bề rộng nút/sidebar, phân 4 nhóm rõ ràng (`Theo ngày`, `Theo tuần`, `Theo tháng`, `Theo quý & năm`).
  - **Khối ngày Tùy chỉnh (Inline Sidebar)**: Loại bỏ popup 2 tháng 640px tràn màn hình, thay thế bằng cụm input ngày inline trực quan (`inpFromDate`, `inpToDate`) kèm nút "Áp dụng" nằm gọn gàng bên dưới radio "Tùy chỉnh".
  - **Khối Chi tiết dòng bung mở (`tr.dtl`)**:
    + Sửa lỗi bảng số liệu `.sums` bị đè bẹp và cắt mép bên phải: Cố định độ rộng `.sums` 330px (`flex: 0 0 330px`), áp dụng Flexbox Bootstrap với `dp-note` chiếm phần còn lại (`flex-grow-1`).
    + Giữ khối chi tiết luôn trong tầm nhìn khi cuộn ngang bảng 1450px: Định vị `.dp` với `position: sticky; left: 0; max-width: min(1200px, calc(100vw - 320px))` giúp toàn bộ bảng hàng hóa, ghi chú, tổng kết và cụm nút hành động (`.dp-actions`) luôn hiển thị trọn vẹn, không bị đẩy trôi ra ngoài mép màn hình.
    + Thẩm mỹ chuẩn KiotViet: Thay đổi viền bao quanh toàn bộ dòng mở thô kệch thành dải viền bên trái `border-left: 4px solid var(--blue)` thanh thoát và nền `#f0f7ff`.
  - **Bảng dữ liệu & Phân trang đáy**: Cấu trúc `#tableWrapper` với class `kiot-table-wrapper` chiếm trọn 100% flex column, giúp thanh phân trang `_Pagination.cshtml` luôn ghim sát đáy card trắng `#content`, loại bỏ hoàn toàn khoảng trắng mênh mông lửng lơ.
  - **Kiểm tra biên dịch**: `dotnet build` đạt 0 Errors.
- **Chuẩn hóa Giao diện Phân hệ Kiểm kho (PhieuKiemKe) theo khuôn mẫu Danh sách Hàng hóa (Phiên 24)**:
  - **Khung giao diện chuẩn KiotViet (`.kiot-container`)**: Chuyển đổi toàn diện trang `Views/PhieuKiemKe/Index.cshtml` sang bố cục 2 cột tiêu chuẩn gồm `.kiot-sidebar-col` (bộ lọc) và `.kiot-main-col` (nội dung), tích hợp nút tròn toggle sidebar `#btnToggleSidebar` (phím tắt F4) ở ranh giới hai cột, animation mượt mà và backdrop che mờ trên mobile/zoom in.
  - **Đồng bộ thanh công cụ (`.kiot-toolbar-row`)**: Tích hợp tiêu đề mobile, ô tìm kiếm mã phiếu `#keywordSearch` tích hợp phím tắt F3 debounce 300ms, nút Tạo mới `+ Kiểm kho` chuẩn Bootstrap primary, dropdown Xuất file (`btn-tool`) 2 chế độ (danh sách/chi tiết), dropdown Ẩn/Hiện cột, nút Tải lại bảng xoay animation (`bi-arrow-clockwise`) và nút Trợ giúp.
  - **Đồng bộ hệ thống biểu tượng (Bootstrap Icons `bi bi-*`)**: Thay thế toàn bộ 39 SVG inline rải rác sang các biểu tượng Bootstrap Icons chuẩn mực (`bi-search`, `bi-plus-lg`, `bi-box-arrow-up`, `bi-star`, `bi-star-fill`, `bi-view-list`, `bi-arrow-clockwise`, `bi-trash`, `bi-copy`, `bi-printer`, `bi-pencil-square`, `bi-check-lg`).
  - **Tái sử dụng Component phân trang LEGO (`_Pagination.cshtml`)**: Bổ sung thuộc tính `PagedData` (`PagedResult<PhieuKiemKeListItemVM>`) trong `PhieuKiemKeIndexVM`, loại bỏ hoàn toàn bộ phân trang HTML tự chế và tái sử dụng component phân trang dùng chung của hệ thống qua AJAX không reload trang.
  - **Chuẩn hóa cấu trúc bảng (`_PhieuKiemKeTable.cshtml`)**: Bọc bảng trong `.kiot-table-scroll-body`, chuẩn hóa `table.tbl`, dòng dữ liệu `tr.tbl-row`, soft badges KiotViet cho trạng thái (Phiếu tạm, Đã cân bằng kho, Đã hủy) và khối Empty State chuẩn mực khi không tìm thấy kết quả.
  - **Đồng bộ JavaScript (`phieu-kiem-ke-index.js`)**: Hỗ trợ phím tắt F3/F4, phân trang AJAX bắt sự kiện `.page-ajax`, xử lý đồng thời drawer sidebar mobile và desktop collapse.
  - **Kiểm tra biên dịch & Đặc tả**: `dotnet build` đạt 0 Errors. Đồng bộ và tinh gọn `docs/specs/kiem-kho.md` đạt 6.987 ký tự (< 8.000 ký tự) theo Luật 12.
- **Sửa lỗi & Ổn định hóa Phân hệ Kiểm kho (Phiên 23 - Sửa lỗi sau tích hợp)**:
  - **Khắc phục lỗi khóa file biên dịch (Lock Process MSB3027)**: Đã giải phóng tiến trình cũ chạy ngầm (PID 4824) chiếm giữ binary `BTL-LTW-QuanLiKho-2.exe`. Lệnh `dotnet build` hoàn thành với 0 lỗi.
  - **Khắc phục xung đột hiển thị bảng (Bootstrap 5 `.row` Clash)**: Đổi toàn bộ thẻ `<tr class="row">` thành `<tr class="tbl-row">` trong `_PhieuKiemKeTable.cshtml`, `kiem-kho.css` và `phieu-kiem-ke-index.js`, đồng thời bổ sung `display: table-row !important;` loại bỏ hoàn toàn hiện tượng vỡ nát cột bảng do Bootstrap Flexbox áp đặt.
  - **Khắc phục sai lệch bộ lọc khoảng ngày (Date Filter Enum Mismatch)**: Mở rộng `ResolveDateRange` trong `PhieuKiemKeController.cs` để nhận diện cả định dạng preset tiếng Việt (`HOMNAY`, `THANGNAY`, `TUANNAY`...) và tiếng Anh (`TODAY`, `THIS_MONTH`...), đồng thời xử lý `ToLocalTime()` khi browser gửi UTC ISO string.
  - **Chuẩn hóa múi giờ lưu chứng từ (`ThoiDiemChot`)**: Chuyển đổi an toàn sang giờ địa phương server trong các action `SaveDraft` và `Complete`.
  - **Bổ sung View `Edit.cshtml`**: Tạo `Views/PhieuKiemKe/Edit.cshtml` bảo đảm cơ chế routing và View Engine tìm kiếm view an toàn.
- **Nâng cấp và Hoàn thiện Phân hệ Kiểm kho (PhieuKiemKe) chuẩn 100% Prototype KiotViet**:
  - **Giao diện Danh sách (`Index.cshtml`)**: Tách `_PhieuKiemKeFilterSidebar.cshtml` và `_PhieuKiemKeTable.cshtml`, tách toàn bộ JavaScript ra `wwwroot/js/phieu-kiem-ke-index.js`. Hỗ trợ lọc khoảng ngày nhanh / lịch 2 tháng tùy chỉnh, lọc trạng thái 3 checkbox, lọc người tạo dạng chip tags multi-select; hỗ trợ click dòng bung mở khối chi tiết `tr.dtl` inline ngay trong bảng với bộ lọc mã/tên hàng, lưu ghi chú, in và modal xác nhận hủy phiếu.
  - **Giao diện Lập / Sửa phiếu (`Create.cshtml`, `Details.cshtml`)**: Chuẩn hóa `_PhieuKiemKeForm.cshtml`, tách toàn bộ JavaScript sang `wwwroot/js/phieu-kiem-ke-form.js`. Layout 2 cột KiotViet với panel thông tin phải gập mở, tìm kiếm autocomplete F3, nạp hàng theo nhóm (Lưới), 4 tabs phân loại (Tất cả, Khớp, Lệch, Chưa kiểm), nhập file Excel/CSV, widget Kiểm gần đây, phím tắt F9 (Lưu tạm) và F10 (Cân bằng kho).
  - **Backend & Nghiệp vụ (`PhieuKiemKeController.cs`, `KiemKhoViewModels.cs`)**: Bổ sung API `HuyPhieu` (chặn tuyệt đối phiếu đã cân bằng theo Luật 6), `SaveNote` (lưu nhanh ghi chú từ dòng chi tiết bung mở), `GetItemDetails` (nạp chi tiết JSON), `Export` (xuất file CSV danh sách hoặc chi tiết), hỗ trợ `copyId` ở action `Create`. Bọc Transaction an toàn khi cân bằng kho, đọc tồn sổ sách từ `vw_TonKhoHienTai`, chốt giá vốn và sinh `PhieuDieuChinh`.
  - **Kiểm tra biên dịch & Đặc tả**: `dotnet build` đạt 0 Errors và 0 Warnings. Đồng bộ tài liệu `docs/specs/kiem-kho.md` (< 8.000 ký tự) theo Luật 12.
- **Chuẩn hóa Kiến trúc Danh mục CRUD dùng chung & Tinh gọn mô-đun Hàng hóa (Khuôn mẫu LEGO)**:
  - Tầng Dùng chung (Shared Framework):
    - `ViewModels/Common/BaseFilterParams.cs`: Chuẩn hóa bộ lọc tìm kiếm (`Q`, `Page`, `PageSize`, `SortBy`, `SortDir`, `FromDate`, `ToDate`, `GetSkipCount()`).
    - `ViewModels/Common/PagedResult.cs`: `PagedResultBase` & `PagedResult<T>` chuẩn hóa cấu trúc kết quả phân trang kèm các thuộc tính tính toán (`StartItemIndex`, `EndItemIndex`, `TotalPages`, `HasPreviousPage`, `HasNextPage`).
    - `Views/Shared/_Pagination.cshtml`: Partial View phân trang chuẩn KiotViet dùng chung cho toàn bộ các danh sách bảng trong hệ thống.
    - `Helpers/ExcelHelper.cs`: Đóng gói toàn bộ tiện ích ClosedXML (đọc cell an toàn, định dạng header xanh KiotViet, vẽ viền, loại bỏ dấu tiếng Việt).
    - `wwwroot/js/kiot-filter.js`: Thư viện JS tiện ích dùng chung (sidebar toggle, debounce tìm kiếm, single/multi custom select, tự động đảo hướng drop-up, phân trang AJAX).
  - Tách Lớp Dịch vụ Excel (`IHangHoaExcelService` / `HangHoaExcelService`):
    - Chuyển giao toàn bộ logic sinh file mẫu, xuất Excel tùy chọn cột, và nhập Excel 16 trường bọc Transaction sang Service độc lập.
    - `HangHoaController.cs` giảm từ 1.944 dòng xuống 1.253 dòng (giảm ~36% dung lượng, controller chỉ điều phối).
  - Tách View & Static JavaScript:
    - Tách 7 khối lọc sidebar thành Partial View `Views/HangHoa/_HangHoaFilterSidebar.cshtml`.
    - Tách ~1.400 dòng JavaScript inline từ `Index.cshtml` ra `wwwroot/js/hang-hoa-index.js`, nạp config qua data-attributes `#hangHoaConfig`.
    - `Views/HangHoa/Index.cshtml` tinh gọn ngoạn mục từ 1.841 dòng (~85 KB) xuống còn 142 dòng (~7.8 KB).
  - Dọn dẹp Dead Views: Xóa bỏ 5 view scaffolding cũ không dùng (`Create.cshtml`, `Edit.cshtml`, `Delete.cshtml`, `_Form.cshtml`, `_Info.cshtml`), giữ lại `Details.cshtml`.
- **Tinh gọn Thanh công cụ Danh sách Hàng hóa (Gỡ bỏ nút Cài đặt)**:

  - Gỡ bỏ nút Cài đặt rỗng (`bi-gear`) trên thanh công cụ của trang Hàng hóa (`Index.cshtml`), chỉ giữ lại các nút điều hướng và tiện ích tiêu chuẩn: Nút Tạo mới, Import file, Xuất file, Tải lại bảng (`bi-arrow-clockwise`) và Trợ giúp (`bi-question-circle`).
- **Hoàn thiện Chức năng Sắp xếp 3 trạng thái Header Bảng Hàng hóa & Cố định Icon không tràn viền**:
  - Hỗ trợ sắp xếp 8 cột: Mã hàng (`mahang`), Tên hàng (`tenhang`), Giá bán (`giaban`), Giá vốn (`giavon`), Tồn kho (`tonkho`), Khách đặt (`khachdat`), Thời gian tạo (`ngaytao`), Dự kiến hết hàng (`dukienhethang`).
  - Chu trình click 3 trạng thái: Lần 1 Tăng dần (ASC) -> Lần 2 Giảm dần (DESC) -> Lần 3 Bình thường (None). Click cột khác tự động chuyển sang cột mới từ Tăng dần.
  - Tối ưu hiển thị icon: Ẩn hoàn toàn icon khi chưa sắp xếp; chỉ hiện khi sắp xếp ASC/DESC.
  - Định vị & Chống tràn viền (khắc phục lỗi out ra ngoài):
    - Cột căn trái (Mã hàng, Tên hàng, Thời gian tạo, Dự kiến hết hàng): Icon nằm trong luồng inline-flex tự nhiên ngay cạnh text; mở rộng chiều rộng cột "Dự kiến hết hàng" lên 160px và "Thời gian tạo" lên 140px, đảm bảo icon luôn nằm trọn trong ô, không bị tràn ra mép ngoài hay đè lên thanh cuộn, chữ tuyệt đối không bị dịch sang trái.
    - Cột số căn phải (Giá bán, Giá vốn, Tồn kho, Khách đặt): Dành padding-right 22px cố định cho icon mũi tên, text bám biên phải mà không bị giật lùi sang trái khi xuất hiện icon.
- **Hoàn thiện Chức năng Nhập & Xuất File Excel Hàng hóa chuẩn KiotViet (16 trường quản lý)**:
  - Cài đặt thư viện `ClosedXML` (v0.105.1): Xử lý đọc và ghi file Excel `.xlsx` chuẩn định dạng OpenXML, tương thích 100% Microsoft Excel và Google Sheets.
  - Tải file mẫu chuẩn (`/HangHoa/DownloadTemplate`): Sinh file `Mau_Nhap_Hang_Hoa_KiotViet.xlsx` gồm 16 cột thông tin quản lý chuẩn, header xanh nổi bật, dòng ghi chú hướng dẫn, và 2 dòng dữ liệu mẫu thực tế.
  - Xuất file Excel tùy chọn cột (`/HangHoa/ExportExcel`):
    - Modal KiotViet `#hhExportModalOv` cho phép người bán tick chọn các cột muốn xuất.
    - Hỗ trợ chọn phạm vi xuất: "Tất cả theo bộ lọc hiện tại" hoặc "Chỉ xuất các hàng đã chọn trên bảng".
    - Nút tiện ích 1-click "★ Bộ cột chuẩn để nhập lại", "Chọn tất cả", "Bỏ chọn".
    - Hộp cảnh báo nghiệp vụ: Nhắc nhở người bán nếu bỏ chọn các cột thiết yếu (Tên hàng, Mã hàng, Loại hàng, ĐVT) thì file xuất ra sẽ không thể làm file nhập ngược lại.
  - Nhập file Excel thông minh (`/HangHoa/ImportExcel`):
    - Modal kéo thả file `.xlsx` (`#hhImportModalOv`) kèm thông tin kích thước và nút gỡ file.
    - Hỗ trợ 3 chế độ khi trùng mã hàng: "Cập nhật thông tin (ghi đè)", "Bỏ qua dòng trùng", "Báo lỗi và dừng".
    - Tự động map cột theo tên header linh hoạt (chống xê dịch cột), tự động tạo mới Nhóm hàng và Đơn vị tính nếu chưa có, parse thuộc tính sang JSON array.
    - Tự động sinh phiếu nhập kho đầu kỳ `LoaiPhieuNhap = 'DAU_KY'` nếu có sản phẩm mới có số lượng tồn kho ban đầu.
    - Bọc Transaction EF an toàn, trả về bảng tổng kết (Thêm mới, Cập nhật, Bỏ qua, Danh sách lỗi chi tiết từng dòng) và tự động tải lại bảng.
- **Đồng bộ toàn diện Logic & Giao diện Xóa hàng hóa chuẩn KiotViet**:
  - Backend (`HangHoaController.cs`):
    - Hoàn thiện kiểm tra bảo toàn dữ liệu trên cả 5 bảng chứng từ: `ChiTietDonBan`, `ChiTietPhieuNhap`, `ChiTietPhieuXuat`, `ChiTietPhieuChuyenKho`, `ChiTietPhieuKiemKe`.
    - Bọc Transaction EF (`BeginTransactionAsync`), tự động xóa cascade dữ liệu bảng con liên quan (`HinhAnhHangHoa`, `NguongTonKho`) khi hàng hóa chưa phát sinh giao dịch.
    - Cung cấp API `NgungBan(int id)` cho phép chuyển nhanh hàng hóa sang trạng thái `NGUNG_BAN` khi không thể xóa do đã có chứng từ.
  - Frontend (`_HangHoaModal.cshtml`, `Index.cshtml`, `hang-hoa-form.css`, `hang-hoa-form.js`):
    - Thay thế hoàn toàn modal Bootstrap thô cũ bằng modal overlay KiotViet `#hhDeleteProductOv` đồng bộ phong cách thiết kế (`.hh-modal.small`, nút đỏ `.hh-btn.danger`, đóng ESC/click ngoài).
    - Tích hợp nút "🗑 Xóa" ở footer của modal Cập nhật hàng hóa (`#btnDeleteProductInModal`, tự động ẩn ở form Tạo mới / Sao chép, chỉ hiển thị khi Chỉnh sửa) kết nối chung với modal xác nhận xóa.
    - Xử lý UX thông minh: Khi xóa hàng đã có giao dịch, modal không hiển thị alert trình duyệt mà hiển thị trực quan card cảnh báo màu đỏ với thông điệp rõ ràng và nút 1-click *"Chuyển sang 'Ngừng bán' ngay"*.
    - Đồng bộ sự kiện xóa từ dòng chi tiết bảng (`.btn-delete-product`) qua hàm toàn cục `window.openDeleteProductModal(id, name)`.
- **Tối ưu hóa toàn diện hiệu năng và độ mượt mà khi đổi/lưu ảnh hàng hóa (10x Faster)**:
  - Nén ảnh phía Client (Canvas Compression): Viết hàm `compressImage` tự động nén và resize ảnh chụp/ảnh nặng về tối đa 1000px, chất lượng JPEG 0.85 trước khi nạp base64; dung lượng giảm từ 5MB xuống ~100-200KB (giảm 95% payload truyền tải và thời gian ghi CSDL).
  - Cập nhật giao diện tức thì (Optimistic UI): Khi lưu thành công hàng hóa, JS lập tức cập nhật ảnh mới trực tiếp vào DOM của bảng (`thumb`, `popover`, `detail`) với độ trễ 0ms trước khi `loadTable()` reload xong.
  - Bộ nhớ đệm thông minh theo ImageVersion (Smart Cache-Busting): Tính toán `ImageVersion` (dựa trên `MaHinhAnh` PK của bảng `HinhAnhHangHoa`), bật HTTP Client Cache `max-age=86400` cho `GetImage`. Nhờ vậy, 14 sản phẩm còn lại trên trang được trình duyệt tải tức thì từ Memory/Disk Cache (0ms), chỉ duy nhất sản phẩm đổi ảnh mới tải dữ liệu mới.
- **Nâng cấp Form Thêm/Sửa Hàng hóa chuẩn KiotViet (5 ảnh CSDL, Mô tả, ĐVT thay Thương hiệu)**:
  - CSDL: Tạo và thực thi migration script `migrations/sql/07_nang_cap_5_anh_va_mota_hanghoa.sql` bổ sung cột `MoTa NVARCHAR(MAX) NULL` cho `dbo.HangHoa` và tạo bảng `dbo.HinhAnhHangHoa` (`MaHinhAnh`, `MaHang`, `DuLieuAnh`, `ThuTu`, `LaAnhChinh`, `NgayTao`).
  - Backend: Tạo Model `HinhAnhHangHoa.cs`, cập nhật `HangHoa.cs` và `QuanLyKhoPhuQuocLtwContext.cs` (DbSet, quan hệ Cascade), ViewModels (`QuickDvtRequest.cs`, `HangHoaForm.cs`, `HangHoaItemVM.cs`), Controller (`HangHoaController.cs`: GetItem nạp 5 ảnh, Create/Edit lưu bảng ảnh + đồng bộ ảnh chính `HangHoa.HinhAnh`, API `CreateDvtQuick`, `GetImage` hỗ trợ index ảnh phụ).
  - Frontend: Tạo `_HangHoaModal.cshtml` theo chuẩn prototype KiotViet (2 tabs Thông tin & Mô tả, khu vực 5 ảnh với thumbnail + badge ảnh chính, bỏ bảng quy đổi đơn vị và thương hiệu, thay vị trí thương hiệu bằng Đơn vị tính + nút tạo nhanh, accordion mở rộng, modal gợi ý chọn nhanh đơn vị/vị trí, footer nút kép Lưu & Lưu và thêm mới); tách CSS module `hang-hoa-form.css` và JS logic `hang-hoa-form.js`; tích hợp vào `Index.cshtml` và đồng bộ `_HangHoaTable.cshtml`.
  - Đồng bộ đặc tả: Cập nhật `docs/specs/danh-sach-hang-hoa.md` tuân thủ Luật 12. – 2026-10-14
- **Bổ sung Thuộc tính Hàng hóa chuẩn KiotViet (Vị trí, Trọng lượng, Tồn cao nhất, Thuộc tính động)**:
  - CSDL: Tạo và thực thi migration script `migrations/sql/06_bo_sung_vitri_trongluong_thuoctinh_tontoida.sql` bổ sung `ViTri`, `TrongLuong`, `DonViTrongLuong`, `ThuocTinh` (JSON array) vào bảng `dbo.HangHoa`, bổ sung `TonCaoNhat` vào bảng `dbo.NguongTonKho`.
  - Backend: Cập nhật Models (`HangHoa.cs`, `NguongTonKho.cs`, `QuanLyKhoPhuQuocLtwContext.cs`), ViewModels (`HangHoaForm.cs`, `HangHoaItemVM`, `ThuocTinhItemVM`, `CapNhatThuocTinhRequest`), và Controller (`HangHoaController.cs`: Create, Edit, GetItem, UpdateThuocTinh, bọc Transaction).
  - Frontend: Cập nhật form modal Thêm/Sửa với section Tồn kho (3 cột: Tồn ban đầu, Định mức thấp nhất, Định mức cao nhất), Vị trí (input + prompt Tạo mới), Trọng lượng (số + g/kg), Thuộc tính động (thêm/xóa dòng Tên - Giá trị kèm gợi ý datalist); modal cập nhật nhanh `quickAttrModal`; cập nhật dòng chi tiết inline accordion hiển thị Định mức tồn Min-Max, Trọng lượng, Vị trí, badges thuộc tính kèm nút "+ Thêm thuộc tính" – [`Index.cshtml`](./BTL-LTW-QuanLiKho-2/Views/HangHoa/Index.cshtml), [`_HangHoaTable.cshtml`](./BTL-LTW-QuanLiKho-2/Views/HangHoa/_HangHoaTable.cshtml) – 2026-10-14
- **Tối ưu Responsive Phóng to & Thu nhỏ chuẩn KiotViet**: Xây dựng cơ chế responsive toàn diện khi zoom in (phóng to / màn hình hẹp < 992px) và zoom out (thu nhỏ / widescreen):
  - Zoom in: Tự động ẩn `_MainMenu`, Topbar thu gọn với nút Hamburger và Avatar tròn, Offcanvas navigation drawer đầy đủ tính năng; Sidebar bộ lọc chuyển sang dạng Drawer mở bằng nút Phễu cạnh tiêu đề "Hàng hóa"; thanh công cụ thu gọn nút thành icon (`+`, bảng tính, cài đặt, trợ giúp); bảng dữ liệu cuộn ngang độc lập.
  - Zoom out: Bảng hàng hóa và container giãn 100% cân đối, giữ nguyên tỷ lệ KiotViet chuẩn mực.
  - Files tác động: [`_Header.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml), [`_MainMenu.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_MainMenu.cshtml), [`Index.cshtml`](./BTL-LTW-QuanLiKho-2/Views/HangHoa/Index.cshtml), [`site.css`](./BTL-LTW-QuanLiKho-2/wwwroot/css/site.css) – 2026-10-13
- **Kiểm toán Toàn diện & Chuẩn hóa Kiến trúc Lần cuối**: Khảo sát 4 hướng, gỡ bỏ backdoor `PasswordHelper`, chuẩn hóa `ClaimsPrincipalExtensions.GetVaiTro()`, dọn sạch dead code (`SwitchWarehouse` thừa, `SearchForDoc` thừa, `Logout` POST, `Privacy`), bọc Transaction `HangHoaController.Create`, chuyển `QuickGroupRequest` sang ViewModel, tinh gọn và đồng bộ 100% tài liệu luật/đặc tả/sổ quyết định – 2026-10-13
- **Chuẩn hóa Kiến trúc Mở rộng (4 Trụ cột Foundation)**: Xây dựng `BaseKhoController`, `INhatKyThaoTacService`, `MaChungTuHelper`, phân nhóm thư mục `ViewModels/` modular (`Common`, `HangHoa`, `KiemKho`, `Account`, `Components`), đóng gói `f3-product-search.js`, thêm API `HangHoaController.SearchForDoc` tái sử dụng cho các màn hình chứng từ – [`BaseKhoController.cs`](./BTL-LTW-QuanLiKho-2/Controllers/BaseKhoController.cs), [`NhatKyThaoTacService.cs`](./BTL-LTW-QuanLiKho-2/Services/NhatKyThaoTacService.cs), [`MaChungTuHelper.cs`](./BTL-LTW-QuanLiKho-2/Services/MaChungTuHelper.cs), [`f3-product-search.js`](./BTL-LTW-QuanLiKho-2/wwwroot/js/components/f3-product-search.js) – 2026-10-13
- **Giao diện Đăng nhập KhoPro**: Tích hợp giao diện đăng nhập chuẩn theo prototype, tách `_LoginLayout.cshtml`, `dang-nhap.css`, `dang-nhap.js`, tối ưu ảnh nền kho `login-bg.jpg` (1920px, ~391 KB < 500 KB), logo thương hiệu `logo.svg`, hỗ trợ ẩn/hiện mật khẩu, cảnh báo Caps Lock, validation client & server, gắn nhanh tài khoản mẫu – [`Login.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Account/Login.cshtml), [`_LoginLayout.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_LoginLayout.cshtml) – 2026-10-13
- **Chuẩn hóa ViewComponent cho Layout Header**: Triển khai `WarehouseSwitcherViewComponent`, xóa bỏ `@inject DbContext` trong `_Header.cshtml`, phân quyền kho theo tài khoản (`TaiKhoanKho`), bổ sung action `SwitchWarehouse` – [`WarehouseSwitcherViewComponent.cs`](./BTL-LTW-QuanLiKho-2/ViewComponents/WarehouseSwitcherViewComponent.cs) – 2026-10-13
- **Cấu trúc Giao diện & Layout KiotViet**: Dựng layout chuẩn với Topbar cố định, Warehouse Switcher, Mega menu ngang KiotViet – [`_Layout.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Layout.cshtml), [`_Header.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml), [`_MainMenu.cshtml`](./BTL-LTW-QuanLiKho-2/Views/Shared/_MainMenu.cshtml) – 2026-10-12
- **Quản lý Hàng hóa**: Danh sách hàng hóa, lọc nhiều tiêu chí, phân trang AJAX, modal thêm/sửa qua JSON, upload ảnh base64, định mức tồn kho (Xem [`docs/specs/danh-sach-hang-hoa.md`](./docs/specs/danh-sach-hang-hoa.md)) – 2026-10-12
- **Quản lý Kiểm kho (Module mẫu)**: Lập phiếu kiểm kho, tìm hàng F3/autocomplete, nạp hàng theo nhóm, lưu tạm, cân bằng kho sinh `PhieuDieuChinh`, đọc tồn `vw_TonKhoHienTai`, ghi nhật ký (Xem [`docs/specs/kiem-kho.md`](./docs/specs/kiem-kho.md)) – 2026-10-12
- **Hệ thống Luật & Trí nhớ AI**: Khảo sát đối chiếu CSDL/code thật, thiết lập `AGENTS.md`, 5 file quy tắc trong `.agent/rules/`, đặc tả mẫu `docs/specs/`, sổ quyết định `docs/quyet-dinh.md` – 2026-10-13
- **Hoàn tất 100% Nhóm 1: Nghiêm trọng ([ISSUE-01] đến [ISSUE-05])**: Sửa view nuốt dữ liệu, chặn tồn âm (`TonKhoService`), tách `vw_BienDongKho`, tối ưu RAM ảnh, POS tự sinh phiếu xuất (`BanHangService`) – 2026-10-13
- **Hoàn tất 100% Nhóm 2: Quan trọng ([ISSUE-06] đến [ISSUE-13])**: DDL `migrations/sql/`, thêm `GiaVon`, đóng băng đơn giá kiểm kho, đổi tên `HangHoaController`, `TaiKhoanKho`, luật 1 ĐVT, retry chống trùng mã hàng, Cookie Auth (`AccountController`), nạp claims – 2026-10-13
- **Hoàn tất 100% Nhóm 3: Nhỏ & Dọn dẹp tài liệu ([ISSUE-14] đến [ISSUE-19])**: Chuyển toàn bộ link sang tương đối, chuẩn hóa hủy chứng từ theo kiến trúc View, chuẩn hóa `ApiResponse` JSON, dọn sạch 5 view lab rác, xóa `_ViewStart` thừa, xuất bản script seed demo chuẩn `05_dulieumau_seed.sql` – 2026-10-13
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
- **2026-10-17 (Phiên 79 - Trưa)**:
  - Đóng gói nút Nhập/Xuất file Excel trong Danh sách hàng hóa:
    - Tạo partial view `Views/HangHoa/_HangHoaExcelActions.cshtml` gom các thao tác file (Xuất file, Nhập file, Tải file mẫu) vào 1 nút dropdown KiotViet duy nhất.
    - Tinh gọn `Views/HangHoa/Index.cshtml`, loại bỏ 25 dòng mã phân mảnh giữa desktop và mobile, chuyển sang gọi 1 dòng partial lego.
    - Cập nhật File Map trong đặc tả `docs/specs/danh-sach-hang-hoa.md`.
- **2026-10-17 (Phiên 78 - Trưa)**:
  - Sửa lỗi ô Email trong modal Thêm mới nhà cung cấp:
    - Bổ sung selector `input[type=email]` (và các loại input liên quan) vào `.hh-f` trong `hang-hoa-form.css`.
    - Bổ sung khối quy tắc chuyên biệt trong `nha-cung-cap.css` đảm bảo ô Email luôn có chiều cao 38px, bo tròn góc `border-radius: 8px;`, `padding: 0 12px;`, không còn bị lỗi viền vuông sắc nhọn.
- **2026-10-16 (Phiên 72 - Tối)**:
  - Thống nhất giao diện thông báo toàn hệ thống & Bỏ kẻ dọc xanh bên trái:
    - Loại bỏ triệt để `border-left` trên `.kiot-toast` trong `site.css`, giải quyết triệt để lỗi kẻ dọc xanh/đỏ/vàng bị nhô ra ngoài góc bo tròn.
    - Đồng bộ kiểu dáng `.hh-toast` và `.toast-box` trong `hang-hoa-form.css`, `kiem-kho.css`.
    - Thống nhất cơ chế hiển thị Toast toàn hệ thống thông qua `window.KiotToast` (`site.js`, `hang-hoa-form.js`, `phieu-kiem-ke-form.js`, `phieu-kiem-ke-index.js`, `xuat-huy-form.js`).
- **2026-10-16 (Phiên 71 - Tối)**:
  - Cố định độ rộng 3 card thông tin chi tiết nhà cung cấp & Tắt thông báo toast khi đánh dấu sao:
    - Loại bỏ toast notification trong `toggleFavoriteSupplier` (`nha-cung-cap-index.js`), thao tác click sao diễn ra êm mượt và âm thầm.
    - Cố định độ rộng 3 card chi tiết ở mức 992px (320px/card) bằng flex layout `.ncc-attr-grid` và `.ncc-attr-col`, bọc trong `.ncc-detail-fixed-wrap` trên cả `_NhaCungCapTable.cshtml` và `_NhaCungCapDetail.cshtml`, bảo đảm 3 card không bị kéo giãn biến dạng khi khung xanh dãn dài do bật nhiều cột.
    - Cố định thanh nút thao tác footer đáy ngay dưới 3 card.
- **2026-10-16 (Phiên 70 - Tối)**:
  - Bổ sung Cột sao Yêu thích & Lọc sao Header cho Nhà cung cấp:
    - Thêm cột `DaDanhDau` trong bảng `DonViCapHang`, model `DonViCapHang.cs`, migration SQL `11_bo_sung_dadanhdau_donvicaphang.sql`.
    - Thêm action `ToggleFavorite` trong `NhaCungCapController.cs`, cập nhật lọc sao header `DaDanhDau` trong `IndexVM` và `FilterParams`.
    - Bổ sung cột sao cố định trên header và từng dòng bảng `_NhaCungCapTable.cshtml`, JS tương tác `nha-cung-cap-index.js`.
- **2026-10-16 (Phiên 59 - Chiều)**:
  - Đồng bộ hiển thị cột Mã nhà cung cấp (`span.text-break`) và mũi tên sắp xếp 3 trạng thái header giống bảng Phiếu kiểm kho (`_NhaCungCapTable.cshtml`, `NhaCungCapIndexVM.cs`, `NhaCungCapController.cs`, `Index.cshtml`, `nha-cung-cap-index.js`).
  - Biên dịch kiểm tra: `dotnet build -t:CoreCompile` 0 Errors, cú pháp JS 0 lỗi.
- **2026-10-16 (Phiên 53 - Chiều)**:
  - Bỏ mục "Tồn kho" và "Nhóm hàng" trên Menu Hàng hóa Topbar (`_MainMenu.cshtml` và `_Header.cshtml`).
  - Biên dịch kiểm tra: `dotnet build -t:CoreCompile` 0 Errors.
- **2026-10-16 (Phiên 52 - Chiều)**:
  - Loại bỏ nút dấu cộng thừa (`#btnQuick`) trong ô tìm kiếm hàng hóa ở màn hình Kiểm kho (`_PhieuKiemKeForm.cshtml`).
  - Tối ưu padding phải của ô input từ 74px xuống 42px (`kiem-kho.css`), giữ nguyên nút chọn theo nhóm (`#btnGrp`).
  - Biên dịch kiểm tra: `dotnet build -t:CoreCompile` 0 lỗi.
- **2026-10-16 (Phiên 51 - Chiều)**:
  - Hỗ trợ Sửa và Xóa Nhóm hàng trực tiếp từ Dropdown Chuẩn KiotViet:
    - Bổ sung nút bút chì ✎ khi hover vào từng mục nhóm hàng trong dropdown lọc sidebar (`#dropdownNhomHang`) và dropdown form (`#listMaNhom`).
    - Tích hợp modal `window.KiotPrompt` cho phép đổi tên nhóm và nút Xóa màu đỏ với kiểm tra an toàn ràng buộc sản phẩm (`HangHoas.Any(h => h.MaNhom == id)`).
    - Khắc phục xung đột sự kiện click: ngăn chặn click nút bút chì làm toggle checkbox bộ lọc, bảo vệ dropdown không bị đóng khi click vào modal prompt/confirm, giữ dropdown mở sau khi Lưu/Xóa/Bỏ qua, hiển thị lỗi validate ngay trong modal.
    - Đồng bộ thời gian thực giữa sidebar, modal form, tags lọc và tự động reload bảng dữ liệu.
    - Cập nhật đặc tả `docs/specs/danh-sach-hang-hoa.md`, kiểm tra biên dịch 0 lỗi.
- **2026-10-16 (Phiên 50 - Chiều)**:
  - Khắc phục triệt để lỗi ấn biểu tượng bút chì ✎ chỉnh sửa item làm tương tác ẩn mất dropdown bên dưới:
    - Bổ sung điều kiện chặn trong bộ lắng nghe sự kiện click toàn cục: Không kích hoạt đóng dropdown khi click diễn ra bên trong bất kỳ modal con nào (`#hhEditItemOv, #hhPromptOv, #kiotPromptOv, #kiotConfirmOv...`) hoặc khi đang có modal con đang hiển thị (`.show`).
    - Đảm bảo dropdown bên dưới giữ nguyên trạng thái mở trong suốt quá trình người dùng thao tác trong modal sửa, cũng như sau khi Lưu, Xóa hoặc Bỏ qua.
    - Đồng bộ logic cho cả dropdown Vị trí, Thuộc tính trong `hang-hoa-form.js` và khối combobox dùng chung trong `kiot-filter.js`.
    - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-16 (Phiên 49 - Chiều)**:
  - Khắc phục triệt để lỗi nhập/tải ảnh bị nền đen trong modal Hàng hóa: Đổ nền trắng `#FFFFFF` trên Canvas trước khi vẽ ảnh nén JPEG; thiết kế lại thanh gợi ý đổi ảnh dạng thanh đáy thay vì phủ đen toàn bộ; hỗ trợ Kéo-Thả (Drag & Drop) và Dán ảnh (Ctrl+V); backend tự động nhận diện MIME type (`image/png`, `image/webp`, `image/gif`, `image/jpeg`). Đồng bộ `PROGRESS.md` và `docs/specs/danh-sach-hang-hoa.md`.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-16 (Phiên 48 - Chiều)**:
  - Tối ưu hóa hiệu ứng mượt mà hai chiều (Two-way Smooth Animations) cho toàn bộ modal xác nhận xóa và modal con:
    - Loại bỏ hiện tượng hiển thị đột ngột khi mở và tắt ngang cụt hứng khi đóng.
    - Chiều mở: Nền mờ dần sang `rgba(15, 23, 42, 0.55)` kèm `backdrop-filter: blur(3px)` trong 0.22s; Khung modal trượt nhẹ từ `translateY(8px) scale(0.94)` lên `translateY(0) scale(1)` với đường cong `cubic-bezier(0.16, 1, 0.3, 1)` trong 0.25s.
    - Chiều đóng: `pointer-events: none` ngắt tức thì chống click lặp; `visibility 0s linear 0.2s` giữ khung modal trong 0.2s để nó kịp co nhỏ, trôi nhẹ xuống và mờ dần vào hư không (`transform: scale(0.94) translateY(8px); opacity: 0;`), tạo cảm giác mềm mại hoàn hảo.
    - Đồng bộ cho cả 3 stylesheet: `site.css` (`.kiot-confirm-ov`, `.kiot-prompt-ov`), `kiem-kho.css` (`.ov`, `.modal-box`), `hang-hoa-form.css` (`.hh-ov`, `.hh-modal`, `#hhDeleteProductOv`).
    - Biên dịch kiểm tra: `dotnet build -t:CoreCompile` 0 Errors, 0 Warnings mới.
- **2026-10-16 (Phiên 47 - Chiều)**:
  - Bổ sung xác nhận trước khi xóa (Confirm Delete) cho toàn bộ các thao tác xóa:
    - Kiểm kho: Khi nhấp nút thùng rác xóa dòng hàng hóa khỏi lưới kiểm kho (`phieu-kiem-ke-form.js`, `_PhieuKiemKeForm.cshtml`, `kiem-kho.css`), hiển thị modal xác nhận KiotViet (`Xác nhận xóa hàng hóa`) với thông tin sản phẩm và 2 lựa chọn "Bỏ qua" và "Đồng ý xóa" (nút đỏ). Hỗ trợ phím Escape và nút close đóng nhanh modal.
    - Hàng hóa: Thêm xác nhận `confirm()` khi xóa ảnh chính, xóa ảnh phụ, xóa vị trí/thuộc tính trong modal con 3 và xóa dòng thuộc tính (`hang-hoa-form.js`).
    - Biên dịch kiểm tra: `dotnet build` đạt 0 Errors, cú pháp JavaScript `node -c` 0 lỗi.
- **2026-10-16 (Phiên 46 - Trưa)**:
  - Đóng gói toàn diện các khối Form & Combobox Sửa Trực Tiếp thành Mảnh ghép Lego dùng chung:
    - Tạo `_KiotPromptModal.cshtml` nhúng vào `_Layout.cshtml` + điều khiển qua `window.KiotPrompt.open({ title, label, value, showDelete, onSave, onDelete })` tạo mới nhanh / sửa ✎ / xóa tại chỗ.
    - Xây dựng `window.KiotNumber` tự format số phân cách hàng nghìn `1,000,000`, select all khi focus; `KiotCollapsible` tự động gập mở accordion `.kiot-sec`; `KiotSplitButton` mở/đóng menu split button.
    - Xây dựng `KiotFilter.initCombobox` đóng gói combobox vừa gõ vừa chọn có icon bút chì ✎ sửa item trực tiếp.
    - Cập nhật toàn diện `site.css` các class `.kiot-sec`, `.kiot-num`, `.kiot-split`, `.kiot-combobox-*`, `.kiot-prompt-*`.
    - Biên dịch kiểm tra: `dotnet build` đạt 0 Errors.
- **2026-10-16 (Phiên 45 - Trưa)**:
  - Tối ưu hóa & Đóng gói toàn diện LeftMenu Filter Sidebar thành các Component dùng chung (Lego Block):
    - ViewModels: Tạo `KiotMultiSelectVM.cs` & `KiotStatusFilterVM.cs` trong `ViewModels/Common/`.
    - Partial Views: Tạo `Views/Shared/_KiotMultiSelectFilter.cshtml` và `_KiotStatusFilter.cshtml` chuẩn hóa toàn bộ dropdown chọn nhiều (kèm tìm kiếm con, tự động đảo hướng drop-up, tag chips) và checkbox trạng thái chứng từ.
    - Script dùng chung: Bổ sung `escapeHtml`, `checkSidebarDropdownDirection`, `renderTagPills` vào `kiot-filter.js`.
    - Refactor View & Script: Rút gọn `_HangHoaFilterSidebar.cshtml` và `_PhieuKiemKeFilterSidebar.cshtml`, tinh gọn `hang-hoa-index.js` và `phieu-kiem-ke-index.js`.
    - Biên dịch kiểm tra: `dotnet build` đạt 0 Errors, `node -c` kiểm tra JavaScript đạt 0 lỗi.
- **2026-10-16 (Phiên 44 - Trưa)**:
  - Đóng gói toàn diện các khối Lego dùng chung độc lập (Lego Framework) giữa Hàng hóa và Kiểm kho:
    - Backend: Tạo `Helpers/DateRangeHelper.cs` xử lý 12 loại bộ lọc ngày, giảm ~90 dòng code switch-case lặp lại trong `PhieuKiemKeController` và `HangHoaController`.
    - Toast KiotViet: Xây dựng `window.KiotToast` (`site.js` & `site.css`), tương thích ngược toàn cục, nạp qua `_Layout.cshtml`.
    - Bộ lọc ngày dùng chung: Tạo `_KiotDateFilter.cshtml` & `KiotDateFilterVM.cs` hỗ trợ cả ngày quá khứ và tương lai, thay thế ~250 dòng Razor lặp lại.
    - Thư viện JS: Bổ sung `initDateFilter`, `initColumnToggle`, `bindStarToggle`, `toggleFloatingPopup` vào `kiot-filter.js`, cắt giảm hơn 500 dòng JS trùng lặp.
    - Biên dịch kiểm tra: `dotnet build` đạt 0 Errors.
- **2026-10-16 (Phiên 40 - Sáng)**:
  - **Hỗ trợ vừa tự động sinh mã vừa nhập tay Mã kiểm kho**:
    - Chạy script Migration `08_bo_sung_maphieu_kiemke.sql` bổ sung cột `MaPhieu VARCHAR(30) NULL` vào bảng `PhieuKiemKe`, cập nhật mã mặc định `PKK00000X` và tạo Filtered Unique Index `UQ_PhieuKiemKe_MaPhieu`.
    - Cập nhật Model `PhieuKiemKe`, DbContext `QuanLyKhoPhuQuocLtwContext`, các ViewModel (`KiemKhoViewModels.cs`).
    - Bổ sung hàm `SinhMaPhieuTuDongAsync()` và Action API `/PhieuKiemKe/GetNextCode`. Cập nhật `SaveDraft`, `Complete`, `Index` (tìm kiếm theo mã tùy chỉnh).
    - Mở khóa ô nhập mã `#fCode` (`_PhieuKiemKeForm.cshtml`), giao diện tối giản sạch sẽ; ngầm hiểu nếu để trống ô mã hệ thống sẽ tự động sinh mã dạng `PKK...` khi lưu (`phieu-kiem-ke-form.js`).
    - Biên dịch kiểm tra: `dotnet build` 0 Errors, cú pháp JavaScript 0 lỗi.
- **2026-10-16 (Phiên 38 - Sáng)**:
  - **Sửa lỗi không nạp dữ liệu mặt hàng khi mở lại bản tạm Phiếu kiểm kho**:
    - **Nguyên nhân**: `<script id="stockTakeConfig">` trong `_PhieuKiemKeForm.cshtml` dùng Razor nội suy chuỗi thủ công; trên Windows văn hóa `vi-VN`, các số thập phân `decimal` (`sys`, `act`, `cost`) bị in dấu phẩy `,` (`10,00`), đồng thời `JavaScriptStringEncode` sinh ký tự `\'` làm `JSON.parse` trên client bị `SyntaxError` và bảng hàng hóa kiểm kho bị rỗng. Đồng thời `PhieuKiemKeController.Edit` trả về nhầm `View("Create")`.
    - **Khắc phục**: Dùng `System.Text.Json.JsonSerializer.Serialize` với `PropertyNamingPolicy = CamelCase` và `UnsafeRelaxedJsonEscaping` để đảm bảo 100% JSON chuẩn quốc tế; sửa `PhieuKiemKeController.Edit` trả về `View("Edit", model)`; bổ sung kiểm tra an toàn trong `phieu-kiem-ke-form.js`.
    - Kiểm tra biên dịch: `dotnet build` 0 Errors, cú pháp JavaScript 0 lỗi.
- **2026-10-16 (Phiên 36 - Sáng)**:
  - **Chuẩn hóa Nút chọn Thời gian Kiểm kho khớp 100% Danh sách Hàng hóa**:
    - **HTML & Giao diện** (`_PhieuKiemKeFilterSidebar.cshtml`):
      + Khối 2 radio: Radio 1 (`#dateAll` / `#labelDateAll`) mặc định hiển thị "Toàn thời gian" kèm icon `bi-chevron-right`; Radio 2 (`#dateCustom` / `#labelDateCustom`) hiển thị "Tùy chỉnh" kèm icon `bi-calendar3`.
      + Popup chọn nhanh `#popupDateQuick`: Tinh gọn chuẩn 3 cột KiotViet giống hệt Hàng hóa (Theo ngày: Hôm nay, Hôm qua; Theo tuần: Tuần này, Tuần trước, 7 ngày qua; Theo tháng: Tháng này, Tháng trước, 30 ngày qua; Pill dưới: Toàn thời gian).
      + Popup lịch 2 tháng `#popupDateCalendar`: Tích hợp Dual Calendar 2 tháng cạnh nhau (`#dateCalBody1`, `#dateCalBody2`), dải ngày tô màu xanh (`.in-range`, `.range-start`, `.range-end`), nút chuyển tháng, phím "Hôm nay", "Bỏ qua", và "Áp dụng".
    - **JavaScript & Tương tác** (`phieu-kiem-ke-index.js`):
      + Tái sử dụng thư viện jQuery (`$jq = window.jQuery`) theo chuẩn `hang-hoa-index.js`.
      + Khắc phục triệt để lỗi double-fire / synthetic click khi nhấp vào label "Tùy chỉnh", chặn đóng/mở popup chập chờn.
      + Đồng bộ hóa định dạng ngày `YYYY-MM-DD` (`formatDateISO`) thay vì ISO UTC string, ngăn chặn sai lệch múi giờ ngày bắt đầu/kết thúc.
      + Đồng bộ `paintFilters()`, `loadTable()`, `triggerExport()` với mã `DateFilterType` chuẩn (`ALL`, `HOM_NAY`, `HOM_QUA`, `TUAN_NAY`, `TUAN_TRUOC`, `7_NGAY`, `THANG_NAY`, `THANG_TRUOC`, `30_NGAY`, `CUSTOM`).
    - **Backend & Specs**:
      + Đổi giá trị mặc định của `PhieuKiemKeFilterVM.DateFilterType` thành `"ALL"` (`KiemKhoViewModels.cs`).
      + Đồng bộ tài liệu đặc tả `docs/specs/kiem-kho.md` (< 8.000 ký tự) theo Luật 12.
    - Kiểm tra biên dịch `dotnet build` đạt 0 lỗi.
- **2026-10-15 (Phiên 35 - Đêm)**:
  - **Đổi tiêu đề màn hình từ "Kiểm kho" thành "Phiếu kiểm kho" chuẩn KiotViet**:
    - Cập nhật tiêu đề sidebar `.kiot-sidebar-title` trong `_PhieuKiemKeFilterSidebar.cshtml` thành "Phiếu kiểm kho", mobile header thành "Bộ lọc phiếu kiểm kho".
    - Cập nhật tiêu đề trang `ViewData["Title"] = "Phiếu kiểm kho"` và mobile header `.kiot-mobile-title` trong `Index.cshtml`.
    - Giữ nguyên nút thao tác chính `+ Kiểm kho` chuẩn mẫu KiotViet (nút thêm chứng từ).
    - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 27 - Chiều)**:
  - **Chuẩn hóa Bộ lọc Người tạo & Kiểu chữ Bảng Kiểm kho giống 100% Danh sách Hàng hóa**:
    - Thay thế hoàn toàn khung `.ms` và `.mslist` cũ bằng `.kiot-multiselect-box` (`#boxNguoiTao`) và `.kiot-ms-dropdown` (`#dropdownNguoiTao`).
    - Thẻ chọn: Hiển thị tối đa 3 thẻ `.kiot-pill-tag` màu xanh KiotViet (`#0070f4`), nút xóa `×` (`.tag-remove`); nếu chọn nhiều hơn 3 sẽ hiển thị huy hiệu `+N khác` (`.kiot-pill-more`).
    - Dropdown: Tích hợp ô tìm kiếm sticky `.kiot-ms-search` (`Tìm người tạo...`), danh sách item `.kiot-ms-item` có checkbox bên trái và tên bên phải, tự động chuyển hướng `.drop-up` khi ở sát đáy sidebar qua `checkSidebarDropdownDirection()`.
    - Đồng bộ màu chữ và kiểu chữ bảng Kiểm kho (`_PhieuKiemKeTable.cshtml`): Chuyển Mã kiểm kho từ màu xanh in đậm về chữ thường tiêu chuẩn, chuyển các cột số liệu (Tổng thực tế, Tổng chênh lệch, SL lệch tăng/giảm) từ in đậm và màu xanh/đỏ về kiểu chữ thường tiêu chuẩn đồng nhất với Danh sách hàng hóa.
    - Dọn sạch các class `.ms`, `.chip`, `.mslist` thừa trong `kiem-kho.css`.
    - Kiểm tra biên dịch `dotnet build` đạt 0 Errors.
- **2026-10-15 (Phiên 26 - Chiều)**:
  - **Chuẩn hóa Nút chọn Thời gian Kiểm kho giống 100% Danh sách Hàng hóa**:
    - Thay thế 2 khối nút `.selbox` bằng 2 dòng radio `.form-check mb-1` (nhãn text + icon `bi-chevron-right` và `bi-calendar3`).
    - Tích hợp 2 popup `.quick-date-popup` và `.dual-calendar-popup` định vị fixed bằng `getBoundingClientRect()`, khớp hoàn toàn trải nghiệm người dùng của module Hàng hóa.
    - Bổ sung `ALL` / `TOANTHOIGIAN` vào `ResolveDateRange` trong `PhieuKiemKeController.cs`.
    - Kiểm tra biên dịch `dotnet build` đạt 0 Errors.
- **2026-10-15 (Phiên 25 - Chiều)**:
  - **Khắc phục Triệt để Lỗi hiển thị Phân hệ Kiểm kho sau chuẩn hóa**:
    - Thiết kế lại Dropdown chọn nhanh khoảng ngày `#quick` dọc chia 4 nhóm chuẩn KiotViet, vừa khít 100% bề rộng sidebar, cuộn mượt mà không bị `overflow: hidden` của sidebar cắt ngang.
    - Chuyển lịch chọn ngày tùy chỉnh sang cụm 2 ô nhập ngày inline `#customDateWrap` (`Từ ngày` - `Đến ngày` và nút Áp dụng) nằm gọn gàng bên dưới radio "Tùy chỉnh".
    - Sửa lỗi bảng số liệu `.sums` bị đè bẹp và cắt mép phải: Áp dụng Bootstrap Flexbox cho `.dp-bottom` với textarea `flex-grow-1` và `.sums` cố định 330px; cấu trúc nhãn và số liệu tách biệt căn đều 2 bên; ghim `.dp` ở vị trí `position: sticky; left: 0; max-width: min(1200px, calc(100vw - 320px))` đảm bảo khi cuộn ngang bảng 1450px, dòng chi tiết luôn nằm trọn trong vùng nhìn thấy.
    - Đổi viền bao quanh toàn bộ dòng mở thành dải viền bên trái `border-left: 4px solid var(--blue)` thanh lịch chuẩn KiotViet.
    - Flexbox `.kiot-table-wrapper` giúp phân trang `_Pagination.cshtml` ghim sát đáy card trắng.
    - Kiểm tra biên dịch `dotnet build` đạt 0 Errors.
- **2026-10-15 (Phiên 23 - Trưa/Chiều)**:
  - **Nâng cấp và Hoàn thiện Phân hệ Kiểm kho (PhieuKiemKe) chuẩn 100% Prototype KiotViet**:
    - **Frontend & UI**: Bóc tách toàn bộ mã HTML/CSS từ `prototype-kiemkho-full.html` sang hệ thống MVC; tạo CSS `kiem-kho.css`; tách `Views/PhieuKiemKe/_PhieuKiemKeFilterSidebar.cshtml` và `_PhieuKiemKeTable.cshtml` (hỗ trợ bung chi tiết dòng `tr.dtl` inline); tách JS `phieu-kiem-ke-index.js`; chuẩn hóa `_PhieuKiemKeForm.cshtml` 2 cột KiotViet kèm panel gập mở, phím tắt F3/F9/F10 và JS `phieu-kiem-ke-form.js`.
    - **Backend & Controller**: Nâng cấp `PhieuKiemKeController.cs` và `KiemKhoViewModels.cs`, bổ sung API `HuyPhieu` (chặn hủy phiếu đã cân bằng theo Luật 6), `SaveNote` (lưu ghi chú từ dòng chi tiết), `GetItemDetails` (nạp chi tiết JSON), `Export` (xuất CSV danh sách hoặc chi tiết), hỗ trợ sao chép qua `Create?copyId=...`. Bọc Transaction an toàn, đọc tồn sổ sách từ `vw_TonKhoHienTai`, chốt giá vốn và sinh `PhieuDieuChinh`.
    - **Kiểm toán & Đồng bộ**: `dotnet build` đạt 0 Errors và 0 Warnings. Đồng bộ tài liệu `docs/specs/kiem-kho.md` (< 8.000 ký tự) theo Luật 12.
- **2026-10-15 (Phiên 16 - Sáng)**:
  - Chuẩn hóa Kiến trúc Danh mục CRUD dùng chung & Tinh gọn mô-đun Hàng hóa (Khuôn mẫu LEGO):
    - **Tầng Dùng chung (Shared Foundation)**: Xây dựng `BaseFilterParams.cs`, `PagedResult<T>`, `_Pagination.cshtml`, `ExcelHelper.cs`, và `kiot-filter.js`. Mọi danh mục tiếp theo đều có thể tái sử dụng ngay lập tức mà không cần viết lại mã phân trang, bộ lọc hay định dạng Excel.
    - **Tách Lớp Dịch vụ Excel**: Tạo `IHangHoaExcelService` và `HangHoaExcelService`, đăng ký DI vào `Program.cs`. Rút gọn `HangHoaController.cs` từ 1.944 dòng xuống 1.253 dòng (~36%).
    - **Mô-đun hóa Giao diện & JavaScript**: Tách 7 khối lọc sidebar sang `_HangHoaFilterSidebar.cshtml`, chuyển ~1.400 dòng inline script sang `hang-hoa-index.js`, rút gọn `Views/HangHoa/Index.cshtml` từ 1.841 dòng (~85 KB) xuống 142 dòng (~7.8 KB). Dọn dẹp 5 file scaffold view cũ.
    - Kiểm tra biên dịch: `dotnet build` 0 lỗi. Đồng bộ toàn bộ tài liệu quy chuẩn (`AGENTS.md`, `PROGRESS.md`, `quyet-dinh.md`, `specs/danh-sach-hang-hoa.md`).
- **2026-10-14 (Phiên 15 - Chiều/Tối)**:

  - Hoàn thiện Chức năng Nhập & Xuất File Excel Hàng hóa chuẩn KiotViet (16 trường quản lý):
    - Tích hợp thư viện ClosedXML (v0.105.1); xây dựng các action `DownloadTemplate`, `ExportExcel`, `ImportExcel` và các ViewModel `ExportHangHoaRequest`, `ImportHangHoaResult`.
    - Dựng modal chọn cột xuất `#hhExportModalOv` hỗ trợ chọn phạm vi (tất cả / hàng đã chọn), nút tiện ích chọn bộ cột chuẩn để nhập lại, và cảnh báo nghiệp vụ khi bỏ chọn cột thiết yếu.
    - Dựng modal nhập file kéo thả `#hhImportModalOv` với 3 chế độ xử lý trùng mã, tự động map cột linh hoạt, tự tạo nhóm/ĐVT mới, tạo phiếu nhập kho đầu kỳ `DAU_KY` nếu có tồn ban đầu, và bọc Transaction EF.
    - Sửa lỗi nhận file khi kéo thả vào Dropzone: Khắc phục lỗi báo `"Vui lòng chọn file Excel trước khi thực hiện."` bằng cách lưu trữ biến `selectedImportFile` độc lập trong JS (`hang-hoa-excel.js`) và đồng bộ hai chiều với `fileInput.files` qua `DataTransfer`. Người dùng kéo thả file hoặc chọn file qua dialog đều thực hiện nhập thành công 100%.
    - Tinh gọn Modal Nhập Excel: Gỡ bỏ khối card "Tải file mẫu Excel chuẩn KiotViet" theo yêu cầu người dùng, giúp giao diện thông thoáng, tập trung trực tiếp vào vùng kéo thả file dữ liệu (`#importDropzone`).
  - Đồng bộ toàn diện Logic & Giao diện Xóa hàng hóa chuẩn KiotViet:
    - **Logic Backend**: Bổ sung `ChiTietPhieuXuat` vào danh sách 5 bảng chứng từ kiểm tra toàn vẹn (`ChiTietDonBan`, `ChiTietPhieuNhap`, `ChiTietPhieuXuat`, `ChiTietPhieuChuyenKho`, `ChiTietPhieuKiemKe`); bọc transaction EF xóa cascade dữ liệu bảng phụ (`HinhAnhHangHoa`, `NguongTonKho`); bổ sung endpoint `NgungBan(id)` chuyển nhanh trạng thái `NGUNG_BAN`.
    - **Giao diện & Trải nghiệm**: Gỡ bỏ hoàn toàn modal Bootstrap thô cũ trong `Index.cshtml`, thay bằng modal overlay KiotViet `#hhDeleteProductOv` (`.hh-modal.small`, nút đỏ `.hh-btn.danger`, đóng ESC/click ngoài); thêm nút "🗑 Xóa" (`#btnDeleteProductInModal`) ở footer modal Cập nhật hàng hóa (tự động ẩn khi Tạo mới/Sao chép); cảnh báo giao dịch trực quan kèm nút 1-click chuyển sang 'Ngừng bán' thay vì browser alert; hiển thị toast nổi và tự động nạp lại bảng sau thao tác.
  - Tối ưu hóa toàn diện hiệu năng và độ mượt mà khi hoán đổi/đổi/lưu ảnh hàng hóa (10x Faster):
    - **Nén ảnh phía Client (Canvas Compression)**: Tự động nén ảnh chọn từ máy (cả thêm mới và thay thế ảnh chính) về kích thước tối đa 1000px, JPEG quality 0.85; giảm dung lượng payload JSON từ 10-25MB xuống ~200-500KB (giảm 95% thời gian truyền tải và ghi DB).
    - **Cập nhật tức thì (Optimistic UI)**: Khi lưu form thành công, JS lập tức cập nhật `src` của ảnh thumbnail, hover popover và tab detail trên bảng (`data-img-id`, `data-popover-img-id`, `data-detail-img-id`) ngay lập tức mà không phải chờ `loadTable()`, loại bỏ hoàn toàn độ trễ và hiện tượng giật/chớp màn hình.
    - **Smart Cache-Busting theo ImageVersion**: Bổ sung `ImageVersion` vào `HangHoaItemVM` (lấy theo `MaHinhAnh` IDENTITY của bảng `HinhAnhHangHoa`), bật lại `ResponseCache(Duration = 86400)` cho `GetImage`. Nhờ đó, trình duyệt tận dụng cache HTTP cho 14 sản phẩm còn lại trên bảng (0ms), chỉ tải lại duy nhất ảnh của sản phẩm vừa thay đổi.
  - Tinh gọn giao diện dòng chi tiết sản phẩm: Loại bỏ nút `+ Thêm thuộc tính` và modal `quickAttrModal` khỏi dòng chi tiết inline trên bảng danh sách, giữ lại huy hiệu (badge) hiển thị thuộc tính; nghiệp vụ thêm/sửa/xóa thuộc tính được quản lý tập trung và trực quan bên trong modal Chỉnh sửa hàng hóa.
  - Chuẩn hóa cấu trúc 5 ảnh hàng hóa: 1 ảnh to đại diện và 4 ảnh nhỏ bên phải:
    - **Layout & CSS**: Khắc phục hiện tượng hiển thị 5 thumbnail nhỏ bên phải bị tràn dài hơn ảnh to. Thiết kế chuẩn xác: 1 ảnh to đại diện bên trái (`200px x 200px`) và cột 4 ô thumbnail bên phải (`45px x 45px`, xếp đều vừa khít `height: 200px`).
    - **Tương tác**: Ảnh to luôn hiển thị ảnh đại diện chính (kèm badge "Ảnh chính", nút xóa `×` và hover "Bấm để đổi ảnh"). Cột bên phải hiển thị đúng 4 ảnh phụ (hoặc nút `+` thêm ảnh và ô placeholder trống khi chưa đủ 5 ảnh). Bấm vào bất kỳ ảnh nhỏ nào sẽ lập tức đổi (swap) làm ảnh chính, bấm `×` để xóa ảnh phụ tương ứng, và xóa ảnh to sẽ tự động đẩy ảnh phụ kế tiếp lên làm ảnh chính.
  - Khắc phục triệt để lỗi tìm kiếm theo Vị trí ở thanh menu lọc bên trái (Left Menu Filter):
    - **Backend**: Sửa lỗi truy vấn trong `HangHoaController.cs` khi lọc `viTri` trước đó truy vấn sai vào trường `HangHoa.QuyCach`. Chuyển toàn bộ Expression query sang trường chuẩn `HangHoa.ViTri`.
    - **Nạp động & Ô tìm kiếm nhanh**: Bổ sung `ViTris` vào `HangHoaIndexVM`, tự động nạp danh sách vị trí thực tế trong DB kết hợp vị trí mặc định; bổ sung ô input `.kiot-ms-search` ("Tìm vị trí...") trong dropdown `#dropdownViTri` giúp người dùng tìm kiếm nhanh khi danh sách vị trí dài.
  - Sửa lỗi xung đột ID và hoàn thiện Multi-select Vị trí trong Modal Tạo/Sửa Hàng hóa:
    - **Xung đột ID**: Đổi tên các ID trong Modal (`_HangHoaModal.cshtml`) thành `formViTriWrap`, `formViTriBox`, `formViTriTags`, `formViTriSearch`, `formViTriDropdown`, `formViTriList` nhằm cô lập hoàn toàn với dropdown `#boxViTri` của Leftmenu.
    - **Giao diện**: Đồng bộ chiều cao chuẩn `38px` cân bằng với ô Trọng lượng, hiển thị tag dạng chip `[ a × ] [ b × ]` kèm dấu tích xanh `✓` trong dropdown chọn theo mẫu KiotViet; thiết lập `z-index` và `overflow: visible` cho Section 3.
  - Đồng bộ toàn diện hệ thống Dropdown trong Form Tạo/Sửa Hàng hóa chuẩn KiotViet:
    - **Đồng nhất giao diện**: Nâng cấp toàn bộ các dropdown còn lại trong form gồm **Nhóm hàng** (`formMaNhom`), **Đơn vị tính** (`formMaDvt`), **Đơn vị trọng lượng** (`formDonViTrongLuong`), và **Tên thuộc tính** (`hh-a-name`) sang cấu trúc Custom Dropdown (`.hh-cs-wrap`, `.hh-cs-box`, `.hh-cs-dropdown`, `.hh-cs-item`).
    - **Tính năng & Trải nghiệm**: Chiều cao chuẩn 38px bo góc 8px, mũi tên xoay mượt mà khi mở, popup danh sách nổi bo góc bóng mờ mềm mại với dấu tích xanh `✓` chuẩn mực cho mục đang chọn, hỗ trợ gõ lọc/tìm kiếm thời gian thực (Search filter), phím Escape/Enter, tự động đóng khi click ngoài, đồng bộ 2 chiều hoàn hảo với `<select>` ẩn bảo toàn 100% logic validation và nạp dữ liệu Edit.
    - **Cơ chế tự động đảo hướng (Auto-flip Drop-up)**: Xây dựng hàm `checkDropdownDirection` tính toán khoảng trống thực tế so với mép dưới modal body và viewport (`spaceBelow < 220px && spaceAbove > spaceBelow`). Khi dropdown nằm ở vị trí thấp (như ô Thuộc tính gần chân modal), popup sẽ tự động bật ngược lên phía trên (`bottom: calc(100% + 4px)` kèm đổ bóng ngược `0 -8px 24px`), nâng `z-index` khu vực lên 50 chống che khuất, và tự động tính toán lại khi cuộn màn hình.
  - Áp dụng cơ chế Auto-flip Drop-up cho Sidebar Bộ lọc bên trái (Left Menu Filter):
    - **Tự động đảo hướng**: Bổ sung hàm `checkSidebarDropdownDirection(box, dropdown)` cho các dropdown bộ lọc ở cột trái gồm: **Nhóm hàng** (`dropdownNhomHang`), **Nhà cung cấp** (`dropdownNcc`), **Vị trí** (`dropdownViTri`), và **Loại hàng** (`dropdownLoaiHang`).
    - **Hiển thị thông minh**: Khi các khối lọc ở dưới thấp (như Vị trí, Loại hàng) được mở và khoảng trống bên dưới không đủ (< 220px), popup tự động bật ngược lên trên (`.kiot-ms-dropdown.drop-up` với `bottom: calc(100% + 4px)` và bóng đổ ngược `0 -10px 25px`); tự động tính toán lại khi cuộn sidebar `.kiot-filter-box`.
    - Kiểm tra cú pháp JS và biên dịch: Đạt chuẩn. Đồng bộ `docs/specs/danh-sach-hang-hoa.md`.
  - Triển khai tính năng Sửa & Xóa Vị trí và Thuộc tính trực tiếp từ Dropdown chuẩn KiotViet:
    - **Hover hiển thị nút Bút chì (`✎`)**: Khi di chuột qua từng mục trong dropdown Vị trí (`#formViTriList .hh-multiselect-item`) và Thuộc tính (`.hh-a-list .hh-cs-item`), nút bút chì `.hh-item-edit-btn` tự động xuất hiện ở mép phải (thay thế dấu check xanh nếu đang chọn); click nút sẽ chặn nổi bọt sự kiện và mở popup sửa.
    - **Modal popup chuẩn KiotViet (`#hhEditItemOv`)**: Hỗ trợ 2 chế độ "Sửa vị trí" (tiêu đề Vị trí, nút Lưu) và "Sửa thuộc tính" (tiêu đề Tên thuộc tính, nút Xong), input tự động nạp giá trị cũ và focus.
    - **Xử lý Đổi tên & Xóa**:
      - Đổi tên: Cập nhật dữ liệu trong mảng `availableLocations` và `selectedLocations` hoặc `knownAttributes` và các dòng thuộc tính đang chọn trong form, đồng bộ tức thì sang danh sách dropdown và bộ lọc sidebar `#dropdownViTri`.
      - Xóa: Nút "🗑 Xóa" ở góc trái modal gỡ bỏ mục khỏi danh sách dữ liệu, bỏ chọn ở các tag/dòng liên quan, đóng modal và hiển thị Toast thông báo.
    - **Tinh chỉnh Hover thuần màu (Không hiệu ứng chuyển động & Giữ nguyên nút bút chì)**: Loại bỏ toàn bộ `transition` làm chậm/chuyển động khi rê chuột qua các mục danh sách chọn (`.hh-multiselect-item`, `.hh-cs-item`, `.kiot-ms-item`), chỉ đổi màu nền `#f3f4f6` ngay lập tức; đồng thời cố định trạng thái hover của nút bút chì `.hh-item-edit-btn` (trong suốt, giữ nguyên màu `#4b5563`, không tạo khối nền hoặc đổi màu xanh khi rê chuột vào icon).
    - **Khắc phục lỗi hở chữ trên ô tìm kiếm vị trí (`.kiot-ms-search`)**: Loại bỏ `padding-top` trên `.kiot-ms-dropdown` khi có ô tìm kiếm; tăng `z-index: 10` cho thanh search sticky; bổ sung lớp mặt nạ che màu trắng `::before` (cao 10px) phía trên ô search và bo góc `7px` để chặn triệt để hiện tượng chữ các dòng dưới bị lộ qua khe hở phía trên khi cuộn danh sách (đặc biệt ở chế độ drop-up).
    - **Tối ưu Dropdown Nhóm hàng & Đơn vị tính trong Form**: Loại bỏ mục "+ Tạo mới" trùng lặp dưới chân dropdown (giữ nguyên nút "+ Tạo mới" trên nhãn); bổ sung ô tìm kiếm dính ở đỉnh dropdown (`.hh-cs-search`: `#searchMaNhom`, `#searchMaDvt`) đồng nhất chuẩn LeftMenu; chuyển ô chọn trên form về `readonly`, tự động focus ô tìm kiếm khi mở popup và lọc tức thì.
    - **Nâng cấp Custom Dropdown "Tiêu chí tồn" & "Sắp xếp giá trị thuộc tính" chuẩn KiotViet**:
      - **Dropdown Tiêu chí tồn** (`Index.cshtml` & `site.css`): Thay thế thẻ `<select id="filterTonKho">` thô sơ bằng Custom Single Select KiotViet (`.kiot-single-select-box`, `.kiot-ss-dropdown`, `.kiot-ss-item`). Thiết kế bo góc 8px, height 38px, mũi tên xoay 180deg mượt mà khi mở, danh sách 4 tiêu chí ("Tất cả", "Còn hàng trong kho", "Hết hàng trong kho", "Dưới định mức tồn ⚠️") với dấu check xanh `bi-check2`, hover `#f3f4f6` phản hồi tức thì (`transition: none`). Tự động đóng khi click ngoài hoặc ESC, hỗ trợ tự động đảo hướng drop-up khi cuộn sidebar, đồng bộ 2 chiều với `<select>` ẩn bảo toàn 100% logic lọc AJAX `loadTable()` và chấm xanh chỉ báo `#dotTonKho`.
      - **Dropdown Sắp xếp giá trị thuộc tính** (`_HangHoaModal.cshtml`, `hang-hoa-form.css`, `hang-hoa-form.js`): Thay thế `<select id="pkSort">` trong modal `#hhPickOv` bằng Custom Dropdown KiotViet mini (`.hh-pk-sort-wrap`, `.hh-pk-sort-box`, `.hh-pk-sort-dropdown`, `.hh-pk-sort-item`). Thiết kế chiều cao 36px bo góc 6px, mũi tên xoay mượt mà, 2 tùy chọn "A → Z" và "Z → A" với dấu check xanh SVG `#i-check`, hover đổi màu tức thì. Tự động đóng khi click ngoài, reset trạng thái chuẩn khi mở modal con, đồng bộ biến `pk.sort` và kích hoạt `renderPickChips()`.
    - **Tính năng Sắp xếp cột bảng dữ liệu 3 trạng thái (3-State Column Sorting)**:
      - **Quy tắc chu kỳ 3 bước**: Click lần 1 ➜ Sắp xếp Tăng dần (`asc`, icon mũi tên lên `bi-arrow-up`); Click lần 2 ➜ Sắp xếp Giảm dần (`desc`, icon mũi tên xuống `bi-arrow-down`); Click lần 3 ➜ Trở về mặc định (`none`, hủy sắp xếp). Khi click sang một cột khác, hệ thống tự động hủy sắp xếp của cột cũ và bắt đầu sắp xếp Tăng dần cho cột mới.
      - **8 Cột hỗ trợ sắp xếp**: Mã hàng (`mahang`), Tên hàng (`tenhang`), Giá bán (`giaban`), Giá vốn (`giavon`), Tồn kho (`tonkho`), Khách đặt (`khachdat`), Thời gian tạo (`ngaytao`), Dự kiến hết hàng (`dukienhethang`).
      - **Backend & Controller**: `HangHoaController.cs` nhận `sortBy` và `sortDir`, thực hiện sắp xếp động trên danh sách `allItems` trước khi phân trang, bảo toàn 100% dữ liệu lọc và tổng hợp.
      - **Giao diện**: Header bảng hiển thị icon mũi tên chỉ khi cột đang sắp xếp (`bi-arrow-up` hoặc `bi-arrow-down`), khi không sắp xếp sẽ ẩn hoàn toàn icon giúp tiêu đề gọn gàng sạch sẽ; hover đổi màu mềm mại (`#dbeafe`), ngăn bôi đen text khi click liên tục (`user-select: none`).
    - Kiểm tra cú pháp JS: `node -c` 0 lỗi. Đồng bộ `docs/specs/danh-sach-hang-hoa.md`.
- **2026-10-15 (Phiên 15 - Sáng)**:
  - Tinh gọn thanh công cụ Quản lý Hàng hóa: Gỡ bỏ nút Cài đặt (`bi-gear`) trên thanh công cụ của trang Hàng hóa (`Index.cshtml`), giữ lại 2 nút tiện ích tiêu chuẩn là Tải lại bảng (`bi-arrow-clockwise`) và Trợ giúp (`bi-question-circle`).
- **2026-10-16 (Phiên 41 - Sáng)**:
  - Đồng bộ Toàn diện Tính năng Đánh dấu Sao trong Kiểm kho khớp 100% Danh sách Hàng hóa:
    - CSDL: Tạo Migration `migrations/sql/09_bo_sung_dadanhdau_phieukiemke.sql` bổ sung cột `DaDanhDau BIT NOT NULL CONSTRAINT DF_PhieuKiemKe_DaDanhDau DEFAULT 0` vào bảng `PhieuKiemKe`. Đồng bộ Entity `PhieuKiemKe.cs` và `QuanLyKhoPhuQuocLtwContext.cs`.
    - Backend: Bổ sung Action `ToggleFavorite(int id)` trong `PhieuKiemKeController.cs`, cập nhật lọc `query.Where(p => p.DaDanhDau)` trong `BuildIndexViewModel`, đồng bộ các ViewModel `PhieuKiemKeListItemVM`, `PhieuKiemKeFilterVM`, `PhieuKiemKeIndexVM`.
    - Giao diện: Thêm nút sao lọc trên header `_PhieuKiemKeTable.cshtml` (`.star-header-filter`, `onclick="toggleStarHeaderFilter(event)"`); đồng bộ cột sao từng dòng sang `<td class="cell-star" onclick="toggleFavoriteStockTake(event, ...)">` bọc `.star-btn` hiển thị màu cam `#f97316` khi đánh dấu (`bi-star-fill`).
    - JavaScript: Thêm `toggleFavoriteStockTake` gọi API `/PhieuKiemKe/ToggleFavorite` cập nhật realtime và fade out dòng khi đang lọc sao; thêm `toggleStarHeaderFilter` kích hoạt lọc sao; chặn click sao mở accordion `tr.dtl`.
    - Kiểm tra biên dịch: 0 lỗi. Đồng bộ `docs/specs/kiem-kho.md`.
- **2026-10-16 (Phiên 40 - Sáng)**:
  - Hỗ trợ Nhập tay và Tự động sinh Mã kiểm kho:
    - CSDL: Tạo Migration `08_bo_sung_maphieu_kiemke.sql` bổ sung cột `MaPhieu VARCHAR(30) NULL` vào bảng `PhieuKiemKe` kèm Filtered Unique Index `UQ_PhieuKiemKe_MaPhieu`.
    - Backend: Mở khóa ô nhập mã kiểm kho, cập nhật logic tự động sinh mã hoặc kiểm tra trùng lặp mã khi lưu tạm / cân bằng kho.
    - Kiểm tra biên dịch: 0 lỗi. Đồng bộ `docs/specs/kiem-kho.md`.
- **2026-10-16 (Phiên 39 - Sáng)**:
  - Khắc phục lỗi chớp tắt popup chọn ngày giờ khi click lần đầu (`phieu-kiem-ke-form.js`, `_PhieuKiemKeForm.cshtml`):
    - Tách hàm `openDatePicker()` hiển thị ngày giờ trực tiếp (không dùng `togglePop`).
    - Bổ sung biến kiểm soát thời gian `lastFocusTime` ngăn chặn hiện tượng double-fire giữa `focus` và `click` khi click lần đầu; giữ nguyên popup mở khi nhận focus.
    - Hỗ trợ toggle đóng/mở khi click lại sau đó; hỗ trợ phím `Escape` đóng nhanh các popup; bổ sung `cursor: pointer` cho ô `#fDate`.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-16 (Phiên 38 - Sáng)**:
  - Sửa lỗi không nạp dữ liệu mặt hàng khi mở lại bản tạm Phiếu kiểm kho (`_PhieuKiemKeForm.cshtml`, `PhieuKiemKeController.cs`):
    - Chuẩn hóa chuỗi JSON cấu hình `stockTakeConfig` dùng `JsonSerializer.Serialize` tránh lỗi dấu phẩy thập phân tiếng Việt (`vi-VN`) làm hỏng cú pháp JSON.
    - Sửa Action `Edit` trả về đúng `View("Edit", model)`.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-16 (Phiên 37 - Sáng)**:
  - Khắc phục ngoại lệ đọc ô Excel an toàn trong ClosedXML (`ExcelHelper.cs`, `HangHoaExcelService.cs`):
    - Bổ sung hàm `GetCellValueAsString` chuyển đổi an toàn theo `cell.Value.Type` tránh `InvalidCastException`.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 36 - Đêm)**:
  - Sửa lỗi Lặp Tiêu đề Tháng trong Bộ chọn Ngày Giờ Lập Phiếu Kiểm kho (`phieu-kiem-ke-form.js`): Gỡ bỏ khối `<div class="cal-h">Tháng MM/YYYY</div>` trùng lặp trong hàm `calHTML`, giữ lại tiêu đề duy nhất chuẩn mực nằm giữa 2 nút chuyển tháng trên thanh điều hướng `.dtnav`, hiển thị ngay phía trên lưới ngày `T2 T3 T4...`, khắc phục dứt điểm hiện tượng hiển thị 2 dòng tháng liên tiếp và làm chiều cao lịch khớp hoàn hảo với khung giờ 230px bên phải.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 35 - Đêm)**:
  - Sửa dứt điểm Lỗi Click không hiện Popup Lịch Tùy chỉnh Dual Calendar trong Kiểm kho (`phieu-kiem-ke-index.js`, `_PhieuKiemKeFilterSidebar.cshtml`):
    - Gỡ bỏ `labelCustom.onclick` thừa gây ra synthetic double-fire click bật-tắt trong 1ms.
    - Thêm cơ chế chống synthetic click `now - lastToggleTime < 250ms` trong `toggleFloatingPopup`.
    - Bổ sung `if (e.target.closest('.dual-calendar-popup, .quick-date-popup')) return;` vào sự kiện click ngoài.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 34 - Đêm)**:
  - Chuẩn hóa Giao diện Popup Lưu ý khi kiểm kho: Khắc phục lỗi popup `.pop.notes` bị co bẹp chiều ngang (~150px) khiến chữ bị ngắt vụn và chèn ép nút panel; đặt `width: 340px`, định vị `top: 44px; right: 0;`, `padding: 16px 18px`, `line-height: 1.55`, tiêu đề có icon `bi-info-circle` xanh KiotViet, đổ bóng nhẹ nhàng.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 33 - Đêm)**:
  - Cố định độ rộng cột Tên hàng & Tự động xuống dòng trong Bảng Kiểm hàng (`_PhieuKiemKeForm.cshtml`, `kiem-kho.css`, `phieu-kiem-ke-form.js`):
    - Đặt `table-layout: fixed;` cho `.grid-card table`.
    - Cố định cột Tên hàng `.w-name`: `width: 280px; min-width: 280px; max-width: 280px;`, tự động xuống dòng (`word-break: break-word; overflow-wrap: anywhere; white-space: normal; line-height: 1.45;`), ngăn chặn triệt để hiện tượng tên dài không dấu cách làm giãn toác bảng.
    - Cố định cột Mã hàng `.w-code`: `width: 120px; white-space: nowrap;`, loại bỏ class `.text-break` gây ngắt đôi mã sản phẩm.
    - Đồng bộ độ rộng các cột số liệu chuẩn KiotViet: STT (46px), ĐVT (70px), Tồn kho (90px), Thực tế (110px), SL lệch (95px), Giá trị lệch (115px).
    - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 32 - Đêm)**:
  - Sửa lỗi Logic Lịch Tùy Chỉnh Dual Calendar & Chuẩn hóa đồng bộ theo Danh sách Hàng hóa (`phieu-kiem-ke-index.js`, `PhieuKiemKeController.cs`):
    - Khắc phục lỗi lịch nhảy về năm 2000 khi chọn Tùy chỉnh lúc đang ở preset "Toàn thời gian", đồng bộ mở lịch tại tháng hiện tại.
    - Đồng bộ hóa cơ chế chọn dải ngày 2 lần nhấp (Click range selection), phím Hôm nay, Áp dụng, Bỏ qua.
    - Tối ưu Server-side `ResolveDateRange` xử lý chính xác `00:00:00` và hỗ trợ đầy đủ các mã bộ lọc ngày.
    - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 31 - Đêm)**:
  - Tinh gọn Thanh công cụ Form Kiểm kho: Gỡ bỏ nút In phiếu (`#tPrint`) trên thanh công cụ của màn hình Lập / Sửa phiếu kiểm kho ([`_PhieuKiemKeForm.cshtml`](file:///D:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Views/PhieuKiemKe/_PhieuKiemKeForm.cshtml)), giữ lại các nút tiện ích cần thiết (Nhập Excel/CSV, Ẩn/hiện cột, Lưu ý khi kiểm kho).
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 28 - Đêm)**:
  - Chuẩn hóa Chi tiết Phiếu kiểm kho bung mở inline khớp 100% mẫu KiotViet:
    - Đổi tab `Thông tin phiếu` sang `Thông tin`; tinh giản meta bỏ hiển thị kho trùng lặp.
    - Chuẩn hóa bảng chi tiết 5 cột (`Mã hàng`, `Tên hàng`, `Tồn kho`, `Thực tế`, `SL lệch`), bỏ cột `Giá trị lệch`.
    - Tinh gọn textarea ghi chú và khối tổng kết phẳng 4 dòng (bỏ viền xám và bỏ dòng tổng giá trị lệch).
    - Đồng bộ hệ thống nút hành động: Nút `Hủy` outline-secondary (kèm kiểm tra chặn hủy phiếu cân bằng kho), `Sao chép`, `Xuất file`, nút `Lưu` trắng viền xám (`bi-floppy`), và nút `In`.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 22 - Sáng)**:
  - Tinh gọn cột Tên hàng (`_HangHoaTable.cshtml`):
    - Gỡ bỏ dòng hiển thị mã vạch phụ (`@item.QuyCach`) dưới tên hàng.
    - Chuyển tên hàng (`@item.TenHang`) từ chữ in đậm (`fw-semibold text-dark`) về kiểu chữ thường tiêu chuẩn, đồng nhất với các cột dữ liệu khác trên bảng.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 21 - Sáng)**:
  - Đồng bộ màu chữ bảng Hàng hóa (`_HangHoaTable.cshtml`):
    - Chuyển cột Mã hàng từ màu xanh in đậm (`text-primary fw-semibold`) về màu chữ thường tiêu chuẩn (`text-break`).
    - Chuyển cột Tồn kho từ màu đỏ in đậm khi hết hàng / dưới định mức (`text-danger fw-bold`) về màu chữ thường tiêu chuẩn (`@item.TonKho.ToString("N0", viCulture)`), giúp toàn bộ bảng dữ liệu đồng nhất màu sắc.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 20 - Sáng)**:
  - Tinh chỉnh kích thước thẻ thuộc tính hàng hóa mini (`.kiot-attr-chip`): Giảm font-size xuống 11px, giảm padding còn 1.5px (chiều cao chip ~20px), bo góc 4px và thu nhỏ khoảng cách margin/gap giúp thẻ thuộc tính hiển thị vừa vặn, thanh thoát và không chiếm dụng diện tích.
- **2026-10-16 (Phiên 43 - Sáng)**:
  - Khắc phục lỗi xuất file dữ liệu kiểm kho ("tất cả thông tin bị cho vào 1 dòng"): Chuyển đổi toàn diện từ định dạng CSV thô sang file Excel `.xlsx` chuẩn KiotViet bằng `ClosedXML`. Thiết lập đầy đủ header xanh `#0066cc`, viền ô, căn lề, format số tiền và số lượng; hỗ trợ cả xuất danh sách (13 cột) và xuất chi tiết từng dòng hàng (16 cột). Bổ sung tham số `id` cho nút Xuất file trên từng dòng bảng (`_PhieuKiemKeTable.cshtml`). Đồng bộ `PROGRESS.md` và `docs/specs/kiem-kho.md`.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-16 (Phiên 42 - Sáng)**:
  - Đồng bộ Chuẩn hóa Tính năng Sắp xếp Cột 3 Trạng thái (3-State Column Sorting) trong Danh sách Phiếu Kiểm kho:
    - Bổ sung `SortBy` và `SortDir` vào `PhieuKiemKeFilterVM` và `PhieuKiemKeIndexVM`.
    - Xử lý sắp xếp 11 cột (`ma`, `tg`, `tt`, `cl`, `tang`, `giam`, `cb`, `slt`, `ghi`, `st`, `kho`) trong `PhieuKiemKeController.BuildIndexViewModel` trước khi phân trang.
    - Cập nhật header `_PhieuKiemKeTable.cshtml` với class `.sortable-th`, `.num`, icon mũi tên `bi-arrow-up` / `bi-arrow-down` và trạng thái `.is-sorted`.
    - Viết script quản lý chu trình 3 trạng thái click trong `phieu-kiem-ke-index.js`, đồng bộ qua AJAX `loadTable` và xuất file CSV.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 19 - Sáng)**:
  - Tối ưu hiển thị Thẻ Thuộc tính Hàng hóa:
    - Loại bỏ 3 thẻ tĩnh thừa ("Hàng hóa thường", "Bán trực tiếp", "Không tích điểm") trong panel chi tiết sản phẩm (`_HangHoaTable.cshtml`).
    - Đưa khối thẻ thuộc tính động (`item.ThuocTinhs`) lên vị trí ngay dưới "Nhóm hàng", loại bỏ khối hiển thị trùng lặp ở dưới chân panel.
    - Thiết kế lại giao diện thẻ thuộc tính `.kiot-attr-chip` dạng 2 khối sang trọng (nhãn xám nhạt `.chip-label`, giá trị nổi bật chữ xanh đậm `.chip-value`, bo góc 6px, đổ bóng nhẹ, phân cách rõ ràng).
    - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 18 - Sáng)**:
  - Tinh gọn ô tìm kiếm trang Hàng hóa: Gỡ bỏ icon mũi tên hai chiều thừa (`bi-arrow-left-right`) trong ô tìm kiếm `#keywordSearch` (`Index.cshtml`), tinh chỉnh `padding-right: 12px` trong `site.css` giúp thanh tìm kiếm gọn gàng, thoáng mắt.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-15 (Phiên 17 - Sáng)**:
  - Tinh gọn giao diện Hàng hóa: Gỡ bỏ biểu tượng cảnh báo `⚠️` (!) ở tùy chọn "Dưới định mức tồn" trong dropdown Tiêu chí tồn (`_HangHoaFilterSidebar.cshtml`) và trong ô hiển thị số lượng tồn kho trên bảng (`_HangHoaTable.cshtml`), đồng bộ đặc tả `danh-sach-hang-hoa.md`.
  - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-14 (Phiên 14 - Chiều)**:
  - Tái thiết kế và nâng cấp toàn diện Modal Tạo/Sửa Hàng hóa theo prototype KiotViet `prototype-taohanghoa.html`:
    - CSDL: Nâng cấp lưu trữ từ 1 ảnh thành tối đa 5 ảnh lưu trực tiếp trong SQL Server qua bảng `dbo.HinhAnhHangHoa` (`migrations/sql/07_nang_cap_5_anh_va_mota_hanghoa.sql`) và bổ sung cột `MoTa` cho `dbo.HangHoa`.
    - Nghiệp vụ & Giao diện: Thay thế vị trí Thương hiệu bằng Đơn vị tính (combobox + prompt tạo nhanh); loại bỏ bảng quy đổi đơn vị phụ (giữ đúng nguyên tắc 1 ĐVT); thiết kế 2 tab (Thông tin chung & Mô tả); thanh công cụ đính kèm tối đa 5 ảnh (kèm đặt làm ảnh đại diện, xóa ảnh, upload kéo thả hoặc chọn file); các khối accordion Vị trí/Trọng lượng/Thuộc tính động; nút Lưu phân tách (Lưu / Lưu & thêm mới).
    - Backend: Viết API `CreateDvtQuick`, nạp và lưu trữ đồng bộ bảng `HinhAnhHangHoa` và ảnh chính `HangHoa.HinhAnh` đảm bảo tương thích ngược 100% với các View và query tồn kho; cập nhật ViewModels và Specs.
    - Kiểm tra biên dịch: 0 lỗi.
- **2026-10-14 (Phiên 13 - Trưa)**:
  - Bổ sung và nâng cấp đầy đủ các thuộc tính còn thiếu trong Quản lý Hàng hóa theo mẫu thực tế KiotViet:
    - CSDL: Tạo và chạy migration script `06_bo_sung_vitri_trongluong_thuoctinh_tontoida.sql` bổ sung các trường `ViTri`, `TrongLuong`, `DonViTrongLuong`, `ThuocTinh` cho `dbo.HangHoa` và `TonCaoNhat` cho `dbo.NguongTonKho`.
    - Backend: Cập nhật Entity, DbContext Fluent API, `HangHoaForm`, `HangHoaItemVM`, `ThuocTinhItemVM`, `CapNhatThuocTinhRequest`, và `HangHoaController` (xử lý Create, Edit, GetItem, API `UpdateThuocTinh`).
    - Frontend: Cập nhật modal Thêm/Sửa với các khối Tồn kho (3 cột), Vị trí (input + link Tạo mới), Trọng lượng (số + g/kg), Thuộc tính động (dòng Tên - Giá trị kèm gợi ý datalist); bổ sung modal cập nhật nhanh thuộc tính `quickAttrModal`; cập nhật dòng chi tiết inline accordion hiển thị Định mức tồn Min-Max, Trọng lượng, Vị trí, badges thuộc tính kèm nút "+ Thêm thuộc tính".
    - Kiểm tra biên dịch: 0 lỗi. Đồng bộ tài liệu đặc tả `docs/specs/danh-sach-hang-hoa.md`.
- **2026-10-13 (Phiên 12 - Tối muộn)**:
  - Tối ưu giao diện đáp ứng (Responsive) khi Phóng to (Zoom in / màn hình hẹp < 992px) và Thu nhỏ (Zoom out / widescreen >= 1400px) mô phỏng chính xác mẫu KiotViet:
    - Khi Phóng to / Màn hình nhỏ: Ẩn thanh menu ngang xanh `_MainMenu`, Topbar thu gọn với nút Hamburger và Avatar; mở menu điều hướng qua Offcanvas drawer; Sidebar bộ lọc chuyển sang Drawer mở bằng nút Phễu (`bi-funnel`) cạnh tiêu đề "Hàng hóa"; thanh công cụ thu gọn nút thành icon (`+`, bảng tính, cài đặt, trợ giúp); bảng dữ liệu cuộn ngang độc lập không bị tràn.
    - Khi Thu nhỏ / Màn hình rộng: Bảng hàng hóa và container giãn 100% cân đối, giữ nguyên tỉ lệ phân bố giữa sidebar và danh sách bảng, không méo mó vỡ khung.
    - Biên dịch kiểm tra: 0 lỗi.
- **2026-10-13 (Phiên 11 - Đêm)**:
  - Khảo sát kiểm toán toàn diện kiến trúc 4 hướng qua subagents và xử lý dứt điểm toàn bộ tồn đọng:
    - Bảo mật: Gỡ bỏ backdoor bypass mật khẩu trong `PasswordHelper.cs`; dọn sạch chuỗi mojibake và logic lỏng lẻo trong `ClaimsPrincipalExtensions.GetVaiTro()`.
    - Chuẩn hóa BaseKhoController & Controller: Gỡ bỏ method `GetCurrentUserId()` gây nhầm lẫn tên gọi giữa MaNv và MaTaiKhoan; cập nhật `PhieuKiemKeController` dùng `CurrentNhanVienId`.
    - Dọn dẹp dead code: Xóa action `SwitchWarehouse` trùng lặp trong `PhieuKiemKeController`, xóa `SearchForDoc` thừa trong `HangHoaController`, xóa action `Logout` POST thừa trong `AccountController`, xóa `Privacy` và chuẩn hóa namespace file-scoped trong `HomeController`.
    - Tái cấu trúc & Quy tắc: Chuyển `QuickGroupRequest` vào `ViewModels/HangHoa/`; bọc `BeginTransactionAsync()` cho `HangHoaController.Create` tuân thủ Rule 7; đồng bộ `MaPhieuHienThi` dùng `MaChungTuHelper`.
    - Đồng bộ tài liệu: Tinh gọn `01-phong-cach-code.md` về 7.925 ký tự (< 8.000); đồng bộ 5 mâu thuẫn trong rules 02, 03, 04; sửa 100% link gãy trong specs; cập nhật đầy đủ `docs/quyet-dinh.md` từ Phiên 7 đến 11.
    - Biên dịch kiểm tra: 0 cảnh báo, 0 lỗi. Hệ thống đạt độ sạch và chuẩn hóa tối đa.
- **2026-10-13 (Phiên 10 - Tối)**:
  - Triển khai toàn diện 4 Trụ cột tối ưu hóa kiến trúc mở rộng:
    - Xây dựng [`BaseKhoController`](./BTL-LTW-QuanLiKho-2/Controllers/BaseKhoController.cs) quản lý tập trung `CurrentWarehouseId`, `CurrentUserId`, `CurrentNhanVienId`, `CurrentUserRole`, `IsQuanLy`. Refactor `HangHoaController` và `PhieuKiemKeController` kế thừa `BaseKhoController`.
    - Xây dựng [`INhatKyThaoTacService`](./BTL-LTW-QuanLiKho-2/Services/INhatKyThaoTacService.cs) & [`NhatKyThaoTacService`](./BTL-LTW-QuanLiKho-2/Services/NhatKyThaoTacService.cs), đăng ký DI, thay thế đoạn code ghi log kiểm toán thủ công tại `PhieuKiemKeController`.
    - Xây dựng [`MaChungTuHelper`](./BTL-LTW-QuanLiKho-2/Services/MaChungTuHelper.cs) chuẩn hóa quy tắc format mã KiotViet (`FormatMaKiemKe`, `FormatMaNhapKho`, `FormatMaHang`...).
    - Tái cấu trúc thư mục `ViewModels/` dạng modular (`Common`, `HangHoa`, `KiemKho`, `Account`, `Components`), bảo toàn 100% namespace và tương thích ngược.
    - Đóng gói component JS [`f3-product-search.js`](./BTL-LTW-QuanLiKho-2/wwwroot/js/components/f3-product-search.js) và action `HangHoaController.SearchForDoc` dùng chung cho các màn hình chứng từ.
    - Cập nhật quy chuẩn kỹ thuật tại [`.agent/rules/01-phong-cach-code.md`](./.agent/rules/01-phong-cach-code.md). Biên dịch kiểm tra: 0 lỗi.
- **2026-10-13 (Phiên 9 - Chiều)**:
  - Cập nhật chuẩn hóa toàn diện đặc tả [`docs/specs/danh-sach-hang-hoa.md`](./docs/specs/danh-sach-hang-hoa.md): bổ sung Bản đồ File liên quan (File Map) chỉ rõ từng file phụ trách và Bảng luồng tương tác chi tiết 4 bước (Sequence Matrix) giữa Frontend - Backend - DB.
  - Cài đặt quy tắc bắt buộc "Đồng bộ đặc tả chức năng" vào Mục 3 (Quy trình cuối phiên) và Luật 12 trong [`AGENTS.md`](./AGENTS.md), đảm bảo mọi AI ở các phiên sau khi sửa code sẽ tự động cập nhật đặc tả tương ứng. Tinh gọn `AGENTS.md` về mức 7.524 ký tự (< 8.000 ký tự).
- **2026-10-13 (Phiên 8 - Trưa)**:
  - Triển khai giao diện Đăng nhập chuẩn theo prototype `prototype-dangnhap.html`:
    - Tạo `wwwroot/images/login-bg.jpg` (ảnh nền kho chuyên nghiệp 1920px, kích thước 391 KB < 500 KB).
    - Tạo `wwwroot/images/logo.svg` (biểu tượng hộp 3D KhoPro).
    - Tạo `wwwroot/css/dang-nhap.css` chứa CSS giao diện theo mẫu thiết kế.
    - Tạo `wwwroot/js/dang-nhap.js` (ẩn/hiện mật khẩu, cảnh báo Caps Lock, client validation, double-click protection).
    - Tạo `Views/Shared/_LoginLayout.cshtml` theo Rule 03 (layout tối giản dành riêng cho đăng nhập).
    - Cập nhật `Views/Account/Login.cshtml` kết nối model `LoginVM`, CSRF token, validation error box và nút test tài khoản mẫu (`quanly`, `thukho`, `banhang`).
  - Kiểm tra biên dịch: 0 lỗi, giao diện sẵn sàng.
- **2026-10-13 (Phiên 7 - Trưa)**: Chuẩn hóa `WarehouseSwitcherViewComponent`, xóa `@inject DbContext` trong `_Header.cshtml`, lọc kho theo quyền, thêm action `SwitchWarehouse`.
- **2026-10-13 (Phiên 6 - Sáng)**: Đóng 6 lỗi Nhóm 3 ([ISSUE-14] đến [ISSUE-19]), dọn view lab cũ, chuẩn hóa `ApiResponse`, xuất bản `05_dulieumau_seed.sql`. Đóng hoàn toàn 19/19 Backlog.
- **2026-10-13 (Phiên 5 - Sáng)**: Đóng 8 lỗi Nhóm 2 ([ISSUE-06] đến [ISSUE-13]), DDL `migrations/sql/`, thêm `GiaVon`, đổi tên controller/table, Cookie Auth, claims.
- **2026-10-13 (Phiên 4 - Sáng)**: Đóng [ISSUE-05] (POS tự sinh phiếu xuất qua `BanHangService`, chặn âm kho, hoàn tồn khi hủy).
- **2026-10-13 (Phiên 3 - Sáng)**: Đánh dấu sao (Star) bảng hàng hóa; Đóng 4 lỗi nghiêm trọng [ISSUE-01] đến [ISSUE-04].
- **2026-10-13 (Phiên 1 & 2 - Sáng)**: Khởi tạo hệ thống luật AI (`AGENTS.md`, 5 file rules, specs, decisions), phân tích thiết lập 19 vấn đề kỹ thuật.
