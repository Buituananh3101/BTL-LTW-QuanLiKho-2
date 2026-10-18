/**
 * chuyen-kho-index.js - Điều khiển giao diện Danh sách Chuyển kho chuẩn KiotViet
 */
(function ($) {
    'use strict';

    const $container = $('#kiotContainer');
    if (!$container.length) return;

    const urls = {
        filter: $container.data('filter-url') || '/ChuyenKho/Filter',
        toggleStar: $container.data('toggle-star-url') || '/ChuyenKho/ToggleFavorite',
        cancel: $container.data('cancel-url') || '/ChuyenKho/Cancel',
        saveNote: $container.data('save-note-url') || '/ChuyenKho/SaveNote',
        export: $container.data('export-url') || '/ChuyenKho/Export',
        receive: $container.data('receive-url') || '/ChuyenKho/Receive',
        save: '/ChuyenKho/Save'
    };

    const currentWh = Number($container.data('current-wh')) || 0;

    // Đối tượng trạng thái lọc tập trung
    const F = {
        q: $('#keywordSearch').val() || '',
        dir: $('input[name="filterDir"]:checked').val() || 'all',
        statuses: ['NHAP', 'DA_XUAT', 'DA_NHAN'],
        preset: 'thangnay',
        fromDate: null,
        toDate: null,
        starred: $container.data('is-starred') === true || $container.data('is-starred') === 'true',
        sortBy: $container.data('sort-by') || null,
        sortDir: $container.data('sort-dir') || null,
        page: 1,
        pageSize: 15,
        openId: null
    };

    // Đọc trạng thái checkbox ban đầu
    function syncInitialStatuses() {
        const checked = [];
        $('#side input[type="checkbox"][value]').each(function () {
            if ($(this).is(':checked')) {
                checked.push($(this).val());
            }
        });
        if (checked.length) {
            F.statuses = checked;
        }
    }
    syncInitialStatuses();

    // Quản lý hiển thị cột (KiotFilter.initColumnToggle)
    let chuyenKhoColumnToggler = null;

    function initColumnToggle() {
        if (!window.KiotFilter || typeof KiotFilter.initColumnToggle !== 'function') return;
        chuyenKhoColumnToggler = KiotFilter.initColumnToggle({
            menuSelector: '#colMenu',
            tableSelector: '#transferTable',
            storageKey: 'kiot_chuyen_kho_cols_v2',
            defaultCols: { maphieu: 1, ngaylap: 1, khonguon: 1, khodich: 1, ngaychuyen: 1, ngaynhan: 1, slchuyen: 1, slnhan: 1, giatri: 1, ghi: 1, st: 1 },
            extraColsCount: 2 // 1 chk + 1 star
        });
    }

    function applyColumnVisibility() {
        if (chuyenKhoColumnToggler && typeof chuyenKhoColumnToggler.apply === 'function') {
            chuyenKhoColumnToggler.apply();
        }
    }

    // Quản lý Accordion Drawer Master-Detail
    let transferRowDetailHandler = null;

    function initRowDetail() {
        if (window.KiotFilter && typeof KiotFilter.initRowDetail === 'function') {
            transferRowDetailHandler = KiotFilter.initRowDetail({
                tableSelector: '#transferTable',
                rowSelector: 'tr.product-row, tr.tbl-row',
                detailRowSelector: '#dtl-{id}',
                wrapSelector: '.product-detail-panel-wrap',
                tabBtnSelector: '.dp-tab',
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

    // 1. Khởi tạo các khối LEGO giao diện
    function initLegoComponents() {
        if (window.KiotFilter) {
            initColumnToggle();
            applyColumnVisibility();

            // Sidebar F4
            if (typeof KiotFilter.initSidebar === 'function') {
                KiotFilter.initSidebar({
                    containerSelector: '#kiotContainer',
                    sidebarSelector: '#sidebarFilterCol',
                    toggleBtnSelector: '#btnToggleSidebar',
                    mobileBtnSelector: '#btnMobileFilter',
                    closeMobileBtnSelector: '#btnCloseSidebarMobile',
                    backdropSelector: '#sidebarBackdrop'
                });
            }

            // Bộ lọc ngày
            if (typeof KiotFilter.initDateFilter === 'function') {
                KiotFilter.initDateFilter('date', function (range) {
                    F.preset = range.preset || '';
                    F.fromDate = range.fromDate || null;
                    F.toDate = range.toDate || null;
                    F.page = 1;
                    loadTable();
                });
            }

            // Master-Detail viền xanh chữ nhật
            initRowDetail();
        }
    }

    // 2. Tải lại bảng dữ liệu qua AJAX
    let loadTimer = null;
    function loadTable() {
        clearTimeout(loadTimer);
        const params = {
            Q: F.q,
            Dir: F.dir,
            Statuses: F.statuses,
            DateFilterType: F.preset,
            FromDate: F.fromDate,
            ToDate: F.toDate,
            DaDanhDau: F.starred,
            SortBy: F.sortBy || '',
            SortDir: F.sortDir || '',
            Page: F.page,
            PageSize: F.pageSize
        };

        $('#tableContainer').css('opacity', '0.6');

        $.ajax({
            url: urls.filter,
            type: 'GET',
            data: $.param(params, true),
            success: function (html) {
                $('#tableContainer').html(html).css('opacity', '1');
                applyColumnVisibility();
                paintFilters();
                initRowDetail();

                if (F.openId && transferRowDetailHandler && typeof transferRowDetailHandler.expand === 'function') {
                    transferRowDetailHandler.expand(F.openId);
                }
            },
            error: function (xhr) {
                $('#tableContainer').css('opacity', '1');
                if (window.KiotToast) {
                    KiotToast.error('Không thể tải dữ liệu bảng chuyển kho.');
                }
            }
        });
    }

    // 3. Cập nhật các chấm cam chỉ thị bộ lọc
    function paintFilters() {
        $('#dDir').toggleClass('on', F.dir !== 'all' && currentWh !== 0);
        const defaultSt = ['NHAP', 'DA_XUAT', 'DA_NHAN'];
        const isStModified = F.statuses.length !== defaultSt.length || !defaultSt.every(s => F.statuses.includes(s));
        $('#dSt').toggleClass('on', isStModified);
    }

    // 4. Bắt sự kiện lọc hướng chuyển
    $(document).on('change', 'input[name="filterDir"]', function () {
        F.dir = $(this).val();
        F.page = 1;
        loadTable();
    });

    // 5. Bắt sự kiện lọc trạng thái checkbox
    $(document).on('change', '#side input[type="checkbox"][value]', function () {
        const checked = [];
        $('#side input[type="checkbox"][value]').each(function () {
            if ($(this).is(':checked')) {
                checked.push($(this).val());
            }
        });
        F.statuses = checked;
        F.page = 1;
        loadTable();
    });

    // 6. Tìm kiếm từ khóa F3 (Debounce 350ms)
    let searchTimer = null;
    $(document).on('input', '#keywordSearch', function () {
        clearTimeout(searchTimer);
        const val = $(this).val();
        searchTimer = setTimeout(function () {
            F.q = val;
            F.page = 1;
            loadTable();
        }, 350);
    });

    // Phím tắt F3 focus ô tìm kiếm
    $(document).on('keydown', function (e) {
        if (e.key === 'F3') {
            e.preventDefault();
            const $inp = $('#keywordSearch');
            $inp.focus().select();
        }
    });

    // 7. Sắp xếp 3 trạng thái cột (Tăng -> Giảm -> Bình thường)
    $(document).on('click', '#transferTable thead th.sortable-th', function (e) {
        e.preventDefault();
        const col = $(this).data('col');
        if (!col) return;

        if (F.sortBy === col) {
            if (F.sortDir === 'asc') {
                F.sortDir = 'desc';
            } else if (F.sortDir === 'desc') {
                F.sortBy = null;
                F.sortDir = null;
            } else {
                F.sortDir = 'asc';
            }
        } else {
            F.sortBy = col;
            F.sortDir = 'asc';
        }
        F.page = 1;
        loadTable();
    });

    // 8. Đánh dấu sao lọc trên Header
    window.toggleStarHeaderFilter = function (e) {
        e.stopPropagation();
        F.starred = !F.starred;
        F.page = 1;
        loadTable();
    };

    // Đánh dấu sao trên từng dòng (silent toggle)
    window.toggleFavoriteTransfer = function (e, id, el) {
        e.stopPropagation();
        const $star = $(el).find('.star-btn');
        $.post(urls.toggleStar, { id: id }, function (res) {
            if (res && res.success) {
                if (res.isFavorite) {
                    $star.addClass('starred').find('i').removeClass('bi-star').addClass('bi-star-fill');
                } else {
                    $star.removeClass('starred').find('i').removeClass('bi-star-fill').addClass('bi-star');
                }
            }
        });
    };

    // 9. Phân trang & Đổi số dòng
    $(document).on('click', '.pagination .page-link[data-page]', function (e) {
        e.preventDefault();
        const p = parseInt($(this).data('page'));
        if (!isNaN(p) && p !== F.page) {
            F.page = p;
            loadTable();
        }
    });

    $(document).on('change', '#pageSizeSelect, select[name="pageSize"]', function () {
        F.pageSize = parseInt($(this).val()) || 15;
        F.page = 1;
        loadTable();
    });

    // Nút Xóa bộ lọc khi rỗng
    $(document).on('click', '#resetF', function (e) {
        e.preventDefault();
        F.q = '';
        $('#keywordSearch').val('');
        F.dir = 'all';
        $('input[name="filterDir"][value="all"]').prop('checked', true);
        F.statuses = ['NHAP', 'DA_XUAT', 'DA_NHAN'];
        $('#side input[type="checkbox"][value]').each(function () {
            $(this).prop('checked', F.statuses.includes($(this).val()));
        });
        F.starred = false;
        F.sortBy = null;
        F.sortDir = null;
        F.page = 1;
        loadTable();
    });

    // 10. Lưu nhanh ghi chú trong Drawer
    $(document).on('click', '.btn-save-note', function () {
        const id = $(this).data('id');
        const $panel = $(this).closest('.product-detail-panel');
        const note = $panel.find('.dp-note').val();

        $.ajax({
            url: urls.saveNote,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ MaPhieuChuyen: id, GhiChu: note }),
            success: function (res) {
                if (res && res.success) {
                    if (window.KiotToast) KiotToast.success(res.message || 'Đã lưu ghi chú.');
                }
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.message || 'Không thể lưu ghi chú.';
                if (window.KiotToast) KiotToast.error(msg);
            }
        });
    });

    // 11. Hủy phiếu chuyển (Phiếu tạm hoặc Đang chuyển)
    $(document).on('click', '.btn-cancel-transfer', function () {
        const id = $(this).data('id');
        const code = $(this).data('code') || ('#' + id);
        const status = $(this).data('status');

        let msg = `Hủy phiếu tạm <b>${code}</b>? Tồn kho không bị ảnh hưởng.`;
        if (status === 'DA_XUAT') {
            msg = `Hàng của phiếu <b>${code}</b> chưa được kho nhận. Hủy phiếu sẽ <b>cộng trả</b> toàn bộ số lượng về tồn kho gửi. Bạn có chắc chắn muốn hủy?`;
        }

        const doCancel = function () {
            $.post(urls.cancel, { id: id }, function (res) {
                if (res && res.success) {
                    if (window.KiotToast) KiotToast.success(res.message);
                    loadTable();
                } else {
                    if (window.KiotToast) KiotToast.error(res?.message || 'Không thể hủy phiếu.');
                }
            }).fail(function (xhr) {
                const m = xhr.responseJSON?.message || 'Đã xảy ra lỗi khi hủy phiếu.';
                if (window.KiotToast) KiotToast.error(m);
            });
        };

        if (window.KiotConfirm && typeof KiotConfirm.show === 'function') {
            KiotConfirm.show({
                title: 'Hủy phiếu chuyển hàng',
                message: msg,
                confirmText: 'Hủy phiếu',
                confirmClass: 'btn-danger',
                onConfirm: doCancel
            });
        } else if (confirm(`Bạn có chắc muốn hủy phiếu ${code}?`)) {
            doCancel();
        }
    });

    // 12. Chuyển hàng từ Drawer (Đối với phiếu tạm)
    $(document).on('click', '.btn-send-transfer', function () {
        const id = $(this).data('id');
        const code = $(this).data('code') || ('#' + id);

        const doSend = function () {
            // Đọc các dòng chi tiết từ bảng hiển thị trong drawer
            const $panel = $(`#dtl-${id}`);
            const lines = [];
            // Chuyển hướng sang trang Edit để chuyển hoặc gọi API trực tiếp
            window.location.href = `/ChuyenKho/Edit/${id}`;
        };

        doSend();
    });

    // 13. Mở Modal Nhận hàng
    $(document).on('click', '.btn-open-receive', function () {
        const id = $(this).data('id');
        const code = $(this).data('code') || ('#' + id);
        const fromName = $(this).data('from') || 'kho gửi';

        // Lấy chi tiết từ bảng trong drawer
        const $detailRow = $(`#dtl-${id}`);
        const lines = [];

        $detailRow.find('.dtl-tbl tr.dtl-line-row').each(function () {
            const $tr = $(this);
            const hangId = Number($tr.data('hang-id')) || Number($tr.find('td:eq(0)').data('id')) || 0;
            const codeText = $tr.data('code') || $tr.find('td:eq(0)').text().trim();
            const nameText = $tr.data('name') || $tr.find('td:eq(1)').text().trim();
            const qty = Number($tr.data('qty')) || Number($tr.find('td:eq(3)').text().trim().replace(/\D/g, '')) || 0;

            if (codeText && qty > 0) {
                lines.push({
                    id: hangId,
                    code: codeText,
                    name: nameText,
                    qty: qty
                });
            }
        });

        if (typeof window.openReceiveModal === 'function') {
            window.openReceiveModal(id, code, fromName, lines, function () {
                loadTable();
            });
        }
    });

    // 14. Xuất file Excel danh sách
    $(document).on('click', '#btnExpList', function () {
        const params = {
            Q: F.q,
            Dir: F.dir,
            Statuses: F.statuses,
            DateFilterType: F.preset,
            FromDate: F.fromDate,
            ToDate: F.toDate,
            DaDanhDau: F.starred
        };
        window.location.href = urls.export + '?' + $.param(params, true);
    });

    // 15. Checkbox chọn tất cả các dòng
    $(document).on('change', '#selectAllRows', function () {
        $('.row-select').prop('checked', $(this).is(':checked'));
    });

    $(document).on('change', '.row-select', function () {
        const allCount = $('.row-select').length;
        const checkedCount = $('.row-select:checked').length;
        $('#selectAllRows').prop('checked', allCount > 0 && allCount === checkedCount);
    });

    // 16. Tìm kiếm nhanh hàng hóa bên trong dòng chi tiết phiếu chuyển
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

    // Khởi tạo ban đầu
    initLegoComponents();
    paintFilters();

})(jQuery);
