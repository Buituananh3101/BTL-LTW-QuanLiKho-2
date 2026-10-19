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

# Thử nghiệm 2 cột song song chuẩn mực
code_side = '''flowchart TD
    subgraph UI ["1. THỦ KHO / CLIENT UI (Giao diện người dùng)"]
        direction TB
        A1([Bắt đầu: Lập phiếu nhập])
        A2["1. Mở form 'Tạo phiếu nhập hàng'"]
        A3["2. Chọn Nhà cung cấp & Chi nhánh kho"]
        A4["3. F3 Tìm kiếm hàng hóa, nhập SL & Đơn giá"]
        A5["4. Bấm nút 'Hoàn thành'"]
        
        A6["5. Chờ phản hồi từ Hệ thống"]
        A7["6. Hiển thị thông báo thành công<br>& Điều hướng danh sách chứng từ"]
        A8([Kết thúc: Nhập hàng thành công])
        
        A1 --> A2 --> A3 --> A4 --> A5
        A5 -.-> A6
        A6 --> A7 --> A8
    end

    subgraph BE ["2. HỆ THỐNG / SERVER & CSDL (Backend Logic & Transaction)"]
        direction TB
        B1["Nhận Request POST Create"]
        B2{"Kiểm tra hợp lệ?<br>(Có NCC, Chi tiết >= 1 dòng, SL > 0)"}
        B3["Trả về thông báo lỗi Validation"]
        B4["Mở Transaction CSDL (BeginTransactionAsync)"]
        B5["Tính lại Giá vốn MAC:<br>GiaVonMoi = (TonCu*GiaCu + SL*GiaNhap)/(TonCu+SL)"]
        
        subgraph DB ["Ghi dữ liệu & Tồn kho trong Transaction"]
            direction TB
            C1[("Lưu Master-Detail: PhieuNhap & ChiTietPhieuNhap (DA_XAC_NHAN)")]
            C2[("Cập nhật Giá vốn mới vào bảng HangHoa")]
            C3[("Tăng số lượng tồn kho qua View vw_TonKhoHienTai")]
            C4[("Cập nhật Công nợ phải trả bảng DonViCapHang")]
            C5[("Ghi Nhật ký thao tác kiểm toán vào bảng NhatKyThaoTac")]
            C1 --> C2 --> C3 --> C4 --> C5
        end
        
        B6["Commit Transaction & Khóa chứng từ vĩnh viễn"]
        
        B1 --> B2
        B2 -- Hợp lệ --> B4 --> B5 --> DB --> B6
        B2 -- Không hợp lệ --> B3
    end

    %% Giao tiếp giữa 2 khối
    A5 ==>|Gửi Form POST| B1
    B3 -.->|Báo lỗi form| A4
    B6 ==>|Thành công HTTP 200| A6
'''

test_code(code_side, 'side_test')
