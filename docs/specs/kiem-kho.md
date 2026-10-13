# Đặc tả Chức năng: Kiểm kho (Stock Take)

> **Mục tiêu**: Đây là chức năng mẫu chuẩn cho mọi chứng từ có form nhiều dòng chi tiết trong hệ thống (Nhập hàng, Xuất hàng, Chuyển kho).

---

## 1. Các bảng CSDL & ViewModel liên quan

### 1.1. Bảng CSDL tham gia:
- [`PhieuKiemKe`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/PhieuKiemKe.cs): Lưu thông tin chung của phiếu (`MaPhieuKiemKe`, `MaKho`, `MaNVLap`, `ThoiDiemChot`, `TrangThai: NHAP / DA_DIEU_CHINH / HUY`, `GhiChu`).
- [`ChiTietPhieuKiemKe`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/ChiTietPhieuKiemKe.cs): Lưu từng mặt hàng kiểm (`MaCTKiemKe`, `MaPhieuKiemKe`, `MaHang`, `SoLuongTheoSo`, `SoLuongThucTe`).
- [`PhieuDieuChinh`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/PhieuDieuChinh.cs): Sinh tự động khi cân bằng kho (`MaPhieuDieuChinh`, `MaPhieuKiemKe`, `NgayDuyet`, `TrangThai: DA_DUYET`).
- [`ChiTietPhieuDieuChinh`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/ChiTietPhieuDieuChinh.cs): Chứa số lượng chênh lệch (`SoLuongDieuChinh = ThucTe - SoSach`).
- [`NhatKyThaoTac`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/NhatKyThaoTac.cs): Lưu vết hành động cân bằng kho.

### 1.2. ViewModels sử dụng:
- [`PhieuKiemKeIndexVM`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/ViewModels/KiemKhoViewModels.cs): Dữ liệu trang danh sách.
- [`PhieuKiemKeFormVM`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/ViewModels/KiemKhoViewModels.cs): Dữ liệu form lập/sửa phiếu.
- [`PhieuKiemKeLineVM`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/ViewModels/KiemKhoViewModels.cs): Một dòng hàng hóa kiểm trong bảng chi tiết.
- [`SaveStockTakeRequest`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/ViewModels/KiemKhoViewModels.cs): Dữ liệu JSON gửi lên server khi bấm Lưu tạm hoặc Cân bằng kho.

---

## 2. Luồng màn hình & Giao diện

### 2.1. Màn hình Danh sách (`Index`)
- **Cột lọc bên trái**:
  - Thời gian tạo: Chọn nhanh (Hôm nay, Hôm qua, Tuần này, Tháng này, 30 ngày qua) hoặc khoảng ngày tùy chỉnh.
  - Trạng thái: Checkbox chọn Phiếu tạm (`NHAP`), Đã cân bằng (`DA_DIEU_CHINH`), Đã hủy (`HUY`).
  - Người tạo: Dropdown chọn nhân viên lập phiếu.
  - Kho: Đọc theo kho làm việc hiện tại.
- **Bảng dữ liệu bên phải**:
  - Cột: Mã kiểm kho (`PKK000001`), Thời gian chốt, Ngày cân bằng, Kho, Người tạo, Tổng thực tế, Tổng chênh lệch, SL lệch tăng, SL lệch giảm, Trạng thái (Badge).
  - Phân trang AJAX và tìm kiếm nhanh theo mã/ghi chú.

### 2.2. Màn hình Lập / Sửa phiếu (`Create` / `Edit`)
Giao diện chia làm 2 cột:
- **Cột trái (Chi tiết kiểm hàng)**:
  - Ô tìm kiếm hàng hóa (hỗ trợ phím tắt **F3**, tìm theo mã nội bộ hoặc tên, hiển thị popup autocomplete gồm Tồn kho và Giá).
  - Nút **"Chọn theo nhóm"** (icon lưới): Cho phép nạp toàn bộ hàng hóa của một nhóm vào bảng kiểm chỉ bằng 1 click.
  - Bảng kiểm hàng:
    - STT, Mã hàng, Tên hàng, ĐVT.
    - **Tồn sổ sách**: Số lượng tồn hệ thống ghi nhận lúc mở form.
    - **Thực tế**: Ô input để thủ kho nhập số lượng đếm được (mặc định để trống là *Chưa kiểm*; nếu hàng đã có trong bảng mà tìm lại thì tự động `+1`).
    - **Chênh lệch**: `Thực tế - Tồn sổ sách` (tô màu xanh nếu lệch tăng, màu đỏ nếu lệch giảm).
    - **Giá trị lệch**: `Chênh lệch × Giá vốn/Giá tham khảo`.
    - Nút xóa dòng (icon thùng rác).
  - Các tab lọc nhanh dòng kiểm: Tất cả, Khớp, Lệch, Chưa kiểm.
- **Cột phải (Thông tin chung & Hành động)**:
  - Thông tin: Mã phiếu tự động, Kho kiểm, Người tạo, Ngày giờ kiểm, Ghi chú.
  - Tổng kết: Tổng số lượng thực tế, Tổng lệch, Lệch tăng, Lệch giảm, Tổng giá trị lệch.
  - Các nút hành động:
    - **Lưu tạm**: Lưu phiếu ở trạng thái `'NHAP'`, chưa ảnh hưởng tồn kho.
    - **Cân bằng kho**: Chốt tồn thực tế, cập nhật tồn kho hệ thống.
    - **Bỏ qua / Quay lại**: Quay về danh sách.

---

## 3. Logic xử lý Cân bằng kho (`Complete`)

Khi người dùng nhấn nút **"Cân bằng kho"**:
1. Bắt đầu giao dịch: `using var trans = await _context.Database.BeginTransactionAsync();`.
2. Đọc lại tồn sổ sách hiện thời từ `vw_TonKhoHienTai` cho toàn bộ các mặt hàng trong phiếu để đảm bảo số liệu sổ sách là mới nhất tại thời điểm chốt.
3. Chuyển trạng thái phiếu kiểm sang `'DA_DIEU_CHINH'`.
4. Lưu danh sách chi tiết kiểm kê (`ChiTietPhieuKiemKe`).
5. Lọc những mặt hàng có chênh lệch thực tế (`SoLuongThucTe.HasValue && (SoLuongThucTe - SoLuongTheoSo != 0)`):
   - Tạo một bản ghi [`PhieuDieuChinh`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/PhieuDieuChinh.cs) với trạng thái `'DA_DUYET'`.
   - Tạo các dòng [`ChiTietPhieuDieuChinh`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/ChiTietPhieuDieuChinh.cs) tương ứng với `SoLuongDieuChinh = SoLuongThucTe - SoLuongTheoSo`.
6. Ghi nhật ký vào [`NhatKyThaoTac`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/NhatKyThaoTac.cs).
7. Commit giao dịch: `await trans.CommitAsync();`.
8. **Khóa phiếu**: Phiếu kiểm đã cân bằng không được phép sửa, không được phép xóa và **không được phép hủy**.
