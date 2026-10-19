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

# Biến thể 1: Thử nghiệm liên kết giữa các rank
code_v1 = '''flowchart TD
    subgraph Client ["1. Thủ kho / Client UI"]
        A1([Bắt đầu: Lập phiếu]) --> A2["Mở form Nhập hàng"]
        A2 --> A3["Chọn NCC & Kho đích"]
        A3 --> A4["F3 Tìm kiếm & Nhập SL, Giá"]
        A4 --> A5["Bấm nút Hoàn thành"]
        A6["Nhận thông báo & Hoàn tất"] --> A7([Kết thúc])
    end

    subgraph Server ["2. Web App & CSDL"]
        B1["Nhận POST Request"] --> B2{"Kiểm tra dữ liệu"}
        B2 -- Lỗi --> B3["Trả lỗi Form"]
        B2 -- Hợp lệ --> B4["Mở Transaction CSDL"]
        B4 --> B5["Tính lại Giá vốn MAC"]
        B5 --> B6["Lưu PhieuNhap & ChiTiet"]
        B6 --> B7["Cập nhật Giá vốn HangHoa"]
        B7 --> B8["Tăng tồn vw_TonKhoHienTai"]
        B8 --> B9["Cập nhật Công nợ NCC"]
        B9 --> B10["Commit Transaction"]
    end

    A1 ~~~ B1
    A2 ~~~ B2
    A3 ~~~ B4
    A4 ~~~ B5
    A5 --> B1
    B10 --> A6
'''
test_code(code_v1, 'v1')
