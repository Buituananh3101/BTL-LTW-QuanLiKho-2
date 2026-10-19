import subprocess, struct

def test_mmd(code, name):
    with open(f'scratch/{name}.mmd', 'w', encoding='utf-8') as f:
        f.write(code)
    cmd = f'npx @mermaid-js/mermaid-cli -i scratch/{name}.mmd -o scratch/{name}.png -b white -s 2'
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    with open(f'scratch/{name}.png', 'rb') as f:
        f.seek(16)
        w, h = struct.unpack('>LL', f.read(8))
    print(f"[{name}] size: {w}x{h}, w/h={w/h:.2f}, h/w={h/w:.2f}")

# Thử nghiệm 1: flowchart LR nhưng bọc các bước theo cột chuẩn
code1 = '''flowchart LR
    subgraph UI ["1. THỦ KHO / CLIENT UI"]
        direction TB
        subgraph UI_Steps [" "]
            direction TB
            A1([Bắt đầu: Lập phiếu nhập])
            A2["Mở form 'Tạo phiếu nhập hàng'"]
            A3["Chọn NCC & Kho đích"]
            A4["F3 Tìm kiếm hàng, nhập SL & Giá"]
            A5["Bấm nút 'Hoàn thành'"]
            A1 --> A2 --> A3 --> A4 --> A5
        end
        subgraph UI_Result [" "]
            direction TB
            A7["Hiển thị thông báo thành công<br>& Điều hướng danh sách chứng từ"]
            A8([Kết thúc: Hoàn tất])
            A7 --> A8
        end
        UI_Steps --> UI_Result
    end

    subgraph BE ["2. HỆ THỐNG / BACKEND & CSDL"]
        direction TB
        B1["Nhận Request POST Create"]
        B2{"Kiểm tra tính hợp lệ?<br>(Có NCC, Chi tiết >= 1 dòng, SL > 0)"}
        B3["Thông báo lỗi Validation"]
        B4["Mở Transaction CSDL (BeginTransactionAsync)"]
        B5["Tính lại Giá vốn bình quân MAC:<br>GiaVonMoi = (TonCu*GiaCu + SL*GiaNhap) / (TonCu + SL)"]
        
        subgraph DB ["Ghi nhận dữ liệu & Tồn kho trong Transaction"]
            direction TB
            C1[("Master-Detail: Lưu PhieuNhap & ChiTietPhieuNhap (DA_XAC_NHAN)")]
            C2[("Cập nhật Giá vốn mới vào bảng HangHoa")]
            C3[("Tăng số lượng tồn kho qua View vw_TonKhoHienTai")]
            C4[("Cập nhật Công nợ phải trả bảng DonViCapHang")]
            C5[("Ghi Nhật ký thao tác kiểm toán vào bảng NhatKyThaoTac")]
            C1 --> C2 --> C3 --> C4 --> C5
        end
        
        B6["Commit Transaction & Khóa chứng từ vĩnh viễn"]
        
        B1 --> B2
        B2 -- Không hợp lệ --> B3
        B2 -- Hợp lệ --> B4
        B4 --> B5 --> DB --> B6
    end

    A5 ==>|1. Gửi Form| B1
    B3 -.->|Lỗi| A4
    B6 ==>|2. Thành công| A7
'''

test_mmd(code1, 'exp1')
# Thử nghiệm 2: flowchart TD
code2 = '''flowchart TD
    subgraph UI ["1. THỦ KHO / CLIENT UI"]
        A1([Bắt đầu: Lập phiếu nhập]) --> A2["Mở form 'Tạo phiếu nhập hàng'"]
        A2 --> A3["Chọn NCC & Kho đích"]
        A3 --> A4["F3 Tìm kiếm hàng, nhập SL & Giá"]
        A4 --> A5["Bấm nút 'Hoàn thành'"]
        A7["Hiển thị thông báo thành công<br>& Điều hướng danh sách chứng từ"] --> A8([Kết thúc: Hoàn tất])
    end

    subgraph BE ["2. HỆ THỐNG / BACKEND & CSDL"]
        B1["Nhận Request POST Create"] --> B2{"Kiểm tra tính hợp lệ?<br>(Có NCC, Chi tiết >= 1 dòng, SL > 0)"}
        B2 -- Không hợp lệ --> B3["Thông báo lỗi Validation"]
        B2 -- Hợp lệ --> B4["Mở Transaction CSDL (BeginTransactionAsync)"]
        B4 --> B5["Tính lại Giá vốn bình quân MAC:<br>GiaVonMoi = (TonCu*GiaCu + SL*GiaNhap) / (TonCu + SL)"]
        
        subgraph DB ["Ghi nhận dữ liệu & Tồn kho trong Transaction"]
            C1[("Master-Detail: Lưu PhieuNhap & ChiTietPhieuNhap (DA_XAC_NHAN)")]
            C2[("Cập nhật Giá vốn mới vào bảng HangHoa")]
            C3[("Tăng số lượng tồn kho qua View vw_TonKhoHienTai")]
            C4[("Cập nhật Công nợ phải trả bảng DonViCapHang")]
            C5[("Ghi Nhật ký thao tác kiểm toán vào bảng NhatKyThaoTac")]
            C1 --> C2 --> C3 --> C4 --> C5
        end
        
        B5 --> DB
        DB --> B6["Commit Transaction & Khóa chứng từ vĩnh viễn"]
    end

    A5 ==>|1. Gửi Form POST| B1
    B3 -.->|Lỗi| A4
    B6 ==>|2. Thành công| A7
'''

test_mmd(code2, 'exp2')
