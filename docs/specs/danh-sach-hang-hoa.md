# Đặc tả Chức năng: Quản lý Hàng hóa (Product Catalog)

> **Mục tiêu**: Đây là **khuôn mẫu chuẩn cho toàn bộ các màn hình Danh mục (CRUD)** trong hệ thống (Quản lý Kho, Nhà cung cấp, Khách hàng, Nhóm hàng). Mọi màn hình danh mục làm sau đều tuân theo kiến trúc bộ lọc sidebar, phân trang AJAX, modal thêm/sửa JSON, và cơ chế bảo toàn dữ liệu của module này.

---

## 1. Các bảng CSDL & ViewModel liên quan

### 1.1. Bảng CSDL tham gia:
- `HangHoa`: Bảng thực thể chính (`MaHang`, `MaHangNoiBo`, `TenHang`, `MaNhom`, `MaDvt`, `QuyCach`, `GiaBanThamKhao`, `GiaVon`, `HinhAnh VARBINARY(MAX)`, `TrangThai: DANG_BAN / NGUNG_BAN`, `NgayTao`, `DaDanhDau`).
- `NhomHang`: Phân loại hàng hóa (`MaNhom`, `TenNhom`).
- `DonViTinh`: Đơn vị tính cơ bản (`MaDvt`, `TenDvt`). Hệ thống áp dụng quy tắc **1 đơn vị tính cơ bản duy nhất**.
- `NguongTonKho`: Định mức tồn Min/Max cho từng mặt hàng tại từng kho (`MaNguong`, `MaHang`, `MaKho`, `TonToiThieu`, `TonToiDa`).
- `vw_TonKhoHienTai`: View tính tồn kho động hiện thời theo `(MaKho, MaHang)`.

### 1.2. ViewModels sử dụng (`ViewModels/HangHoaForm.cs`):
- `HangHoaIndexVM`: Dữ liệu cho trang danh sách toàn trang (chứa danh sách `Items`, tổng tồn kho, tổng giá trị, các danh mục nạp vào dropdown bộ lọc).
- `HangHoaItemVM`: Một dòng dữ liệu hiển thị trên bảng (Mã, Tên, ĐVT, Nhóm, Giá bán, Giá vốn, Tồn kho hiện tại, Tồn tối thiểu, Dự kiến hết hàng, Cờ `HasImage`, Cờ `DaDanhDau`).
- `HangHoaForm`: Model dùng cho form/modal Thêm mới và Chỉnh sửa (hỗ trợ Data Annotations kiểm tra hợp lệ bằng tiếng Việt).

---

## 2. Luồng màn hình & Giao diện (Chuẩn KiotViet)

### 2.1. Cột lọc bên trái (Sidebar Filter)
Chứa 7 khối tiêu chí lọc kết hợp:
1. **Nhóm hàng**: Danh sách nhóm hàng + nút "Tạo mới" nhóm nhanh qua modal.
2. **Tồn kho**: Tất cả / Còn hàng trong kho / Hết hàng trong kho / Dưới định mức tồn (⚠️).
3. **Dự kiến hết hàng**: Khoảng thời gian dự báo (Hôm nay, 3 ngày tới, 7 ngày tới, Trong tháng này, > 30 ngày).
4. **Nhà cung cấp**: Lọc các mặt hàng từng nhập từ nhà cung cấp tương ứng.
5. **Loại hàng**: Hàng hóa / Dịch vụ / Combo đóng gói.
6. **Vị trí**: Lọc theo chuỗi vị trí trong kho (lưu trong `QuyCach`).
7. **Thời gian tạo**: Hôm nay, Tuần này, Tháng này, hoặc khoảng ngày tùy chọn.

### 2.2. Thanh công cụ trên (Action Bar)
- Ô tìm kiếm từ khóa (tìm theo Tên hàng, Mã nội bộ hoặc Mã vạch/Quy cách).
- Bộ lọc Đánh dấu sao (`DaDanhDau`): Lọc nhanh các mặt hàng được gắn sao ưu tiên.
- Nút **"Thêm mới"**: Mở Modal thêm nhanh hàng hóa (không reload toàn trang).
- Nút Import/Export Excel và tùy chọn hiển thị cột bảng.

### 2.3. Bảng dữ liệu chính & Phân trang AJAX
- **Hiển thị bảng**: Tách thành Partial View `_HangHoaTable.cshtml`.
- **Cơ chế lọc & chuyển trang mượt mà**:
  - Khi người dùng đổi bất kỳ tiêu chí lọc nào hoặc click số trang:
  - JavaScript gom các tham số lọc, gửi request `GET /HangHoa/Filter?...`
  - Controller xử lý lọc và chỉ trả về Partial View `_HangHoaTable.cshtml`.
  - JavaScript thay thế nội dung vùng `#contentTable` mà **không reload toàn trang**.

