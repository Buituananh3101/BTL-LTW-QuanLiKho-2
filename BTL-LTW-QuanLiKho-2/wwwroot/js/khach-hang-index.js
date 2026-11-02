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
       6.1. SIDEBAR CO-GIÃN & RESPONSIVE MOBILE (CHUẨN KIOTVIET)
       ========================================================================== */
    const container = $('#kiotContainer');

    function toggleSidebar(forceState) {
        const isCollapsed = container.hasClass('sidebar-collapsed');
        const shouldCollapse = forceState !== undefined ? forceState : !isCollapsed;

        if (shouldCollapse) {
            container.addClass('sidebar-collapsed');
            $('#sidebarToggleIcon').removeClass('bi-chevron-left').addClass('bi-chevron-right');
            $('#btnToggleSidebar').attr('title', 'Mở rộng bộ lọc (F4)');
            localStorage.setItem('kiot_sidebar_state', 'collapsed');
        } else {
            container.removeClass('sidebar-collapsed');
            $('#sidebarToggleIcon').removeClass('bi-chevron-right').addClass('bi-chevron-left');
            $('#btnToggleSidebar').attr('title', 'Thu gọn bộ lọc (F4)');
            localStorage.setItem('kiot_sidebar_state', 'expanded');
        }
    }

    if (localStorage.getItem('kiot_sidebar_state') === 'collapsed') {
        toggleSidebar(true);
    }

    $('#btnToggleSidebar').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar();
    });

    let toggleHoverTimer = null;
    $('#sidebarFilterCol, #btnToggleSidebar').on('mouseenter', function () {
        clearTimeout(toggleHoverTimer);
        $('#btnToggleSidebar').addClass('btn-visible');
    }).on('mouseleave', function () {
        clearTimeout(toggleHoverTimer);
        toggleHoverTimer = setTimeout(function () {
            if (!$('#sidebarFilterCol:hover').length && !$('#btnToggleSidebar:hover').length) {
                $('#btnToggleSidebar').removeClass('btn-visible');
            }
        }, 120);
    });

    // Mobile Sidebar Drawer
    function openMobileSidebar() {
        $('#sidebarFilterCol').addClass('show-mobile');
        $('#sidebarBackdrop').addClass('show');
        $('body').addClass('noscroll');
    }
    function closeMobileSidebar() {
        $('#sidebarFilterCol').removeClass('show-mobile');
        $('#sidebarBackdrop').removeClass('show');
        $('body').removeClass('noscroll');
    }
    $('#btnMobileFilter').on('click', openMobileSidebar);
    $('#btnCloseSidebarMobile, #sidebarBackdrop').on('click', closeMobileSidebar);

    // Khởi tạo bộ lọc ngày tạo KiotDateFilter
    if (window.KiotFilter && typeof window.KiotFilter.initDateFilter === 'function') {
        window.KiotFilter.initDateFilter('tgt', function (from, to, text, val) {
            state.tgTaoFilter = val || 'ALL';
            state.tgTaoTu = from || null;
            state.tgTaoDen = to || null;
            state.page = 1;
            loadTable();
        });
    }

    /* ==========================================================================
       6.2. PHÂN TRANG AJAX & TÌM KIẾM
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

    // Single-select Người tạo (Custom Lego chuẩn Hàng hóa)
    $('#boxNguoiTao').on('click', function (e) {
        e.stopPropagation();
        const box = $(this);
        const dropdown = $('#dropdownNguoiTao');

        $('.kiot-ms-dropdown, .kiot-ss-dropdown').not(dropdown).removeClass('show drop-up').css('max-height', '');
        $('.kiot-multiselect-box, .kiot-single-select-box').not(box).removeClass('open');
        $('.quick-date-popup, .dual-calendar-popup').hide();

        const willShow = !dropdown.hasClass('show');
        if (willShow) {
            if (window.KiotFilter && typeof window.KiotFilter.checkSidebarDropdownDirection === 'function') {
                window.KiotFilter.checkSidebarDropdownDirection(box[0], dropdown[0]);
            }
            dropdown.addClass('show');
            box.addClass('open');
        } else {
            dropdown.removeClass('show drop-up').css('max-height', '');
            box.removeClass('open');
        }
    });

    $('#dropdownNguoiTao').on('click', '.kiot-ss-item', function (e) {
        e.stopPropagation();
        const val = String($(this).data('val'));
        const text = $(this).find('span').text().trim();

        $('#textNguoiTao').text(text);
        $('#dropdownNguoiTao .kiot-ss-item').removeClass('selected');
        $(this).addClass('selected');

        $('#dotNguoiTao').toggle(val !== 'ALL');
        $('#dropdownNguoiTao').removeClass('show drop-up').css('max-height', '');
        $('#boxNguoiTao').removeClass('open');

        $('#filterNguoiTao').val(val);
        state.nguoiTao = val;
        state.page = 1;
        loadTable();
    });

    // Single-select Sinh nhật (Custom Lego chuẩn Hàng hóa)
    $('#boxSinhNhat').on('click', function (e) {
        e.stopPropagation();
        const box = $(this);
        const dropdown = $('#dropdownSinhNhat');

        $('.kiot-ms-dropdown, .kiot-ss-dropdown').not(dropdown).removeClass('show drop-up').css('max-height', '');
        $('.kiot-multiselect-box, .kiot-single-select-box').not(box).removeClass('open');
        $('.quick-date-popup, .dual-calendar-popup').hide();

        const willShow = !dropdown.hasClass('show');
        if (willShow) {
            if (window.KiotFilter && typeof window.KiotFilter.checkSidebarDropdownDirection === 'function') {
                window.KiotFilter.checkSidebarDropdownDirection(box[0], dropdown[0]);
            }
            dropdown.addClass('show');
            box.addClass('open');
        } else {
            dropdown.removeClass('show drop-up').css('max-height', '');
            box.removeClass('open');
        }
    });

    $('#dropdownSinhNhat').on('click', '.kiot-ss-item', function (e) {
        e.stopPropagation();
        const val = String($(this).data('val'));
        const text = $(this).find('span').text().trim();

        $('#textSinhNhat').text(text);
        $('#dropdownSinhNhat .kiot-ss-item').removeClass('selected');
        $(this).addClass('selected');

        $('#dotSinhNhat').toggle(val !== 'ALL');
        $('#dropdownSinhNhat').removeClass('show drop-up').css('max-height', '');
        $('#boxSinhNhat').removeClass('open');

        $('#filterSinhNhat').val(val);
        state.sinhNhatFilter = val;
        state.page = 1;
        loadTable();
    });

    // Cuộn sidebar tự động điều chỉnh hướng mở của dropdown
    $('.kiot-filter-box').on('scroll', function () {
        const openDropdown = $('.kiot-ms-dropdown.show, .kiot-ss-dropdown.show');
        if (openDropdown.length) {
            const box = openDropdown.siblings('.kiot-multiselect-box, .kiot-single-select-box');
            if (box.length && window.KiotFilter && typeof window.KiotFilter.checkSidebarDropdownDirection === 'function') {
                window.KiotFilter.checkSidebarDropdownDirection(box[0], openDropdown[0]);
            }
        }
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

    // Bộ lọc Nhóm khách hàng (Lego Multi-Select với Tags Dropdown chuẩn KiotViet)
    let selectedNhomKhachHang = [];

    function renderNhomBox() {
        const box = $('#boxNhomKhachHang');
        const dropdown = $('#dropdownNhomKhachHang');
        const dot = $('#dotNhomKhachHang');

        dot.css('display', selectedNhomKhachHang.length > 0 ? 'inline-block' : 'none');

        dropdown.find('.kiot-ms-item').each(function () {
            const val = String($(this).data('val'));
            const isSel = selectedNhomKhachHang.some(x => String(x.val) === val);
            $(this).toggleClass('selected', isSel);
            $(this).find('input[type="checkbox"]').prop('checked', isSel);
        });

        if (window.KiotFilter && typeof window.KiotFilter.renderTagPills === 'function') {
            window.KiotFilter.renderTagPills(box, selectedNhomKhachHang, 'Chọn nhóm khách hàng', 2);
        }
    }

    function setupNhomKhachHangFilter() {
        const box = $('#boxNhomKhachHang');
        const dropdown = $('#dropdownNhomKhachHang');

        // Click vào box để mở / đóng dropdown
        box.on('click', function (e) {
            if ($(e.target).closest('.tag-remove').length) return;
            e.stopPropagation();

            $('.kiot-ms-dropdown').not(dropdown).removeClass('show drop-up').css('max-height', '');
            $('.kiot-multiselect-box').not(box).removeClass('open');
            $('.quick-date-popup, .dual-calendar-popup').hide();

            const willShow = !dropdown.hasClass('show');
            if (willShow) {
                if (window.KiotFilter && typeof window.KiotFilter.checkSidebarDropdownDirection === 'function') {
                    window.KiotFilter.checkSidebarDropdownDirection(box[0], dropdown[0]);
                }
                dropdown.addClass('show');
                box.addClass('open');
                dropdown.find('.kiot-ms-search input').focus();
            } else {
                dropdown.removeClass('show drop-up').css('max-height', '');
                box.removeClass('open');
            }
        });

        // Xóa tag từ pill viên thuốc trực tiếp trên box
        box.on('click', '.tag-remove', function (e) {
            e.stopPropagation();
            const val = String($(this).closest('.kiot-pill-tag').data('val'));
            selectedNhomKhachHang = selectedNhomKhachHang.filter(x => String(x.val) !== val);
            state.nhomKhachHangs = selectedNhomKhachHang.map(x => parseInt(x.val)).filter(n => !isNaN(n));
            renderNhomBox();
            state.page = 1;
            loadTable();
        });

        // Click vào ô +N nhóm khác
        box.on('click', '.kiot-pill-more', function (e) {
            e.stopPropagation();
            if (window.KiotFilter && typeof window.KiotFilter.checkSidebarDropdownDirection === 'function') {
                window.KiotFilter.checkSidebarDropdownDirection(box[0], dropdown[0]);
            }
            dropdown.addClass('show');
            box.addClass('open');
        });

        // Click chọn / bỏ chọn item trong dropdown
        dropdown.on('click', '.kiot-ms-item', function (e) {
            if ($(e.target).closest('.kiot-item-edit-btn, .hh-item-edit-btn').length) {
                return;
            }
            e.stopPropagation();
            const val = String($(this).data('val'));
            const name = $(this).data('name') || $(this).find('.kiot-ms-text').text().trim();
            const idx = selectedNhomKhachHang.findIndex(x => String(x.val) === val);

            if (idx >= 0) {
                selectedNhomKhachHang.splice(idx, 1);
            } else {
                selectedNhomKhachHang.push({ val: val, name: name });
            }

            state.nhomKhachHangs = selectedNhomKhachHang.map(x => parseInt(x.val)).filter(n => !isNaN(n));
            renderNhomBox();
            state.page = 1;
            loadTable();
        });

        // Tìm kiếm con bên trong dropdown nhóm
        dropdown.find('.kiot-ms-search input').on('input', function (e) {
            e.stopPropagation();
            const term = $(this).val().trim().toLowerCase();
            dropdown.find('.kiot-ms-item').each(function () {
                const text = ($(this).data('name') || $(this).text()).toLowerCase();
                if (!term || text.includes(term)) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        });

        // Đóng các dropdown khi click ra ngoài document
        $(document).on('click', function (e) {
            if (!$(e.target).closest('.kiot-multiselect-box, .kiot-single-select-box, .kiot-ms-dropdown, .kiot-ss-dropdown').length) {
                $('.kiot-ms-dropdown, .kiot-ss-dropdown').removeClass('show drop-up').css('max-height', '');
                $('.kiot-multiselect-box, .kiot-single-select-box').removeClass('open');
            }
        });

        // Quét các checkbox được render có sẵn
        dropdown.find('.kiot-ms-item.selected').each(function () {
            const val = String($(this).data('val'));
            const name = $(this).data('name') || $(this).find('.kiot-ms-text').text().trim();
            if (!selectedNhomKhachHang.some(x => String(x.val) === val)) {
                selectedNhomKhachHang.push({ val: val, name: name });
            }
        });
        state.nhomKhachHangs = selectedNhomKhachHang.map(x => parseInt(x.val)).filter(n => !isNaN(n));
        renderNhomBox();
    }

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

    // Quản lý ảnh đại diện chuẩn Hàng hóa (Render động, không xung đột class)
    function renderAvatarBox(src) {
        const $box = $('#avatarPreviewBox');
        if (src) {
            $box.addClass('has-img').html(`
                <img src="${src}" alt="Ảnh đại diện" style="width: 100%; height: 100%; object-fit: cover; border-radius: 11px;">
                <button type="button" class="hh-main-x" id="btnRemoveAvatar" title="Xóa ảnh" aria-label="Xóa ảnh">×</button>
                <div class="hh-main-change-hint">Bấm để đổi ảnh</div>
            `);
        } else {
            $box.removeClass('has-img').html(`
                <svg class="hh-ic" style="width: 44px; height: 44px; stroke: #94a3b8; stroke-width: 1.5; margin-bottom: 6px;"><use href="#i-img"/></svg>
                <span class="fw-semibold text-primary" style="font-size: 13.5px;">Thêm ảnh</span>
                <small style="font-size: 11.5px; color: #9ca3af; margin-top: 4px;">Ảnh không quá 2MB</small>
            `);
        }
    }

    $('#avatarPreviewBox').on('click', function (e) {
        if ($(e.target).closest('#btnRemoveAvatar').length) {
            e.preventDefault();
            e.stopPropagation();
            $('#formAvatarFileInput').val('');
            $('#formHinhAnh').val('');
            renderAvatarBox('');
            return;
        }
        $('#formAvatarFileInput').trigger('click');
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
            renderAvatarBox(e.target.result);
        };
        reader.readAsDataURL(file);
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
        renderAvatarBox('');
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
                renderAvatarBox(d.hinhAnh || '');

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

                    // 1. Thêm HTML vào dropdown sidebar để chọn ngay
                    const newItemHtml = `
                        <div class="kiot-ms-item" data-val="${res.id}" data-name="${res.name}">
                            <input type="checkbox" class="form-check-input" />
                            <span class="kiot-ms-text">${res.name}</span>
                            <button type="button" class="kiot-item-edit-btn hh-item-edit-btn" data-id="${res.id}" data-name="${res.name}" data-type="nhomkhachhang" title="Sửa nhóm khách hàng" aria-label="Sửa ${res.name}">
                                <i class="bi bi-pencil" style="font-size:12px;pointer-events:none;"></i>
                            </button>
                        </div>`;
                    $('#dropdownNhomKhachHang').append(newItemHtml);

                    // 2. Thêm option vào select nhóm trong modal
                    const newOpt = new Option(res.name, res.id, true, true);
                    $('#formMaNhomKhachHang').append(newOpt);

                    // 3. Tự động chọn nhóm vừa tạo vào bộ lọc
                    selectedNhomKhachHang.push({ val: String(res.id), name: res.name });
                    state.nhomKhachHangs = selectedNhomKhachHang.map(x => parseInt(x.val)).filter(n => !isNaN(n));
                    renderNhomBox();
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
       9.1. MODAL CON: SỬA / XÓA NHÓM KHÁCH HÀNG (ICON BÚT CHÌ ✎)
       ========================================================================== */
    // Mở modal sửa nhóm từ icon bút chì
    $(document).on('click', '#dropdownNhomKhachHang .kiot-item-edit-btn, #dropdownNhomKhachHang .hh-item-edit-btn', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const id = $(this).data('id') || $(this).closest('.kiot-ms-item').data('val');
        const name = $(this).data('name') || $(this).closest('.kiot-ms-item').find('.kiot-ms-text').text().trim();

        $('#editNhomId').val(id);
        $('#editNhomInput').val(name);
        $('#editNhomGhiChu').val('');
        $('#editNhomField').removeClass('invalid');
        $('#hhEditNhomKhOv').addClass('show');

        // Đóng dropdown để giao diện thông thoáng
        $('#dropdownNhomKhachHang').removeClass('show drop-up').css('max-height', '');
        $('#boxNhomKhachHang').removeClass('open');

        setTimeout(() => $('#editNhomInput').focus().select(), 100);
    });

    $(document).on('click', '[data-close="hhEditNhomKhOv"]', function () {
        $('#hhEditNhomKhOv').removeClass('show');
    });

    $('#hhEditNhomKhOv').on('click', function (e) {
        if (e.target === this) $(this).removeClass('show');
    });

    // Lưu sửa tên nhóm
    $('#btnEditNhomSave').on('click', function () {
        const id = parseInt($('#editNhomId').val());
        const newName = ($('#editNhomInput').val() || '').trim();
        const newGhiChu = ($('#editNhomGhiChu').val() || '').trim();

        if (!newName) {
            $('#editNhomField').addClass('invalid');
            return;
        }

        const $btn = $(this);
        $btn.prop('disabled', true);

        $.ajax({
            url: `/KhachHang/UpdateNhom/${id}`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ maNhomKhachHang: id, tenNhom: newName, ghiChu: newGhiChu }),
            success: function (res) {
                $btn.prop('disabled', false);
                if (res.success) {
                    if (window.KiotToast) KiotToast.success(res.message);
                    $('#hhEditNhomKhOv').removeClass('show');

                    // 1. Cập nhật trong dropdown sidebar
                    const $item = $(`#dropdownNhomKhachHang .kiot-ms-item[data-val="${id}"]`);
                    $item.data('name', res.name).attr('data-name', res.name);
                    $item.find('.kiot-ms-text').text(res.name);
                    $item.find('.kiot-item-edit-btn').data('name', res.name).attr('data-name', res.name);

                    // 2. Cập nhật trong select modal khách hàng
                    $(`#formMaNhomKhachHang option[value="${id}"]`).text(res.name);

                    // 3. Cập nhật mảng selectedNhomKhachHang nếu nhóm này đang được chọn
                    const sel = selectedNhomKhachHang.find(x => String(x.val) === String(id));
                    if (sel) {
                        sel.name = res.name;
                    }
                    renderNhomBox();
                    loadTable();
                } else {
                    if (window.KiotToast) KiotToast.error(res.message);
                }
            },
            error: function () {
                $btn.prop('disabled', false);
                if (window.KiotToast) KiotToast.error('Không thể cập nhật nhóm khách hàng.');
            }
        });
    });

    // Xóa nhóm khách hàng
    $('#btnEditNhomDelete').on('click', function () {
        const id = parseInt($('#editNhomId').val());
        const name = $('#editNhomInput').val();

        const doDelete = () => {
            $.ajax({
                url: `/KhachHang/DeleteNhom/${id}`,
                type: 'POST',
                success: function (res) {
                    if (res.success) {
                        if (window.KiotToast) KiotToast.success(res.message);
                        $('#hhEditNhomKhOv').removeClass('show');

                        // 1. Xóa khỏi dropdown sidebar
                        $(`#dropdownNhomKhachHang .kiot-ms-item[data-val="${id}"]`).remove();

                        // 2. Xóa khỏi select trong modal khách hàng
                        $(`#formMaNhomKhachHang option[value="${id}"]`).remove();

                        // 3. Bỏ chọn nếu đang lọc theo nhóm này
                        selectedNhomKhachHang = selectedNhomKhachHang.filter(x => String(x.val) !== String(id));
                        state.nhomKhachHangs = selectedNhomKhachHang.map(x => parseInt(x.val)).filter(n => !isNaN(n));
                        renderNhomBox();
                        state.page = 1;
                        loadTable();
                    } else {
                        if (window.KiotToast) KiotToast.error(res.message);
                    }
                },
                error: function () {
                    if (window.KiotToast) KiotToast.error('Lỗi khi xóa nhóm khách hàng.');
                }
            });
        };

        if (window.KiotConfirm) {
            KiotConfirm.show({
                title: 'Xóa nhóm khách hàng',
                message: `Bạn có chắc chắn muốn xóa nhóm khách hàng <strong>${name}</strong>? Các khách hàng thuộc nhóm này sẽ không còn thuộc nhóm nào.`,
                confirmText: 'Đồng ý xóa',
                isDanger: true,
                onConfirm: doDelete
            });
        } else if (confirm(`Bạn có chắc muốn xóa nhóm khách hàng ${name}?`)) {
            doDelete();
        }
    });

    /* ==========================================================================
       10. KHỞI TẠO BAN ĐẦU
       ========================================================================== */
    $(document).ready(function () {
        initColumnToggle();
        setupNhomKhachHangFilter();
    });

})(jQuery);
