# Đặc tả Chức năng: Quản lý Người dùng & Phân quyền Kho

> **Mô-đun**: Thiết lập hệ thống ➜ Người dùng & Phân quyền  
> **Tài liệu tham chiếu**: [`.agent/rules/04-xac-thuc-phan-quyen.md`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/.agent/rules/04-xac-thuc-phan-quyen.md) | [`AGENTS.md`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/AGENTS.md)

---

## 1. Mục tiêu & Phạm vi nghiệp vụ

- **Mục tiêu**: Cung cấp giao diện trực quan chuẩn chuyên nghiệp để Quản lý quản lý nhân sự, tài khoản đăng nhập, vai trò (Quản lý, Bán hàng, Thủ kho) và phân quyền chi nhánh kho phụ trách.
- **Phạm vi truy cập**: URL `/NguoiDung`. Phân quyền bắt buộc: Chỉ vai trò **Quản lý** (`[Authorize(Roles = "Quản lý")]`) mới có quyền truy cập. Các vai trò khác bị từ chối truy cập (HTTP 403).
- **Hành động nghiệp vụ**:
  - Xem danh sách tài khoản kèm bộ lọc tìm kiếm theo từ khóa (tên đăng nhập, họ tên nhân viên, SĐT), theo Vai trò, Trạng thái (Hoạt động / Bị khóa) và Kho phụ trách.
  - Thêm mới tài khoản: Tạo đồng thời hồ sơ `NhanVien`, `TaiKhoan` (mã hóa SHA-256) và bảng ánh xạ `TaiKhoanKho`.
  - Chỉnh sửa tài khoản: Cập nhật thông tin nhân viên, vai trò, trạng thái và đồng bộ danh sách kho phụ trách.
  - Xóa người dùng: Kiểm tra phát sinh chứng từ trên 7 bảng nghiệp vụ (Nhập, Xuất, Chuyển, Kiểm kê, Điều chỉnh, Bán hàng, Trả hàng nhập). Nếu chưa có giao dịch thì xóa vĩnh viễn; nếu đã có chứng từ thì chặn xóa và hướng dẫn người dùng chuyển sang Khóa tài khoản để bảo toàn lịch sử.
  - Đổi / Đặt lại mật khẩu (Reset password) nhanh.

---

## 2. Các bảng CSDL & ViewModels

### 2.1. Bảng CSDL (Database First)
- `TaiKhoan`: Thông tin đăng nhập (`TenDangNhap`, `MatKhauHash`, `DangHoatDong`, `MaVaiTro`, `MaNhanVien`).
- `NhanVien`: Hồ sơ nhân sự (`HoTen`, `DienThoai`, `Email`, `DiaChi`, `GhiChu`, `NgayVaoLam`, `TrangThai`).
- `VaiTro`: Danh mục vai trò (`TenVaiTro`: Quản lý, Thủ kho, Bán hàng).
- `TaiKhoanKho`: Bảng liên kết nhiều-nhiều (`MaTaiKhoan`, `MaKho`, `NgayPhanCong`).
- `Kho`: Danh mục kho hàng để gán quyền.
- `NhatKyThaoTac`: Ghi vết hành động (Thêm/Sửa/Khóa/Reset mật khẩu).

### 2.2. ViewModels (`ViewModels/NguoiDung/`)
- `NguoiDungFilterParams.cs`: Kế thừa `BaseFilterParams` (`Q`, `VaiTroIds`, `TrangThais`, `KhoIds`).
- `NguoiDungItemVM.cs`: Dòng hiển thị bảng (tên đăng nhập, họ tên, vai trò, ghi chú, danh sách kho, trạng thái, cờ `IsCurrentUser`).
- `NguoiDungIndexVM.cs`: Model trang Index chứa `PagedData`, `Filter`, danh sách vai trò, danh sách kho, số lượng thống kê.
- `NguoiDungFormVM.cs`: Model form thêm mới và cập nhật người dùng kèm Ghi chú và Data Annotations validation.
- `DoiMatKhauVM.cs`: Model form đổi/đặt lại mật khẩu.

---

## 3. Luồng màn hình & Giao diện (Chuẩn giao diện hệ thống)

### 3.1. Màn hình Danh sách (`Index.cshtml`)
- **Topbar**: Nút `F3` tìm kiếm nhanh, nút `+ Người dùng` (`#btnOpenCreateUser`), nút `F4` mở/đóng sidebar lọc.
- **Sidebar lọc trái (`_NguoiDungFilterSidebar.cshtml`)**: Lọc theo từ khóa, Vai trò (`_KiotMultiSelectFilter`), Kho phụ trách (`_KiotMultiSelectFilter`), Trạng thái (`_KiotStatusFilter`).
- **Bảng dữ liệu AJAX (`_NguoiDungTable.cshtml`)**:
  - Sắp xếp 3 trạng thái (`sortable-th`): Tên đăng nhập, Tên nhân viên, Vai trò, Trạng thái.
  - Co giãn 100% không cuộn ngang (`table-layout: fixed`, `overflow-x: hidden`). Cột Kho làm việc tự động co giãn theo không gian còn lại.
  - Phân trang AJAX: Tái sử dụng Lego `_Pagination.cshtml`.