---

## 3. Cơ chế Thêm, Sửa & Tối ưu Dữ liệu

### 3.1. Thêm mới & Cập nhật qua JSON API (Modal):
- **Thêm mới (`POST /HangHoa/Create`)**: Nhận JSON qua `[FromBody] HangHoaForm`:
  - Tự động sinh mã `MaHangNoiBo` nếu để trống (`HH` + 6 chữ số tự tăng).
  - Có cơ chế **Retry tự động 3 lần** nếu gặp tranh chấp chỉ mục duy nhất `UQ_HangHoa_MaHangNoiBo`.
  - Tự động lưu bản ghi `NguongTonKho` theo `CurrentWarehouseId` nếu có nhập tồn tối thiểu.
  - Nếu có nhập "Tồn kho ban đầu > 0", tự động tạo 1 `PhieuNhap` đầu kỳ trạng thái `DA_XAC_NHAN` để tồn kho vào đúng sổ sách kế toán.
  - Trả về JSON `{ success = true, id = item.MaHang, message = "..." }`.
- **Chỉnh sửa (`GET /HangHoa/GetItem?id=X` và `POST /HangHoa/Edit?id=X`)**:
  - `GetItem`: Trả về dữ liệu JSON để điền tự động vào modal sửa.
  - `Edit`: Nhận JSON cập nhật thuộc tính và ngưỡng tồn kho.

### 3.2. Cơ chế xử lý Hình ảnh (Chống tràn RAM):
- Ảnh được tải lên từ client dưới dạng chuỗi Base64 và lưu vào cột `HinhAnh VARBINARY(MAX)` của bảng `HangHoa`.
- **Nguyên tắc chống tràn RAM (Quan trọng)**: Khi truy vấn danh sách, **tuyệt đối không `SELECT HinhAnh`**. Dùng LINQ Projection lấy cờ boolean `HasImage = x.HinhAnh != null`.
- Khi hiển thị ảnh trên bảng: Thẻ `<img>` gọi riêng `src="/HangHoa/GetImage?id=X"` có cache trình duyệt.

### 3.3. Tính năng Đánh dấu sao (`DaDanhDau`):
- Cho phép người dùng click icon ngôi sao trực tiếp trên từng dòng của bảng để bật/tắt ưu tiên (`POST /HangHoa/ToggleStar?id=X`).
- Trả về JSON `{ success = true, isStarred = boolean }` cập nhật giao diện tức thì.

---

## 4. Các quy tắc nghiệp vụ bất biến

1. **QUY TẮC BẢO TOÀN DỮ LIỆU (CẤM XÓA KHI ĐÃ CÓ GIAO DỊCH)**:
   - Trước khi xóa một mặt hàng (`POST /HangHoa/Delete`), hệ thống bắt buộc kiểm tra xem mặt hàng đó đã từng xuất hiện trong các bảng chi tiết giao dịch hay chưa:
     - `ChiTietDonBan`
     - `ChiTietPhieuNhap`
     - `ChiTietPhieuChuyenKho`
     - `ChiTietPhieuKiemKe`
   - **Nếu đã có ít nhất 1 giao dịch**: Bắt buộc chặn lại và trả về thông báo lỗi: *"Hàng hóa này đã phát sinh giao dịch/chứng từ trong hệ thống, không thể xóa. Bạn có thể chuyển sang trạng thái 'Ngừng bán'."*
   - Chỉ cho phép xóa cứng khi hàng hóa hoàn toàn chưa có bất kỳ giao dịch nào.
2. **Quy tắc Mã nội bộ**: Mã hàng nội bộ là duy nhất (`UNIQUE`), định dạng chuẩn `HH` + 6 số tự tăng, có cơ chế retry chống Race Condition.
3. **Quy tắc Tồn kho theo kho làm việc**:
   - Số lượng tồn hiển thị trên bảng luôn lấy theo kho đang làm việc (`CurrentWarehouseId`) từ View `vw_TonKhoHienTai`. Đổi kho ở Header thì số tồn tự động đổi theo.
4. **Quy tắc Trạng thái kinh doanh**:
   - `DANG_BAN`: Xuất hiện trong các dropdown tìm kiếm của phiếu nhập, xuất, kiểm, bán.
   - `NGUNG_BAN`: Không xuất hiện khi lập chứng từ mới, nhưng vẫn giữ nguyên trong lịch sử các chứng từ cũ.
