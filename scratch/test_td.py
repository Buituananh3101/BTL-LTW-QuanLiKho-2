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

# Thử nghiệm TD-1: Không có liên kết kéo ngược từ B về A
code_td1 = '''flowchart TD
    subgraph Left ["1. Thủ kho / Client UI"]
        A1([Bắt đầu: Lập phiếu nhập]) --> A2["Mở form 'Tạo phiếu nhập hàng'"]
        A2 --> A3["Chọn Nhà cung cấp & Chi nhánh kho"]
        A3 --> A4["F3 Tìm hàng hóa, nhập SL & Đơn giá"]
        A4 --> A5["Bấm nút 'Hoàn thành'"]
    end

    subgraph Right ["2. Web App & CSDL (Backend Logic & Database)"]
        B1["Nhận Request POST Create"] --> B2{"Kiểm tra hợp lệ?<br>(Có NCC, Chi tiết >= 1 dòng)"}
        B2 -- Không hợp lệ --> B3["Trả về lỗi Validation"]
        B2 -- Hợp lệ --> B4["Mở Transaction CSDL"]
        B4 --> B5["Tính lại Giá vốn MAC:<br>GiaVonMoi = (TonCu*GiaCu + SL*GiaNhap)/(TonCu+SL)"]
        
        subgraph DB ["Ghi dữ liệu trong Transaction"]
            C1[("Lưu PhieuNhap & ChiTietPhieuNhap")]
            C2[("Cập nhật Giá vốn bảng HangHoa")]
            C3[("Tăng tồn kho qua vw_TonKhoHienTai")]
            C4[("Cập nhật Công nợ bảng DonViCapHang")]
            C5[("Ghi Nhật ký bảng NhatKyThaoTac")]
            C1 --> C2 --> C3 --> C4 --> C5
        end
        B5 --> DB
        DB --> B6["Commit Transaction & Khóa chứng từ"]
        B6 --> B7([Kết thúc: Nhập hàng thành công])
    end

    A1 ~~~ B1
    A5 --> B1
'''
test_code(code_td1, 'td1')
