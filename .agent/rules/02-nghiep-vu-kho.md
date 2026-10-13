# 02. Nghiệp vụ Quản lý kho hàng & Trạng thái chứng từ

## 1. Cơ chế tính toán Tồn kho (`vw_TonKhoHienTai`)

Trong hệ thống, tồn kho **không lưu thành bảng số lượng tĩnh** để tránh lệch số liệu giữa tồn kho và chứng từ lịch sử. Tồn kho của từng mặt hàng tại từng kho được tính toán động thông qua View CSDL **`vw_TonKhoHienTai`** ([`VwTonKhoHienTai`](../../BTL-LTW-QuanLiKho-2/Models/VwTonKhoHienTai.cs)):

```
Tồn kho = (Tổng Nhập đã xác nhận + Chuyển đến đã nhận + Điều chỉnh tăng)
        - (Tổng Xuất đã xác nhận + Chuyển đi đã xuất/nhận + Điều chỉnh giảm)
```

### Các nguồn biến động tồn kho:
1. **Nhập kho ([`PhieuNhap`](../../BTL-LTW-QuanLiKho-2/Models/PhieuNhap.cs))**: Trạng thái `TrangThai = 'DA_XAC_NHAN'` → Cộng tồn tại `MaKho`.
2. **Xuất kho ([`PhieuXuat`](../../BTL-LTW-QuanLiKho-2/Models/PhieuXuat.cs))**: Trạng thái `TrangThai = 'DA_XAC_NHAN'` → Trừ tồn tại `MaKho` của đơn hàng.
3. **Chuyển kho ([`PhieuChuyenKho`](../../BTL-LTW-QuanLiKho-2/Models/PhieuChuyenKho.cs))**:
   - Trạng thái `'DA_XUAT'` hoặc `'DA_NHAN'` → Trừ tồn tại kho nguồn (`MaKhoNguon`).
   - Trạng thái `'DA_NHAN'` → Cộng tồn tại kho đích (`MaKhoDich`).
4. **Kiểm kho & Điều chỉnh ([`PhieuDieuChinh`](../../BTL-LTW-QuanLiKho-2/Models/PhieuDieuChinh.cs))**:
   - Trạng thái `TrangThai = 'DA_DUYET'`.
   - `ChiTietPhieuDieuChinh.SoLuongDieuChinh > 0` → Tăng tồn kho tương ứng.
   - `ChiTietPhieuDieuChinh.SoLuongDieuChinh < 0` → Giảm tồn kho tương ứng.

---

## 2. Chuẩn hóa Trạng thái chứng từ (Chuỗi `VARCHAR`)

Các chứng từ trong hệ thống dùng mã chuỗi tiếng Việt không dấu (khớp với CHECK Constraint trong CSDL):

| Loại chứng từ | Giá trị trạng thái | Ý nghĩa | Badge giao diện |
|---|---|---|---|
| **`PhieuNhap`** | `'NHAP'` | Phiếu tạm | `bg-primary` (Xanh dương) |
| | `'DA_XAC_NHAN'` | Đã nhập kho (ảnh hưởng tồn) | `bg-success` (Xanh lá) |
| | `'HUY'` | Đã hủy | `bg-secondary` (Xám) |
| **`PhieuXuat`** | `'NHAP'` | Phiếu tạm | `bg-primary` |
| | `'DA_XAC_NHAN'` | Đã xuất kho (ảnh hưởng tồn) | `bg-success` |
| | `'HUY'` | Đã hủy | `bg-secondary` |
| **`PhieuChuyenKho`** | `'NHAP'` | Phiếu tạm | `bg-primary` |
| | `'DA_XUAT'` | Đang chuyển (đã trừ kho nguồn) | `bg-warning text-dark` |
| | `'DA_NHAN'` | Đã nhận (đã cộng kho đích) | `bg-success` |
| | `'HUY'` | Đã hủy | `bg-secondary` |
| **`PhieuKiemKe`** | `'NHAP'` | Phiếu tạm | `bg-primary` |
| | `'DA_KIEM'` | Đã kiểm xong, chờ duyệt | `bg-info text-white` |
| | `'DA_DIEU_CHINH'` | Đã cân bằng kho (khóa phiếu) | `bg-success` |
| | `'HUY'` | Đã hủy | `bg-secondary` |
| **`PhieuDieuChinh`** | `'CHO_DUYET'` | Chờ duyệt | `bg-warning text-dark` |
| | `'DA_DUYET'` | Đã duyệt (ảnh hưởng tồn) | `bg-success` |
| | `'HUY'` | Đã hủy | `bg-secondary` |

---

## 3. Các quy tắc nghiệp vụ bất biến

1. **Hiệu lực tồn kho**: CHỈ những chứng từ ở trạng thái `DA_XAC_NHAN`, `DA_NHAN`, `DA_DUYET` mới làm thay đổi số lượng tồn trong `vw_TonKhoHienTai`. Phiếu tạm (`NHAP`) **không ảnh hưởng đến tồn kho**.
2. **Quyền sửa & xóa chứng từ**:
   - **Phiếu tạm (`NHAP`)**: Được phép chỉnh sửa số lượng, thêm/bớt mặt hàng hoặc xóa phiếu.
   - **Phiếu đã hoàn thành**: Tuyệt đối **không được sửa hoặc xóa** để bảo đảm tính toàn vẹn sổ sách. Chỉ được thực hiện thao tác **Hủy** (cập nhật `TrangThai = 'HUY'`, View SQL tự động loại trừ phiếu đã hủy).
