# 02. Nghiệp vụ Quản lý kho hàng & Trạng thái chứng từ

## 1. Cơ chế tính toán Tồn kho (`vw_TonKhoHienTai`)

Trong hệ thống, tồn kho **không lưu thành bảng số lượng tĩnh** để tránh lệch số liệu giữa tồn kho và chứng từ lịch sử. Tồn kho của từng mặt hàng tại từng kho được tính toán động thông qua View CSDL **`vw_TonKhoHienTai`** ([`VwTonKhoHienTai`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/VwTonKhoHienTai.cs)):

```
Tồn kho = (Tổng Nhập đã xác nhận + Chuyển đến đã nhận + Điều chỉnh tăng)
        - (Tổng Xuất đã xác nhận + Chuyển đi đã xuất/nhận + Điều chỉnh giảm)
```

### Các nguồn biến động tồn kho:
1. **Nhập kho ([`PhieuNhap`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/PhieuNhap.cs))**: Trạng thái `TrangThai = 'DA_XAC_NHAN'` → Cộng tồn tại `MaKho`.
2. **Xuất kho ([`PhieuXuat`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/PhieuXuat.cs))**: Trạng thái `TrangThai = 'DA_XAC_NHAN'` → Trừ tồn tại `MaKho` của đơn hàng.
3. **Chuyển kho ([`PhieuChuyenKho`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/PhieuChuyenKho.cs))**:
   - Trạng thái `'DA_XUAT'` hoặc `'DA_NHAN'` → Trừ tồn tại kho nguồn (`MaKhoNguon`).
   - Trạng thái `'DA_NHAN'` → Cộng tồn tại kho đích (`MaKhoDich`).
4. **Kiểm kho & Điều chỉnh ([`PhieuDieuChinh`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/PhieuDieuChinh.cs))**:
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
   - **Phiếu đã hoàn thành**: Tuyệt đối **không được sửa hoặc xóa** để bảo đảm tính toàn vẹn sổ sách. Chỉ được thực hiện thao tác **Hủy** (sinh bút toán đảo ngược hoặc chuyển trạng thái sang `'HUY'`).
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
   - Mọi thao tác quan trọng (Hoàn thành phiếu, Cân bằng kho, Hủy phiếu, Xóa phiếu tạm) đều phải ghi một bản ghi vào bảng [`NhatKyThaoTac`](file:///d:/CODE/BTL-LTW-QuanLiKho-2/BTL-LTW-QuanLiKho-2/Models/NhatKyThaoTac.cs) với đầy đủ thông tin: Mã tài khoản, thời điểm, đối tượng, nội dung thao tác.
8. **Định hướng `InventoryService`**:
   - Khi dự án mở rộng, các thao tác đọc tồn kho và tạo chứng từ biến động phải được đóng gói vào Service dùng chung (`InventoryService`) thay vì viết lặp lại các câu lệnh LINQ thô trong Controller.
