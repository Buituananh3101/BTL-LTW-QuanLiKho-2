import subprocess, struct

def test_code(code, name):
    with open(f'scratch/{name}.mmd', 'w', encoding='utf-8') as f:
        f.write(code)
    cmd = f'npx @mermaid-js/mermaid-cli -i scratch/{name}.mmd -o scratch/{name}.png -b white -s 2'
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    with open(f'scratch/{name}.png', 'rb') as f:
        f.seek(16)
        w, h = struct.unpack('>LL', f.read(8))
    print(f"[{name}] size: {w}x{h}, w/h={w/h:.2f}, h/w={h/w:.2f}")

code_v2 = '''flowchart LR
    subgraph Client ["1. Thủ kho / Giao diện người dùng (Client UI)"]
        direction TB
        A1(["<b>BƯỚC 1: MỞ FORM & CHỌN THÔNG TIN</b><br>• Đăng nhập hệ thống, truy cập menu Nhập hàng<br>• Mở modal/form 'Tạo phiếu nhập hàng mới'<br>• Chọn Nhà cung cấp & Chi nhánh kho tiếp nhận"])
        
        A2["<b>BƯỚC 2: NHẬP CHI TIẾT HÀNG HÓA</b><br>• Bấm F3 tìm kiếm nhanh theo mã hoặc tên hàng<br>• Nhập Số lượng thực nhập & Đơn giá thỏa thuận<br>• Hệ thống tự tính: Thành tiền = SL * Đơn giá"]
        
        A3["<b>BƯỚC 3: XÁC NHẬN HOÀN THÀNH</b><br>• Kiểm tra tổng tiền & thông tin chiết khấu<br>• Bấm nút 'Hoàn thành' gửi form POST lên Server"]
        
        A4(["<b>BƯỚC 4: KẾT THÚC & NHẬN KẾT QUẢ</b><br>• Nhận thông báo Toast thành công từ Web App<br>• Tự động điều hướng về danh sách phiếu nhập<br>• Khóa chứng từ vĩnh viễn & In phiếu nhập kho"])
        
        A1 --> A2 --> A3
    end

    subgraph Server ["2. Web App & CSDL (Backend Logic & Database Transaction)"]
        direction TB
        B1{"<b>BƯỚC 5: KIỂM TRA HỢP LỆ (VALIDATION)</b><br>• Đã chọn NCC & Chi nhánh kho đích hợp lệ?<br>• Chi tiết phiếu nhập có ít nhất 1 mặt hàng?<br>• Số lượng > 0 và Đơn giá nhập >= 0?"}
        
        B_Err["<b>BÁO LỖI VALIDATION FORM</b><br>• Trả về ModelState không hợp lệ<br>• Hiển thị cảnh báo lỗi chi tiết trên form<br>• Giữ nguyên dữ liệu để Thủ kho chỉnh sửa"]
        
        B2["<b>BƯỚC 6: TÍNH LẠI GIÁ VỐN BÌNH QUÂN MAC</b><br>Công thức bình quân gia quyền di động:<br><b>GiaVonMoi = (TonCu*GiaCu + SL*GiaNhap) / (TonCu + SL)</b>"]
        
        DB[("<b>BƯỚC 7: THỰC THI TRANSACTION ĐỒNG BỘ CSDL</b><br>• Lưu Master-Detail: PhieuNhap & ChiTietPhieuNhap (Trạng thái: DA_XAC_NHAN)<br>• Cập nhật Giá vốn mới (GiaVonMoi) vào bảng HangHoa<br>• Tăng số lượng tồn kho thực tế tính qua View vw_TonKhoHienTai<br>• Cập nhật Công nợ phải trả Nhà cung cấp trong bảng DonViCapHang<br>• Ghi Nhật ký thao tác kiểm toán (Audit Log) vào bảng NhatKyThaoTac")]
        
        B3["<b>BƯỚC 8: COMMIT TRANSACTION & KHÓA CHỨNG TỪ</b><br>• Commit Transaction (Đảm bảo tính toàn vẹn ACID)<br>• Khóa chứng từ vĩnh viễn (Tuyệt đối cấm sửa/xóa)<br>• Trả về HTTP 200 OK kèm mã phiếu vừa tạo"]
        
        B1 -- "Không hợp lệ" --> B_Err
        B1 -- "Dữ liệu hợp lệ" --> B2 --> DB --> B3
    end

    %% Giao tiếp giữa 2 khối Trái - Phải
    A3 ==>|Gửi Form POST Create| B1
    B_Err -.->|Báo lỗi quay lại form| A2
    B3 ==>|HTTP 200 OK Thành công| A4
'''

test_code(code_v2, 'v2_detailed')