### 3.2. Modal Thêm/Sửa người dùng (`_NguoiDungModal.cshtml`)
- Header: Tiêu đề, nút đóng `X`. Căn giữa viewport tuyệt đối (`display: flex; align-items: center; justify-content: center; margin: auto;`) cho cả Modal Thêm/Sửa `#userModalOv` và Modal Đổi mật khẩu `#pwdModalOv`.
- Body: Thông tin tài khoản & nhân sự (Tên đăng nhập, Mật khẩu, Họ tên, SĐT, Email), trường Vai trò người dùng sử dụng Custom Single-Select chuẩn Danh sách hàng hóa (`.hh-cs-wrap`, `.hh-cs-box`, `.hh-cs-dropdown`, icon checkmark xanh), Accordion Địa chỉ và Accordion Phân quyền kho sử dụng Dropdown Multi-Select chuẩn Lego Danh sách hàng hóa (`.kiot-multiselect-box`, `.kiot-ms-dropdown`, tìm kiếm chi nhánh con, tag pills có nút xóa nhanh & huy hiệu số lượng).
- Footer: Checkbox Trạng thái "Đang hoạt động", nút Bỏ qua và nút Lưu người dùng.

### 3.3. Modal Đổi mật khẩu nhanh (`_DoiMatKhauModal.cshtml`)
- Đặt lại mật khẩu nhanh từ bảng với ô xác nhận và icon mắt ẩn/hiện.

---

## 4. Quy tắc nghiệp vụ & Bảo mật

1. **Bảo mật truy cập**: Áp dụng `[Authorize(Roles = "Quản lý")]` trên `NguoiDungController`. Menu chỉ hiển thị cho `Quản lý`.
2. **Mã hóa mật khẩu**: Sử dụng `SHA-256` đồng bộ qua `PasswordHelper.HashPassword`.
3. **Chống tự xóa / tự khóa**: Chặn tự xóa và tự khóa tài khoản của chính mình. Chặn xóa tài khoản admin gốc.
4. **Quy tắc Xóa người dùng an toàn**: Chỉ cho phép xóa vĩnh viễn khi chưa phát sinh chứng từ trong 7 bảng nghiệp vụ (`PhieuNhap`, `PhieuXuat`, `PhieuChuyenKho`, `PhieuKiemKe`, `PhieuDieuChinh`, `DonBan`, `PhieuTraHangNhap`). Nếu đã có chứng từ, hệ thống chặn xóa và hỏi người dùng có muốn chuyển sang Khóa tài khoản không.
5. **Phân quyền kho**: Vai trò Quản lý có toàn quyền trên mọi kho. Vai trò Thủ kho/Bán hàng chỉ truy cập các kho trong `TaiKhoanKho`.
6. **Giao dịch toàn vẹn**: Bọc lưu đa bảng (`NhanVien`, `TaiKhoan`, `TaiKhoanKho`) trong `BeginTransactionAsync()`.
7. **Nhật ký thao tác**: Ghi vết đầy đủ qua `INhatKyThaoTacService`.

---

## 5. Danh mục Khối Lego tái sử dụng (Luật 10 AGENTS.md)

- [x] **Modal Thao tác & Xác nhận**: `_NguoiDungModal.cshtml` chuẩn khuôn mẫu Hàng hóa + `KiotConfirm` (`window.KiotConfirm.show()`) khi Xóa / Khóa tài khoản.
- [x] **Bộ lọc Dropdown chọn nhiều**: `_KiotMultiSelectFilter.cshtml` cho vai trò và kho.
- [x] **Bộ lọc Trạng thái checkbox**: `_KiotStatusFilter.cshtml` cho trạng thái.
- [x] **Phân trang AJAX**: `_Pagination.cshtml` + `BaseFilterParams`.
- [x] **Thông báo Toast**: `KiotToast.success()`, `KiotToast.error()`.

---

## 6. Ma trận Kiểm thử 3 Tài khoản Hạt giống

| Tài khoản | Mật khẩu | Vai trò | Quyền truy cập `/NguoiDung` | Quyền chuyển đổi Kho |
|---|---|---|---|---|
| `quanly` | `123456` | Quản lý | Toàn quyền (CRUD, Reset MK, Khóa TK) | Toàn bộ các kho |
| `thukho` | `123456` | Nhân viên kho | Bị chặn (403 ➜ `/Account/AccessDenied`) | Chỉ các kho được phân công |
| `banhang` | `123456` | Bán hàng | Bị chặn (403 ➜ `/Account/AccessDenied`) | Chỉ các kho được phân công |

---

## 7. Checklist nghiệm thu

- [x] Biên dịch dự án hoàn tất với 0 Errors.
- [x] Phân quyền Quản lý bắt buộc, chặn truy cập trái phép.
- [x] CRUD tài khoản kèm phân quyền kho và mã hóa mật khẩu SHA-256.
- [x] Thay nút khóa bằng nút Xóa trên bảng: kiểm tra 7 bảng chứng từ; nếu chưa có giao dịch thì xóa vĩnh viễn, nếu đã có chứng từ thì chỉ cho phép chuyển sang Khóa tài khoản.
- [x] Chống tự xóa / tự khóa tài khoản của chính mình và tài khoản admin gốc.
