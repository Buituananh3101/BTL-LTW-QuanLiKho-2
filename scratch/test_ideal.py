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

code_ideal = '''flowchart LR
    subgraph Client ["1. Thủ kho / Giao diện người dùng (Client UI)"]
        direction TB
        A1(["<b>Bắt đầu: Lập phiếu nhập hàng</b><br>• Mở form 'Tạo phiếu nhập hàng'<br>• Chọn Nhà cung cấp & Chi nhánh kho<br>• F3 Tìm kiếm hàng hóa, nhập SL & Đơn giá"])
        A2["<b>Bấm nút 'Hoàn thành'</b><br>Gửi yêu cầu POST lên Web App"]
        A3(["<b>Hiển thị kết quả & Kết thúc</b><br>• Thông báo thành công Toast KiotViet<br>• Điều hướng về danh sách chứng từ<br>• Khóa chứng từ & Cho phép in phiếu"])
        
        A1 --> A2
    end

    subgraph Server ["2. Web App & CSDL (Backend Logic & Transaction)"]
        direction TB
        B1{"<b>Kiểm tra Validation Form</b><br>• Đã chọn NCC & Kho đích?<br>• Chi tiết có ít nhất 1 mặt hàng?<br>• Số lượng & Đơn giá nhập > 0?"}
        
        B_Err["<b>Báo lỗi Validation</b><br>Hiển thị cảnh báo & Giữ form để sửa"]
        
        B2["<b>Mở Transaction CSDL & Tính Giá vốn MAC</b><br>GiaVonMoi = (TonCu*GiaCu + SL*GiaNhap) / (TonCu + SL)"]
        
        DB[("<b>Thực thi lưu CSDL đồng bộ trong Transaction</b><br>• Master-Detail: PhieuNhap & ChiTiet (DA_XAC_NHAN)<br>• Cập nhật Giá vốn mới vào bảng HangHoa<br>• Tăng số lượng tồn kho qua View vw_TonKhoHienTai<br>• Cập nhật Công nợ phải trả bảng DonViCapHang<br>• Ghi Nhật ký kiểm toán vào bảng NhatKyThaoTac")]
        
        B3["<b>Commit Transaction</b><br>Khóa chứng từ vĩnh viễn (Cấm sửa/xóa)"]
        
        B1 -- "Không hợp lệ" --> B_Err
        B1 -- "Hợp lệ" --> B2 --> DB --> B3
    end

    %% Giao tiếp giữa 2 khối Trái - Phải
    A2 ==>|1. Gửi Form POST| B1
    B_Err -.->|2a. Trả lỗi form| A1
    B3 ==>|2b. Phản hồi HTTP 200 OK| A3
'''

test_code(code_ideal, 'ideal_2col')
