/**
 * bao-cao-ton-kho.js - Quản lý tương tác Báo cáo Tồn kho theo kho (Pivot Kho)
 * Chuẩn hóa 100% theo khuôn mẫu chuyên nghiệp LEGO (đồng bộ với Danh sách Hàng hóa)
 */
(function ($) {
    'use strict';

    // 1. Khởi tạo trạng thái ban đầu từ Config
    const $cfg = $('#tonKhoConfig');
    let currentPage = parseInt($cfg.data('page')) || 1;
    let pageSize = parseInt($cfg.data('page-size')) || 15;
    let currentSortBy = $cfg.data('sort-by') || '';
    let currentSortDir = $cfg.data('sort-dir') || '';
    let currentTinhTrang = $cfg.data('tinh-trang') || 'ALL';

    let selectedKhoIds = [];
    try {
        const rawKhos = $cfg.attr('data-selected-khos');
        if (rawKhos) selectedKhoIds = JSON.parse(rawKhos).map(x => parseInt(x));
    } catch (e) {
        selectedKhoIds = [];
    }

    let selectedNhomIds = [];
    const initMaNhom = parseInt($cfg.data('ma-nhom')) || 0;
    if (initMaNhom > 0) selectedNhomIds.push(initMaNhom);

    let selectedTrangThais = ['DANG_KINH_DOANH'];

    const khoNames = {};
    const nhomNames = {};

    // 2. Khởi tạo Sidebar chuyên nghiệp F4 & Hotkeys
    if (window.KiotFilter && typeof KiotFilter.initSidebar === 'function') {
        KiotFilter.initSidebar({
            storageKey: 'kiot_sidebar_baocao_tonkho'
        });
    }

    // Hotkey F3 focus ô tìm kiếm & Escape đóng popup/drawer
    $(document).on('keydown', function (e) {
        if (e.key === 'F3') {
            e.preventDefault();
            $('#keywordSearch').trigger('focus').select();
        } else if (e.key === 'Escape') {
            closeDrawer();
            closeAllDropdowns();
        }
    });

    function closeAllDropdowns() {
        $('.kiot-ms-dropdown, .kiot-ss-dropdown').removeClass('show drop-up').css('max-height', '');
        $('.kiot-multiselect-box, .kiot-single-select-box').removeClass('open is-active');
    }

    // 3. Nạp dữ liệu bảng AJAX (Pivot Kho)
    function loadTable(page) {
        if (page) currentPage = page;
        const q = $('#keywordSearch').val().trim();

        const params = new URLSearchParams();
        params.append('Page', currentPage);
        params.append('PageSize', pageSize);
        if (q) params.append('Q', q);

        if (currentSortBy) {
            params.append('SortBy', currentSortBy);
            params.append('SortDir', currentSortDir || 'asc');
        }

        if (currentTinhTrang && currentTinhTrang !== 'ALL') {
            params.append('TinhTrangTon', currentTinhTrang);
        }

        selectedKhoIds.forEach(id => params.append('SelectedKhoIds', id));
        selectedNhomIds.forEach(id => params.append('SelectedNhomIds', id));
        selectedTrangThais.forEach(st => params.append('SelectedTrangThais', st));

        const $wrap = $('#tableWrapper');
        $wrap.css('opacity', '0.45');

        $.ajax({
            url: '/BaoCao/Filter?' + params.toString(),
            type: 'GET',
            success: function (html, status, xhr) {
                $wrap.html(html).css('opacity', '1');

                // Đọc KPI Summary từ Response Header để cập nhật thẻ tức thời
                const summaryHeader = xhr.getResponseHeader('X-Summary-Json');
                if (summaryHeader) {
                    try {
                        const summary = JSON.parse(decodeURIComponent(summaryHeader));
                        updateSummaryCards(summary);
                    } catch (err) {
                        console.error('Lỗi phân giải Summary Header:', err);
                    }
                }
            },
            error: function () {
                $wrap.css('opacity', '1');
                if (window.KiotToast) {
                    KiotToast.error('Không thể tải dữ liệu báo cáo tồn kho.');
                }
            }
        });
    }

    // 3.1. Cập nhật số liệu trên 4 thẻ Summary KPI
    function updateSummaryCards(summary) {
        if (!summary) return;
        $('#sumMatHang').text(formatNumber(summary.TongSoMatHang || 0));
        $('#sumSoLuongTon').text(formatNumber(summary.TongSoLuongTon || 0, 2));
        $('#sumGiaTriTon').text(formatNumber(summary.TongGiaTriTon || 0) + ' ₫');
        $('#sumCanLuuY').text(formatNumber(summary.SoMatHangCanLuuY || 0));
    }

    function formatNumber(val, decimals = 0) {
        if (val === undefined || val === null) return '0';
        return Number(val).toLocaleString('vi-VN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        });
    }

    // 4. Tìm kiếm từ khóa với Debounce 350ms
    let searchTimer = null;
    $('#keywordSearch').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            loadTable(1);
        }, 350);
    });

    // 5. Khởi tạo Multi-Select Dropdown dùng chung (Chuẩn Lego hệ thống)
    function setupMultiSelect(boxId, dropdownId, dotId, selectedArray, namesMap, placeholder, onRenderComplete) {
        const $box = $(boxId);
        const $dropdown = $(dropdownId);
        const $dot = $(dotId);
        if (!$box.length || !$dropdown.length) return;

        // Cache tên item từ data-val và data-name
        $dropdown.find('.kiot-ms-item').each(function () {
            const val = parseInt($(this).data('val'), 10);
            const name = $(this).data('name') || $(this).find('.kiot-ms-text').text().trim() || $(this).text().trim();
            if (!isNaN(val) && name) namesMap[val] = name;
        });

        const totalCount = Object.keys(namesMap).length;

        function renderBox() {
            // Đồng bộ checkbox và class selected
            $dropdown.find('.kiot-ms-item').each(function () {
                const val = parseInt($(this).data('val'), 10);
                const isSel = selectedArray.includes(val);
                $(this).toggleClass('selected', isSel);
                $(this).find('input[type="checkbox"]').prop('checked', isSel);
            });

            // Dot trạng thái: sáng khi chọn một phần item
            const isAllSelected = selectedArray.length === 0 || selectedArray.length === totalCount;
            if ($dot.length) {
                $dot.toggleClass('active', !isAllSelected && selectedArray.length > 0);
            }

            // Tag Pills
            const selectedItems = selectedArray.map(id => ({
                val: id,
                name: namesMap[id] || ('#' + id)
            }));

            if (window.KiotFilter && typeof window.KiotFilter.renderTagPills === 'function') {
                window.KiotFilter.renderTagPills($box, selectedItems, placeholder, 2);
            } else {
                if (selectedItems.length === 0 || (boxId === '#boxKho' && selectedItems.length === totalCount)) {
                    $box.html(`<span class="kiot-ms-placeholder">${placeholder}</span>`);
                } else {
                    let html = '';
                    selectedItems.slice(0, 2).forEach(it => {
                        html += `<span class="kiot-pill-tag" data-val="${it.val}">${it.name} <span class="tag-remove">&times;</span></span>`;
                    });
                    if (selectedItems.length > 2) {
                        html += `<span class="kiot-pill-more">+${selectedItems.length - 2}</span>`;
                    }
                    $box.html(html);
                }
            }

            if (typeof onRenderComplete === 'function') {
                onRenderComplete(selectedArray, totalCount);
            }
        }

        renderBox();

        // Click $box để mở/đóng
        $box.on('click', function (e) {
            const $tagRemove = $(e.target).closest('.tag-remove, .kiot-tag-close');
            if ($tagRemove.length) {
                e.stopPropagation();
                const $pill = $tagRemove.closest('.kiot-pill-tag').length ? $tagRemove.closest('.kiot-pill-tag') : $tagRemove;
                const val = parseInt($pill.data('val'), 10);
                const idx = selectedArray.indexOf(val);
                if (idx !== -1) {
                    selectedArray.splice(idx, 1);
                    renderBox();
                    loadTable(1);
                }
                return;
            }

            e.stopPropagation();
            const willShow = !$dropdown.hasClass('show');
            closeAllDropdowns();

            if (willShow) {
                $dropdown.addClass('show');
                $box.addClass('open is-active');

                if (window.KiotFilter && typeof window.KiotFilter.checkSidebarDropdownDirection === 'function') {
                    window.KiotFilter.checkSidebarDropdownDirection($box[0], $dropdown[0]);
                }

                const $searchInput = $dropdown.find('.kiot-ms-search input, input[type="text"]');
                if ($searchInput.length) {
                    $searchInput.val('');
                    $dropdown.find('.kiot-ms-item').show();
                    setTimeout(() => $searchInput.trigger('focus'), 50);
                }
            }
        });

        // Click từng item trong dropdown
        $dropdown.on('click', '.kiot-ms-item', function (e) {
            e.stopPropagation();
            const val = parseInt($(this).data('val'), 10);
            if (isNaN(val)) return;

            const idx = selectedArray.indexOf(val);
            if (idx >= 0) {
                selectedArray.splice(idx, 1);
            } else {
                selectedArray.push(val);
            }

            renderBox();
            loadTable(1);
        });

        // Tìm kiếm nội bộ
        $dropdown.on('click', '.kiot-ms-search input, input[type="text"]', function (e) {
            e.stopPropagation();
        });

        $dropdown.on('input', '.kiot-ms-search input, input[type="text"]', function (e) {
            e.stopPropagation();
            const term = $(this).val().trim().toLowerCase();
            $dropdown.find('.kiot-ms-item').each(function () {
                const text = ($(this).data('name') || $(this).find('.kiot-ms-text').text() || $(this).text() || '').trim().toLowerCase();
                $(this).toggle(!term || text.includes(term));
            });
        });

        return { renderBox };
    }

    // 5.1. Khởi tạo Multi-select Kho
    const khoHandler = setupMultiSelect('#boxKho', '#dropdownKho', '#dotKho', selectedKhoIds, khoNames, 'Tất cả chi nhánh', function (arr, total) {
        const $btn = $('#btnToggleAllKho');
        if ($btn.length) {
            $btn.text(arr.length === total ? 'Bỏ chọn' : 'Tất cả');
        }
    });

    $('#btnToggleAllKho').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const totalCount = Object.keys(khoNames).length;
        if (selectedKhoIds.length === totalCount) {
            selectedKhoIds = [];
        } else {
            selectedKhoIds = Object.keys(khoNames).map(x => parseInt(x, 10));
        }
        if (khoHandler) khoHandler.renderBox();
        loadTable(1);
    });

    // 5.2. Khởi tạo Multi-select Nhóm hàng (giống Danh sách Hàng hóa)
    setupMultiSelect('#boxNhomHang', '#dropdownNhomHang', '#dotNhomHang', selectedNhomIds, nhomNames, 'Chọn nhóm hàng');

    // 6. Khởi tạo Single-Select Dropdown: Tình trạng tồn (giống Tồn kho của Hàng hóa)
    function setupSingleSelectTon() {
        const $box = $('#boxTinhTrangTon');
        const $dropdown = $('#dropdownTinhTrangTon');
        const $text = $('#textTinhTrangTon');
        const $dot = $('#dotTinhTrangTon');

        $box.on('click', function (e) {
            e.stopPropagation();
            const willShow = !$dropdown.hasClass('show');
            closeAllDropdowns();

            if (willShow) {
                $dropdown.addClass('show');
                $box.addClass('open is-active');
                if (window.KiotFilter && typeof window.KiotFilter.checkSidebarDropdownDirection === 'function') {
                    window.KiotFilter.checkSidebarDropdownDirection($box[0], $dropdown[0]);
                }
            }
        });

        $dropdown.on('click', '.kiot-ss-item', function (e) {
            e.stopPropagation();
            const val = $(this).data('val');
            const label = $(this).find('span').text().trim();

            $dropdown.find('.kiot-ss-item').removeClass('selected');
            $(this).addClass('selected');
            $text.text(label);

            currentTinhTrang = val;
            $dot.toggleClass('active', currentTinhTrang !== 'ALL');

            closeAllDropdowns();
            loadTable(1);
        });
    }

    setupSingleSelectTon();

    // 7. Khởi tạo Checkbox Status Filter: Hàng hóa (chuẩn Lego _KiotStatusFilter)
    $(document).on('change', '#sidebarFilterCol input[data-s]', function () {
        selectedTrangThais = $('#sidebarFilterCol input[data-s]:checked').map(function () {
            return $(this).data('s');
        }).get();

        const isDefault = selectedTrangThais.length === 1 && selectedTrangThais[0] === 'DANG_KINH_DOANH';
        $('#dotTrangThaiHang').toggleClass('active', !isDefault && selectedTrangThais.length > 0);

        loadTable(1);
    });

    // 8. Sắp xếp cột 3 trạng thái chuẩn Danh sách Hàng hóa (Không sort -> ASC -> DESC -> Không sort)
    $(document).on('click', '#tableTonKho thead th.sortable-th', function (e) {
        e.preventDefault();
        const col = $(this).data('col') || $(this).data('sort');
        if (!col) return;

        if (currentSortBy === col) {
            if (currentSortDir === 'asc') {
                currentSortDir = 'desc';
            } else if (currentSortDir === 'desc') {
                currentSortBy = '';
                currentSortDir = '';
            } else {
                currentSortDir = 'asc';
            }
        } else {
            currentSortBy = col;
            currentSortDir = 'asc';
        }

        currentPage = 1;
        loadTable(1);
    });

    // 9. Phân trang AJAX qua nút _Pagination
    $(document).on('click', '.page-ajax', function (e) {
        e.preventDefault();
        const p = parseInt($(this).data('page'));
        if (p && p !== currentPage) {
            loadTable(p);
            $('html, body').animate({ scrollTop: $('#tableWrapper').offset().top - 70 }, 200);
        }
    });

    // 10. Xử lý Master-Detail Drawer xem chi tiết mặt hàng
    function openDrawer(maHang) {
        closeAllDropdowns();
        $('#tonKhoDrawerOverlay').fadeIn(150);
        $('#tonKhoDrawer').css('display', 'flex').hide().fadeIn(200);

        $('#drwTenHang').text('Đang tải dữ liệu...');
        $('#drwMaHangNoiBo').text('...');
        $('#drwKhoTableBody').html('<tr><td colspan="5" class="text-center py-3 text-muted"><span class="spinner-border spinner-border-sm me-1"></span> Đang nạp chi nhánh...</td></tr>');

        $.ajax({
            url: `/BaoCao/GetChiTietDinhMuc?maHang=${maHang}`,
            type: 'GET',
            success: function (d) {
                $('#drwTenHang').text(d.tenHang);
                $('#drwMaHangNoiBo').text(d.maHangNoiBo);
                $('#drwTenNhom').text(d.tenNhom || 'Chưa phân nhóm');
                $('#drwDvt').text(d.tenDvt || '-');
                $('#drwViTri').text(d.viTri || 'Chưa thiết lập');
                $('#drwGiaVon').text(formatNumber(d.giaVon) + ' ₫');
                $('#drwGiaBan').text(formatNumber(d.giaBan) + ' ₫');
                $('#drwTongTon').text(formatNumber(d.tongTon, 2));
                $('#drwTongGiaTri').text(formatNumber(d.tongGiaTriTon) + ' ₫');

                let rowsHtml = '';
                if (d.chiTietKhos && d.chiTietKhos.length > 0) {
                    d.chiTietKhos.forEach(k => {
                        let badgeClass = 'bg-secondary-subtle text-secondary';
                        if (k.trangThaiDinhMuc === 'Dưới định mức') badgeClass = 'bg-warning-subtle text-warning-emphasis';
                        else if (k.trangThaiDinhMuc === 'Vượt định mức') badgeClass = 'bg-info-subtle text-info-emphasis';
                        else if (k.trangThaiDinhMuc === 'Tồn âm') badgeClass = 'bg-danger-subtle text-danger';
                        else if (k.trangThaiDinhMuc === 'Bình thường') badgeClass = 'bg-success-subtle text-success';

                        rowsHtml += `
                            <tr>
                                <td class="fw-semibold text-dark">${k.tenKho}</td>
                                <td class="text-end ${k.tonHienTai < 0 ? 'text-danger fw-bold' : ''}">
                                    ${formatNumber(k.tonHienTai, 2)}
                                </td>
                                <td class="text-end text-muted">${k.tonToiThieu > 0 ? formatNumber(k.tonToiThieu, 2) : '-'}</td>
                                <td class="text-end text-muted">${k.tonCaoNhat ? formatNumber(k.tonCaoNhat, 2) : '-'}</td>
                                <td class="text-center">
                                    <span class="badge ${badgeClass}" style="font-size: 11px;">${k.trangThaiDinhMuc}</span>
                                </td>
                            </tr>
                        `;
                    });
                } else {
                    rowsHtml = '<tr><td colspan="5" class="text-center py-2 text-muted">Không có dữ liệu chi nhánh.</td></tr>';
                }
                $('#drwKhoTableBody').html(rowsHtml);
            },
            error: function () {
                if (window.KiotToast) KiotToast.error('Không thể tải chi tiết định mức hàng hóa.');
                closeDrawer();
            }
        });
    }

    function closeDrawer() {
        $('#tonKhoDrawer').fadeOut(150);
        $('#tonKhoDrawerOverlay').fadeOut(150);
    }

    // Bấm vào dòng hàng hóa hoặc nút mở drawer
    $(document).on('click', '.row-tonkho', function (e) {
        if ($(e.target).closest('button, a, input').length && !$(e.target).closest('.btn-view-drawer').length) {
            return;
        }
        const maHang = $(this).data('id');
        if (maHang) openDrawer(maHang);
    });

    $(document).on('click', '#btnCloseDrawer, #btnDismissDrawer, #tonKhoDrawerOverlay', function () {
        closeDrawer();
    });

    // 11. Nút Xuất file Excel
    $('#btnExportExcel').on('click', function () {
        const q = $('#keywordSearch').val().trim();
        const params = new URLSearchParams();
        if (q) params.append('Q', q);
        if (currentSortBy) {
            params.append('SortBy', currentSortBy);
            params.append('SortDir', currentSortDir || 'asc');
        }
        if (currentTinhTrang && currentTinhTrang !== 'ALL') params.append('TinhTrangTon', currentTinhTrang);

        selectedKhoIds.forEach(id => params.append('SelectedKhoIds', id));
        selectedNhomIds.forEach(id => params.append('SelectedNhomIds', id));
        selectedTrangThais.forEach(st => params.append('SelectedTrangThais', st));

        window.location.href = '/BaoCao/ExportExcel?' + params.toString();
    });

    // 12. Nút In báo cáo
    $('#btnPrintReport').on('click', function () {
        window.print();
    });

    // 13. BẮT BUỘC: Đóng các dropdown khi click ra ngoài document
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.kiot-multiselect-box, .kiot-single-select-box, .kiot-ms-dropdown, .kiot-ss-dropdown').length) {
            closeAllDropdowns();
        }
    });

})(jQuery);
