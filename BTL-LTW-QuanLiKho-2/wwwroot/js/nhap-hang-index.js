/**
 * nhap-hang-index.js
 * Quản lý danh sách Phiếu Nhập Hàng (Chuẩn KiotViet)
 * Tái sử dụng đồng bộ 100% khối LEGO KiotFilter & KiotConfirm
 */

$(function () {
    'use strict';

    const $container = $('#kiotContainer');
    if (!$container.length) return;

    const filterUrl = $container.data('filter-url') || '/NhapHang/Filter';
    const cancelUrl = $container.data('cancel-url') || '/NhapHang/Cancel';
    const saveNoteUrl = $container.data('save-note-url') || '/NhapHang/SaveNote';
    const exportUrl = $container.data('export-url') || '/NhapHang/Export';
    const toggleStarUrl = $container.data('toggle-star-url') || '/NhapHang/ToggleFavorite';

    let isStarredFilterActive = $container.data('is-starred') === true;

    // Trạng thái bộ lọc (Mặc định Toàn thời gian theo chuẩn Kiểm kho)
    const F = {
        q: $('#keywordSearch').val()?.trim() || '',
        mode: 'preset',
        preset: 'ALL',
        from: null,
        to: null,
        statuses: ['NHAP', 'DA_XAC_NHAN'],
        creatorIds: [],
        creatorNames: {},
        confirmerIds: [],
        confirmerNames: {},
        nccIds: [],
        nccNames: {},
        daDanhDau: isStarredFilterActive,
        sortBy: $container.data('sort-by') || 'tg',
        sortDir: $container.data('sort-dir') || 'desc',
        page: 1,
        size: 15,
        openId: null
    };

    // Khởi tạo các trạng thái ban đầu từ DOM
    $('.kiot-status-filter-block input[data-s]:checked').each(function () {
        const s = $(this).data('s');
        if (!F.statuses.includes(s)) F.statuses.push(s);
    });

    // Cấu hình 20 cột hiển thị mặc định khớp với KiotViet
    const DEFAULT_RECEIPT_COLS = {
        ma: 1,
        matra: 0,
        tg: 1,
        tgtao: 0,
        ngaycapnhat: 0,
        mancc: 1,
        ncc: 1,
        chinhanh: 0,
        nguoinhap: 0,
        nguoitao: 0,
        tongsl: 0,
        slmathang: 0,
        tongtien: 0,
        giamgia: 0,
        cantra: 1,
        chietkhautt: 0,
        tiendatra: 0,
        ghi: 0,
        st: 1,
        sohoadon: 0
    };

    let receiptColumnToggler = null;

    /* ===== 1. CẬP NHẬT GIAO DIỆN BỘ LỌC (DOTS, PRESETS, RADIOS) ===== */
    function paintFilters() {
        const isPreset = F.mode === 'preset';
        const isAll = isPreset && (F.preset === 'ALL' || F.preset === 'TOANTHOIGIAN');

        const rdAll = $('#dateAll'), rdCustom = $('#dateCustom');
        if (rdAll.length) rdAll.prop('checked', isPreset);
        if (rdCustom.length) rdCustom.prop('checked', !isPreset);

        // Dot Ngày
        $('#dotDate').toggleClass('on', !isAll);

        // Dot Trạng thái
        $('#dotSt').toggleClass('on', F.statuses.length > 0 && !(F.statuses.length === 2 && F.statuses.includes('NHAP') && F.statuses.includes('DA_XAC_NHAN')));

        // Dot Người tạo, Người nhập, Nhà cung cấp
        $('#dotUser').toggleClass('on', F.creatorIds.length > 0);
        $('#dotConfirmer').toggleClass('on', F.confirmerIds.length > 0);
        $('#dotNcc').toggleClass('on', F.nccIds.length > 0);

        // Active state cho nút trong popupDateQuick
        $('#popupDateQuick .quick-date-btn, #popupDateQuick .quick-date-pill-all').each(function () {
            $(this).toggleClass('active', F.mode === 'preset' && $(this).data('val') === F.preset);
        });

        // Đồng bộ checkbox trạng thái
        $('input[data-s]').each(function () {
            $(this).prop('checked', F.statuses.includes($(this).data('s')));
        });

        // Render box tag pills cho 3 dropdown
        renderCreatorMultiSelect();
        renderConfirmerMultiSelect();
        renderNccMultiSelect();
    }

    /* ===== 2. MULTISELECT DROPDOWNS (NGƯỜI TẠO, NGƯỜI NHẬP, NHÀ CUNG CẤP) ===== */
    function renderMultiSelect(boxSelector, dropdownSelector, selectedIds, namesMap, dotSelector, placeholder) {
        const $box = $(boxSelector);
        const $dropdown = $(dropdownSelector);
        if (!$box.length || !$dropdown.length) return;

        const $dot = $(dotSelector);
        if ($dot.length) {
            $dot.toggleClass('on', selectedIds.length > 0);
        }

        $dropdown.find('.kiot-ms-item').each(function () {
            const val = parseInt($(this).data('val'));
            const isSel = selectedIds.includes(val);
            $(this).toggleClass('selected', isSel);
            $(this).find('input[type="checkbox"]').prop('checked', isSel);
        });

        const selectedItems = selectedIds.map(id => ({
            val: id,
            name: namesMap[id] || ('#' + id)
        }));

        if (window.KiotFilter && typeof window.KiotFilter.renderTagPills === 'function') {
            window.KiotFilter.renderTagPills($box, selectedItems, placeholder, 2);
        }
    }

    function renderCreatorMultiSelect() {
        renderMultiSelect('#boxNguoiTao', '#dropdownNguoiTao', F.creatorIds, F.creatorNames, '#dotUser', 'Chọn người tạo');
    }

    function renderConfirmerMultiSelect() {
        renderMultiSelect('#boxNguoiNhap', '#dropdownNguoiNhap', F.confirmerIds, F.confirmerNames, '#dotConfirmer', 'Chọn người nhập');
    }

    function renderNccMultiSelect() {
        renderMultiSelect('#boxNhaCungCap', '#dropdownNhaCungCap', F.nccIds, F.nccNames, '#dotNcc', 'Chọn nhà cung cấp');
    }

    function setupMultiSelectDropdown(boxSelector, dropdownSelector, selectedIds, namesMap, renderFn) {
        const $box = $(boxSelector);
        const $dropdown = $(dropdownSelector);
        if (!$box.length || !$dropdown.length) return;

        // Cache trước tên từ các mục trong dropdown HTML
        $dropdown.find('.kiot-ms-item').each(function () {
            const val = parseInt($(this).data('val'));
            const name = $(this).data('name') || $(this).find('.kiot-ms-text').text().trim() || $(this).find('span').text().trim();
            if (!isNaN(val) && name) namesMap[val] = name;
        });

        // 1. Click vào box để mở / đóng dropdown
        $box.on('click', function (e) {
            // Nếu bấm vào nút xóa tag (dấu ×)
            const $tagRemove = $(e.target).closest('.tag-remove, .kiot-tag-close');
            if ($tagRemove.length) {
                e.stopPropagation();
                const $pill = $tagRemove.closest('.kiot-pill-tag').length ? $tagRemove.closest('.kiot-pill-tag') : $tagRemove;
                const val = parseInt($pill.data('val'));
                const idx = selectedIds.indexOf(val);
                if (idx !== -1) {
                    selectedIds.splice(idx, 1);
                    renderFn();
                    paintFilters();
                    F.page = 1;
                    loadTable();
                }
                return;
            }

            e.stopPropagation();

            // Đóng các dropdown khác và calendar popups
            $('.kiot-ms-dropdown').not($dropdown).removeClass('show drop-up').css('max-height', '');
            $('.kiot-multiselect-box').not($box).removeClass('open');
            $('.quick-date-popup, .dual-calendar-popup').hide();

            const willShow = !$dropdown.hasClass('show');
            if (willShow) {
                if (window.KiotFilter && typeof window.KiotFilter.checkSidebarDropdownDirection === 'function') {
                    window.KiotFilter.checkSidebarDropdownDirection($box[0], $dropdown[0]);
                }
                $dropdown.addClass('show');
                $box.addClass('open');
                const $searchInput = $dropdown.find('input[type="text"]');
                if ($searchInput.length) {
                    $searchInput.val('');
                    $dropdown.find('.kiot-ms-item').show();
                    $searchInput.focus();
                }
            } else {
                $dropdown.removeClass('show drop-up').css('max-height', '');
                $box.removeClass('open');
            }
        });

        // 2. Click chọn / bỏ chọn mục trong dropdown
        $dropdown.on('click', '.kiot-ms-item', function (e) {
            if ($(e.target).closest('.kiot-item-edit-btn, .hh-item-edit-btn').length) {
                return;
            }
            e.stopPropagation();
            const val = parseInt($(this).data('val'));
            if (isNaN(val)) return;

            const name = $(this).data('name') || $(this).find('.kiot-ms-text').text().trim() || $(this).find('span').text().trim();
            const idx = selectedIds.indexOf(val);
            if (idx >= 0) {
                selectedIds.splice(idx, 1);
            } else {
                selectedIds.push(val);
                if (name) namesMap[val] = name;
            }

            renderFn();
            paintFilters();
            F.page = 1;
            loadTable();
        });

        // 3. Tìm kiếm nội bộ trong dropdown
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
    }

    /* ===== 3. QUẢN LÝ ẨN / HIỆN CỘT BẢNG ===== */
    function initColumnToggle() {
        if (window.KiotFilter && typeof window.KiotFilter.initColumnToggle === 'function') {
            receiptColumnToggler = window.KiotFilter.initColumnToggle({
                menuSelector: '#colMenu',
                tableSelector: '#receiptTable',
                storageKey: 'kiot_nhap_hang_cols_v2',
                defaultCols: DEFAULT_RECEIPT_COLS,
                extraColsCount: 2 // checkbox + star
            });
        }
    }

    function applyColumnVisibility() {
        if (receiptColumnToggler && typeof receiptColumnToggler.apply === 'function') {
            receiptColumnToggler.apply();
        }
    }

    /* ===== 4. NẠP DỮ LIỆU BẢNG BẰNG AJAX ===== */
    function buildFilterParams() {
        const params = {
            Q: F.q,
            DateFilterType: F.mode === 'preset' ? F.preset : 'CUSTOM',
            DaDanhDau: F.daDanhDau,
            SortBy: F.sortBy,
            SortDir: F.sortDir,
            Page: F.page,
            PageSize: F.size
        };

        if (F.mode === 'custom') {
            if (F.from) {
                params.FromDate = typeof F.from === 'string' ? F.from : window.KiotFilter.formatDateISO(F.from);
            }
            if (F.to) {
                params.ToDate = typeof F.to === 'string' ? F.to : window.KiotFilter.formatDateISO(F.to);
            }
        }

        if (F.statuses && F.statuses.length > 0) {
            params.Statuses = F.statuses;
        }

        if (F.creatorIds && F.creatorIds.length > 0) {
            params.CreatorIds = F.creatorIds;
        }

        if (F.confirmerIds && F.confirmerIds.length > 0) {
            params.ConfirmerIds = F.confirmerIds;
        }

        if (F.nccIds && F.nccIds.length > 0) {
            params.NccIds = F.nccIds;
        }

        return params;
    }

    function loadTable() {
        const $wrap = $('#tableContainer');
        if ($wrap.length) $wrap.css('opacity', '0.6');

        $.ajax({
            url: filterUrl,
            type: 'GET',
            data: buildFilterParams(),
            traditional: true,
            success: function (html) {
                $wrap.html(html);
                rebindTableEvents();
                if (F.openId) {
                    expandReceiptRow(F.openId, false);
                }
            },
            error: function () {
                if (window.KiotToast) KiotToast.error('Không thể tải dữ liệu phiếu nhập hàng.');
            },
            complete: function () {
                if ($wrap.length) $wrap.css('opacity', '1');
            }
        });
    }

    let receiptRowDetailHandler = null;

    function initRowDetail() {
        if (window.KiotFilter && typeof window.KiotFilter.initRowDetail === 'function') {
            receiptRowDetailHandler = window.KiotFilter.initRowDetail({
                tableSelector: '#receiptTable',
                rowSelector: 'tr.product-row, tr.tbl-row',
                detailRowSelector: '#dtl-{id}',
                wrapSelector: '.product-detail-panel-wrap',
                tabBtnSelector: '.dp-tab',
                tabPaneSelector: '.tab-pane-content, .tab-pane',
                excludeClickSelector: 'input, button, a, label, .cell-checkbox, .cell-star, .star-btn',
                slideDuration: 150,
                fadeDuration: 120,
                onOpen: function (id, $row, $detailRow) {
                    F.openId = id;
                    setTimeout(function () {
                        if ($detailRow && $detailRow.length && $row && $row.length) {
                            const $scrollContainer = $detailRow.closest('.kiot-table-scroll-body');
                            if ($scrollContainer.length) {
                                const containerTop = $scrollContainer.offset().top;
                                const containerHeight = $scrollContainer.height();
                                const rowTop = $row.offset().top;
                                const detailBottom = $detailRow.offset().top + $detailRow.outerHeight();

                                if (detailBottom > containerTop + containerHeight) {
                                    const scrollTarget = $scrollContainer.scrollTop() + (rowTop - containerTop) - 10;
                                    $scrollContainer.animate({ scrollTop: Math.max(0, scrollTarget) }, 200);
                                }
                            }
                        }
                    }, 180);
                },
                onClose: function () {
                    F.openId = null;
                }
            });
        }
    }

    function expandReceiptRow(id, toggle = true) {
        if (!receiptRowDetailHandler) return;
        if (toggle) {
            receiptRowDetailHandler.toggle(id);
        } else {
            receiptRowDetailHandler.expand(id);
        }
    }

    /* ===== 5. SỰ KIỆN TRÊN BẢNG VÀ PHÂN TRANG ===== */
    function rebindTableEvents() {
        initColumnToggle();
        applyColumnVisibility();
        initRowDetail();

        // Check all rows
        $('#selectAllRows').off('change').on('change', function () {
            $('.row-select').prop('checked', $(this).prop('checked'));
        });

        $('.row-select').off('change').on('change', function () {
            const allCount = $('.row-select').length;
            const checkedCount = $('.row-select:checked').length;
            $('#selectAllRows').prop('checked', allCount > 0 && allCount === checkedCount);
        });
    }

    // Tìm kiếm nhanh hàng hóa bên trong dòng chi tiết phiếu nhập
    $(document).on('input', '.dtl-search-code, .dtl-search-name', function () {
        const $dp = $(this).closest('.product-detail-panel, .dp');
        const codeKw = ($dp.find('.dtl-search-code').val() || '').trim().toLowerCase();
        const nameKw = ($dp.find('.dtl-search-name').val() || '').trim().toLowerCase();
        $dp.find('.dtl-line-row').each(function () {
            const c = ($(this).data('code') || '').toLowerCase();
            const n = ($(this).data('name') || '').toLowerCase();
            const match = (!codeKw || c.includes(codeKw)) && (!nameKw || n.includes(nameKw));
            $(this).toggle(match);
        });
    });

    // Sắp xếp cột Sortable TH
    $(document).on('click', '.sortable-th', function () {
        const col = $(this).data('col');
        if (!col) return;
        if (F.sortBy === col) {
            F.sortDir = F.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            F.sortBy = col;
            F.sortDir = 'desc';
        }
        F.page = 1;
        loadTable();
    });

    // Phân trang AJAX qua _Pagination.cshtml
    $(document).on('click', '.kiot-pagination-btn, .page-ajax, .kiot-page-link', function (e) {
        e.preventDefault();
        const p = parseInt($(this).data('page'));
        if (p && p !== F.page) {
            F.page = p;
            loadTable();
        }
    });

    // Nút tải lại bảng
    $('#btnReloadTable').on('click', function () {
        const $btn = $(this);
        $btn.addClass('spinning');
        loadTable();
        setTimeout(() => $btn.removeClass('spinning'), 600);
    });

    /* ===== 6. ĐÁNH DẤU SAO YÊU THÍCH ===== */
    window.toggleFavoriteReceipt = function (e, id, cell) {
        e.stopPropagation();
        const $starBtn = $(cell).hasClass('star-btn') ? $(cell) : $(cell).find('.star-btn');
        const isCurrentStarred = $starBtn.hasClass('starred');
        const nextState = !isCurrentStarred;

        $starBtn.toggleClass('starred', nextState);
        $starBtn.find('i').attr('class', nextState ? 'bi bi-star-fill' : 'bi bi-star');

        $.ajax({
            url: `${toggleStarUrl}?id=${id}`,
            type: 'POST',
            success: function (res) {
                if (!res.success) {
                    $starBtn.toggleClass('starred', isCurrentStarred);
                    $starBtn.find('i').attr('class', isCurrentStarred ? 'bi bi-star-fill' : 'bi bi-star');
                }
            },
            error: function () {
                $starBtn.toggleClass('starred', isCurrentStarred);
                $starBtn.find('i').attr('class', isCurrentStarred ? 'bi bi-star-fill' : 'bi bi-star');
            }
        });
    };

    window.toggleStarHeaderFilter = function (e) {
        e.stopPropagation();
        F.daDanhDau = !F.daDanhDau;
        $('#starHeaderFilter').toggleClass('starred', F.daDanhDau);
        $('#starHeaderFilter i').attr('class', F.daDanhDau ? 'bi bi-star-fill' : 'bi bi-star');
        F.page = 1;
        loadTable();
    };

    /* ===== 7. LƯU GHI CHÚ VÀ HỦY CHỨNG TỪ ===== */
    $(document).on('click', '.btn-save-note', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        const note = $(this).closest('.product-detail-panel, .dp').find('.dp-note').val();

        $.ajax({
            url: `${saveNoteUrl}?id=${id}`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ maPhieuNhap: id, ghiChu: note }),
            success: function (res) {
                if (res.success && window.KiotToast) {
                    KiotToast.success('Đã lưu ghi chú thành công!');
                }
            },
            error: function () {
                if (window.KiotToast) KiotToast.error('Không thể lưu ghi chú.');
            }
        });
    });

    $(document).on('click', '.btn-cancel-doc', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        const code = $(this).data('code') || ('PN' + id);

        function doCancel() {
            $.ajax({
                url: `${cancelUrl}?id=${id}`,
                type: 'POST',
                success: function (res) {
                    if (res.success) {
                        if (window.KiotToast) KiotToast.success(res.message || 'Đã hủy phiếu nhập hàng thành công!');
                        loadTable();
                    } else {
                        if (window.KiotToast) KiotToast.error(res.message || 'Không thể hủy phiếu nhập.');
                    }
                },
                error: function (xhr) {
                    const msg = xhr.responseJSON?.message || 'Lỗi khi gửi yêu cầu hủy phiếu.';
                    if (window.KiotToast) KiotToast.error(msg);
                }
            });
        }

        if (window.KiotConfirm) {
            window.KiotConfirm.show({
                title: 'Hủy phiếu nhập hàng',
                icon: 'bi-exclamation-triangle-fill',
                iconColor: '#dc2626',
                message: `Bạn có chắc chắn muốn hủy phiếu nhập hàng "${code}" không? Thao tác này sẽ hoàn lại số lượng tồn kho (nếu phiếu đã hoàn thành) và không thể hoàn tác.`,
                okText: 'Đồng ý hủy',
                onConfirm: doCancel
            });
        } else if (confirm(`Bạn có chắc chắn muốn hủy phiếu nhập hàng "${code}" không? Thao tác này không thể hoàn tác.`)) {
            doCancel();
        }
    });

    /* ===== 8. XUẤT EXCEL ===== */
    $('#btnExpList').on('click', function () {
        if (window.KiotToast) KiotToast.info('Đang chuẩn bị file danh sách phiếu nhập...');
        const p = $.param(buildFilterParams());
        window.location.href = `${exportUrl}?type=list&${p}`;
    });

    $('#btnExpDetail').on('click', function () {
        if (window.KiotToast) KiotToast.info('Đang chuẩn bị file chi tiết phiếu nhập...');
        const p = $.param(buildFilterParams());
        window.location.href = `${exportUrl}?type=detail&${p}`;
    });

    /* ===== 9. RESET TOÀN BỘ BỘ LỌC ===== */
    function resetAllFilters() {
        F.q = '';
        F.preset = 'ALL';
        F.mode = 'preset';
        F.from = null;
        F.to = null;
        F.statuses = ['NHAP', 'DA_XAC_NHAN'];
        F.creatorIds = [];
        F.confirmerIds = [];
        F.nccIds = [];
        F.daDanhDau = false;
        F.sortBy = 'tg';
        F.sortDir = 'desc';
        F.page = 1;
        F.openId = null;

        $('#keywordSearch').val('');
        $('#starHeaderFilter').removeClass('starred');
        $('#starHeaderFilter i').attr('class', 'bi bi-star');
        $('#textDateRange').text('Toàn thời gian');

        paintFilters();
        loadTable();
    }

    $(document).on('click', '#resetF', function (e) {
        e.preventDefault();
        resetAllFilters();
    });

    /* ===== 10. KHỞI TẠO BỘ LẮNG NGHE SỰ KIỆN ===== */
    function init() {
        // 1. Ô tìm kiếm từ khóa F3 (Debounce 350ms)
        let searchTimer = null;
        $('#keywordSearch').on('input', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                F.q = $(this).val().trim();
                F.page = 1;
                loadTable();
            }, 350);
        });

        // 2. Khởi tạo Bộ lọc Thời gian dùng KiotFilter.initDateFilter
        if (window.KiotFilter && typeof window.KiotFilter.initDateFilter === 'function') {
            window.KiotFilter.initDateFilter('date', function (from, to, text, val) {
                if (val === 'CUSTOM') {
                    F.mode = 'custom';
                    F.preset = 'CUSTOM';
                    F.from = from ? new Date(from) : null;
                    F.to = to ? new Date(to) : null;
                } else {
                    F.mode = 'preset';
                    F.preset = val || 'ALL';
                    F.from = null;
                    F.to = null;
                }
                F.page = 1;
                paintFilters();
                loadTable();
            });
        }

        // 3. Checkbox Trạng thái
        $(document).on('change', '.kiot-status-filter-block input[data-s]', function () {
            const s = $(this).data('s');
            if ($(this).is(':checked')) {
                if (!F.statuses.includes(s)) F.statuses.push(s);
            } else {
                F.statuses = F.statuses.filter(x => x !== s);
            }
            F.page = 1;
            paintFilters();
            loadTable();
        });

        // 4. Gắn sự kiện cho 3 Multi-select (Người tạo, Người nhập, Nhà cung cấp)
        setupMultiSelectDropdown('#boxNguoiTao', '#dropdownNguoiTao', F.creatorIds, F.creatorNames, renderCreatorMultiSelect);
        setupMultiSelectDropdown('#boxNguoiNhap', '#dropdownNguoiNhap', F.confirmerIds, F.confirmerNames, renderConfirmerMultiSelect);
        setupMultiSelectDropdown('#boxNhaCungCap', '#dropdownNhaCungCap', F.nccIds, F.nccNames, renderNccMultiSelect);

        // 5. Đóng popup khi cuộn sidebar hoặc click ngoài hoặc nhấn Escape
        $('.kiot-filter-box').on('scroll', function () {
            $('.quick-date-popup, .dual-calendar-popup').hide();
            const $openDropdown = $('.kiot-ms-dropdown.show');
            if ($openDropdown.length) {
                const $box = $openDropdown.parent().find('.kiot-multiselect-box');
                if ($box.length && window.KiotFilter && typeof window.KiotFilter.checkSidebarDropdownDirection === 'function') {
                    window.KiotFilter.checkSidebarDropdownDirection($box[0], $openDropdown[0]);
                }
            }
        });

        $(document).on('click', function (e) {
            if ($(e.target).closest('.dual-calendar-popup, .quick-date-popup').length) return;

            const $targetBlock = $(e.target).closest('.f-block');
            if (!$targetBlock.length) {
                $('.quick-date-popup, .dual-calendar-popup').hide();
                $('.kiot-ms-dropdown').removeClass('show drop-up').css('max-height', '');
                $('.kiot-multiselect-box').removeClass('open');
            } else {
                $('.dual-calendar-popup, .quick-date-popup').not($targetBlock.find('.dual-calendar-popup, .quick-date-popup')).hide();
                $('.kiot-ms-dropdown').not($targetBlock.find('.kiot-ms-dropdown')).removeClass('show drop-up').css('max-height', '');
                $('.kiot-multiselect-box').not($targetBlock.find('.kiot-multiselect-box')).removeClass('open');
            }
        });

        $(document).on('keydown', function (e) {
            if (e.key === 'Escape') {
                $('.quick-date-popup, .dual-calendar-popup').hide();
                $('.kiot-ms-dropdown').removeClass('show drop-up').css('max-height', '');
                $('.kiot-multiselect-box').removeClass('open');
            } else if (e.key === 'F3' || e.keyCode === 114) {
                e.preventDefault();
                $('#keywordSearch').focus().select();
            }
        });

        // 6. Khởi tạo LEGO Sidebar KiotFilter.initSidebar (F4 & Mobile Drawer)
        if (window.KiotFilter && typeof window.KiotFilter.initSidebar === 'function') {
            window.KiotFilter.initSidebar({
                containerSelector: '#kiotContainer',
                btnToggleSelector: '#btnToggleSidebar',
                iconSelector: '#sidebarToggleIcon',
                mobileBtnSelector: '#btnMobileFilter',
                mobileCloseSelector: '#btnCloseSidebarMobile',
                backdropSelector: '#sidebarBackdrop',
                sidebarColSelector: '#sidebarFilterCol',
                storageKey: 'kiot_nhap_hang_sidebar'
            });
        }

        // 7. Tùy chọn hiển thị cột
        initColumnToggle();

        // 8. Gắn sự kiện ban đầu cho bảng
        rebindTableEvents();

        // 9. Vẽ bộ lọc ban đầu
        paintFilters();
    }

    init();
});
