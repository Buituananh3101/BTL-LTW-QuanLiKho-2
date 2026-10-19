import urllib.request, zlib, base64, struct

test_2 = '''flowchart TD
    subgraph Left["1. Thủ kho / Client UI"]
        A1([Bắt đầu]) --> A2["Mở form Tạo phiếu"]
        A2 --> A3["Chọn NCC và Kho đích"]
        A3 --> A4["F3 Tìm hàng, nhập SL & Giá"]
        A4 --> A5["Bấm nút Hoàn thành"]
        A6([Kết thúc: Thành công])
    end

    subgraph Center["2. Web App / Logic Backend"]
        B1["Nhận POST Create"] --> B2{"Validate hợp lệ?"}
        B2 -- Lỗi --> B3["Báo lỗi Validation"]
        B2 -- Hợp lệ --> B4["Mở Transaction CSDL"]
        B4 --> B5["Tính Giá vốn bình quân MAC"]
        B6["Commit Transaction"]
        B7["Trả kết quả thành công"]
    end

    subgraph Right["3. CSDL và Tồn kho"]
        C1[("Lưu PhieuNhap & ChiTiet")]
        C2[("Cập nhật Giá vốn HangHoa")]
        C3[("Tăng tồn vw_TonKhoHienTai")]
        C4[("Cập nhật Công nợ NCC")]
        C5[("Ghi Audit Log NhatKyThaoTac")]
    end

    %% Force side by side
    A1 ~~~ B1 ~~~ C1
    
    A5 --> B1
    B3 --> A4
    B5 --> C1
    B5 --> C2
    B5 --> C3
    B5 --> C4
    C1 & C2 & C3 & C4 --> C5
    C5 --> B6 --> B7 --> A6
'''

compressed = zlib.compress(test_2.encode('utf-8'), 9)
encoded = base64.urlsafe_b64encode(compressed).decode('utf-8')
url = f'https://kroki.io/mermaid/png/{encoded}'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        w, h = struct.unpack('>LL', data[16:24])
        print(f'Test 2 with ~~~: {w}x{h}, ratio h/w = {h/w:.2f}, w/h = {w/h:.2f}')
        with open('scratch/test_side_2.png', 'wb') as f:
            f.write(data)
except Exception as e:
    print('Error:', e)
