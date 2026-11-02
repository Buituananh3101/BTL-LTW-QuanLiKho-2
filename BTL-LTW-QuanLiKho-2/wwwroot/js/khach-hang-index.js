/**
 * khach-hang-index.js - Quản lý tương tác màn hình Danh sách Khách hàng
 * Đồng bộ 100% với khuôn mẫu Danh sách Hàng hóa và 4 ảnh KiotViet thực tế
 */

(function ($) {
    'use strict';

    // 1. Trạng thái bộ lọc toàn cục
    const state = {
        q: '',
        nhomKhachHangs: [],
        loaiKhachHangs: [],
        loaiKhachHangSegment: 'ALL',
        gioiTinh: 'ALL',
        trangThais: ['HOAT_DONG'],
        tgTaoFilter: 'ALL',
        tgTaoTu: null,
        tgTaoDen: null,
        sinhNhatFilter: 'ALL',
        nguoiTao: 'ALL',
        tongBanTu: null,
        tongBanDen: null,
        noTu: null,
        noDen: null,
        daDanhDau: $('#kiotContainer').data('is-starred') === true,
        sortBy: $('#kiotContainer').data('sort-by') || 'makh',
        sortDir: $('#kiotContainer').data('sort-dir') || 'desc',
        page: 1,
        pageSize: 15,
        expandedId: null
    };

    /* ==========================================================================
       2. TẢI VÀ NẠP DỮ LIỆU BẢNG BẰNG AJAX
       ========================================================================== */
    function buildFilterParams() {
        const params = new URLSearchParams();

        if (state.q.trim()) params.append('Q', state.q.trim());
        if (state.nhomKhachHangs && state.nhomKhachHangs.length > 0) {
            state.nhomKhachHangs.forEach(n => params.append('NhomKhachHangs', n));
        }
        if (state.loaiKhachHangSegment && state.loaiKhachHangSegment !== 'ALL') {
            params.append('LoaiKhachHangSegment', state.loaiKhachHangSegment);
        }
        if (state.gioiTinh && state.gioiTinh !== 'ALL') {
            params.append('GioiTinh', state.gioiTinh);
        }
        if (state.trangThais && state.trangThais.length > 0) {
            state.trangThais.forEach(st => params.append('TrangThais', st));
        }
        if (state.tgTaoFilter && state.tgTaoFilter !== 'ALL') {
            params.append('TgTaoFilter', state.tgTaoFilter);
            if (state.tgTaoTu) params.append('TgTaoTu', state.tgTaoTu);
            if (state.tgTaoDen) params.append('TgTaoDen', state.tgTaoDen);
        }
        if (state.sinhNhatFilter && state.sinhNhatFilter !== 'ALL') {
            params.append('SinhNhatFilter', state.sinhNhatFilter);
        }
        if (state.nguoiTao && state.nguoiTao !== 'ALL') {
            params.append('NguoiTao', state.nguoiTao);
        }
        if (state.tongBanTu !== null && state.tongBanTu !== undefined) {
            params.append('TongBanTu', state.tongBanTu);
        }
        if (state.tongBanDen !== null && state.tongBanDen !== undefined) {
            params.append('TongBanDen', state.tongBanDen);
        }
        if (state.noTu !== null && state.noTu !== undefined) {
            params.append('NoTu', state.noTu);
        }
        if (state.noDen !== null && state.noDen !== undefined) {
            params.append('NoDen', state.noDen);
        }
        if (state.daDanhDau) {
            params.append('DaDanhDau', 'true');
        }

        if (state.sortBy) params.append('SortBy', state.sortBy);
        if (state.sortDir) params.append('SortDir', state.sortDir);

        params.append('Page', state.page);
        params.append('PageSize', state.pageSize);

        return params;
    }

    function loadTable() {
        const params = buildFilterParams();
        $('#khachHangTableContainer').addClass('table-loading');

        $.ajax({
            url: '/KhachHang/Filter?' + params.toString(),
            type: 'GET',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            success: function (html) {
                $('#khachHangTableContainer').html(html).removeClass('table-loading');
                applyColumnVisibility();

                // Khôi phục dòng đang mở chi tiết nếu có
                if (state.expandedId) {
                    const $row = $(`tr.product-row[data-id="${state.expandedId}"]`);
                    const $detailRow = $(`#detail-${state.expandedId}`);
                    if ($row.length && $detailRow.length) {
                        $row.addClass('selected');
                        const visibleCols = $('#productTable thead tr:first-child th:visible').length || 18;
                        $detailRow.find('> td').attr('colspan', visibleCols);
                        $detailRow.show();
                        $detailRow.find('.product-detail-panel-wrap').show();
                    } else {
                        state.expandedId = null;
                    }
                }
            },
            error: function () {
                $('#khachHangTableContainer').removeClass('table-loading');
                if (window.KiotToast) KiotToast.error('Không thể tải dữ liệu khách hàng.');
            }
        });
    }

    /* ==========================================================================
       3. TÙY CHỌN ẨN / HIỆN CỘT (LƯU LOCALSTORAGE V2)
       ========================================================================== */
    const STORAGE_KEY_COLS = 'kiot_khach_hang_cols_v2';

    function initColumnToggle() {
        let saved = null;
        try {
            saved = JSON.parse(localStorage.getItem(STORAGE_KEY_COLS));
        } catch (e) { }

        if (saved && Array.isArray(saved)) {
            $('#colMenu input[data-c]').each(function () {
                const col = $(this).data('c');
                $(this).prop('checked', saved.includes(col));
            });
        }

        applyColumnVisibility();

        $('#colMenu input[data-c]').on('change', function () {
            const activeCols = [];
            $('#colMenu input[data-c]:checked').each(function () {
                activeCols.push($(this).data('c'));
            });
            localStorage.setItem(STORAGE_KEY_COLS, JSON.stringify(activeCols));
            applyColumnVisibility();
        });
    }

    function applyColumnVisibility() {
        const visibleCols = {};
        $('#colMenu input[data-c]').each(function () {
            const col = $(this).data('c');
            visibleCols[col] = $(this).is(':checked');
        });

        $('#productTable thead th[data-col], #productTable tbody td[data-col]').each(function () {
            const col = $(this).data('col');
            if (visibleCols[col] !== undefined) {
                $(this).toggle(visibleCols[col]);
            }
        });

        const visibleCount = $('#productTable thead th:visible').length || 18;
        $('#productTable tbody tr.product-detail-row > td').attr('colspan', visibleCount);
        $('#productTable tbody tr.empty-row > td').attr('colspan', visibleCount);
    }

    /* ==========================================================================
       4. MASTER-DETAIL INLINE DRAWER (KHỚP CHUẨN HÀNG HÓA - RENDER SẴN, ZERO LAG)
       ========================================================================== */
    $(document).on('click', '#productTable tbody .product-row', function (e) {
        if ($(e.target).closest('input[type="checkbox"], button, a, label, .star-btn').length) {
            return;
        }

        const id = $(this).data('id');
        const $detailRow = $(`#detail-${id}`).first();
        if (!$detailRow.length) return;

        const $wrap = $detailRow.find('.product-detail-panel-wrap');
        const isCurrentlyOpen = $detailRow.is(':visible');

        // Đóng các dòng khác đang mở một cách mượt mà không xung đột
        $('.product-detail-row').not($detailRow).each(function () {
            const $other = $(this);
            $other.find('.product-detail-panel-wrap').stop(true, true).slideUp(150, function () {
                $other.hide();
            });
        });
        $('.product-row').not(this).removeClass('selected');

        if (isCurrentlyOpen) {
            $wrap.stop(true, true).slideUp(150, function () {
                $detailRow.hide();
            });
            $(this).removeClass('selected');
            state.expandedId = null;
        } else {
            $(this).addClass('selected');
            state.expandedId = id;

            const visibleCols = $('#productTable thead tr:first-child th:visible').length || 18;
            $detailRow.find('> td').attr('colspan', visibleCols);

            $detailRow.show();
            $wrap.stop(true, true).hide().slideDown(150);
        }
    });

    // Chuyển Tab bên trong chi tiết
    $(document).on('click', '.product-detail-tab-btn', function (e) {
        e.stopPropagation();
        const tab = $(this).data('tab');
        const $panel = $(this).closest('.product-detail-panel');

        $panel.find('.product-detail-tab-btn').removeClass('active');
        $(this).addClass('active');

        $panel.find('.tab-pane-content').hide();
        $panel.find(`.tab-${tab}`).stop(true, true).fadeIn(120);
    });

    /* ==========================================================================
       5. SẮP XẾP 3 TRẠNG THÁI TRÊN HEADER CỘT
       ========================================================================== */
    $(document).on('click', '#productTable thead th.sortable-th', function () {
        const col = $(this).data('sort');
        if (!col) return;

        if (state.sortBy === col) {
            if (state.sortDir === 'asc') {
                state.sortDir = 'desc';
            } else if (state.sortDir === 'desc') {
                state.sortBy = 'makh';
                state.sortDir = 'desc';
            }
        } else {
            state.sortBy = col;
            state.sortDir = 'asc';
        }

        state.page = 1;
        loadTable();
    });

    // Lọc theo sao ⭐ trên header
    window.toggleStarHeaderFilter = function (e) {
        e.stopPropagation();
        state.daDanhDau = !state.daDanhDau;
        const $btn = $('#starHeaderFilter');
        if (state.daDanhDau) {
            $btn.addClass('starred').attr('title', 'Bỏ lọc sao (Hiển thị tất cả)').find('i').removeClass('bi-star').addClass('bi-star-fill');
        } else {
            $btn.removeClass('starred').attr('title', 'Lọc danh sách khách hàng được đánh dấu sao').find('i').removeClass('bi-star-fill').addClass('bi-star');
        }
        state.page = 1;
        loadTable();
    };

    // Đánh dấu sao cho từng khách hàng
    window.toggleFavoriteKhachHang = function (e, id, el) {
        e.stopPropagation();
        const $btn = $(el).find('.star-btn');
        $.ajax({
            url: `/KhachHang/ToggleFavorite/${id}`,
            type: 'POST',
            success: function (res) {
                if (res.success) {
                    if (res.isStarred) {
                        $btn.addClass('starred').find('i').removeClass('bi-star').addClass('bi-star-fill');
                    } else {
                        $btn.removeClass('starred').find('i').removeClass('bi-star-fill').addClass('bi-star');
                    }
                    if (window.KiotToast) KiotToast.success(res.isStarred ? 'Đã đánh dấu sao khách hàng.' : 'Đã bỏ đánh dấu sao.');
                }
            }
        });
    };

    /* ==========================================================================
       6. PHÂN TRANG AJAX & TÌM KIẾM
       ========================================================================== */
    $(document).on('click', '.kiot-pagination-wrap .pagination .page-link', function (e) {
        e.preventDefault();
        const page = parseInt($(this).data('page'));
        if (!page || isNaN(page) || page === state.page) return;

        state.page = page;
        loadTable();
    });

    // Ô tìm kiếm nhanh F3 (Debounce 300ms)
    let searchTimeout = null;
    $('#keywordSearch').on('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
            state.q = $('#keywordSearch').val() || '';
            state.page = 1;
            loadTable();
        }, 300);
    });

    // Phím tắt F3 & F4
    $(document).on('keydown', function (e) {
        if (e.key === 'F3' || e.keyCode === 114) {
            e.preventDefault();
            $('#keywordSearch').focus().select();
        } else if (e.key === 'F4' || e.keyCode === 115) {
            e.preventDefault();
            $('#btnToggleSidebar').click();
        }
    });

    // Nút tải lại bảng
    $('#btnReloadTable').on('click', function () {
        loadTable();
    });

    // Xuất file Excel
    $('#btnExportExcel').on('click', function () {
        const params = buildFilterParams();
        params.append('export', 'excel');
        window.location.href = '/KhachHang/ExportExcel?' + params.toString();
    });

    // Checkbox chọn tất cả
    $(document).on('change', '#selectAllRows', function () {
        const checked = $(this).is(':checked');
        $('table.tbl tbody input.row-select').prop('checked', checked);
    });

    /* ==========================================================================
       7. CÁC BỘ LỌC BÊN SIDEBAR (SEGMENTED BUTTONS & LEGO FILTERS)
       ========================================================================== */
    // Segmented Buttons: Loại khách hàng
    $(document).on('click', '#groupLoaiKhachHang .btn-segmented', function () {
        $('#groupLoaiKhachHang .btn-segmented').removeClass('active');
        $(this).addClass('active');
        state.loaiKhachHangSegment = $(this).data('val') || 'ALL';
        $('#filterLoaiKhachHangSegment').val(state.loaiKhachHangSegment);
        state.page = 1;
        loadTable();
    });

    // Segmented Buttons: Giới tính
    $(document).on('click', '#groupGioiTinh .btn-segmented', function () {
        $('#groupGioiTinh .btn-segmented').removeClass('active');
        $(this).addClass('active');
        state.gioiTinh = $(this).data('val') || 'ALL';
        $('#filterGioiTinh').val(state.gioiTinh);
        state.page = 1;
        loadTable();
    });

    // Người tạo & Sinh nhật
    $('#filterNguoiTao').on('change', function () {
        state.nguoiTao = $(this).val();
        state.page = 1;
        loadTable();
    });

    $('#filterSinhNhat').on('change', function () {
        state.sinhNhatFilter = $(this).val();
        state.page = 1;
        loadTable();
    });

    // Bộ lọc Trạng thái (Lego Status Checkboxes)
    $(document).on('change', '#filterGroup_TrangThai input[type="checkbox"]', function () {
        state.trangThais = [];
        $('#filterGroup_TrangThai input[type="checkbox"]:checked').each(function () {
            state.trangThais.push($(this).val());
        });
        state.page = 1;
        loadTable();
    });

    // Bộ lọc Nhóm khách hàng (Multi-select)
    $(document).on('change', '#dropdownNhomKhachHang input[type="checkbox"]', function () {
        state.nhomKhachHangs = [];
        $('#dropdownNhomKhachHang input[type="checkbox"]:checked').each(function () {
            const val = parseInt($(this).val());
            if (!isNaN(val)) state.nhomKhachHangs.push(val);
        });
        state.page = 1;
        loadTable();
    });

    // Bộ lọc Giá trị (Tổng bán & Nợ hiện tại)
    function setupValueFilter(containerId, onApply) {
        const $box = $(`#${containerId}`);
        if (!$box.length) return;

        $box.find('.kiot-vf-btn-apply').on('click', function () {
            const tuStr = $box.find('.kiot-vf-from').val().replace(/\D/g, '');
            const denStr = $box.find('.kiot-vf-to').val().replace(/\D/g, '');
            const tu = tuStr ? parseFloat(tuStr) : null;
            const den = denStr ? parseFloat(denStr) : null;
            onApply(tu, den);
            state.page = 1;
            loadTable();
        });

        $box.find('.kiot-vf-clear').on('click', function () {
            $box.find('.kiot-vf-from, .kiot-vf-to').val('');
            onApply(null, null);
            state.page = 1;
            loadTable();
        });
    }

    setupValueFilter('filterGroup_TongBan', function (tu, den) {
        state.tongBanTu = tu;
        state.tongBanDen = den;
    });

    setupValueFilter('filterGroup_No', function (tu, den) {
        state.noTu = tu;
        state.noDen = den;
    });

    /* ==========================================================================
       8. MODAL THÊM MỚI & CHỈNH SỬA KHÁCH HÀNG (THEO KHUÔN MẪU HÀNG HÓA & 4 ẢNH)
       ========================================================================== */
    function openModal() {
        $('#khachHangModalOv').addClass('show');
        $('body').addClass('noscroll');
    }

    function closeModal() {
        $('#khachHangModalOv').removeClass('show');
        $('body').removeClass('noscroll');
    }

    // Đóng modal bằng data-close
    $(document).on('click', '[data-close="khachHangModalOv"]', function () {
        closeModal();
    });

    $('#khachHangModalOv').on('click', function (e) {
        if (e.target === this) closeModal();
    });

    // Accordion co giãn đóng/mở
    $(document).on('click', '.hh-sec-h', function () {
        $(this).closest('.hh-sec').toggleClass('open');
    });

    // Chuyển đổi Radio Thông tin xuất hóa đơn (Cá nhân ⇋ Doanh nghiệp)
    function updateXhdView(type) {
        if (type === 'DOANH_NGHIEP') {
            $('#lblMstRequired, #lblDiaChiRequired').show();
            $('#formMaSoThue').attr('placeholder', 'Bắt buộc');
            $('#formXhdDiaChi').attr('placeholder', 'Bắt buộc');
            $('#lblXhdTenDonVi').text('Tên công ty');
            $('#formXhdTenDonVi').attr('placeholder', 'Nhập tên công ty');
            $('#boxXhdCccd').hide();
            $('#boxXhdHoChieu').hide();
            $('#boxXhdDvqhns').show();
        } else {
            $('#lblMstRequired, #lblDiaChiRequired').hide();
            $('#formMaSoThue').attr('placeholder', 'Nhập mã số thuế');
            $('#formXhdDiaChi').attr('placeholder', 'Nhập địa chỉ');
            $('#lblXhdTenDonVi').text('Tên đơn vị');
            $('#formXhdTenDonVi').attr('placeholder', 'Nhập tên đơn vị');
            $('#boxXhdCccd').show();
            $('#boxXhdHoChieu').show();
            $('#boxXhdDvqhns').hide();
        }
    }

    $('input[name="xhdLoaiSwitch"]').on('change', function () {
        updateXhdView($(this).val());
    });

    // Xử lý Avatar upload preview
    $('#avatarPreviewBox').on('click', function () {
        $('#formAvatarFileInput').click();
    });

    $('#formAvatarFileInput').on('change', function () {
        const file = this.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            if (window.KiotToast) KiotToast.error('Ảnh đại diện không được vượt quá 2MB.');
            $(this).val('');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            $('#avatarPreviewImg').attr('src', e.target.result).show();
            $('#avatarPlaceholder').hide();
            $('#btnRemoveAvatar').show();
        };
        reader.readAsDataURL(file);
    });

    $('#btnRemoveAvatar').on('click', function () {
        $('#formAvatarFileInput').val('');
        $('#formHinhAnh').val('');
        $('#avatarPreviewImg').attr('src', '').hide();
        $('#avatarPlaceholder').show();
        $(this).hide();
    });

    // Nút Tra cứu MST nhanh
    $('#btnTraCuuMst').on('click', function () {
        const mst = ($('#formMaSoThue').val() || '').trim();
        if (!mst) {
            if (window.KiotToast) KiotToast.warning('Vui lòng nhập mã số thuế trước khi tra cứu.');
            $('#formMaSoThue').focus();
            return;
        }

        const $btn = $(this);
        $btn.prop('disabled', true).text('Đang tra cứu...');

        // Giả lập tra cứu hoặc gọi API VietQR/Tổng cục thuế
        setTimeout(function () {
            $btn.prop('disabled', false).text('Tra cứu MST');
            if (window.KiotToast) KiotToast.success(`Đã tìm thấy thông tin MST: ${mst}`);
            if (!$('#formXhdTenDonVi').val()) {
                $('#formXhdTenDonVi').val('CÔNG TY CỔ PHẦN ĐỐI TÁC PHÚ QUỐC');
            }
            if (!$('#formXhdDiaChi').val()) {
                $('#formXhdDiaChi').val('Đường Trần Hưng Đạo, Phường Dương Đông, TP. Phú Quốc');
                $('#formXhdKhuVuc').val('Kiên Giang');
                $('#formXhdPhuongXa').val('Phường Dương Đông');
            }
        }, 600);
    });

    // Mở Modal Thêm mới Khách hàng
    $('#btnOpenCreateKhModal').on('click', function () {
        $('#khModalTitle').text('Tạo khách hàng');
        $('#khForm')[0].reset();
        $('#formMaKh').val('0');
        $('#formHinhAnh').val('');
        $('#formAvatarFileInput').val('');
        $('#avatarPreviewImg').attr('src', '').hide();
        $('#avatarPlaceholder').show();
        $('#btnRemoveAvatar').hide();
        $('#formTrangThaiCheck').prop('checked', true);
        $('#radioXhdCaNhan').prop('checked', true);
        updateXhdView('CA_NHAN');

        $('.hh-sec').addClass('open');
        $('.hh-f').removeClass('invalid');

        openModal();
        setTimeout(() => $('#formTenKh').focus(), 100);
    });

    // Mở Modal Chỉnh sửa Khách hàng
    $(document).on('click', '.btn-edit-kh', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        if (!id) return;

        $('.hh-f').removeClass('invalid');

        $.ajax({
            url: `/KhachHang/GetItem?id=${id}`,
            type: 'GET',
            success: function (res) {
                if (!res.success) {
                    if (window.KiotToast) KiotToast.error(res.message);
                    return;
                }

                const d = res.data;
                $('#khModalTitle').text(`Cập nhật khách hàng: ${d.tenKh}`);
                $('#formMaKh').val(d.maKh);
                $('#formMaKhCustom').val(d.maKhCustom);
                $('#formTenKh').val(d.tenKh);
                $('#formDienThoai').val(d.dienThoai || '');
                $('#formDienThoai2').val(d.dienThoai2 || '');
                $('#formNgaySinh').val(d.ngaySinh ? d.ngaySinh.split('T')[0] : '');
                $('#formGioiTinh').val(d.gioiTinh || '');
                $('#formEmail').val(d.email || '');
                $('#formFacebook').val(d.facebook || '');
                $('#formHinhAnh').val(d.hinhAnh || '');
                $('#formDiaChi').val(d.diaChi || '');
                $('#formKhuVuc').val(d.khuVuc || '');
                $('#formPhuongXa').val(d.phuongXa || '');
                $('#formMaNhomKhachHang').val(d.maNhomKhachHang || '');
                $('#formGhiChu').val(d.ghiChu || '');
                $('#formTrangThaiCheck').prop('checked', d.trangThai === 'HOAT_DONG');

                // Avatar preview
                if (d.hinhAnh) {
                    $('#avatarPreviewImg').attr('src', d.hinhAnh).show();
                    $('#avatarPlaceholder').hide();
                    $('#btnRemoveAvatar').show();
                } else {
                    $('#avatarPreviewImg').attr('src', '').hide();
                    $('#avatarPlaceholder').show();
                    $('#btnRemoveAvatar').hide();
                }

                // Xuất HĐ
                const xhdType = d.xhdLoaiKhachHang === 'DOANH_NGHIEP' ? 'DOANH_NGHIEP' : 'CA_NHAN';
                if (xhdType === 'DOANH_NGHIEP') {
                    $('#radioXhdDoanhNghiep').prop('checked', true);
                } else {
                    $('#radioXhdCaNhan').prop('checked', true);
                }
                updateXhdView(xhdType);

                $('#formMaSoThue').val(d.maSoThue || '');
                $('#formXhdTenDonVi').val(d.xhdTenDonVi || '');
                $('#formSoCccd').val(d.soCccd || '');
                $('#formTenNguoiMua').val(d.tenNguoiMua || '');
                $('#formXhdDiaChi').val(d.xhdDiaChi || '');
                $('#formXhdKhuVuc').val(d.xhdKhuVuc || '');
                $('#formXhdPhuongXa').val(d.xhdPhuongXa || '');
                $('#formXhdEmail').val(d.xhdEmail || '');
                $('#formSoHoChieu').val(d.soHoChieu || '');
                $('#formMaDvqhns').val(d.maDvqhns || '');
                $('#formXhdSoDienThoai').val(d.xhdSoDienThoai || '');
                $('#formTenNganHang').val(d.tenNganHang || '');
                $('#formSoTaiKhoanNganHang').val(d.soTaiKhoanNganHang || '');

                $('.hh-sec').addClass('open');
                openModal();
                setTimeout(() => $('#formTenKh').focus(), 100);
            },
            error: function () {
                if (window.KiotToast) KiotToast.error('Không thể tải thông tin khách hàng.');
            }
        });
    });

    // Lưu Khách hàng (Thêm mới hoặc Cập nhật)
    $('#btnSaveKhachHang').on('click', function () {
        const id = parseInt($('#formMaKh').val()) || 0;
        const tenKh = ($('#formTenKh').val() || '').trim();
        const isDoanhNghiep = $('#radioXhdDoanhNghiep').is(':checked');
        const mst = ($('#formMaSoThue').val() || '').trim();
        const diaChiXhd = ($('#formXhdDiaChi').val() || '').trim();

        // Validation client
        let hasError = false;
        $('.hh-f').removeClass('invalid');

        if (!tenKh) {
            $('#khFldTen').addClass('invalid');
            hasError = true;
        }

        if (isDoanhNghiep) {
            if (!mst) {
                $('#fldXhdMst').addClass('invalid');
                hasError = true;
            }
            if (!diaChiXhd) {
                $('#fldXhdDiaChi').addClass('invalid');
                hasError = true;
            }
        }

        if (hasError) {
            if (window.KiotToast) KiotToast.warning('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
            return;
        }

        const formData = new FormData();
        formData.append('MaKh', id);
        formData.append('TenKh', tenKh);
        formData.append('MaKhCustom', ($('#formMaKhCustom').val() || '').trim());
        formData.append('DienThoai', ($('#formDienThoai').val() || '').trim());
        formData.append('DienThoai2', ($('#formDienThoai2').val() || '').trim());
        formData.append('NgaySinh', $('#formNgaySinh').val());
        formData.append('GioiTinh', $('#formGioiTinh').val());
        formData.append('Email', ($('#formEmail').val() || '').trim());
        formData.append('Facebook', ($('#formFacebook').val() || '').trim());
        formData.append('HinhAnh', $('#formHinhAnh').val());
        formData.append('DiaChi', ($('#formDiaChi').val() || '').trim());
        formData.append('KhuVuc', $('#formKhuVuc').val());
        formData.append('PhuongXa', ($('#formPhuongXa').val() || '').trim());
        formData.append('MaNhomKhachHang', $('#formMaNhomKhachHang').val() || '');
        formData.append('GhiChu', ($('#formGhiChu').val() || '').trim());
        formData.append('LoaiKhachHang', isDoanhNghiep ? 'CUA_HANG' : 'LE');
        formData.append('TrangThai', $('#formTrangThaiCheck').is(':checked') ? 'HOAT_DONG' : 'NGUNG_GIAO_DICH');

        // Xuất HĐ
        formData.append('XhdLoaiKhachHang', isDoanhNghiep ? 'DOANH_NGHIEP' : 'CA_NHAN');
        formData.append('MaSoThue', mst);
        formData.append('XhdTenDonVi', ($('#formXhdTenDonVi').val() || '').trim());
        formData.append('SoCccd', ($('#formSoCccd').val() || '').trim());
        formData.append('TenNguoiMua', ($('#formTenNguoiMua').val() || '').trim());
        formData.append('XhdDiaChi', diaChiXhd);
        formData.append('XhdKhuVuc', $('#formXhdKhuVuc').val());
        formData.append('XhdPhuongXa', ($('#formXhdPhuongXa').val() || '').trim());
        formData.append('XhdEmail', ($('#formXhdEmail').val() || '').trim());
        formData.append('SoHoChieu', ($('#formSoHoChieu').val() || '').trim());
        formData.append('MaDvqhns', ($('#formMaDvqhns').val() || '').trim());
        formData.append('XhdSoDienThoai', ($('#formXhdSoDienThoai').val() || '').trim());
        formData.append('TenNganHang', $('#formTenNganHang').val());
        formData.append('SoTaiKhoanNganHang', ($('#formSoTaiKhoanNganHang').val() || '').trim());

        const avatarFile = $('#formAvatarFileInput')[0].files[0];
        if (avatarFile) {
            formData.append('AvatarFile', avatarFile);
        }

        const url = id > 0 ? `/KhachHang/Edit/${id}` : '/KhachHang/Create';
        const $btn = $('#btnSaveKhachHang');
        $btn.prop('disabled', true).text('Đang lưu...');

        $.ajax({
            url: url,
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function (res) {
                $btn.prop('disabled', false).text('Lưu');
                if (res.success) {
                    if (window.KiotToast) KiotToast.success(res.message);
                    closeModal();
                    loadTable();
                } else {
                    if (window.KiotToast) KiotToast.error(res.message);
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', false).text('Lưu');
                if (window.KiotToast) KiotToast.error('Đã xảy ra lỗi khi lưu khách hàng.');
            }
        });
    });

    // Xóa Khách hàng (Bảo vệ dữ liệu đơn bán bằng KiotConfirm)
    $(document).on('click', '.btn-delete-kh', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        const name = $(this).data('name') || 'này';
        if (!id) return;

        const confirmAction = () => {
            $.ajax({
                url: `/KhachHang/Delete/${id}`,
                type: 'POST',
                success: function (res) {
                    if (res.success) {
                        if (window.KiotToast) KiotToast.success(res.message);
                        loadTable();
                    } else if (res.hasTransaction) {
                        if (window.KiotConfirm) {
                            KiotConfirm.show({
                                title: 'Không thể xóa khách hàng',
                                message: res.message,
                                isWarning: true,
                                confirmText: 'Đã hiểu',
                                hideCancel: true
                            });
                        } else {
                            alert(res.message.replace(/<[^>]+>/g, ''));
                        }
                    } else {
                        if (window.KiotToast) KiotToast.error(res.message);
                    }
                },
                error: function () {
                    if (window.KiotToast) KiotToast.error('Lỗi khi xóa khách hàng.');
                }
            });
        };

        if (window.KiotConfirm) {
            KiotConfirm.show({
                title: 'Xóa khách hàng',
                message: `Bạn có chắc chắn muốn xóa khách hàng <strong>${name}</strong>? Thao tác này không thể hoàn tác.`,
                confirmText: 'Đồng ý xóa',
                isDanger: true,
                onConfirm: confirmAction
            });
        } else if (confirm(`Bạn có chắc chắn muốn xóa khách hàng ${name}?`)) {
            confirmAction();
        }
    });

    // Chuyển đổi trạng thái (Ngừng giao dịch / Kích hoạt)
    $(document).on('click', '.btn-toggle-status-kh', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        const status = $(this).data('status');
        const name = $(this).data('name') || '';
        if (!id) return;

        const isDeactivate = status === 'HOAT_DONG';
        const actionTitle = isDeactivate ? 'Ngừng giao dịch' : 'Kích hoạt lại';
        const actionMsg = isDeactivate
            ? `Bạn có chắc chắn muốn chuyển khách hàng <strong>${name}</strong> sang trạng thái <strong>Ngừng giao dịch</strong>?`
            : `Bạn có chắc chắn muốn <strong>kích hoạt lại</strong> khách hàng <strong>${name}</strong>?`;

        const doToggle = () => {
            $.ajax({
                url: `/KhachHang/ToggleStatus/${id}`,
                type: 'POST',
                success: function (res) {
                    if (res.success) {
                        if (window.KiotToast) KiotToast.success(res.message);
                        loadTable();
                    } else {
                        if (window.KiotToast) KiotToast.error(res.message);
                    }
                },
                error: function () {
                    if (window.KiotToast) KiotToast.error('Lỗi khi cập nhật trạng thái.');
                }
            });
        };

        if (window.KiotConfirm) {
            KiotConfirm.show({
                title: actionTitle,
                message: actionMsg,
                confirmText: 'Xác nhận',
                onConfirm: doToggle
            });
        } else if (confirm(actionMsg.replace(/<[^>]+>/g, ''))) {
            doToggle();
        }
    });

    /* ==========================================================================
       9. POPUP TẠO NHANH NHÓM KHÁCH HÀNG
       ========================================================================== */
    $(document).on('click', '#btnOpenQuickGroupModal, #btnQuickCreateNhomKhModal', function (e) {
        e.preventDefault();
        $('#pTenNhomInput').val('');
        $('#pGhiChuInput').val('');
        $('#pNhomField').removeClass('invalid');
        $('#hhPromptNhomKhOv').addClass('show');
        setTimeout(() => $('#pTenNhomInput').focus(), 100);
    });

    $(document).on('click', '[data-close="hhPromptNhomKhOv"]', function () {
        $('#hhPromptNhomKhOv').removeClass('show');
    });

    $('#hhPromptNhomKhOv').on('click', function (e) {
        if (e.target === this) $(this).removeClass('show');
    });

    $('#btnSaveQuickNhomKh').on('click', function () {
        const tenNhom = ($('#pTenNhomInput').val() || '').trim();
        const ghiChu = ($('#pGhiChuInput').val() || '').trim();

        if (!tenNhom) {
            $('#pNhomField').addClass('invalid');
            return;
        }

        const $btn = $(this);
        $btn.prop('disabled', true);

        $.ajax({
            url: '/KhachHang/CreateNhom',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ tenNhom: tenNhom, ghiChu: ghiChu }),
            success: function (res) {
                $btn.prop('disabled', false);
                if (res.success) {
                    if (window.KiotToast) KiotToast.success(res.message);
                    $('#hhPromptNhomKhOv').removeClass('show');

                    // Thêm option vào select nhóm trong modal
                    const newOpt = new Option(res.name, res.id, true, true);
                    $('#formMaNhomKhachHang').append(newOpt).trigger('change');

                    // Reload lại trang hoặc reload table để đồng bộ sidebar
                    loadTable();
                } else {
                    if (window.KiotToast) KiotToast.error(res.message);
                }
            },
            error: function () {
                $btn.prop('disabled', false);
                if (window.KiotToast) KiotToast.error('Không thể tạo nhóm khách hàng.');
            }
        });
    });

    /* ==========================================================================
       10. KHỞI TẠO BAN ĐẦU
       ========================================================================== */
    $(document).ready(function () {
        initColumnToggle();
    });

})(jQuery);
