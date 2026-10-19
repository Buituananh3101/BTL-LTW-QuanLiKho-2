/**
 * the-kho-index.js - Quản lý tương tác màn hình Báo cáo Thẻ kho
 * Chuẩn hóa 100% theo khuôn mẫu LEGO KiotViet
 */
(function ($) {
    'use strict';

    // 1. Quản lý trạng thái bộ lọc
    const $cfg = $('#theKhoConfig');
    let selectedMaHang = parseInt($cfg.data('ma-hang'), 10) || parseInt($('#selectedMaHang').val(), 10) || 0;
    let selectedMaKho = parseInt($cfg.data('ma-kho'), 10) || parseInt($('#selectKhoLuuTru').val(), 10) || 0;
    let dateRange = $cfg.data('date-range') || 'THIS_MONTH';
    let customTuNgay = $cfg.data('tu-ngay') || '';
    let customDenNgay = $cfg.data('den-ngay') || '';
    let currentPage = parseInt($cfg.data('page'), 10) || 1;
    let pageSize = parseInt($cfg.data('page-size'), 10) || 20;
    let searchDebounceTimer = null;

    // 2. Khởi tạo Sidebar thu gọn (F4)
    if (window.KiotFilter && typeof KiotFilter.initSidebar === 'function') {
        KiotFilter.initSidebar({
            storageKey: 'kiot_thekho_sidebar'
        });
    }

    // 3. Khởi tạo Bộ lọc Thời gian Lego (_KiotDateFilter)
    if (window.KiotFilter && typeof KiotFilter.initDateFilter === 'function') {
        KiotFilter.initDateFilter('thekho_date', function (from, to, text, val) {
            customTuNgay = from ? formatDateParam(from) : '';
            customDenNgay = to ? formatDateParam(to) : '';
            dateRange = val || 'CUSTOM';
            loadData(1);
        });
    }

    // 4. Khởi tạo Tìm kiếm Mặt hàng Autocomplete F3 Lego (initProductSearch)
    if (window.KiotFilter && typeof KiotFilter.initProductSearch === 'function') {
        KiotFilter.initProductSearch({
            inputSelector: '#tkSearchProductInput',
            dropdownSelector: '#tkProductSuggestDropdown',
            apiUrl: '/BaoCao/SearchHangHoa',
            getWarehouseId: function () {
                return $('#selectKhoLuuTru').val() || 0;
            },
            onSelect: function (product) {
                const maHang = product.id || product.Id || product.maHang || product.MaHang;
                const code = product.maHangNoiBo || product.code || '';
                const name = product.tenHang || product.name || '';
                const dvt = product.tenDvt || product.dvt || 'Cái';
                const nhom = product.tenNhom || '';

                applySelectedProduct(maHang, code, name, dvt, nhom);
            }
        });
    }

    // Cập nhật mặt hàng đang chọn trên sidebar và nạp lại Thẻ kho
    function applySelectedProduct(maHang, code, name, dvt, nhom) {
        if (!maHang) return;
        selectedMaHang = maHang;
        $('#selectedMaHang').val(maHang);

        // Đóng dropdown tìm kiếm và xóa từ khóa input
        $('#tkProductSuggestDropdown').removeClass('show').hide();
        $('#tkSearchProductInput').val('');

        // Cập nhật card trên sidebar
        $('#tkCardProductCode').text(code);
        $('#tkCardProductName').text(name).attr('title', name);
        let subHtml = `ĐVT: <strong>${escapeHtml(dvt)}</strong>`;
        if (nhom) {
            subHtml += ` · ${escapeHtml(nhom)}`;
        }
        $('#tkCardProductSub').html(subHtml);
        $('#tkSelectedProductCard').removeClass('d-none');
        $('#tkNoProductHint').addClass('d-none');
        $('#dotMatHang').addClass('active');

        // Tải lại bảng thẻ kho cho mặt hàng mới
        loadData(1);
    }

    // Đảm bảo dropdown luôn cuộn về đầu và không bị kéo lệch
    const suggestDropdownEl = document.getElementById('tkProductSuggestDropdown');
    if (suggestDropdownEl && window.MutationObserver) {
        const observer = new MutationObserver(function () {
            if (suggestDropdownEl.classList.contains('show')) {
                suggestDropdownEl.scrollTop = 0;
            }
        });
        observer.observe(suggestDropdownEl, { childList: true, attributes: true, attributeFilter: ['class'] });
    }

    // Đóng dropdown tìm kiếm khi click ra ngoài hoặc nhấn phím Escape
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#tkSearchProductInput, #tkProductSuggestDropdown').length) {
            $('#tkProductSuggestDropdown').removeClass('show').hide();
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            $('#tkProductSuggestDropdown').removeClass('show').hide();
        }
    });

    // Bắt thêm sự kiện click trực tiếp trên dòng autocomplete để đảm bảo chọn ngay
    $(document).on('click', '#tkProductSuggestDropdown .kk-autocomplete-item', function () {
        const maHang = $(this).data('id');
        const code = $(this).data('code') || '';
        const name = $(this).data('name') || '';
        const unit = $(this).data('unit') || 'Cái';
        const group = $(this).data('group') || '';
        if (maHang) {
            applySelectedProduct(maHang, code, name, unit, group);
        }
    });

    // Sự kiện bỏ chọn mặt hàng trên sidebar
    $(document).on('click', '#btnRemoveSelectedProduct', function (e) {
        e.preventDefault();
        e.stopPropagation();
        selectedMaHang = 0;
        $('#selectedMaHang').val(0);
        $('#tkSelectedProductCard').addClass('d-none');
        $('#tkNoProductHint').removeClass('d-none');
        $('#dotMatHang').removeClass('active');
        $('#tkSearchProductInput').val('').focus();
        loadData(1);
    });

    // 5. Khởi tạo Dropdown Single-Select Chi nhánh kho Lego (KiotFilter.initSingleSelect)
    function updateKhoDot(val) {
        const khoId = parseInt(val, 10) || 0;
        const $dot = $('#dotKho');
        if (khoId > 0) {
            $dot.addClass('active');
        } else {
            $dot.removeClass('active');
        }
    }

    if (window.KiotFilter && typeof KiotFilter.initSingleSelect === 'function') {
        KiotFilter.initSingleSelect('#boxKho', '#dropdownKho', function (val, text) {
            $('#selectKhoLuuTru').val(val);
            selectedMaKho = parseInt(val, 10) || 0;
            updateKhoDot(val);
            loadData(1);
        });
    } else {
        $('#dropdownKho .kiot-ss-item').on('click', function () {
            const val = $(this).data('val');
            const text = $(this).find('span').text().trim();
            $('#dropdownKho .kiot-ss-item').removeClass('selected');
            $(this).addClass('selected');
            $('#textKho').text(text);
            $('#selectKhoLuuTru').val(val);
            $('#dropdownKho').removeClass('show');
            selectedMaKho = parseInt(val, 10) || 0;
            updateKhoDot(val);
            loadData(1);
        });
    }

    // 6. Sự kiện lọc theo loại giao dịch (checkbox Lego _KiotStatusFilter)
    $(document).on('change', 'input[data-s]', function () {
        updateStatusDot();
        loadData(1);
    });

    function updateStatusDot() {
        const checkedCount = $('input[data-s]:checked').length;
        const totalCount = $('input[data-s]').length;
        const $dot = $('#dotLoaiGd');
        if ($dot.length) {
            if (checkedCount > 0 && checkedCount < totalCount) {
                $dot.addClass('on');
            } else {
                $dot.removeClass('on');
            }
        }
    }
    updateStatusDot();

    // 7. Tìm kiếm nhanh trên bảng dòng thẻ kho
    $('#keywordSearch').on('input', function () {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(function () {
            loadData(1);
        }, 300);
    });

    // 8. Nút tải lại bảng
    $('#btnReloadTable').on('click', function () {
        loadData(currentPage);
    });

    // 9. Nút xuất file Excel
    $('#btnExportTheKho').on('click', function () {
        const params = buildParams(1);
        const url = '/BaoCao/ExportTheKho?' + params.toString();
        window.location.href = url;
    });

    // 10. Nút in Thẻ kho
    $('#btnPrintTheKho').on('click', function () {
        window.print();
    });

    // 11. Xử lý phân trang AJAX (Lego _Pagination)
    $(document).on('click', '.pagination a, .page-ajax a', function (e) {
        e.preventDefault();
        const href = $(this).attr('href');
        if (!href || href === '#' || href === 'javascript:void(0)') return;

        // Bóc tách tham số Page từ href
        const url = new URL(href, window.location.origin);
        const page = parseInt(url.searchParams.get('Page') || url.searchParams.get('page'), 10);
        if (page && page > 0 && page !== currentPage) {
            loadData(page);
        }
    });

    // 12. Hàm xây dựng Query Parameters gửi lên Server
    function buildParams(page) {
        const params = new URLSearchParams();
        const maHang = $('#selectedMaHang').val() || selectedMaHang;
        if (maHang && maHang > 0) {
            params.append('MaHang', maHang);
        }

        const maKho = $('#selectKhoLuuTru').val();
        if (maKho && maKho > 0) {
            params.append('MaKho', maKho);
        }

        if (dateRange) params.append('DateRange', dateRange);
        if (customTuNgay) params.append('TuNgay', customTuNgay);
        if (customDenNgay) params.append('DenNgay', customDenNgay);

        const kw = $('#keywordSearch').val().trim();
        if (kw) params.append('TuKhoa', kw);

        params.append('Page', page || 1);
        params.append('PageSize', pageSize);

        $('input[data-s]:checked').each(function () {
            params.append('LoaiChungTu', $(this).data('s'));
        });

        return params;
    }

    // 13. Nạp dữ liệu AJAX đồng bộ Summary KPI và Bảng Thẻ kho
    function loadData(page) {
        if (page) currentPage = page;
        const $content = $('#theKhoMainContent');
        $content.css('opacity', '0.5');

        const params = buildParams(currentPage);

        $.ajax({
            url: '/BaoCao/FilterTheKho',
            type: 'GET',
            data: params.toString(),
            success: function (html) {
                $content.html(html);
                $content.css('opacity', '1');
            },
            error: function () {
                $content.css('opacity', '1');
                if (window.KiotToast && typeof KiotToast.error === 'function') {
                    KiotToast.error('Không thể tải dữ liệu Thẻ kho. Vui lòng thử lại.');
                } else {
                    alert('Không thể tải dữ liệu Thẻ kho.');
                }
            }
        });
    }

    // Helper định dạng ngày ISO
    function formatDateParam(d) {
        if (!d) return '';
        if (typeof d === 'string') return d;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Helper escape chuỗi HTML chống XSS
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

})(jQuery);
