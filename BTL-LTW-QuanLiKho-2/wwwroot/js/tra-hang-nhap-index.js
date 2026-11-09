/**
 * tra-hang-nhap-index.js
 * Quản lý danh sách Phiếu Trả Hàng Nhập (chuẩn chuyên nghiệp & Prototype)
 * Tái sử dụng đồng bộ 100% khối LEGO AppFilter & AppToast
 */

$(function () {
    'use strict';

    const $container = $('#kpContainer');
    if (!$container.length) return;

    const filterUrl = $container.data('filter-url') || '/TraHangNhap/Filter';
    const cancelUrl = $container.data('cancel-url') || '/TraHangNhap/Cancel';
    const saveNoteUrl = $container.data('save-note-url') || '/TraHangNhap/QuickUpdateNote';
    const exportUrl = $container.data('export-url') || '/TraHangNhap/ExportExcel';
    const toggleStarUrl = $container.data('toggle-star-url') || '/TraHangNhap/ToggleFavorite';

    let isStarredFilterActive = $container.data('is-starred') === true;

    // Trạng thái bộ lọc
    const F = {
        q: $('#keywordSearch').val()?.trim() || '',
        advSup: '',
        advProd: '',
        mode: 'preset',
        preset: 'ALL',
        from: null,
        to: null,
        statuses: ['NHAP', 'DA_TRA_HANG'],
        creatorIds: [],
        creatorNames: {},
        payerIds: [],
        payerNames: {},
        nccIds: [],
        nccNames: {},
        daDanhDau: isStarredFilterActive,
        sortBy: $container.data('sort-by') || '',
        sortDir: $container.data('sort-dir') || '',
        page: 1,
        size: 15,
        openId: null
    };

    // Đọc trạng thái ban đầu từ DOM
    $('.kp-status-filter-block input[data-s]:checked').each(function () {
        const s = $(this).data('s');
        if (!F.statuses.includes(s)) F.statuses.push(s);
    });

    // Cấu hình 14 cột hiển thị mặc định
    const DEFAULT_COLS = {
        ma: 1,
        tg: 1,
        tgtao: 0,
        ncc: 1,
        chinhanh: 0,
        nguoitra: 0,
        nguoitao: 0,
        tongsl: 0,
        slmathang: 0,
        tongtien: 1,
        giamgia: 1,
        canthu: 1,
        dathu: 1,
        st: 1
    };

    let colToggler = null;

    /* ===== 1. CẬP NHẬT GIAO DIỆN BỘ LỌC (DOTS, PRESETS, RADIOS, MULTI-SELECTS) ===== */
    function renderMultiSelect(boxSelector, dropdownSelector, selectedIds, namesMap, dotSelector, placeholder) {
        const $box = $(boxSelector);
        const $dropdown = $(dropdownSelector);
        if (!$box.length || !$dropdown.length) return;

        const $dot = $(dotSelector);
        if ($dot.length) {
            $dot.toggleClass('on', selectedIds.length > 0);
        }

        $dropdown.find('.kp-ms-item').each(function () {
            const val = parseInt($(this).data('val'), 10);
            const isSel = selectedIds.includes(val);
            $(this).toggleClass('selected', isSel);
            $(this).find('input[type="checkbox"]').prop('checked', isSel);
        });

        const selectedItems = selectedIds.map(id => ({
            val: id,
            name: namesMap[id] || ('#' + id)
        }));

        if (window.AppFilter && typeof window.AppFilter.renderTagPills === 'function') {
            window.AppFilter.renderTagPills($box, selectedItems, placeholder, 2);
        } else {
            if (selectedItems.length === 0) {
                $box.html(`<span class="kp-ms-placeholder">${placeholder}</span>`);
            } else {
                let html = '';
                selectedItems.slice(0, 2).forEach(it => {
                    html += `<span class="kp-pill-tag" data-val="${it.val}">${it.name} <span class="tag-remove">&times;</span></span>`;
                });
                if (selectedItems.length > 2) {
                    html += `<span class="kp-pill-more">+${selectedItems.length - 2}</span>`;
                }
                $box.html(html);
            }
        }
    }

    function renderCreatorMultiSelect() {
        renderMultiSelect('#boxNguoiTao', '#dropdownNguoiTao', F.creatorIds, F.creatorNames, '#dotUser', 'Chọn người tạo');
    }

    function renderPayerMultiSelect() {
        renderMultiSelect('#boxNguoiTra', '#dropdownNguoiTra', F.payerIds, F.payerNames, '#dotPayer', 'Chọn người trả');
    }

    function renderNccMultiSelect() {
        renderMultiSelect('#boxNhaCungCap', '#dropdownNhaCungCap', F.nccIds, F.nccNames, '#dotNcc', 'Chọn nhà cung cấp');
    }

    function setupMultiSelectDropdown(boxSelector, dropdownSelector, selectedIds, namesMap, renderFn) {
        const $box = $(boxSelector);
        const $dropdown = $(dropdownSelector);
        if (!$box.length || !$dropdown.length) return;

        // Cache trước tên từ các mục trong dropdown HTML
        $dropdown.find('.kp-ms-item').each(function () {
            const val = parseInt($(this).data('val'), 10);
            const name = $(this).data('name') || $(this).find('.kp-ms-text').text().trim() || $(this).find('span').text().trim();
            if (!isNaN(val) && name) namesMap[val] = name;
        });

        // 1. Click vào box để mở / đóng dropdown
        $box.on('click', function (e) {
            const $tagRemove = $(e.target).closest('.tag-remove, .kp-tag-close');
            if ($tagRemove.length) {
                e.stopPropagation();
                const $pill = $tagRemove.closest('.kp-pill-tag').length ? $tagRemove.closest('.kp-pill-tag') : $tagRemove;
                const val = parseInt($pill.data('val'), 10);
                const idx = selectedIds.indexOf(val);
                if (idx !== -1) {
                    selectedIds.splice(idx, 1);
                    renderFn();
                    paintFilters();
                    F.page = 1;
                    fetchTable();
                }
                return;
            }

            e.stopPropagation();

            $('.kp-ms-dropdown').not($dropdown).removeClass('show drop-up').css('max-height', '');
            $('.kp-multiselect-box').not($box).removeClass('open');
            $('.quick-date-popup, .dual-calendar-popup').hide();

            const willShow = !$dropdown.hasClass('show');
            if (willShow) {
                if (window.AppFilter && typeof window.AppFilter.checkSidebarDropdownDirection === 'function') {
                    window.AppFilter.checkSidebarDropdownDirection($box[0], $dropdown[0]);
                }
                $dropdown.addClass('show');
                $box.addClass('open');
                const $searchInput = $dropdown.find('input[type="text"]');
                if ($searchInput.length) {
                    $searchInput.val('');
                    $dropdown.find('.kp-ms-item').show();
                    $searchInput.focus();
                }
            } else {
                $dropdown.removeClass('show drop-up').css('max-height', '');
                $box.removeClass('open');
            }
        });

        // 2. Click chọn / bỏ chọn mục trong dropdown
        $dropdown.on('click', '.kp-ms-item', function (e) {
            if ($(e.target).closest('.kp-item-edit-btn, .hh-item-edit-btn').length) {
                return;
            }
            e.stopPropagation();
            const val = parseInt($(this).data('val'), 10);
            if (isNaN(val)) return;

            const name = $(this).data('name') || $(this).find('.kp-ms-text').text().trim() || $(this).find('span').text().trim();
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
            fetchTable();
        });

        // 3. Tìm kiếm nội bộ trong dropdown
        $dropdown.on('click', '.kp-ms-search input, input[type="text"]', function (e) {
            e.stopPropagation();
        });

        $dropdown.on('input', '.kp-ms-search input, input[type="text"]', function (e) {
            e.stopPropagation();
            const term = $(this).val().trim().toLowerCase();
            $dropdown.find('.kp-ms-item').each(function () {
                const text = ($(this).data('name') || $(this).find('.kp-ms-text').text() || $(this).text() || '').trim().toLowerCase();
                $(this).toggle(!term || text.includes(term));
            });
        });
    }

    function paintFilters() {
        const isPreset = F.mode === 'preset';
        const isAll = isPreset && (F.preset === 'ALL' || F.preset === 'TOANTHOIGIAN');

        const rdAll = $('#dateAll'), rdCustom = $('#dateCustom');
        if (rdAll.length) rdAll.prop('checked', isPreset);
        if (rdCustom.length) rdCustom.prop('checked', !isPreset);

        // Dot Ngày
        $('#dotDate').toggleClass('on', !isAll);

        // Dot Trạng thái
        $('#dotSt').toggleClass('on', F.statuses.length > 0 && !(F.statuses.length === 2 && F.statuses.includes('NHAP') && F.statuses.includes('DA_TRA_HANG')));

        // Render multi-selects & dots
        renderCreatorMultiSelect();
        renderPayerMultiSelect();
        renderNccMultiSelect();

        $('#popupDateQuick .quick-date-btn, #popupDateQuick .quick-date-pill-all').each(function () {
            $(this).toggleClass('active', F.mode === 'preset' && $(this).data('val') === F.preset);
        });

        $('.kp-status-filter-block input[data-s]').each(function () {
            $(this).prop('checked', F.statuses.includes($(this).data('s')));
        });

        // Icon sao header
        $('#starHeaderFilter').toggleClass('starred', F.daDanhDau);
        $('#starHeaderFilter i').attr('class', F.daDanhDau ? 'bi bi-star-fill' : 'bi bi-star');
    }

    /* ===== 2. NẠP DỮ LIỆU BẢNG BẰNG AJAX ===== */
    function fetchTable() {
        const params = {
            Q: F.q,
            AdvSup: F.advSup,
            AdvProd: F.advProd,
            DateFilterType: F.mode === 'preset' ? F.preset : 'CUSTOM',
            FromDate: F.mode === 'custom' && F.from ? F.from : null,
            ToDate: F.mode === 'custom' && F.to ? F.to : null,
            Statuses: F.statuses,
            NccIds: F.nccIds,
            CreatorIds: F.creatorIds,
            PayerIds: F.payerIds,
            DaDanhDau: F.daDanhDau,
            SortBy: F.sortBy,
            SortDir: F.sortDir,
            Page: F.page,
            PageSize: F.size
        };

        const $wrapper = $('#tableContainer');
        $wrapper.addClass('opacity-50 pointer-events-none');

        $.ajax({
            url: filterUrl,
            type: 'GET',
            data: params,
            traditional: true,
            success: function (html) {
                $wrapper.html(html);
                $wrapper.removeClass('opacity-50 pointer-events-none');

                if (colToggler && typeof colToggler.apply === 'function') {
                    colToggler.apply();
                }

                if (F.openId) {
                    const $targetRow = $(`#detail-row-${F.openId}`);
                    if ($targetRow.length) {
                        $targetRow.show();
                        $targetRow.find('.product-detail-panel-wrap').show();
                        $(`.tbl-row[data-id="${F.openId}"]`).addClass('open selected is-expanded');
                    }
                }
            },
            error: function (xhr) {
                $wrapper.removeClass('opacity-50 pointer-events-none');
                if (window.AppToast) {
                    AppToast.error('Không thể nạp dữ liệu: ' + (xhr.responseJSON?.message || xhr.statusText));
                } else {
                    alert('Lỗi tải danh sách: ' + xhr.statusText);
                }
            }
        });
    }

    /* ===== 3. KHỞI TẠO BỘ LỌC CỘT & PHÂN TRANG LEGO ===== */
    if (window.AppFilter) {
        colToggler = AppFilter.initColumnToggle({
            storageKey: 'kp_cols_tra_hang_nhap',
            defaultCols: DEFAULT_COLS,
            menuSelector: '#colMenu',
            tableSelector: '#receiptTable'
        });

        if (typeof AppFilter.initDateFilter === 'function') {
            AppFilter.initDateFilter('date', function (from, to, text, val) {
                if (val === 'CUSTOM') {
                    F.mode = 'custom';
                    F.preset = 'CUSTOM';
                    F.from = from || null;
                    F.to = to || null;
                } else {
                    F.mode = 'preset';
                    F.preset = val || 'ALL';
                    F.from = null;
                    F.to = null;
                }
                F.page = 1;
                paintFilters();
                fetchTable();
            });
        }

        if (typeof AppFilter.initSidebar === 'function') {
            AppFilter.initSidebar({
                containerSelector: '#kpContainer',
                btnToggleSelector: '#btnToggleSidebar',
                iconSelector: '#sidebarToggleIcon',
                mobileBtnSelector: '#btnMobileFilter',
                mobileCloseSelector: '#btnCloseSidebarMobile',
                backdropSelector: '#sidebarBackdrop',
                sidebarColSelector: '#sidebarFilterCol',
                storageKey: 'kp_sidebar_tra_hang_nhap'
            });
        }
    }

    /* ===== 4. LẮNG NGHE SỰ KIỆN TRÊN SIDEBAR ===== */
    // Trạng thái checkbox
    $(document).on('change', '.kp-status-filter-block input[data-s]', function () {
        const val = $(this).data('s');
        if (this.checked) {
            if (!F.statuses.includes(val)) F.statuses.push(val);
        } else {
            F.statuses = F.statuses.filter(s => s !== val);
        }
        F.page = 1;
        paintFilters();
        fetchTable();
    });

    // Khởi tạo các Multi-select Lego từ DOM
    setupMultiSelectDropdown('#boxNguoiTao', '#dropdownNguoiTao', F.creatorIds, F.creatorNames, renderCreatorMultiSelect);
    setupMultiSelectDropdown('#boxNguoiTra', '#dropdownNguoiTra', F.payerIds, F.payerNames, renderPayerMultiSelect);
    setupMultiSelectDropdown('#boxNhaCungCap', '#dropdownNhaCungCap', F.nccIds, F.nccNames, renderNccMultiSelect);

    // Đọc các giá trị pre-selected nếu có
    $('#dropdownNguoiTao .kp-ms-item.selected, #dropdownNguoiTao .kp-ms-item input:checked').each(function () {
        const val = parseInt($(this).closest('.kp-ms-item').data('val'), 10);
        if (!isNaN(val) && !F.creatorIds.includes(val)) F.creatorIds.push(val);
    });
    $('#dropdownNguoiTra .kp-ms-item.selected, #dropdownNguoiTra .kp-ms-item input:checked').each(function () {
        const val = parseInt($(this).closest('.kp-ms-item').data('val'), 10);
        if (!isNaN(val) && !F.payerIds.includes(val)) F.payerIds.push(val);
    });
    $('#dropdownNhaCungCap .kp-ms-item.selected, #dropdownNhaCungCap .kp-ms-item input:checked').each(function () {
        const val = parseInt($(this).closest('.kp-ms-item').data('val'), 10);
        if (!isNaN(val) && !F.nccIds.includes(val)) F.nccIds.push(val);
    });

    // Vẽ lại trạng thái ban đầu của multi-selects
    renderCreatorMultiSelect();
    renderPayerMultiSelect();
    renderNccMultiSelect();

    // Tìm kiếm ô input
    let searchDebounce;
    $('#keywordSearch').on('input', function () {
        clearTimeout(searchDebounce);
        F.q = $(this).val()?.trim() || '';
        searchDebounce = setTimeout(function () {
            F.page = 1;
            fetchTable();
        }, 350);
    });

    // Nút tìm kiếm nâng cao (Popup)
    $('#btnAdvSearch').on('click', function (e) {
        e.stopPropagation();
        $('#advbox').toggle();
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('.kp-multiselect-box, .kp-ms-dropdown').length) {
            $('.kp-ms-dropdown').removeClass('show drop-up').css('max-height', '');
            $('.kp-multiselect-box').removeClass('open');
        }
        if (!$(e.target).closest('#advbox, #btnAdvSearch').length) {
            $('#advbox').hide();
        }
    });

    $('#btnAdvApply').on('click', function () {
        F.advSup = $('#advSup').val()?.trim() || '';
        F.advProd = $('#advProd').val()?.trim() || '';
        $('#advbox').hide();
        F.page = 1;
        fetchTable();
    });

    $('#btnAdvReset').on('click', function () {
        $('#advSup').val('');
        $('#advProd').val('');
        F.advSup = '';
        F.advProd = '';
        $('#advbox').hide();
        F.page = 1;
        fetchTable();
    });

    // Tải lại bảng
    $('#btnReloadTable').on('click', function () {
        fetchTable();
        if (window.AppToast) AppToast.info('Đã làm mới dữ liệu.');
    });

    // Xuất Excel
    $('#btnExportExcel').on('click', function () {
        const url = `${exportUrl}?Q=${encodeURIComponent(F.q)}&AdvSup=${encodeURIComponent(F.advSup)}&AdvProd=${encodeURIComponent(F.advProd)}&DateFilterType=${F.mode === 'preset' ? F.preset : 'CUSTOM'}&FromDate=${F.from || ''}&ToDate=${F.to || ''}&Statuses=${F.statuses.join('&Statuses=')}&NccIds=${F.nccIds.join('&NccIds=')}&CreatorIds=${F.creatorIds.join('&CreatorIds=')}&PayerIds=${F.payerIds.join('&PayerIds=')}&DaDanhDau=${F.daDanhDau}`;
        window.location.href = url;
    });

    // Hover buffer chống flicker nút toggle sidebar
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

    // Reset bộ lọc khi nhấn vào empty state
    $(document).on('click', '#resetF', function (e) {
        e.preventDefault();
        F.q = '';
        $('#keywordSearch').val('');
        F.advSup = '';
        $('#advSup').val('');
        F.advProd = '';
        $('#advProd').val('');
        F.mode = 'preset';
        F.preset = 'ALL';
        F.from = null;
        F.to = null;
        F.statuses = ['NHAP', 'DA_TRA_HANG'];
        F.creatorIds = [];
        F.payerIds = [];
        F.nccIds = [];
        F.daDanhDau = false;
        F.page = 1;
        paintFilters();
        fetchTable();
    });

    // Phân trang
    $(document).on('click', '#tableContainer .pagination a.page-link', function (e) {
        e.preventDefault();
        const pg = parseInt($(this).data('page') || $(this).text(), 10);
        if (pg && pg > 0 && pg !== F.page) {
            F.page = pg;
            fetchTable();
        }
    });

    $(document).on('change', '#tableContainer select.kp-page-size-select', function () {
        F.size = parseInt($(this).val(), 10) || 15;
        F.page = 1;
        fetchTable();
    });

    /* ===== 5. SẮP XẾP CỘT 3 TRẠNG THÁI ===== */
    $(document).on('click', '#receiptTable thead th.sortable-th', function () {
        const col = $(this).data('col');
        if (!col) return;

        let newDir = 'asc';
        if (F.sortBy === col) {
            if (F.sortDir === 'asc') newDir = 'desc';
            else if (F.sortDir === 'desc') newDir = '';
        }

        F.sortBy = newDir ? col : '';
        F.sortDir = newDir;
        F.page = 1;
        fetchTable();
    });

    /* ===== 6. MỞ / ĐÓNG CHI TIẾT DÒNG INLINE (ACCORDION DRAWER CHUYỂN ĐỘNG MƯỢT NHƯ NHÀ CUNG CẤP & chuyên nghiệp) ===== */
    let returnRowDetailHandler = null;

    function initRowDetail() {
        if (window.AppFilter && typeof window.AppFilter.initRowDetail === 'function') {
            returnRowDetailHandler = window.AppFilter.initRowDetail({
                tableSelector: '#receiptTable',
                rowSelector: 'tr.product-row, tr.tbl-row',
                detailRowSelector: '#detail-row-{id}',
                wrapSelector: '.product-detail-panel-wrap',
                tabBtnSelector: '.product-detail-tab-btn, .dp-tabs span',
                tabPaneSelector: '.tab-pane-content, .tab-pane',
                excludeClickSelector: 'input, button, a, label, .cell-checkbox, .cell-star, .star-btn',
                slideDuration: 150,
                fadeDuration: 120,
                autoCenter: false,
                onOpen: function (id) {
                    F.openId = id;
                },
                onClose: function () {
                    F.openId = null;
                }
            });
        }
    }

    initRowDetail();

    // Lọc con bên trong drawer
    $(document).on('input', '.detail-row .fl-code, .detail-row .fl-name', function () {
        const $panel = $(this).closest('.detail-panel-inline');
        const codeFilter = $panel.find('.fl-code').val().trim().toLowerCase();
        const nameFilter = $panel.find('.fl-name').val().trim().toLowerCase();

        $panel.find('tbody tr.dtl-item-row').each(function () {
            const rowCode = $(this).data('code') || '';
            const rowName = $(this).data('name') || '';
            const match = rowCode.includes(codeFilter) && rowName.includes(nameFilter);
            $(this).toggle(match);
        });
    });

    // Lưu nhanh ghi chú, người trả, ngày trả
    $(document).on('click', '.btn-quick-save-note, .btn-save-note', function () {
        const $btn = $(this);
        const id = $btn.data('id');
        const $row = $(`#detail-row-${id}`);
        const note = $row.find('.dp-note').val() || '';
        const payerId = $row.find('.inp-payer').val();
        const returnDate = $row.find('.inp-date').val();

        const token = $('input[name="__RequestVerificationToken"]').val();

        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Lưu');

        $.ajax({
            url: saveNoteUrl,
            type: 'POST',
            contentType: 'application/json',
            headers: { 'RequestVerificationToken': token },
            data: JSON.stringify({
                MaPhieuTraHang: id,
                GhiChu: note,
                MaNvtra: payerId ? parseInt(payerId, 10) : null,
                NgayTra: returnDate || null
            }),
            success: function (res) {
                $btn.prop('disabled', false).html(originalHtml);
                if (window.AppToast) AppToast.success(res.message || 'Đã lưu thông tin phiếu.');
                
                // Cập nhật DOM trên dòng bảng cha mà không reload bảng (không sập drawer)
                const $parentRow = $(`tr.tbl-row[data-id="${id}"], tr[data-id="${id}"]`);
                if ($parentRow.length) {
                    const $noteCol = $parentRow.find('[data-col="ghi"]');
                    if ($noteCol.length) {
                        $noteCol.text(note.trim() ? note.trim() : '---').attr('title', note.trim());
                    }
                    if (res.tenNguoiTra) {
                        const $payerCol = $parentRow.find('[data-col="nguoitra"]');
                        if ($payerCol.length) $payerCol.text(res.tenNguoiTra);
                    }
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', false).html(originalHtml);
                const msg = xhr.responseJSON?.message || 'Lỗi khi lưu thông tin.';
                if (window.AppToast) AppToast.error(msg);
                else alert(msg);
            }
        });
    });

    // Hủy phiếu trả hàng
    $(document).on('click', '.btn-cancel-return', function () {
        const id = $(this).data('id');
        const code = $(this).data('code');
        const status = $(this).data('status');

        const isDraft = status === 'NHAP' || status === 'PHIEU_TAM';
        const msg = isDraft
            ? `Hủy phiếu tạm <b>${code}</b>? Tồn kho và công nợ không bị ảnh hưởng.`
            : `Hủy phiếu đã trả hàng <b>${code}</b> sẽ hoàn trả số lượng hàng vào kho và khôi phục công nợ NCC. Tiếp tục?`;

        if (!confirm(msg.replace(/<[^>]+>/g, ''))) return;

        const token = $('input[name="__RequestVerificationToken"]').val();

        $.ajax({
            url: cancelUrl + '?id=' + id,
            type: 'POST',
            headers: { 'RequestVerificationToken': token },
            success: function (res) {
                if (window.AppToast) AppToast.success(res.message || 'Đã hủy phiếu.');
                F.openId = null;
                fetchTable();
            },
            error: function (xhr) {
                const err = xhr.responseJSON?.message || 'Không thể hủy phiếu.';
                if (window.AppToast) AppToast.error(err);
                else alert(err);
            }
        });
    });

    // Toggle sao
    window.toggleFavoriteReceipt = function (e, id, el) {
        e.stopPropagation();
        $.ajax({
            url: toggleStarUrl,
            type: 'POST',
            data: { id: id },
            success: function (res) {
                if (res.success) {
                    const $star = $(el).find('.star-btn');
                    $star.toggleClass('starred', res.isFavorite);
                    $star.find('i').attr('class', res.isFavorite ? 'bi bi-star-fill' : 'bi bi-star');
                }
            }
        });
    };

    window.toggleStarHeaderFilter = function (e) {
        e.stopPropagation();
        F.daDanhDau = !F.daDanhDau;
        F.page = 1;
        paintFilters();
        fetchTable();
    };

    // Phím tắt toàn cục
    $(document).on('keydown', function (e) {
        if (e.key === 'F3') {
            e.preventDefault();
            $('#keywordSearch').focus().select();
        } else if (e.key === 'F4') {
            e.preventDefault();
            $('#btnToggleSidebar').trigger('click');
        }
    });

    // Checkbox chọn tất cả
    $(document).on('change', '#selectAllRows', function () {
        const checked = this.checked;
        $('#receiptTable tbody input.row-select').prop('checked', checked);
    });

    paintFilters();
});
