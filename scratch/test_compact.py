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

# Thử nghiệm cấu trúc 2 khối Trái - Phải cô đọng, chuyên nghiệp
code_compact = '''flowchart LR
    subgraph Client ["1. Thủ kho / Client UI (Bên Trái)"]
        direction TB
        subgraph C_Input ["Nhập liệu chứng từ"]
            A1([Bắt đầu: Lập phiếu]) --> A2["Mở form 'Tạo phiếu nhập hàng'"]
            A2 --> A3["Chọn Nhà cung cấp & Chi nhánh kho đích"]
            A3 --> A4["F3 Tìm kiếm mặt hàng, nhập SL & Giá nhập"]
            A4 --> A5["Bấm nút 'Hoàn thành'"]
        end
        subgraph C_Output ["Kết quả phản hồi"]
            A6["Hiển thị thông báo thành công<br>& Điều hướng danh sách chứng từ"] --> A7([Kết thúc: Nhập hàng thành công])
        end
    end

    subgraph Server ["2. Web App & CSDL (Bên Phải)"]
        direction TB
        B1["Nhận Request POST Create & Bind Model"] --> B2{"Kiểm tra tính hợp lệ?<br>(Có NCC, Chi tiết >= 1 dòng, SL > 0)"}
        B2 -- Không hợp lệ --> B3["Trả về thông báo lỗi Validation Form"]
        B2 -- Hợp lệ --> B4["Mở Transaction CSDL (BeginTransactionAsync)"]
        B4 --> B5["Tính lại Giá vốn bình quân MAC:<br>GiaVonMoi = (TonCu*GiaCu + SL*GiaNhap) / (TonCu + SL)"]
        
        subgraph DB ["Thực thi CSDL trong Transaction"]
            C1[("1. Lưu PhieuNhap & ChiTietPhieuNhap (DA_XAC_NHAN)")]
            C2[("2. Cập nhật Giá vốn mới vào bảng HangHoa")]
            C3[("3. Tăng tồn kho qua View vw_TonKhoHienTai")]
            C4[("4. Cập nhật Công nợ phải trả bảng DonViCapHang")]
            C5[("5. Ghi Nhật ký thao tác vào bảng NhatKyThaoTac")]
            C1 --> C2 --> C3 --> C4 --> C5
        end
        
        B5 --> DB
        DB --> B6["Commit Transaction & Khóa chứng từ vĩnh viễn"]
    end

    A5 ==>|Gửi POST Form| B1
    B3 -.->|Báo lỗi nhập lại| A4
    B6 ==>|HTTP 200 OK| A6
'''
test_code(code_compact, 'compact1')
