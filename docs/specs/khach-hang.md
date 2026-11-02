# Đặc tả Chức năng: Quản lý Khách hàng (Customer Management)

> **Mục tiêu**: Quản lý danh mục Khách hàng chuẩn giao diện & nghiệp vụ thực tế KiotViet, đồng bộ 100% khuôn mẫu Hàng hóa (`HangHoa`). Tìm kiếm nhanh F3, thu gọn sidebar F4, lọc Segmented, Master-Detail Drawer 0ms, Modal Thêm/Sửa avatar <= 2MB, Accordion Lego `KiotCollapsible` tự động gập mở (Địa chỉ, Nhóm/Ghi chú, Xuất hóa đơn Cá nhân/Doanh nghiệp).

---

## 1. Kiến trúc File & CSDL liên quan

### 1.1. Bản đồ File liên quan (File Map)
- **Controller**: `Controllers/KhachHangController.cs` (CRUD, Filter AJAX, GetDetail, ToggleFavorite ⭐, CreateNhom, ExportExcel).
- **ViewModels (`ViewModels/KhachHang/`)**:
  - `KhachHangIndexVM.cs`: Dữ liệu phân trang, nhóm khách hàng, nhân viên tạo, tỉnh thành.
  - `KhachHangFilterParams.cs`: Tiêu chí lọc (Q, NhomKhachHangs, LoaiKhachHangSegment, GioiTinh, TgTaoFilter, SinhNhatFilter, NguoiTao, DaDanhDau, TongBan, No).
  - `KhachHangItemVM.cs`: 25 trường bảng & drawer (Mã KH, Tên KH, SĐT 1 & 2, Nhóm, Địa chỉ, Khu vực, MST, Sinh nhật, Giới tính, Doanh thu, Xuất HĐ).
  - `KhachHangFormVM.cs`: Form thêm/sửa, upload avatar <= 2MB, Data Annotations validation.
  - `KhachHangDetailVM.cs`: Chi tiết nạp vào drawer (Thông tin chung, Lưới thuộc tính 4 cột, Khối xuất HĐ, Lịch sử `DonBan`, Công nợ).
- **Views (`Views/KhachHang/`)**:
  - `Index.cshtml`: Khung trang `kiot-container`, topbar (F3, + Khách hàng, Xuất file, Tùy chọn 15 cột `#colMenu`, F4).
  - `_KhachHangFilterSidebar.cshtml`: Sidebar lọc (Nhóm KH có link `+ Tạo mới` & sửa ✎, Segmented buttons Loại KH & Giới tính, Ngày tạo, Sinh nhật, Người tạo, Doanh số & Nợ, Trạng thái).
  - `_KhachHangTable.cshtml`: Bảng AJAX fixed width, sắp xếp 3 trạng thái, cột sao ⭐, drawer chi tiết 0ms.
  - `_KhachHangModal.cshtml`: Modal `.hh-modal` (Top grid kèm avatar, Accordion gập mở Địa chỉ, Nhóm/Ghi chú, và Xuất HĐ Cá nhân ⇋ Doanh nghiệp).
  - `_KhachHangDetail.cshtml`: Inline Drawer hiển thị 3 Tabs (Thông tin đầy đủ, Lịch sử mua hàng, Nợ cần thu).
- **Styles & Scripts**: `wwwroot/css/hang-hoa-form.css`, `wwwroot/js/khach-hang-index.js`, `wwwroot/js/site.js` (Lego `KiotCollapsible`).

### 1.2. Bảng CSDL tham gia
- `NhomKhachHang`: `MaNhomKhachHang` (PK), `TenNhom`, `GhiChu`.
- `KhachHang`: `MaKH` (PK), `MaKhHienThi`, `TenKH`, `DienThoai`, `DienThoai2`, `NgaySinh`, `GioiTinh`, `Email`, `Facebook`, `HinhAnh`, `DiaChi`, `KhuVuc`, `PhuongXa`, `MaNhomKhachHang` (FK), `GhiChu`, `NgayTao`, `NguoiTao`, `DaDanhDau`, `LoaiKhachHang`, `TrangThai`, `XhdLoaiKhachHang`, `MaSoThue`, `XhdTenDonVi`, `SoCccd`, `TenNguoiMua`, `XhdDiaChi`, `XhdKhuVuc`, `XhdPhuongXa`, `XhdEmail`, `SoHoChieu`, `MaDvqhns`, `XhdSoDienThoai`, `TenNganHang`, `SoTaiKhoanNganHang`.
- `DonBan`: `MaDonBan` (PK), `MaKh` (FK), `MaKho`, `MaNvlap`, `NgayLap`, `TrangThai`.
- `ChiTietDonBan`: `MaDonBan`, `MaHang`, `SoLuong`, `DonGiaApDung`, `ChietKhau`.
- `KhoanThu`: `MaKhoanThu`, `MaDonBan`, `SoTien`, `NgayThu`.

---

## 2. Bảng Luồng Tương tác Nghiệp vụ Chi tiết

