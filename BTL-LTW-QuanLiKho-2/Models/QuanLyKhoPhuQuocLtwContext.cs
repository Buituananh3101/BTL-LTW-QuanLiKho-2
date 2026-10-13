using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace BTL_LTW_QuanLiKho_2.Models;

public partial class QuanLyKhoPhuQuocLtwContext : DbContext
{
    public QuanLyKhoPhuQuocLtwContext(DbContextOptions<QuanLyKhoPhuQuocLtwContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ChiTietDonBan> ChiTietDonBans { get; set; }

    public virtual DbSet<ChiTietPhieuChuyenKho> ChiTietPhieuChuyenKhos { get; set; }

    public virtual DbSet<ChiTietPhieuDieuChinh> ChiTietPhieuDieuChinhs { get; set; }

    public virtual DbSet<ChiTietPhieuKiemKe> ChiTietPhieuKiemKes { get; set; }

    public virtual DbSet<ChiTietPhieuNhap> ChiTietPhieuNhaps { get; set; }

    public virtual DbSet<ChiTietPhieuXuat> ChiTietPhieuXuats { get; set; }

    public virtual DbSet<DonBan> DonBans { get; set; }

    public virtual DbSet<DonViCapHang> DonViCapHangs { get; set; }

    public virtual DbSet<DonViTinh> DonViTinhs { get; set; }

    public virtual DbSet<HangHoa> HangHoas { get; set; }

    public virtual DbSet<KhachHang> KhachHangs { get; set; }

    public virtual DbSet<Kho> Khos { get; set; }

    public virtual DbSet<KhoanThu> KhoanThus { get; set; }

    public virtual DbSet<NguongTonKho> NguongTonKhos { get; set; }

    public virtual DbSet<NhanVien> NhanViens { get; set; }

    public virtual DbSet<NhatKyThaoTac> NhatKyThaoTacs { get; set; }

    public virtual DbSet<NhomHang> NhomHangs { get; set; }

    public virtual DbSet<PhieuChuyenKho> PhieuChuyenKhos { get; set; }

    public virtual DbSet<PhieuDieuChinh> PhieuDieuChinhs { get; set; }

    public virtual DbSet<PhieuKiemKe> PhieuKiemKes { get; set; }

    public virtual DbSet<PhieuNhap> PhieuNhaps { get; set; }

    public virtual DbSet<PhieuXuat> PhieuXuats { get; set; }

    public virtual DbSet<TaiKhoan> TaiKhoans { get; set; }

    public virtual DbSet<TaiKhoanKho> TaiKhoanKhos { get; set; }

    public virtual DbSet<VaiTro> VaiTros { get; set; }

    public virtual DbSet<VwTonKhoHienTai> VwTonKhoHienTais { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ChiTietDonBan>(entity =>
        {
            entity.HasKey(e => e.MaCtdonBan).HasName("PK__ChiTietD__D45798D32D1A76E5");

            entity.ToTable("ChiTietDonBan");

            entity.HasIndex(e => new { e.MaDonBan, e.MaHang }, "UQ_CTDB_Don_Hang").IsUnique();

            entity.Property(e => e.MaCtdonBan).HasColumnName("MaCTDonBan");
            entity.Property(e => e.ChietKhau).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.DonGiaApDung).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SoLuong).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.MaDonBanNavigation).WithMany(p => p.ChiTietDonBans)
                .HasForeignKey(d => d.MaDonBan)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTDB_DonBan");

            entity.HasOne(d => d.MaHangNavigation).WithMany(p => p.ChiTietDonBans)
                .HasForeignKey(d => d.MaHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTDB_HangHoa");
        });

