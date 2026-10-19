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

# Thử nghiệm 3: Sử dụng cú pháp subgraph lồng hoặc rankDir
# Trong mermaid, nếu đồ thị là flowchart TD, nhưng 2 subgraph được bọc trong 1 subgraph ngang:
code_nest = '''flowchart TD
    subgraph UI ["1. THỦ KHO / CLIENT UI"]
        A1([Bắt đầu: Lập phiếu nhập])
        A2["1. Mở form 'Tạo phiếu nhập hàng'"]
        A3["2. Chọn Nhà cung cấp & Kho đích"]
        A4["3. F3 Tìm kiếm hàng hóa, nhập SL & Giá"]
        A5["4. Bấm nút 'Hoàn thành'"]
        A6["5. Nhận phản hồi & Hiển thị thông báo"]
        A7([Kết thúc: Nhập hàng thành công])
        
        A1 --> A2 --> A3 --> A4 --> A5
        A6 --> A7
    end

    subgraph BE ["2. HỆ THỐNG / BACKEND & CSDL"]
        B1["1. Nhận Request POST Create"]
        B2{"2. Kiểm tra tính hợp lệ?<br>(Có NCC, Chi tiết >= 1 dòng)"}
        B3["Thông báo lỗi Validation"]
        B4["3. Mở Transaction CSDL"]
        B5["4. Tính lại Giá vốn MAC"]
        B6["5. Ghi PhieuNhap & ChiTiet (DA_XAC_NHAN)"]
        B7["6. Cập nhật Giá vốn mới vào HangHoa"]
        B8["7. Tăng tồn kho qua vw_TonKhoHienTai"]
        B9["8. Cập nhật Công nợ bảng DonViCapHang"]
        B10["9. Commit Transaction & Khóa chứng từ"]
        
        B1 --> B2
        B2 -- Không hợp lệ --> B3
        B2 -- Hợp lệ --> B4 --> B5 --> B6 --> B7 --> B8 --> B9 --> B10
    end

    %% Liên kết luồng
    A5 --> B1
    B3 -.-> A4
    B10 --> A6
'''
test_code(code_nest, 'nest1')