| Tên Luồng | 1. Tương tác | 2. Frontend (View / JS) | 3. Backend (Controller) | 4. CSDL & Phản hồi |
|---|---|---|---|---|
| **1. Nạp ban đầu** | Click menu "Khách hàng" | GET `/KhachHang` | `Index()` nạp trang 1, nhóm KH, người tạo | Render `Index.cshtml` |
| **2. Lọc đa tiêu chí** | Gõ F3 / Chọn Segmented Pills / Nhóm / Nợ | Debounce 300ms ➜ AJAX `GET /KhachHang/Filter` | `Filter(...)` lọc LINQ, tính tổng | Render `_KhachHangTable.cshtml` |
| **3. Xem chi tiết (0ms)** | Click dòng khách hàng | Bung drawer 0ms mượt mà, highlight viền xanh | Pre-rendered sẵn trong DOM | Mở drawer không lag |
| **4. Thêm mới KH** | Bấm "+ Khách hàng", chọn ảnh, điền form, "Lưu" | Modal `.hh-modal` ➜ `POST /KhachHang/Create` | Validate, lưu avatar, sinh mã `KH00001` | Ghi `KhachHang`, Transaction |
| **5. Chỉnh sửa KH** | Bấm "Chỉnh sửa" trong drawer | AJAX `GET GetItem?id=X` ➜ nạp form ➜ `POST Edit` | Validate & cập nhật | Cập nhật DB ➜ reload bảng |
| **6. Tạo nhóm nhanh** | Bấm "+ Tạo mới" nhóm | Popup `hhPromptNhomKhOv` ➜ `POST CreateNhom` | Kiểm tra trùng, lưu `NhomKhachHang` | Trả về ID & nạp dropdown |
| **7. Đánh dấu sao ⭐** | Click icon ⭐ trên dòng/header | AJAX `POST ToggleFavorite/id` | Đổi trạng thái `DaDanhDau` | Cập nhật UI sao vàng |
| **8. Xóa / Ngừng GD** | Bấm "Xóa" hoặc "Ngừng GD" | Modal `KiotConfirm` hỏi xác nhận | Kiểm tra `DonBans.Any(d => d.MaKh == id)` | Chặn xóa nếu có GD, cho ngừng GD |

---

## 3. Quy chuẩn Giao diện & Khối Lego Tái sử dụng

1. **Thanh Toolbar trên cùng**: Ô tìm kiếm F3, nút bấm `+ Khách hàng`, nút Xuất file Excel, nút Tùy chọn 15 cột dữ liệu (`#colMenu` 2 cột chia đôi 420px, lưu LocalStorage), nút Tải lại và F1 Trợ giúp.
2. **Cột lọc bên trái (Sidebar Filter)**:
   - Nhóm khách hàng: Lego `_KiotMultiSelectFilter` có link `+ Tạo mới` và icon ✎ sửa nhóm.
   - Segmented buttons: Loại khách hàng (`[Tất cả] [Cá nhân] [Công ty]`), Giới tính (`[Tất cả] [Nam] [Nữ]`).
   - Bộ lọc thời gian: Ngày tạo, Sinh nhật (`_KiotDateFilter`).
   - Bộ lọc khoảng tiền: Tổng bán, Nợ hiện tại (`_KiotValueFilter`).
   - Bộ lọc trạng thái: Lego `_KiotStatusFilter` (*Đang hoạt động*, *Ngừng giao dịch*).
3. **Bảng dữ liệu & Master-Detail (Khuôn mẫu Hàng hóa)**:
   - `table-layout: fixed; width: max-content; min-width: 100%`, font regular 13px, header sort 3 trạng thái.
   - Drawer 3 Tab (Thông tin, Lịch sử mua hàng, Nợ cần thu), khối Thông tin xuất HĐ kiểu `.supplier-box`.
4. **Modal Thêm/Sửa (Khuôn mẫu `_HangHoaModal.cshtml`)**:
   - Header `.hh-m-head`, Top grid với avatar tròn `<= 2MB`, 3 Accordion co giãn: Địa chỉ, Nhóm/Ghi chú, và Thông tin xuất HĐ (Radio Cá nhân / Doanh nghiệp tự động đổi trường bắt buộc và placeholder).

---

## 4. Các Quy tắc Nghiệp vụ Bất biến

1. **BẢO VỆ DỮ LIỆU ĐƠN HÀNG**: Tuyệt đối không xóa khách hàng đã có đơn bán (`DonBan`). Nếu có GD, chặn xóa và gợi ý chuyển sang "Ngừng giao dịch".
2. **TỰ ĐỘNG SINH MÃ KHÁCH HÀNG**: Tiền tố `KH` + 5 số tự tăng (`KH00001`, `KH00002`...). Nếu người dùng nhập mã riêng, kiểm tra chống trùng lặp.
3. **TÍNH TOÁN CÔNG NỢ & TỔNG BÁN**:
   - `TongBan`: Tổng giá trị các đơn bán của khách hàng = `Sum(SoLuong * DonGiaApDung - ChietKhau)`.
   - `DaThu`: Tổng tiền thu từ các phiếu thu liên kết `KhoanThu`.
   - `NoHienTai`: `TongBan - DaThu`.
4. **GIAO DỊCH TOÀN VẸN & LOGGING**: Mọi thao tác Thêm/Sửa/Đổi trạng thái bọc trong Transaction và ghi vết nhật ký vào `NhatKyThaoTac`.

---

## 5. Checklist Nghiệm thu

- [x] Biên dịch dự án hoàn tất với 0 Errors.
- [x] Tạo bảng `NhomKhachHang` và bổ sung 25 cột vào bảng `KhachHang` an toàn.
- [x] Modal Thêm/Sửa chuẩn 4 ảnh KiotViet (Avatar tròn, Accordion Địa chỉ, Nhóm/Ghi chú, Thông tin xuất HĐ).
- [x] Sidebar lọc đa năng hỗ trợ Segmented buttons (Loại KH, Giới tính), nhóm KH có tạo mới nhanh.
- [x] Bảng dữ liệu font phẳng regular 13px, hỗ trợ sort 3 trạng thái, ⭐ yêu thích và tùy chọn 15 cột.
- [x] Click dòng mở Inline Drawer 0ms mượt mà, chuyển 3 tab ngăn nắp.
- [x] Chặn xóa khách hàng có đơn bán bằng hộp thoại `KiotConfirm`.
- [x] Xuất file Excel đầy đủ các cột thông tin khách hàng.
