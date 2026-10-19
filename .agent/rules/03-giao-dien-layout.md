# 03. Giao diện, Layout & Thành phần dùng chung

## 1. Cấu trúc Layout chuẩn KiotViet
- Duy nhất một Layout chính: [`Views/Shared/_Layout.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/Shared/_Layout.cshtml) qua `_ViewStart.cshtml`. Cấm khai báo lại trong View con.
- Ngoại lệ: `_LoginLayout.cshtml` (Đăng nhập), `_PrintLayout.cshtml` (In A4/A5).
- Khung trang: Topbar (`_Header`, `_MainMenu`), `@RenderBody()`, `_KiotPromptModal`, scripts `jquery`, `site.js`, `kiot-filter.js`.

## 2. Header & Bộ chọn Kho (`WarehouseSwitcher`)
- Vị trí: [`Views/Shared/_Header.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml).
- `WarehouseSwitcherViewComponent`: Nạp kho theo phân quyền, đổi kho qua `POST /Account/SwitchWarehouse?warehouseId=X`.

## 3. Mega-Menu ngang (`_MainMenu.cshtml`)
- Menu: **Tổng quan**, **Hàng hóa**, **Mua hàng**, **Đơn hàng**, **Khách hàng**, **Báo cáo**, **Thiết lập**, **Bán hàng**.

## 4. Quy ước View & Scripts
- **Partial View**: Tách HTML dùng chung (`_Header`, `_Pagination`, partial table...).
- **ViewComponent**: Cần truy vấn CSDL độc lập (`WarehouseSwitcherViewComponent`).
- **`@section Scripts`**: Chứa code JS, AJAX riêng của từng màn hình.

## 5. Quy chuẩn bảng & Modal
- **Bảng dữ liệu**: Chuẩn KiotViet, header `table-light`, phân trang AJAX.
- **Modal**: Overlay KiotViet, gửi AJAX JSON nhận `{ success, message }`, toast thông báo.

---

## 6. Các Khối Giao Diện & Tiện Ích Dùng Chung (Lego Framework)

Hệ thống đóng gói các thành phần lặp lại thành các "mảnh ghép Lego" độc lập, gọi 1 dòng:

1. **Bộ lọc Ngày tháng (`_KiotDateFilter.cshtml` & `KiotDateFilterVM`)**:
   - Razor: `<partial name="_KiotDateFilter" model='new KiotDateFilterVM { TargetId = "date" }' />`
   - Client JS: `KiotFilter.initDateFilter("date", (from, to, text, val) => { ... })`
   - Backend: `var (from, to) = DateRangeHelper.Resolve(filter.DateFilterType, filter.FromDate, filter.ToDate);`
2. **Phân trang AJAX (`_Pagination.cshtml` & `PagedResult<T>`)**:
   - Razor: `<partial name="_Pagination" model="Model.PagedData" />` (kết hợp `BaseFilterParams`).
3. **Hệ thống Toast KiotViet (`site.js` & `site.css`)**:
   - Cú pháp: `KiotToast.success("..."), KiotToast.error("..."), KiotToast.warning("..."), KiotToast.info("...")`.
4. **Ẩn / Hiện Cột bảng (`KiotFilter.initColumnToggle`)**:
   - Cú pháp: `KiotFilter.initColumnToggle({ menuSelector: '#colMenu', tableSelector: '#myTable', storageKey: '...', defaultCols: {...} });`
5. **Đánh dấu Sao Bookmark (`KiotFilter.bindStarToggle`)**:
   - Cú pháp: `KiotFilter.bindStarToggle('#myTable', '/Controller/ToggleFavorite', callback);`
6. **Ô nhập số tự định dạng (`.kiot-num` / `KiotNumber`)**:
   - Cú pháp: Class `kiot-num` tự format `1,000,000`, select all khi focus; đọc số qua `KiotNumber.get('#input')`.
7. **Khối gập mở Accordion (`.kiot-sec` / `KiotCollapsible`)**:
   - Cấu trúc: Khối `.kiot-sec` chứa `.kiot-sec-h` (tiêu đề + `.kiot-chev`) và `.kiot-sec-b` (nội dung).
8. **Nút lưu đa năng Split Button (`.kiot-split`)**:
   - Cấu trúc: Nút chính `.btn-main` + mũi tên `.caret` xổ menu `.kiot-menu`, tự đóng khi click ngoài.
9. **Dropdown Combobox có bút chì ✎ (`KiotFilter.initCombobox`)**:
   - Cú pháp: `KiotFilter.initCombobox({ wrapSelector: '#wrap', items: [...], onEditItem: ... })` (hỗ trợ hiển thị cây phân cấp `item.level` với thụt lề 16px và tiền tố `└─`).