        modelBuilder.Entity<ChiTietPhieuChuyenKho>(entity =>
        {
            entity.HasKey(e => e.MaCtphieuChuyen).HasName("PK__ChiTietP__17923AB94DC76C87");

            entity.ToTable("ChiTietPhieuChuyenKho");

            entity.HasIndex(e => new { e.MaPhieuChuyen, e.MaHang }, "UQ_CTPCK_Phieu_Hang").IsUnique();

            entity.Property(e => e.MaCtphieuChuyen).HasColumnName("MaCTPhieuChuyen");
            entity.Property(e => e.SoLuong).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.MaHangNavigation).WithMany(p => p.ChiTietPhieuChuyenKhos)
                .HasForeignKey(d => d.MaHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTPCK_HangHoa");

            entity.HasOne(d => d.MaPhieuChuyenNavigation).WithMany(p => p.ChiTietPhieuChuyenKhos)
                .HasForeignKey(d => d.MaPhieuChuyen)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTPCK_PhieuChuyen");
        });

        modelBuilder.Entity<ChiTietPhieuDieuChinh>(entity =>
        {
            entity.HasKey(e => e.MaCtdieuChinh).HasName("PK__ChiTietP__CE427CD9694E2905");

            entity.ToTable("ChiTietPhieuDieuChinh");

            entity.HasIndex(e => e.MaCtkiemKe, "UQ__ChiTietP__A5FC6EBD3F3E0054").IsUnique();

            entity.Property(e => e.MaCtdieuChinh).HasColumnName("MaCTDieuChinh");
            entity.Property(e => e.MaCtkiemKe).HasColumnName("MaCTKiemKe");
            entity.Property(e => e.SoLuongDieuChinh).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.MaCtkiemKeNavigation).WithOne(p => p.ChiTietPhieuDieuChinh)
                .HasForeignKey<ChiTietPhieuDieuChinh>(d => d.MaCtkiemKe)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTPDC_CTKiemKe");

            entity.HasOne(d => d.MaPhieuDieuChinhNavigation).WithMany(p => p.ChiTietPhieuDieuChinhs)
                .HasForeignKey(d => d.MaPhieuDieuChinh)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTPDC_PhieuDieuChinh");
        });

        modelBuilder.Entity<ChiTietPhieuKiemKe>(entity =>
        {
            entity.HasKey(e => e.MaCtkiemKe).HasName("PK__ChiTietP__A5FC6EBC56D45112");

            entity.ToTable("ChiTietPhieuKiemKe");

            entity.HasIndex(e => new { e.MaPhieuKiemKe, e.MaHang }, "UQ_CTPKK_Phieu_Hang").IsUnique();

            entity.Property(e => e.MaCtkiemKe).HasColumnName("MaCTKiemKe");
            entity.Property(e => e.SoLuongTheoSo).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SoLuongThucTe).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.MaHangNavigation).WithMany(p => p.ChiTietPhieuKiemKes)
                .HasForeignKey(d => d.MaHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTPKK_HangHoa");

            entity.HasOne(d => d.MaPhieuKiemKeNavigation).WithMany(p => p.ChiTietPhieuKiemKes)
                .HasForeignKey(d => d.MaPhieuKiemKe)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTPKK_PhieuKiemKe");
        });

        modelBuilder.Entity<ChiTietPhieuNhap>(entity =>
        {
            entity.HasKey(e => e.MaCtphieuNhap).HasName("PK__ChiTietP__79208174AB986965");

            entity.ToTable("ChiTietPhieuNhap");

            entity.HasIndex(e => new { e.MaPhieuNhap, e.MaHang }, "UQ_CTPN_Phieu_Hang").IsUnique();

            entity.Property(e => e.MaCtphieuNhap).HasColumnName("MaCTPhieuNhap");
            entity.Property(e => e.DonGiaNhap).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SoLuong).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.MaHangNavigation).WithMany(p => p.ChiTietPhieuNhaps)
                .HasForeignKey(d => d.MaHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTPN_HangHoa");

            entity.HasOne(d => d.MaPhieuNhapNavigation).WithMany(p => p.ChiTietPhieuNhaps)
                .HasForeignKey(d => d.MaPhieuNhap)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTPN_PhieuNhap");
        });

        modelBuilder.Entity<ChiTietPhieuXuat>(entity =>
        {
            entity.HasKey(e => e.MaCtphieuXuat).HasName("PK__ChiTietP__7FB230CAE6284838");

            entity.ToTable("ChiTietPhieuXuat");

            entity.HasIndex(e => e.MaCtdonBan, "UQ__ChiTietP__D45798D2234BC67A").IsUnique();

            entity.Property(e => e.MaCtphieuXuat).HasColumnName("MaCTPhieuXuat");
            entity.Property(e => e.MaCtdonBan).HasColumnName("MaCTDonBan");
            entity.Property(e => e.SoLuongXuat).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.DonGiaXuat)
                .HasColumnType("decimal(18, 2)")
                .HasDefaultValue(0m, "DF_CTPX_DonGia");

            entity.HasOne(d => d.MaCtdonBanNavigation).WithOne(p => p.ChiTietPhieuXuat)
                .HasForeignKey<ChiTietPhieuXuat>(d => d.MaCtdonBan)
                .HasConstraintName("FK_CTPX_CTDonBan");

            entity.HasOne(d => d.MaHangNavigation).WithMany(p => p.ChiTietPhieuXuats)
                .HasForeignKey(d => d.MaHang)
                .HasConstraintName("FK_CTPX_HangHoa");

            entity.HasOne(d => d.MaPhieuXuatNavigation).WithMany(p => p.ChiTietPhieuXuats)
                .HasForeignKey(d => d.MaPhieuXuat)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CTPX_PhieuXuat");
        });

        modelBuilder.Entity<DonBan>(entity =>
        {
            entity.HasKey(e => e.MaDonBan).HasName("PK__DonBan__CDB61EB4BE93A9D4");

            entity.ToTable("DonBan");

            entity.HasIndex(e => new { e.MaKho, e.TrangThai }, "IX_DonBan_Kho_TrangThai");

            entity.Property(e => e.GhiChu).HasMaxLength(500);
            entity.Property(e => e.MaKh).HasColumnName("MaKH");
            entity.Property(e => e.MaNvlap).HasColumnName("MaNVLap");
            entity.Property(e => e.NgayLap).HasDefaultValueSql("(sysdatetime())", "DF_DonBan_NgayLap");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("NHAP", "DF_DonBan_TrangThai");

            entity.HasOne(d => d.MaKhNavigation).WithMany(p => p.DonBans)
                .HasForeignKey(d => d.MaKh)
                .HasConstraintName("FK_DonBan_KhachHang");

            entity.HasOne(d => d.MaKhoNavigation).WithMany(p => p.DonBans)
                .HasForeignKey(d => d.MaKho)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DonBan_Kho");

            entity.HasOne(d => d.MaNvlapNavigation).WithMany(p => p.DonBans)
                .HasForeignKey(d => d.MaNvlap)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DonBan_NVLap");
        });

        modelBuilder.Entity<DonViCapHang>(entity =>
        {
            entity.HasKey(e => e.MaDonViCapHang).HasName("PK__DonViCap__6E06577711FC368F");

            entity.ToTable("DonViCapHang");

            entity.HasIndex(e => e.TenDonVi, "UQ__DonViCap__9031EA2583E39946").IsUnique();

            entity.Property(e => e.DiaChi).HasMaxLength(255);
            entity.Property(e => e.DienThoai)
                .HasMaxLength(15)
                .IsUnicode(false);
            entity.Property(e => e.TenDonVi).HasMaxLength(150);
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("HOAT_DONG", "DF_DonViCapHang_TrangThai");
        });

        modelBuilder.Entity<DonViTinh>(entity =>
        {
            entity.HasKey(e => e.MaDvt).HasName("PK__DonViTin__3D895AFE8AEACC48");

            entity.ToTable("DonViTinh");

            entity.HasIndex(e => e.TenDvt, "UQ__DonViTin__316F60CC8B88A864").IsUnique();

            entity.Property(e => e.MaDvt).HasColumnName("MaDVT");
            entity.Property(e => e.MoTa).HasMaxLength(255);
            entity.Property(e => e.TenDvt)
                .HasMaxLength(50)
                .HasColumnName("TenDVT");
        });

        modelBuilder.Entity<HangHoa>(entity =>
        {
            entity.HasKey(e => e.MaHang).HasName("PK__HangHoa__19C0DB1D43713BAC");

            entity.ToTable("HangHoa");

            entity.HasIndex(e => e.MaHangNoiBo, "UQ__HangHoa__65D2FAF85F8CB84A").IsUnique();

            entity.Property(e => e.GiaBanThamKhao).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.GiaVon)
                .HasColumnType("decimal(18, 2)")
                .HasDefaultValue(0m, "DF_HangHoa_GiaVon");
            entity.Property(e => e.MaDvt).HasColumnName("MaDVT");
            entity.Property(e => e.MaHangNoiBo)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.QuyCach).HasMaxLength(255);
            entity.Property(e => e.TenHang).HasMaxLength(150);
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("DANG_BAN", "DF_HangHoa_TrangThai");
            entity.Property(e => e.HinhAnh).HasColumnType("varbinary(max)");
            entity.Property(e => e.NgayTao).HasColumnType("datetime");

            entity.HasOne(d => d.MaDvtNavigation).WithMany(p => p.HangHoas)
                .HasForeignKey(d => d.MaDvt)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HangHoa_DonViTinh");

            entity.HasOne(d => d.MaNhomNavigation).WithMany(p => p.HangHoas)
                .HasForeignKey(d => d.MaNhom)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HangHoa_NhomHang");
        });

        modelBuilder.Entity<KhachHang>(entity =>
        {
            entity.HasKey(e => e.MaKh).HasName("PK__KhachHan__2725CF1E7CAF039A");

            entity.ToTable("KhachHang");

            entity.Property(e => e.MaKh).HasColumnName("MaKH");
            entity.Property(e => e.DiaChi).HasMaxLength(255);
            entity.Property(e => e.DienThoai)
                .HasMaxLength(15)
                .IsUnicode(false);
            entity.Property(e => e.LoaiKhachHang)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("LE", "DF_KhachHang_Loai");
            entity.Property(e => e.TenKh)
                .HasMaxLength(150)
                .HasColumnName("TenKH");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("HOAT_DONG", "DF_KhachHang_TrangThai");
        });

        modelBuilder.Entity<Kho>(entity =>
        {
            entity.HasKey(e => e.MaKho).HasName("PK__Kho__3BDA93505446AD4B");

            entity.ToTable("Kho");

            entity.HasIndex(e => e.TenKho, "UQ__Kho__33A304E1ADEA41D1").IsUnique();

            entity.Property(e => e.DiaChi).HasMaxLength(255);
            entity.Property(e => e.MoTa).HasMaxLength(255);
            entity.Property(e => e.TenKho).HasMaxLength(100);
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("HOAT_DONG", "DF_Kho_TrangThai");
        });

        modelBuilder.Entity<KhoanThu>(entity =>
        {
            entity.HasKey(e => e.MaKhoanThu).HasName("PK__KhoanThu__E2C9C52901DD9CA1");

            entity.ToTable("KhoanThu");

            entity.HasIndex(e => e.MaDonBan, "IX_KhoanThu_DonBan");

            entity.Property(e => e.GhiChu).HasMaxLength(500);
            entity.Property(e => e.MaNvthu).HasColumnName("MaNVThu");
            entity.Property(e => e.PhuongThuc)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.SoTien).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ThoiDiemThu).HasDefaultValueSql("(sysdatetime())", "DF_KhoanThu_ThoiDiem");

            entity.HasOne(d => d.MaDonBanNavigation).WithMany(p => p.KhoanThus)
                .HasForeignKey(d => d.MaDonBan)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_KhoanThu_DonBan");

            entity.HasOne(d => d.MaNvthuNavigation).WithMany(p => p.KhoanThus)
                .HasForeignKey(d => d.MaNvthu)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_KhoanThu_NhanVien");
        });

        modelBuilder.Entity<NguongTonKho>(entity =>
        {
            entity.HasKey(e => new { e.MaKho, e.MaHang }).HasName("PK__NguongTo__FA469EE10DB50E70");

            entity.ToTable("NguongTonKho");

            entity.Property(e => e.TonToiThieu).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.MaHangNavigation).WithMany(p => p.NguongTonKhos)
                .HasForeignKey(d => d.MaHang)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_NguongTonKho_HangHoa");

            entity.HasOne(d => d.MaKhoNavigation).WithMany(p => p.NguongTonKhos)
                .HasForeignKey(d => d.MaKho)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_NguongTonKho_Kho");
        });

        modelBuilder.Entity<NhanVien>(entity =>
        {
            entity.HasKey(e => e.MaNv).HasName("PK__NhanVien__2725D70A597B4747");

            entity.ToTable("NhanVien");

            entity.HasIndex(e => e.DienThoai, "UQ__NhanVien__1F03187671FDCEDF").IsUnique();

            entity.HasIndex(e => e.Email, "UQ__NhanVien__A9D1053403FAD8BD").IsUnique();

            entity.Property(e => e.MaNv).HasColumnName("MaNV");
            entity.Property(e => e.DiaChi).HasMaxLength(255);
            entity.Property(e => e.DienThoai)
                .HasMaxLength(15)
                .IsUnicode(false);
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.HoTen).HasMaxLength(100);
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("DANG_LAM", "DF_NhanVien_TrangThai");
        });

        modelBuilder.Entity<NhatKyThaoTac>(entity =>
        {
            entity.HasKey(e => e.MaNhatKy).HasName("PK__NhatKyTh__E42EF42EF5334A86");

            entity.ToTable("NhatKyThaoTac");

            entity.HasIndex(e => new { e.MaTaiKhoan, e.ThoiDiem }, "IX_NhatKy_TaiKhoan_ThoiDiem").IsDescending(false, true);

            entity.Property(e => e.LoaiDoiTuong).HasMaxLength(50);
            entity.Property(e => e.MaDoiTuong)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.NoiDung).HasMaxLength(1000);
            entity.Property(e => e.ThaoTac).HasMaxLength(100);
            entity.Property(e => e.ThoiDiem).HasDefaultValueSql("(sysdatetime())", "DF_NhatKy_ThoiDiem");

            entity.HasOne(d => d.MaTaiKhoanNavigation).WithMany(p => p.NhatKyThaoTacs)
                .HasForeignKey(d => d.MaTaiKhoan)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_NhatKy_TaiKhoan");
        });

        modelBuilder.Entity<NhomHang>(entity =>
        {
            entity.HasKey(e => e.MaNhom).HasName("PK__NhomHang__234F91CD9A4C7AC3");

            entity.ToTable("NhomHang");

            entity.HasIndex(e => e.TenNhom, "UQ__NhomHang__2B432D0D1E500267").IsUnique();

            entity.Property(e => e.MoTa).HasMaxLength(255);
            entity.Property(e => e.TenNhom).HasMaxLength(100);
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("HOAT_DONG", "DF_NhomHang_TrangThai");
        });

        modelBuilder.Entity<PhieuChuyenKho>(entity =>
        {
            entity.HasKey(e => e.MaPhieuChuyen).HasName("PK__PhieuChu__21F3BB92A92DB534");

            entity.ToTable("PhieuChuyenKho");

            entity.HasIndex(e => new { e.MaKhoDich, e.TrangThai }, "IX_PhieuChuyen_KhoDich_TrangThai");

            entity.HasIndex(e => new { e.MaKhoNguon, e.TrangThai }, "IX_PhieuChuyen_KhoNguon_TrangThai");

            entity.Property(e => e.GhiChu).HasMaxLength(500);
            entity.Property(e => e.MaNvlap).HasColumnName("MaNVLap");
            entity.Property(e => e.MaNvnhan).HasColumnName("MaNVNhan");
            entity.Property(e => e.MaNvxuat).HasColumnName("MaNVXuat");
            entity.Property(e => e.NgayLap).HasDefaultValueSql("(sysdatetime())", "DF_PhieuChuyen_NgayLap");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("NHAP", "DF_PhieuChuyen_TrangThai");

            entity.HasOne(d => d.MaKhoDichNavigation).WithMany(p => p.PhieuChuyenKhoMaKhoDichNavigations)
                .HasForeignKey(d => d.MaKhoDich)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PhieuChuyen_KhoDich");

            entity.HasOne(d => d.MaKhoNguonNavigation).WithMany(p => p.PhieuChuyenKhoMaKhoNguonNavigations)
                .HasForeignKey(d => d.MaKhoNguon)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PhieuChuyen_KhoNguon");

            entity.HasOne(d => d.MaNvlapNavigation).WithMany(p => p.PhieuChuyenKhoMaNvlapNavigations)
                .HasForeignKey(d => d.MaNvlap)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PhieuChuyen_NVLap");

            entity.HasOne(d => d.MaNvnhanNavigation).WithMany(p => p.PhieuChuyenKhoMaNvnhanNavigations)
                .HasForeignKey(d => d.MaNvnhan)
                .HasConstraintName("FK_PhieuChuyen_NVNhan");

            entity.HasOne(d => d.MaNvxuatNavigation).WithMany(p => p.PhieuChuyenKhoMaNvxuatNavigations)
                .HasForeignKey(d => d.MaNvxuat)
                .HasConstraintName("FK_PhieuChuyen_NVXuat");
        });

        modelBuilder.Entity<PhieuDieuChinh>(entity =>
        {
            entity.HasKey(e => e.MaPhieuDieuChinh).HasName("PK__PhieuDie__B6B1F184C70C51E6");

            entity.ToTable("PhieuDieuChinh");

            entity.HasIndex(e => e.MaPhieuKiemKe, "UQ__PhieuDie__40B08EA98AB640C9").IsUnique();

            entity.Property(e => e.GhiChu).HasMaxLength(500);
            entity.Property(e => e.MaNvduyet).HasColumnName("MaNVDuyet");
            entity.Property(e => e.MaNvlap).HasColumnName("MaNVLap");
            entity.Property(e => e.NgayLap).HasDefaultValueSql("(sysdatetime())", "DF_PhieuDieuChinh_NgayLap");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("NHAP", "DF_PhieuDieuChinh_TrangThai");

            entity.HasOne(d => d.MaNvduyetNavigation).WithMany(p => p.PhieuDieuChinhMaNvduyetNavigations)
                .HasForeignKey(d => d.MaNvduyet)
                .HasConstraintName("FK_PhieuDieuChinh_NVDuyet");

            entity.HasOne(d => d.MaNvlapNavigation).WithMany(p => p.PhieuDieuChinhMaNvlapNavigations)
                .HasForeignKey(d => d.MaNvlap)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PhieuDieuChinh_NVLap");

            entity.HasOne(d => d.MaPhieuKiemKeNavigation).WithOne(p => p.PhieuDieuChinh)
                .HasForeignKey<PhieuDieuChinh>(d => d.MaPhieuKiemKe)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PhieuDieuChinh_PhieuKiemKe");
        });

        modelBuilder.Entity<PhieuKiemKe>(entity =>
        {
            entity.HasKey(e => e.MaPhieuKiemKe).HasName("PK__PhieuKie__40B08EA807710F5D");

            entity.ToTable("PhieuKiemKe");

            entity.Property(e => e.GhiChu).HasMaxLength(500);
            entity.Property(e => e.MaNvlap).HasColumnName("MaNVLap");
            entity.Property(e => e.ThoiDiemChot).HasDefaultValueSql("(sysdatetime())", "DF_PhieuKiemKe_ThoiDiemChot");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("NHAP", "DF_PhieuKiemKe_TrangThai");

            entity.HasOne(d => d.MaKhoNavigation).WithMany(p => p.PhieuKiemKes)
                .HasForeignKey(d => d.MaKho)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PhieuKiemKe_Kho");

            entity.HasOne(d => d.MaNvlapNavigation).WithMany(p => p.PhieuKiemKes)
                .HasForeignKey(d => d.MaNvlap)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PhieuKiemKe_NVLap");
        });

        modelBuilder.Entity<PhieuNhap>(entity =>
        {
            entity.HasKey(e => e.MaPhieuNhap).HasName("PK__PhieuNha__1470EF3B695B27B2");

            entity.ToTable("PhieuNhap");

            entity.HasIndex(e => new { e.MaKho, e.TrangThai }, "IX_PhieuNhap_Kho_TrangThai");

            entity.Property(e => e.GhiChu).HasMaxLength(500);
            entity.Property(e => e.LoaiPhieuNhap)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("THONG_THUONG", "DF_PhieuNhap_Loai");
            entity.Property(e => e.MaNvlap).HasColumnName("MaNVLap");
            entity.Property(e => e.MaNvxacNhan).HasColumnName("MaNVXacNhan");
            entity.Property(e => e.NgayLap).HasDefaultValueSql("(sysdatetime())", "DF_PhieuNhap_NgayLap");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("NHAP", "DF_PhieuNhap_TrangThai");

            entity.HasOne(d => d.MaDonViCapHangNavigation).WithMany(p => p.PhieuNhaps)
                .HasForeignKey(d => d.MaDonViCapHang)
                .HasConstraintName("FK_PhieuNhap_NhaCungCap");

            entity.HasOne(d => d.MaKhoNavigation).WithMany(p => p.PhieuNhaps)
                .HasForeignKey(d => d.MaKho)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PhieuNhap_Kho");

            entity.HasOne(d => d.MaNvlapNavigation).WithMany(p => p.PhieuNhapMaNvlapNavigations)
                .HasForeignKey(d => d.MaNvlap)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PhieuNhap_NVLap");

            entity.HasOne(d => d.MaNvxacNhanNavigation).WithMany(p => p.PhieuNhapMaNvxacNhanNavigations)
                .HasForeignKey(d => d.MaNvxacNhan)
                .HasConstraintName("FK_PhieuNhap_NVXacNhan");
        });

        modelBuilder.Entity<PhieuXuat>(entity =>
        {
            entity.HasKey(e => e.MaPhieuXuat).HasName("PK__PhieuXua__26C4B5A26796E255");

            entity.ToTable("PhieuXuat");

            entity.HasIndex(e => e.MaDonBan, "UQ__PhieuXua__CDB61EB51063B35E").IsUnique();

            entity.Property(e => e.GhiChu).HasMaxLength(500);
            entity.Property(e => e.LoaiPhieuXuat)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("XUAT_BAN", "DF_PhieuXuat_Loai");
            entity.Property(e => e.MaNvlap).HasColumnName("MaNVLap");
            entity.Property(e => e.MaNvxacNhan).HasColumnName("MaNVXacNhan");
            entity.Property(e => e.NgayLap).HasDefaultValueSql("(sysdatetime())", "DF_PhieuXuat_NgayLap");
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("NHAP", "DF_PhieuXuat_TrangThai");

            entity.HasOne(d => d.MaDonBanNavigation).WithOne(p => p.PhieuXuat)
                .HasForeignKey<PhieuXuat>(d => d.MaDonBan)
                .HasConstraintName("FK_PhieuXuat_DonBan");

            entity.HasOne(d => d.MaKhoNavigation).WithMany(p => p.PhieuXuats)
                .HasForeignKey(d => d.MaKho)
                .HasConstraintName("FK_PhieuXuat_Kho");

            entity.HasOne(d => d.MaNvlapNavigation).WithMany(p => p.PhieuXuatMaNvlapNavigations)
                .HasForeignKey(d => d.MaNvlap)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PhieuXuat_NVLap");

            entity.HasOne(d => d.MaNvxacNhanNavigation).WithMany(p => p.PhieuXuatMaNvxacNhanNavigations)
                .HasForeignKey(d => d.MaNvxacNhan)
                .HasConstraintName("FK_PhieuXuat_NVXacNhan");
        });

        modelBuilder.Entity<TaiKhoan>(entity =>
        {
            entity.HasKey(e => e.MaTaiKhoan).HasName("PK__TaiKhoan__AD7C6529BF85411D");

            entity.ToTable("TaiKhoan");

            entity.HasIndex(e => e.MaNv, "UQ__TaiKhoan__2725D70BC2708961").IsUnique();

            entity.HasIndex(e => e.TenDangNhap, "UQ__TaiKhoan__55F68FC0A9013A0E").IsUnique();

            entity.Property(e => e.MaNv).HasColumnName("MaNV");
            entity.Property(e => e.MatKhauHash)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.TenDangNhap)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.TrangThai)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("HOAT_DONG", "DF_TaiKhoan_TrangThai");

            entity.HasOne(d => d.MaNvNavigation).WithOne(p => p.TaiKhoan)
                .HasForeignKey<TaiKhoan>(d => d.MaNv)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TaiKhoan_NhanVien");

            entity.HasOne(d => d.MaVaiTroNavigation).WithMany(p => p.TaiKhoans)
                .HasForeignKey(d => d.MaVaiTro)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TaiKhoan_VaiTro");
        });

        modelBuilder.Entity<VaiTro>(entity =>
        {
            entity.HasKey(e => e.MaVaiTro).HasName("PK__VaiTro__C24C41CF3D1EC701");

            entity.ToTable("VaiTro");

            entity.HasIndex(e => e.TenVaiTro, "UQ__VaiTro__1DA55814D7427A35").IsUnique();

            entity.Property(e => e.MoTa).HasMaxLength(255);
            entity.Property(e => e.TenVaiTro).HasMaxLength(50);
        });

        modelBuilder.Entity<TaiKhoanKho>(entity =>
        {
            entity.HasKey(e => new { e.MaTaiKhoan, e.MaKho }).HasName("PK_TaiKhoan_Kho");

            entity.ToTable("TaiKhoan_Kho");

            entity.Property(e => e.NgayPhanCong)
                .HasDefaultValueSql("(sysdatetime())", "DF_TaiKhoan_Kho_NgayPhanCong");
            entity.Property(e => e.GhiChu).HasMaxLength(255);

            entity.HasOne(d => d.MaKhoNavigation).WithMany(p => p.TaiKhoanKhos)
                .HasForeignKey(d => d.MaKho)
                .HasConstraintName("FK_TaiKhoanKho_Kho");

            entity.HasOne(d => d.MaTaiKhoanNavigation).WithMany(p => p.TaiKhoanKhos)
                .HasForeignKey(d => d.MaTaiKhoan)
                .HasConstraintName("FK_TaiKhoanKho_TaiKhoan");
        });

        modelBuilder.Entity<VwTonKhoHienTai>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_TonKhoHienTai");

            entity.Property(e => e.SoLuongTon).HasColumnType("decimal(18, 2)");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
