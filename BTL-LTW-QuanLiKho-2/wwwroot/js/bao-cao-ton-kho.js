/**
 * bao-cao-ton-kho.js - Quản lý tương tác Báo cáo Tồn kho theo kho (Pivot Kho)
 * Chuẩn hóa 100% theo khuôn mẫu Danh sách Hàng hóa (Inline Subrow, Summary Row, Column Toggle)
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

    let selectedTrangThais = ['DANG_BAN'];

    const khoNames = {};
    const nhomNames = {};

    // 2. Khởi tạo Sidebar chuyên nghiệp F4 & Hotkeys
    if (window.KiotFilter && typeof KiotFilter.initSidebar === 'function') {
        KiotFilter.initSidebar({
            storageKey: 'kiot_sidebar_baocao_tonkho'
        });
    }

    // Hotkey F3 focus ô tìm kiếm & Escape đóng dropdown
    $(document).on('keydown', function (e) {
        if (e.key === 'F3') {
            e.preventDefault();
            $('#keywordSearch').trigger('focus').select();
        } else if (e.key === 'Escape') {
            closeAllDropdowns();
        }
    });

    function closeAllDropdowns() {
        $('.kiot-ms-dropdown, .kiot-ss-dropdown').removeClass('show drop-up').css('max-height', '');
        $('.kiot-multiselect-box, .kiot-single-select-box').removeClass('open is-active');
    }

    // 3. Tùy chọn ẩn / hiện cột chuẩn Danh sách Hàng hóa
    function applyColumnVisibility() {
        $('#colMenu input[data-c]').each(function () {
            const colKey = $(this).data('c');
            const isVisible = $(this).is(':checked');
            localStorage.setItem('kiot_tonkho_col_' + colKey, isVisible ? '1' : '0');

            if (colKey === 'khos') {
                $(`th[data-col^="kho_"], td[data-col^="kho_"]`).toggle(isVisible);
            } else {
                $(`th[data-col="${colKey}"], td[data-col="${colKey}"]`).toggle(isVisible);
            }
        });

        // Tự động điều chỉnh colspan cho các dòng chi tiết đang mở
        const visibleCols = $('#tableTonKho thead tr:first-child th:visible').length || 8;
        $('.tonkho-detail-row > td').attr('colspan', visibleCols);
    }

    function initColumnToggle() {
        $('#colMenu input[data-c]').each(function () {
            const colKey = $(this).data('c');
            const saved = localStorage.getItem('kiot_tonkho_col_' + colKey);
            if (saved !== null) {
                $(this).prop('checked', saved === '1');
            }
        });
        applyColumnVisibility();
    }

    $(document).on('change', '#colMenu input[data-c]', function () {
        applyColumnVisibility();
    });

    // 4. Nạp dữ liệu bảng AJAX (Pivot Kho)
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
            success: function (html) {
                $wrap.html(html).css('opacity', '1');
                applyColumnVisibility();
            },
            error: function () {
                $wrap.css('opacity', '1');
                if (window.KiotToast) {
                    KiotToast.error('Không thể tải dữ liệu báo cáo tồn kho.');
                }
            }
        });
    }

    // Nút Tải lại bảng
    $(document).on('click', '#btnReloadTable', function (e) {
        e.preventDefault();
        const $icon = $(this).find('i');
        $icon.addClass('spin-animation');
        loadTable(currentPage);
        setTimeout(() => $icon.removeClass('spin-animation'), 600);
    });

    // 5. Tìm kiếm từ khóa với Debounce 350ms
    let searchTimer = null;
    $('#keywordSearch').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            loadTable(1);
        }, 350);
    });

    // 6. Khởi tạo Multi-Select Dropdown dùng chung (Chuẩn Lego hệ thống)
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

            // Dot trạng thái: sáng khi có lọc tiêu chí cụ thể
            if ($dot.length) {
                $dot.toggleClass('active', selectedArray.length > 0);
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

    // 6.1. Khởi tạo Multi-select Kho (Mặc định: Tất cả các kho, chỉ chọn cụ thể khi người dùng tích chọn)
    const khoHandler = setupMultiSelect('#boxKho', '#dropdownKho', '#dotKho', selectedKhoIds, khoNames, 'Tất cả các kho', function (arr, total) {
        const $btn = $('#btnToggleAllKho');
        if ($btn.length) {
            $btn.text('Bỏ chọn');
            $btn.toggle(arr.length > 0);
        }
    });

    $('#btnToggleAllKho').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        selectedKhoIds.length = 0;
        if (khoHandler) khoHandler.renderBox();
        loadTable(1);
    });

    // 6.2. Khởi tạo Multi-select Nhóm hàng (giống Danh sách Hàng hóa)
    setupMultiSelect('#boxNhomHang', '#dropdownNhomHang', '#dotNhomHang', selectedNhomIds, nhomNames, 'Chọn nhóm hàng');

    // 7. Khởi tạo Single-Select Dropdown: Tình trạng tồn (giống Tồn kho của Hàng hóa)
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

    // 8. Khởi tạo Checkbox Status Filter: Hàng hóa (chuẩn Lego _KiotStatusFilter)
    $(document).on('change', '#sidebarFilterCol input[data-s]', function () {
        selectedTrangThais = $('#sidebarFilterCol input[data-s]:checked').map(function () {
            return $(this).data('s');
        }).get();

        const isDefault = selectedTrangThais.length === 1 && (selectedTrangThais[0] === 'DANG_BAN' || selectedTrangThais[0] === 'DANG_KINH_DOANH');
        $('#dotTrangThaiHang').toggleClass('active', !isDefault && selectedTrangThais.length > 0);

        loadTable(1);
    });

    // 9. Sắp xếp cột 3 trạng thái chuẩn Danh sách Hàng hóa (Không sort -> ASC -> DESC -> Không sort)
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

    // 10. Phân trang AJAX qua nút _Pagination
    $(document).on('click', '.page-ajax', function (e) {
        e.preventDefault();
        const p = parseInt($(this).data('page'));
        if (p && p !== currentPage) {
            loadTable(p);
            $('.kiot-table-scroll-body').scrollTop(0);
        }
    });

    // 11. Xử lý mở rộng dòng chi tiết Inline Subrow (Master - Detail chuẩn Danh sách Hàng hóa)
    $(document).on('click', '.product-row.row-tonkho', function (e) {
        if ($(e.target).closest('input, button, a').length) {
            return;
        }

        const id = $(this).data('id');
        const $detailRow = $('#detail-' + id);
        const $wrap = $detailRow.find('.product-detail-panel-wrap');
        const isCurrentlyOpen = $detailRow.is(':visible');

        // Thu gọn các dòng chi tiết khác
        $('.tonkho-detail-row').not($detailRow).each(function () {
            const $other = $(this);
            $other.find('.product-detail-panel-wrap').stop(true, true).slideUp(150, function () {
                $other.hide();
            });
        });
        $('.product-row.row-tonkho').not(this).removeClass('selected');

        if (isCurrentlyOpen) {
            $wrap.stop(true, true).slideUp(150, function () {
                $detailRow.hide();
            });
            $(this).removeClass('selected');
        } else {
            $(this).addClass('selected');
            const visibleCols = $('#tableTonKho thead tr:first-child th:visible').length || 8;
            $detailRow.find('> td').attr('colspan', visibleCols);
            $detailRow.show();
            $wrap.stop(true, true).hide().slideDown(150);
        }
    });

    // Chuyển Tab chi tiết bên trong Subrow
    $(document).on('click', '.product-detail-tab-btn', function (e) {
        e.stopPropagation();
        const tabName = $(this).data('tab');
        const $panel = $(this).closest('.product-detail-panel');

        $panel.find('.product-detail-tab-btn').removeClass('active');
        $(this).addClass('active');

        $panel.find('.tab-pane-content').hide();
        $panel.find('.tab-' + tabName).fadeIn(120);

        if (tabName === 'thekho') {
            loadTheKhoQuick($panel);
        }
    });

    // Nạp nhanh Thẻ kho qua API /BaoCao/GetTheKhoQuick
    function loadTheKhoQuick($panel) {
        const $box = $panel.find('.thekho-quick-box');
        if (!$box.length || $box.attr('data-loaded') === 'true') return;

        const maHang = parseInt($box.data('ma-hang'), 10);
        if (!maHang) return;

        const $tbody = $box.find('.thekho-quick-tbody');
        $tbody.html('<tr><td colspan="7" class="text-center py-3 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Đang nạp dữ liệu thẻ kho...</td></tr>');

        $.ajax({
            url: `/BaoCao/GetTheKhoQuick?maHang=${maHang}&soLuong=10`,
            type: 'GET',
            success: function (res) {
                $box.attr('data-loaded', 'true');
                const list = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
                if (!list.length) {
                    $tbody.html('<tr><td colspan="7" class="text-center py-3 text-muted">Chưa có phát sinh biến động kho nào cho mặt hàng này.</td></tr>');
                    return;
                }

                let rowsHtml = '';
                list.forEach(function (d) {
                    const timeStr = d.thoiDiem ? new Date(d.thoiDiem).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : (d.ngayChungTu ? new Date(d.ngayChungTu).toLocaleDateString('vi-VN') : '-');
                    const codeHtml = d.maChungTu || '-';
                    const loai = d.loaiGiaoDich || d.dienGiai || 'Giao dịch kho';
                    const slNhap = d.soLuongNhap > 0 ? `<span class="text-success">+${Number(d.soLuongNhap).toLocaleString('vi-VN')}</span>` : '-';
                    const slXuat = d.soLuongXuat > 0 ? `<span class="text-danger">-${Number(d.soLuongXuat).toLocaleString('vi-VN')}</span>` : '-';
                    const ton = `<span>${Number(d.tonCuoi ?? d.tonLuyKe ?? 0).toLocaleString('vi-VN')}</span>`;
                    const doiTac = d.tenDoiTac || d.doiTac || '-';

                    rowsHtml += `
                        <tr>
                            <td class="text-muted small">${timeStr}</td>
                            <td>${escapeHtml(codeHtml)}</td>
                            <td>${escapeHtml(loai)}</td>
                            <td class="text-end">${slNhap}</td>
                            <td class="text-end">${slXuat}</td>
                            <td class="text-end text-dark">${ton}</td>
                            <td class="text-muted small">${escapeHtml(doiTac)}</td>
                        </tr>
                    `;
                });
                $tbody.html(rowsHtml);
            },
            error: function () {
                $tbody.html('<tr><td colspan="7" class="text-center py-3 text-danger"><i class="bi bi-exclamation-circle me-1"></i> Không thể nạp thẻ kho nhanh.</td></tr>');
            }
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 12. Nút Xuất file Excel
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

    // 13. Nút In báo cáo
    $('#btnPrintReport').on('click', function () {
        window.print();
    });

    // 14. BẮT BUỘC: Đóng các dropdown khi click ra ngoài document
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.kiot-multiselect-box, .kiot-single-select-box, .kiot-ms-dropdown, .kiot-ss-dropdown, #colMenu, #btnColsDropdown').length) {
            closeAllDropdowns();
        }
    });

    // 15. Khởi tạo ẩn/hiện cột khi trang tải xong
    initColumnToggle();

})(jQuery);
