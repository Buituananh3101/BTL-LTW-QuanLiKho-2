# 03. Giao diện, Layout & Thành phần dùng chung

## 1. Cấu trúc Layout chuẩn KiotViet

Hệ thống sử dụng **duy nhất một Layout chính** cho toàn bộ các màn hình nghiệp vụ:
- Đường dẫn: [`Views/Shared/_Layout.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/Shared/_Layout.cshtml)
- Cấu hình toàn cục tại: [`Views/_ViewStart.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/_ViewStart.cshtml) (`@{ Layout = "_Layout"; }`).
- Các View con **tuyệt đối không khai báo lại `Layout = ...`**.

### 1.1. Khung trang trong `_Layout.cshtml`:
Gồm Topbar cố định (`_Header`, `_MainMenu`), vùng thân `@RenderBody()`, modal `<partial name="_KiotPromptModal" />` và scripts `jquery`, `bootstrap`, `site.js` (`KiotToast`, `KiotNumber`, `KiotPrompt`).

### 1.2. Layout ngoại lệ:
- `_LoginLayout.cshtml`: Cho trang Đăng nhập.
- `_PrintLayout.cshtml`: Cho in chứng từ khổ A4/A5.

---

## 2. Header & Bộ chọn Kho làm việc (`WarehouseSwitcher`)
- Vị trí: [`Views/Shared/_Header.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/Shared/_Header.cshtml).
- `WarehouseSwitcherViewComponent`: Nạp kho theo quyền (Quản lý: tất cả; Nhân viên: kho được giao).
- Lưu kho vào `Session["CurrentWarehouseId"]`. Đổi kho: gọi `POST /Account/SwitchWarehouse?warehouseId=X` rồi reload.
- Tạo chứng từ bắt buộc chọn kho cụ thể.

---

## 3. Mega-Menu ngang (`_MainMenu.cshtml`)
- Vị trí: [`Views/Shared/_MainMenu.cshtml`](../../BTL-LTW-QuanLiKho-2/Views/Shared/_MainMenu.cshtml).
- Nhóm menu: **Tổng quan**, **Hàng hóa**, **Mua hàng**, **Đơn hàng**, **Khách hàng**, **Báo cáo**, **Thiết lập**, **Bán hàng**.

---

## 4. Quy ước Partial View, ViewComponent & Script Section
- **Partial View**: Thành phần dùng chung hoặc tách HTML (`_Header.cshtml`, `_Pagination.cshtml`, bảng table...).
- **ViewComponent**: Giao diện cần truy vấn CSDL độc lập (`WarehouseSwitcherViewComponent`).
- **`@section Scripts`**: Chứa code JavaScript, jQuery, AJAX riêng của từng màn hình (`Index.cshtml`, `Create.cshtml`).

---

## 5. Quy chuẩn bảng dữ liệu & Modal
1. **Bảng dữ liệu**: Bọc trong table chuẩn KiotViet, header `table-light`, phân trang AJAX và tổng số dòng.
2. **Modal**: Cấu trúc KiotViet modal overlay, gửi AJAX JSON nhận `{ success, message }`, toast thông báo và cập nhật bảng.

---

## 6. Các Khối Giao Diện & Tiện Ích Dùng Chung (Lego Framework)

Hệ thống đóng gói các thành phần lặp lại thành các "mảnh ghép Lego" độc lập, gọi 1 dòng:

1. **Bộ lọc Ngày tháng (`_KiotDateFilter.cshtml` & `KiotDateFilterVM`)**:
   - Razor: `<partial name="_KiotDateFilter" model='new KiotDateFilterVM { TargetId = "date", Label = "Thời gian", PresetVal = "ALL", DateType = "past" }' />`
   - Client JS: `KiotFilter.initDateFilter("date", (from, to, text, val) => { ... })`
   - Backend: `var (from, to) = DateRangeHelper.Resolve(filter.DateFilterType, filter.FromDate, filter.ToDate);`
2. **Phân trang AJAX (`_Pagination.cshtml` & `PagedResult<T>`)**:
   - Razor: `<partial name="_Pagination" model="Model.PagedData" />` (kết hợp `BaseFilterParams`).
3. **Hệ thống Toast KiotViet (`site.js` & `site.css`)**:
   - Cú pháp: `KiotToast.success("..."), KiotToast.error("..."), KiotToast.warning("..."), KiotToast.info("...")`.
4. **Ẩn / Hiện Cột bảng (`KiotFilter.initColumnToggle`)**:
   - Cú pháp: `KiotFilter.initColumnToggle({ menuSelector: '#colMenu', tableSelector: '#myTable', storageKey: '...', defaultCols: {...}, extraColsCount: 2 });`
   - Tự động đồng bộ `colspan` dòng chi tiết và gán `.last-visible-col` khép kín viền bảng.
5. **Đánh dấu Sao Bookmark (`KiotFilter.bindStarToggle`)**:
   - Cú pháp: `KiotFilter.bindStarToggle('#myTable', '/Controller/ToggleFavorite', callback);`
6. **Ô nhập số tự định dạng (`.kiot-num` / `KiotNumber`)**:
   - Cú pháp: Input gắn class `kiot-num` tự format `1,000,000`, select all khi focus; đọc số sạch qua `KiotNumber.get('#input')`.
7. **Khối gập mở Accordion (`.kiot-sec` / `KiotCollapsible`)**:
   - Cấu trúc: Khối `.kiot-sec` chứa `.kiot-sec-h` (tiêu đề + icon `.kiot-chev`) và `.kiot-sec-b` (nội dung), click tự động đóng/mở.
8. **Nút lưu đa năng Split Button (`.kiot-split`)**:
   - Cấu trúc: Nút chính `.btn-main` + nút mũi tên `.caret` xổ menu `.kiot-menu`, tự đóng khi click ngoài.
9. **Dropdown Combobox có bút chì ✎ sửa/xóa trực tiếp (`KiotFilter.initCombobox`)**:
   - Cú pháp: `KiotFilter.initCombobox({ wrapSelector: '#wrap', items: [...], onEditItem: ... })` (vừa gõ tìm kiếm, vừa chọn, hover hiện icon bút chì ✎ sửa trực tiếp).
10. **Modal con dùng chung (`_KiotPromptModal.cshtml` / `KiotPrompt`)**:
    - Cú pháp: `KiotPrompt.open({ title, label, value, showDelete, onSave, onDelete })` (tạo mới nhanh / sửa ✎ / xóa dùng chung toàn hệ thống).
11. **Bộ lọc Khoảng giá trị Từ - Tới (`_KiotValueFilter.cshtml` & `KiotValueFilterVM`)**:
    - Razor: `<partial name="_KiotValueFilter" model='new KiotValueFilterVM("TongMua", "Tổng mua", "Giá trị")' />`
    - Client JS: `KiotFilter.initValueFilter("TongMua", (from, to) => { ... })`
12. **Bộ lọc Trạng thái Checkbox / Pills (`_KiotStatusFilter.cshtml` & `KiotStatusFilterVM`)**:
    - Razor: `<partial name="_KiotStatusFilter" model='new KiotStatusFilterVM("Trạng thái", "dotSt", options, KiotStatusRenderMode.Pills)' />`
    - Client JS: `KiotFilter.initStatusFilter('#pillsStatus', val => { ... })` (hỗ trợ cả `Checkbox` và `Pills`).
13. **Master-Detail Accordion & Tabs Bảng (`KiotFilter.initRowDetail`)**:
    - Cú pháp: `KiotFilter.initRowDetail({ tableSelector: '#myTable', rowSelector: 'tr.product-row', onTabChange: ... })` (click dòng bung drawer êm ái, chuyển tab, tự đồng bộ `colspan` và `.last-visible-col`).
14. **Thao tác Thực thể Danh mục (`KiotFilter.initEntityActions`)**:
    - Cú pháp: `KiotFilter.initEntityActions({ editSelector: '...', deleteSelector: '...', statusSelector: '...', onEdit: ..., onDelete: ..., onToggleStatus: ... })` (chuẩn hóa sự kiện Sửa, Xóa, Đổi trạng thái).
15. **Chọn Ngày Giờ Chứng Từ (`KiotFilter.initDateTimePicker`)**:
    - HTML: `<input id="fDate" class="f-date" />` + `<div id="dtPop" class="pop dtpop"></div>`
    - Client JS: `KiotFilter.initDateTimePicker({ inputSelector: '#fDate', popupSelector: '#dtPop', onChange: (d, text, iso) => ... })` (lịch tháng 2 chiều, slot giờ 24h, tự đồng bộ ô input `dd/MM/yyyy HH:mm`).
16. **Bộ máy Xuất Excel ClosedXML (`ExcelHelper.Export` & `ExcelHelper.ExportToExcel`)**:
    - Cú pháp: `ExcelHelper.Export("TenSheet", data, col => col.AddCenter("Mã", x => x.Ma).AddDateTime("Ngày", x => x.Ngay).AddNumber("SL", x => x.SL).AddCurrency("Tiền", x => x.Tien))` (tự động Header xanh KiotViet, kẻ viền bảng, format số/tiền/ngày, co giãn cột).