10. **Modal con dùng chung (`_KiotPromptModal.cshtml` / `KiotPrompt`)**:
    - Cú pháp: `KiotPrompt.open({ title, label, value, showDelete, onSave, onDelete })` (tạo mới / sửa ✎ / xóa).
11. **Bộ lọc Khoảng giá trị Từ - Tới (`_KiotValueFilter.cshtml` & `KiotValueFilterVM`)**:
    - Razor: `<partial name="_KiotValueFilter" model='new KiotValueFilterVM("TongMua", "Tổng mua", "Giá trị")' />`
    - Client JS: `KiotFilter.initValueFilter("TongMua", (from, to) => { ... })`
12. **Bộ lọc Trạng thái Checkbox / Pills (`_KiotStatusFilter.cshtml` & `KiotStatusFilterVM`)**:
    - Razor: `<partial name="_KiotStatusFilter" model='new KiotStatusFilterVM("Trạng thái", "dotSt", options, KiotStatusRenderMode.Pills)' />`
    - Client JS: `KiotFilter.initStatusFilter('#pillsStatus', val => { ... })` (hỗ trợ cả `Checkbox` và `Pills`).
13. **Master-Detail Accordion & Tabs Bảng (`KiotFilter.initRowDetail`)**:
    - Cú pháp: `KiotFilter.initRowDetail({ tableSelector: '#myTable', rowSelector: 'tr.product-row', onTabChange: ... })` (bung drawer êm ái, chuyển tab, tự đồng bộ `colspan`).
14. **Thao tác Thực thể Danh mục (`KiotFilter.initEntityActions`)**:
    - Cú pháp: `KiotFilter.initEntityActions({ editSelector: '...', deleteSelector: '...', statusSelector: '...', onEdit: ..., onDelete: ..., onToggleStatus: ... })`.
15. **Chọn Ngày Giờ Chứng Từ (`KiotFilter.initDateTimePicker`)**:
    - Client JS: `KiotFilter.initDateTimePicker({ inputSelector: '#fDate', popupSelector: '#dtPop', onChange: (d, text, iso) => ... })` (lịch tháng 2 chiều, slot giờ 24h, tự đồng bộ `dd/MM/yyyy HH:mm`).
16. **Bộ máy Xuất Excel ClosedXML (`ExcelHelper.Export` & `ExcelHelper.ExportToExcel`)**:
    - Cú pháp: `ExcelHelper.Export("Sheet", data, col => col.AddCenter("Mã", x => x.Ma).AddDateTime("Ngày", x => x.Ngay).AddNumber("SL", x => x.SL).AddCurrency("Tiền", x => x.Tien))`.
17. **Tìm Kiếm Hàng Hóa F3 (`KiotFilter.initProductSearch`)**:
    - Client JS: `KiotFilter.initProductSearch({ inputSelector: '#productSearchInput', dropdownSelector: '#autocompleteDropdown', apiUrl: '...', getWarehouseId: () => whId, onSelect: p => addProduct(p) })` (phím F3, debounce, Up/Down/Enter/Esc, quét barcode, hiển thị tồn kho & giá).
18. **Lưới Dòng Chứng Từ (`KiotFilter.initDocGrid`)**:
    - Cú pháp: `KiotFilter.initDocGrid({ tableBodySelector: '#itemsTableBody', emptyBoxSelector: '#emptyLineBox', tableScrollSelector: '#tableScrollWrap', rowSelector: '.item-line-row', onRecalc: () => recalcTotals() })` (tự đánh STT, toggle rỗng/có dữ liệu, xóa kèm KiotConfirm).
19. **Bộ Tải & Nén Ảnh Canvas (`KiotFilter.initImageUploader`)**:
    - Cú pháp: `KiotFilter.initImageUploader({ mainBoxSelector: '#hhImgMain', thumbsBoxSelector: '#hhThumbs', fileInputSelector: '#hhImgFile', modalSelector: '#hhModalOv', maxImages: 5, maxDimension: 1200, quality: 0.88 })` (nén Canvas nền trắng, kéo thả drag-drop, dán clipboard Ctrl+V, đổi ảnh chính, xóa kèm KiotConfirm).
20. **Khung Trang Danh Sách Boilerplate (`KiotFilter.createListPage`)**:
    - Cú pháp: `KiotFilter.createListPage({ containerSelector: '#kiotContainer', tableSelector: '#transferTable', tableWrapperSelector: '#tableContainer', searchInputSelector: '#keywordSearch', storageKeyCols: '...', defaultCols: {...}, dateFilterId: 'date', rowDetailOptions: {...}, buildParams: (p, s) => {}, onPaintFilters: s => {} })` (tự động hóa 100% boilerplate lọc AJAX, phân trang, sort 3 trạng thái, bookmark sao, phím tắt F3/F4, sidebar).


