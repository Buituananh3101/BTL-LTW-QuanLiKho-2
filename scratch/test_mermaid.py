import urllib.request, zlib, base64, struct

code = '''flowchart TD
    subgraph Client["1. Thủ kho / Giao diện người dùng (Client UI)"]
        A1([Bắt đầu]) --> A2["Mở form 'Tạo phiếu nhập hàng'"]
        A2 --> A3["Chọn Nhà cung cấp và Chi nhánh kho đích"]
        A3 --> A4["F3 Tìm kiếm mặt hàng, nhập SL và Đơn giá mua"]
        A4 --> A5["Bấm nút 'Hoàn thành'"]
        A6([Kết thúc: Nhập hàng thành công])
    end

    subgraph Server["2. Web App / Logic Xử lý (Backend Service)"]
        B1["Nhận Request POST Create"]
        B2{"Kiểm tra hợp lệ?<br>(Có NCC, Chi tiết >= 1 dòng, SL > 0)"}
        B3["Trả về thông báo lỗi Validation"]
        B4["Mở Transaction CSDL (BeginTransactionAsync)"]
        B5["Tính lại Giá vốn bình quân gia quyền MAC:<br>GiaVonMoi = (TonCu*GiaCu + SL*GiaNhap) / (TonCu + SL)"]
        B10["Trả về kết quả thành công và Điều hướng"]
    end

    subgraph DB["3. Cơ sở dữ liệu và Tồn kho (Database Engine)"]
        subgraph SaveData["Thực thi ghi dữ liệu đồng thời trong Transaction"]
            C1[("Lưu Master PhieuNhap<br>và Detail ChiTietPhieuNhap")]
            C2[("Cập nhật Giá vốn mới<br>vào bảng HangHoa")]
            C3[("Tăng số lượng tồn kho<br>qua View vw_TonKhoHienTai")]
            C4[("Ghi nhận Công nợ phải trả<br>bảng DonViCapHang")]
        end
        C5[("Ghi Nhật ký thao tác (Audit Log) bảng NhatKyThaoTac")]
        C6["Commit Transaction"]
    end

    A5 --> B1
    B1 --> B2
    B2 -- Dữ liệu sai --> B3
    B3 --> A4
    B2 -- Dữ liệu đúng --> B4
    B4 --> B5
    B5 --> SaveData
    SaveData --> C5
    C5 --> C6
    C6 --> B10
    B10 --> A6
'''

compressed = zlib.compress(code.encode('utf-8'), 9)
encoded = base64.urlsafe_b64encode(compressed).decode('utf-8')
url = f'https://kroki.io/mermaid/png/{encoded}'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        w, h = struct.unpack('>LL', data[16:24])
        print(f'Rendered size: {w}x{h}, aspect ratio w/h = {w/h:.2f}, h/w = {h/w:.2f}')
        with open('scratch/test_balanced.png', 'wb') as f:
            f.write(data)
except Exception as e:
    print('Error:', e)