3. **NGOẠI LỆ ĐẶC BIỆT: Phiếu kiểm kho đã cân bằng KHÔNG ĐƯỢC HỦY**:
   - Khi một `PhieuKiemKe` đã chuyển sang trạng thái `'DA_DIEU_CHINH'` (đã sinh `PhieuDieuChinh` có `DA_DUYET`), phiếu này bị **khóa vĩnh viễn, không được hủy**.
   - **Lý do**: Sau khi cân bằng, kho đã phát sinh các giao dịch bán hàng, chuyển kho dựa trên mốc tồn mới. Hủy phiếu kiểm cũ sẽ làm sai lệch toàn bộ chuỗi giao dịch tiếp theo. Nếu phát hiện kiểm sai, bắt buộc phải lập một phiếu kiểm mới.
4. **Quy tắc chốt tồn tại thời điểm cân bằng kiểm kho**:
   - Khi bấm **"Cân bằng kho"**, hệ thống phải đọc lại tồn hiện tại từ `vw_TonKhoHienTai` để gán vào `SoLuongTheoSo` của phiếu.
   - Chênh lệch thực tế được tính: `Số lượng điều chỉnh = Thực tế - Sổ sách tại thời điểm cân bằng`.
5. **Dòng "Chưa kiểm" trong kiểm kho**:
   - Mặt hàng có `SoLuongThucTe = null` (Chưa kiểm) sẽ **bỏ qua**: giữ nguyên tồn hiện tại, không sinh dòng điều chỉnh kho và không tính vào tổng chênh lệch.
6. **Chặn tồn âm**:
   - Trước khi xác nhận xuất kho hoặc chuyển kho, hệ thống phải kiểm tra số lượng tồn hiện thời tại kho nguồn qua `vw_TonKhoHienTai`. Nếu `SoLuongTon < SoLuongXuat`, phải báo lỗi tiếng Việt rõ ràng và hủy giao dịch.
7. **Luôn ghi `NhatKyThaoTac`**:
   - Mọi thao tác quan trọng (Hoàn thành phiếu, Cân bằng kho, Hủy phiếu, Xóa phiếu tạm) đều phải ghi một bản ghi vào bảng [`NhatKyThaoTac`](../../BTL-LTW-QuanLiKho-2/Models/NhatKyThaoTac.cs) với đầy đủ thông tin: Mã tài khoản, thời điểm, đối tượng, nội dung thao tác.
8. **Đóng gói tầng Dịch vụ (`TonKhoService`, `BanHangService`)**:
   - Các thao tác đọc tồn kho, kiểm tra chặn âm kho và tạo chứng từ biến động phải được đóng gói vào Service dùng chung (`ITonKhoService`, `IBanHangService`) thay vì viết lặp lại các câu lệnh LINQ thô trong Controller.
9. **Quy tắc bắt buộc khi Bán hàng (POS / Đơn bán) [ISSUE-05]**:
   - Do `vw_TonKhoHienTai` chỉ trừ kho qua `PhieuXuat`, khi tạo hoặc thanh toán đơn bán tại quầy (`DonBan`), hệ thống **bắt buộc tự động sinh kèm một `PhieuXuat`** có `TrangThai = 'DA_XAC_NHAN'`, `LoaiPhieuXuat = 'XUAT_BAN'`, `MaKho = donBan.MaKho`, liên kết `MaDonBan`, và sao chép đầy đủ chi tiết sang `ChiTietPhieuXuat` (`MaHang`, `SoLuongXuat`, `DonGiaXuat`, `MaCTDonBan`).
   - Toàn bộ quy trình phải nằm trong một transaction (`BeginTransactionAsync`).
   - Bắt buộc kiểm tra tồn kho trước khi xuất bằng `ITonKhoService.KiemTraXuatKhoAsync(...)` để chặn đứng việc xuất âm kho.
   - Thao tác bán hàng POS và xuất kho tự động được đóng gói chuẩn mực trong `IBanHangService` ([`BanHangService.cs`](../../BTL-LTW-QuanLiKho-2/Services/BanHangService.cs)).
   - Khi hủy đơn bán (`TrangThai = 'HUY'`), phiếu xuất đi kèm cũng được chuyển sang `'HUY'`, `vw_BienDongKho` sẽ tự động loại bỏ phiếu xuất này, giúp tồn kho được hoàn trả ngay lập tức.
10. **Quy tắc Đơn vị tính cơ bản duy nhất [ISSUE-10]**:
   - Toàn bộ hệ thống chỉ quản lý tồn kho theo **1 Đơn vị tính cơ bản duy nhất** cho mỗi mặt hàng (`HangHoa.MaDvt`).
   - Mọi chứng từ (Nhập, Xuất, Chuyển, Kiểm, Bán) chỉ ghi nhận theo ĐVT cơ bản, không dùng ĐVT phụ hay hệ số quy đổi.

