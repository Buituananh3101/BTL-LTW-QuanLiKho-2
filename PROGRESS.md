# Tiến độ dự án

Cập nhật lần cuối: 2026-10-16 – Đồng bộ Tính năng Sắp xếp Cột 3 Trạng thái trong Kiểm kho (Phiên 42)

---

## Đang làm
- Kiểm tra người dùng nghiệm thu tính năng sắp xếp cột 3 trạng thái trong danh sách phiếu kiểm kho.

---

## Việc kế tiếp
- Tiếp tục rà soát và hoàn thiện các nghiệp vụ chứng từ kho tiếp theo (Nhập hàng, Xuất kho, Chuyển kho) dựa trên khuôn mẫu Hàng hóa và Kiểm kho.

---

## Đã xong
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
