/**
 * chuyen-kho-index.js - Điều khiển giao diện Danh sách Chuyển kho chuẩn chuyên nghiệp
 * Tái sử dụng KiotFilter.createListPage (Lego Engine)
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

    // Đọc trạng thái checkbox ban đầu
    const initialStatuses = [];
    $('#side input[type="checkbox"][value]:checked').each(function () {
        initialStatuses.push($(this).val());
    });

    // Khởi tạo trang bằng KiotFilter.createListPage
    const listPage = (window.KiotFilter && typeof KiotFilter.createListPage === 'function')
        ? KiotFilter.createListPage({
            containerSelector: '#kiotContainer',
            tableSelector: '#transferTable',
            tableWrapperSelector: '#tableContainer',
            searchInputSelector: '#keywordSearch',
            storageKeyCols: 'kiot_chuyen_kho_cols_v2',
            defaultCols: { maphieu: 1, ngaylap: 1, khonguon: 1, khodich: 1, ngaychuyen: 1, ngaynhan: 1, slchuyen: 1, slnhan: 1, giatri: 1, ghi: 1, st: 1 },
            extraColsCount: 2,
            initialState: {
                dir: $('input[name="filterDir"]:checked').val() || 'all',
                statuses: initialStatuses.length ? initialStatuses : ['NHAP', 'DA_XUAT', 'DA_NHAN'],
                preset: 'thangnay'
            },
            dateFilterId: 'date',
            rowDetailOptions: {
                wrapSelector: '.product-detail-panel-wrap',
                tabBtnSelector: '.product-detail-tab-btn, .dp-tab',
                tabPaneSelector: '.tab-pane-content, .tab-pane'
            },
            buildParams: function (params, state) {
                params.append('Dir', state.dir || 'all');
            },
            onPaintFilters: function (state) {
                $('#dDir').toggleClass('on', state.dir !== 'all' && currentWh !== 0);
                const defaultSt = ['NHAP', 'DA_XUAT', 'DA_NHAN'];
                const isStModified = state.statuses.length !== defaultSt.length || !defaultSt.every(s => state.statuses.includes(s));
                $('#dSt').toggleClass('on', isStModified);
            }
        })
        : null;

    const F = listPage ? listPage.state : {};
    const loadTable = listPage ? listPage.loadTable : function () {};

    // Bắt sự kiện lọc hướng chuyển
    $(document).on('change', 'input[name="filterDir"]', function () {
        F.dir = $(this).val();
        listPage ? listPage.reload(true) : loadTable();
    });

    // Bắt sự kiện lọc trạng thái checkbox
    $(document).on('change', '#side input[type="checkbox"][value]', function () {
        const checked = [];
        $('#side input[type="checkbox"][value]:checked').each(function () {
            checked.push($(this).val());
        });
        F.statuses = checked;
        listPage ? listPage.reload(true) : loadTable();
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
        F.sortBy = '';
        F.sortDir = '';
        listPage ? listPage.reload(true) : loadTable();
    });

    // Lưu nhanh ghi chú trong Drawer
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
                if (res && res.success && window.KiotToast) {
                    KiotToast.success(res.message || 'Đã lưu ghi chú.');
                }
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.message || 'Không thể lưu ghi chú.';
                if (window.KiotToast) KiotToast.error(msg);
            }
        });
    });

    // Hủy phiếu chuyển (Phiếu tạm hoặc Đang chuyển)
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
                } else if (window.KiotToast) {
                    KiotToast.error(res?.message || 'Không thể hủy phiếu.');
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

    // Chuyển hàng từ Drawer (Đối với phiếu tạm)
    $(document).on('click', '.btn-send-transfer', function () {
        const id = $(this).data('id');
        window.location.href = `/ChuyenKho/Edit/${id}`;
    });

    // Mở Modal Nhận hàng
    $(document).on('click', '.btn-open-receive', function () {
        const id = $(this).data('id');
        const code = $(this).data('code') || ('#' + id);
        const fromName = $(this).data('from') || 'kho gửi';
        const $detailRow = $(`#dtl-${id}`);
        const lines = [];

        $detailRow.find('.dtl-tbl tr.dtl-line-row').each(function () {
            const $tr = $(this);
            const hangId = Number($tr.data('hang-id')) || Number($tr.find('td:eq(0)').data('id')) || 0;
            const codeText = $tr.data('code') || $tr.find('td:eq(0)').text().trim();
            const nameText = $tr.data('name') || $tr.find('td:eq(1)').text().trim();
            const qty = Number($tr.data('qty')) || Number($tr.find('td:eq(3)').text().trim().replace(/\D/g, '')) || 0;

            if (codeText && qty > 0) {
                lines.push({ id: hangId, code: codeText, name: nameText, qty: qty });
            }
        });

        if (typeof window.openReceiveModal === 'function') {
            window.openReceiveModal(id, code, fromName, lines, function () {
                loadTable();
            });
        }
    });

    // Xuất file Excel danh sách
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

    // Checkbox chọn tất cả các dòng
    $(document).on('change', '#selectAllRows', function () {
        $('.row-select').prop('checked', $(this).is(':checked'));
    });

    $(document).on('change', '.row-select', function () {
        const allCount = $('.row-select').length;
        const checkedCount = $('.row-select:checked').length;
        $('#selectAllRows').prop('checked', allCount > 0 && allCount === checkedCount);
    });

    // Tìm kiếm nhanh hàng hóa bên trong dòng chi tiết phiếu chuyển
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

    // Cập nhật giao diện lọc ban đầu
    listPage?.paintFilters();

})(jQuery);
