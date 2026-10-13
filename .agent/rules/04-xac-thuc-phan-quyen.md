# 04. Xác thực, Phân quyền & Quản lý Kho làm việc

## 1. Kiến trúc Xác thực (Cookie Authentication)

Hệ thống sử dụng **Cookie Authentication tự viết** trên các bảng CSDL có sẵn (`TaiKhoan`, `NhanVien`, `VaiTro`), **không dùng ASP.NET Core Identity** để giữ cấu trúc tinh gọn theo đúng phạm vi bài tập lớn.

### 1.1. Cấu hình đã triển khai trong `Program.cs`:
```csharp
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.LogoutPath = "/Account/Logout";
        options.AccessDeniedPath = "/Account/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
    });

// Middleware pipeline (Authentication đứng trước Authorization)
app.UseAuthentication();
app.UseAuthorization();
```

### 1.2. Mật khẩu & Bảo mật:
- Mật khẩu được băm an toàn qua helper [`PasswordHelper.cs`](../../BTL-LTW-QuanLiKho-2/Services/PasswordHelper.cs) sử dụng thuật toán `SHA256` (không dùng gói bên ngoài theo Rule 11).
- Tuyệt đối không lưu hoặc so sánh mật khẩu ở dạng văn bản thô (plain text).

---

## 2. Mô hình Người dùng & Vai trò trong CSDL

Hệ thống tách biệt thông tin con người và tài khoản đăng nhập:
1. **[`NhanVien`](../../BTL-LTW-QuanLiKho-2/Models/NhanVien.cs)**: Lưu thông tin cá nhân (`MaNV`, `HoTen`, `DienThoai`, `Email`, `NgayVaoLam`, `TrangThai: DANG_LAM / NGHI_VIEC`).
2. **[`TaiKhoan`](../../BTL-LTW-QuanLiKho-2/Models/TaiKhoan.cs)**: Lưu thông tin đăng nhập (`MaTaiKhoan`, `MaNV`, `MaVaiTro`, `TenDangNhap`, `MatKhauHash`, `TrangThai: HOAT_DONG / KHOA`).
3. **[`VaiTro`](../../BTL-LTW-QuanLiKho-2/Models/VaiTro.cs)**: Lưu vai trò trong hệ thống (`MaVaiTro`, `TenVaiTro`, `MoTa`).

### Các vai trò nghiệp vụ chuẩn:
- **Quản trị viên / Admin**: Toàn quyền cấu hình hệ thống, quản lý người dùng, xem được tất cả các kho và duyệt mọi chứng từ.
- **Thủ kho**: Thao tác tạo và xử lý phiếu nhập, xuất, chuyển kho, kiểm kê và xem tồn kho của các kho được phân công.
- **Nhân viên bán hàng**: Lập đơn bán hàng, xem danh mục hàng hóa, xem tồn kho bán lẻ, quản lý khách hàng.
- **Kế toán**: Xem báo cáo tài chính, theo dõi khoản thu, kiểm tra công nợ và xem chứng từ kho.

---

## 3. Quản lý Claims khi Đăng nhập

Khi đăng nhập thành công qua `AccountController.Login`, hệ thống nạp các Claims chuẩn vào danh tính người dùng:
- `ClaimTypes.NameIdentifier`: `MaTaiKhoan.ToString()`
- `ClaimTypes.Name`: `TenDangNhap`
- `ClaimTypes.GivenName`: `HoTen` của nhân viên (hiển thị trên thanh Header)
- `ClaimTypes.Role`: `TenVaiTro` (phục vụ `[Authorize(Roles = "...")]`)
- `ClaimTypes.UserData`: `MaNV.ToString()`

---

## 4. Phân quyền theo Kho làm việc

### 4.1. Bảng phân quyền đã triển khai ([`TaiKhoanKho`](../../BTL-LTW-QuanLiKho-2/Models/TaiKhoanKho.cs)):
Để kiểm soát nhân viên nào được phép làm việc tại những kho nào, hệ thống sử dụng bảng trung gian:
- Khóa chính kép: `(MaTaiKhoan, MaKho)`
- Admin: Mặc định có quyền truy cập vào tất cả các kho.
- Các vai trò khác: Chỉ được chọn và thao tác trên những kho có trong bảng `TaiKhoanKho`.

### 4.2. Cơ chế cách ly dữ liệu theo Kho (Warehouse Scoping):
- Mọi truy vấn danh sách, tồn kho, tạo phiếu mới đều phải gắn chặt với kho đang làm việc (`CurrentWarehouseId`).
- Khi người dùng gửi request (kể cả truyền ID kho qua query string hoặc body), Controller phải **kiểm tra lại quyền truy cập**:
  ```csharp
  if (!UserCanAccessWarehouse(warehouseId))
  {
      return Forbid(); // Từ chối nếu tài khoản không được phân công kho này
  }
  ```
- Dropdown Warehouse Switcher ở Header chỉ hiển thị những kho mà tài khoản hiện tại có quyền truy cập.
