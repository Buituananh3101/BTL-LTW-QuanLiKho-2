/**
 * nha-cung-cap-index.js - Quản lý tương tác màn hình Danh sách Nhà cung cấp
 * Chuẩn hóa 100% theo quy chuẩn LEGO KiotViet và Rule 10 (AGENTS.md)
 */

(function ($) {
    'use strict';

    // 1. Trạng thái bộ lọc toàn cục
    const state = {
        q: '',
        nhom: [],
        tongMuaTu: null,
        tongMuaDen: null,
        thoiGian: 'ALL',
        fromDate: null,
        toDate: null,
        noTu: null,
        noDen: null,
        trangThai: 'HOAT_DONG',
        sortBy: $('#kiotContainer').data('sort-by') || '',
        sortDir: $('#kiotContainer').data('sort-dir') || '',
        page: 1,
        pageSize: 15,
        expandedId: null
    };

    const escapeHtml = KiotFilter.escapeHtml || function (s) {
        if (!s) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    /* ==========================================================================
       2. TẢI VÀ NẠP DỮ LIỆU BẢNG BẰNG AJAX
       ========================================================================== */
    function loadTable() {
        const params = new URLSearchParams();

        if (state.q.trim()) params.append('Q', state.q.trim());
        if (state.nhom && state.nhom.length > 0) {
            params.append('NhomNcc', state.nhom.map(x => x.val).join(','));
        }
        if (state.tongMuaTu !== null && state.tongMuaTu !== undefined) {
            params.append('TongMuaTu', state.tongMuaTu);
        }
        if (state.tongMuaDen !== null && state.tongMuaDen !== undefined) {
            params.append('TongMuaDen', state.tongMuaDen);
        }
        if (state.noTu !== null && state.noTu !== undefined) {
            params.append('NoTu', state.noTu);
        }
        if (state.noDen !== null && state.noDen !== undefined) {
            params.append('NoDen', state.noDen);
        }
        if (state.trangThai) {
            params.append('TrangThai', state.trangThai);
        }
        if (state.thoiGian) {
            params.append('ThoiGian', state.thoiGian);
            if (state.fromDate) params.append('FromDate', state.fromDate);
            if (state.toDate) params.append('ToDate', state.toDate);
        }
        if (state.sortBy) {
            params.append('SortBy', state.sortBy);
            params.append('SortDir', state.sortDir || 'asc');
        }
        params.append('Page', state.page);
        params.append('PageSize', state.pageSize);

        const $container = $('#productTableContainer').length ? $('#productTableContainer') : ($('#tableWrapper').length ? $('#tableWrapper') : $('#tableContainer'));
        $container.css('opacity', '0.6');

        $.ajax({
            url: '/NhaCungCap/Filter?' + params.toString(),
            type: 'GET',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            success: function (html) {
                $container.html(html).css('opacity', '1');
                applyColumnVisibility();
                updateSortIcons();
                bindPaginationEvents();

                // Nếu có dòng đang mở trước đó, khôi phục trạng thái
                if (state.expandedId) {
                    const $row = $(`#supplierTable tr.product-row[data-id="${state.expandedId}"]`);
                    if ($row.length) {
                        expandSupplierRow(state.expandedId, false);
                    } else {
                        state.expandedId = null;
                    }
                }
            },
            error: function () {
                $container.css('opacity', '1');
                if (window.KiotToast) {
                    window.KiotToast.error('Không thể tải danh sách nhà cung cấp.');
                }
            }
        });
    }

    /* ==========================================================================
       3. KHỞI TẠO BỘ LỌC SIDEBAR (5 KHỐI LEGO)
       ========================================================================== */
    function initSidebarFilters() {
        // 3.1. Sidebar Toggle F4 & Mobile Drawer
        KiotFilter.initSidebar({
            containerSelector: '#kiotContainer',
            btnToggleSelector: '#btnToggleSidebar',
            iconSelector: '#sidebarToggleIcon',
            mobileBtnSelector: '#btnMobileFilter',
            mobileCloseSelector: '#btnCloseSidebarMobile',
            backdropSelector: '#sidebarBackdrop',
            sidebarColSelector: '#sidebarFilterCol',
            storageKey: 'kiot_ncc_sidebar_state'
        });

        // 3.2. Khối 1: Nhóm nhà cung cấp (Multi-select)
        const $boxNhom = $('#boxNhomNcc');
        const $ddNhom = $('#dropdownNhomNcc');

        function renderNhomTags() {
            const items = state.nhom || [];
            $('#dotNhomNcc').toggleClass('active', items.length > 0);
            KiotFilter.renderTagPills($boxNhom, items, 'Tất cả các nhóm', 2);
        }

        $boxNhom.on('click', function (e) {
            if ($(e.target).closest('.tag-remove').length) return;
            e.stopPropagation();
            $('.kiot-ms-dropdown, .quick-date-popup, .dual-calendar-popup').not($ddNhom).removeClass('show drop-up');
            KiotFilter.checkSidebarDropdownDirection($boxNhom, $ddNhom);
            $ddNhom.toggleClass('show');
            $boxNhom.toggleClass('open');
            if ($ddNhom.hasClass('show')) {
                $ddNhom.find('.kiot-ms-search input').focus();
            }
        });

        // Xóa tag từ pill
        $boxNhom.on('click', '.tag-remove', function (e) {
            e.stopPropagation();
            const val = String($(this).closest('.kiot-pill-tag').data('val'));
            state.nhom = state.nhom.filter(x => String(x.val) !== val);
            $ddNhom.find(`.kiot-ms-item[data-val="${val}"]`).removeClass('selected').find('input[type="checkbox"]').prop('checked', false);
            renderNhomTags();
            state.page = 1;
            loadTable();
        });

        // Click chọn item trong dropdown
        $ddNhom.on('click', '.kiot-ms-item', function (e) {
            if ($(e.target).closest('.kiot-item-edit-btn').length) return;
            e.stopPropagation();
            const $item = $(this);
            const val = String($item.data('val'));
            const name = $item.data('name') || $item.find('.kiot-ms-text').text().trim();
            const idx = state.nhom.findIndex(x => String(x.val) === val);

            if (idx >= 0) {
                state.nhom.splice(idx, 1);
                $item.removeClass('selected').find('input[type="checkbox"]').prop('checked', false);
            } else {
                state.nhom.push({ val: val, name: name });
                $item.addClass('selected').find('input[type="checkbox"]').prop('checked', true);
            }

            renderNhomTags();
            state.page = 1;
            loadTable();
        });

        // Tìm kiếm con trong dropdown nhóm
        $ddNhom.find('.kiot-ms-search input').on('input', function (e) {
            e.stopPropagation();
            const term = $(this).val().trim().toLowerCase();
            $ddNhom.find('.kiot-ms-item').each(function () {
                const text = ($(this).data('name') || $(this).text()).toLowerCase();
                $(this).toggle(!term || text.includes(term));
            });
        });

        // Nút ✎ sửa / xóa nhóm nhà cung cấp dùng KiotPrompt
        $ddNhom.on('click', '.kiot-item-edit-btn', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const id = $(this).data('id');
            const oldName = $(this).data('name') || $(this).closest('.kiot-ms-item').find('.kiot-ms-text').text().trim();
            handleEditGroupSupplier(id, oldName);
        });

        // Nút "+ Tạo mới" nhóm NCC trên header khối
        $('#btnOpenQuickGroupNcc').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleCreateGroupSupplier();
        });

        // 3.3. Khối 2: Tổng mua (Khoảng giá trị dùng LEGO KiotFilter.initValueFilter)
        KiotFilter.initValueFilter('TongMua', function (tu, den) {
            state.tongMuaTu = tu;
            state.tongMuaDen = den;
            state.page = 1;
            loadTable();
        });

        // 3.4. Khối 3: Thời gian tạo (KiotDateFilter component)
        KiotFilter.initDateFilter('date', function (from, to, text, val) {
            if (val === 'CUSTOM') {
                state.thoiGian = 'CUSTOM';
                state.fromDate = from;
                state.toDate = to;
            } else {
                state.thoiGian = val || 'ALL';
                state.fromDate = null;
                state.toDate = null;
            }
            state.page = 1;
            loadTable();
        });

        // 3.5. Khối 4: Nợ hiện tại (Khoảng giá trị dùng LEGO KiotFilter.initValueFilter)
        KiotFilter.initValueFilter('No', function (tu, den) {
            state.noTu = tu;
            state.noDen = den;
            state.page = 1;
            loadTable();
        });

        // 3.6. Khối 5: Trạng thái (Dạng Pills chuẩn prototype qua LEGO KiotFilter.initStatusFilter)
        KiotFilter.initStatusFilter('#pillsStatus', function (val) {
            if (val === 'all' || val === '') {
                state.trangThai = '';
            } else if (val === 'active' || val === 'HOAT_DONG') {
                state.trangThai = 'HOAT_DONG';
            } else if (val === 'off' || val === 'NGUNG_HOAT_DONG') {
                state.trangThai = 'NGUNG_HOAT_DONG';
            } else {
                state.trangThai = val;
            }

            $('#dotTrangThai').toggleClass('active', state.trangThai !== 'HOAT_DONG');
            state.page = 1;
            loadTable();
        });

        // Đóng các dropdown khi click ra ngoài
        $(document).on('click', function (e) {
            if (!$(e.target).closest('#boxNhomNcc, #dropdownNhomNcc').length) {
                $ddNhom.removeClass('show drop-up');
                $boxNhom.removeClass('open');
            }
        });
    }

    /* ==========================================================================
       4. QUẢN LÝ NHÓM NHÀ CUNG CẤP (QUICK CREATE / EDIT / DELETE)
       ========================================================================== */
    function handleCreateGroupSupplier() {
        if (!window.KiotPrompt) return;
        window.KiotPrompt.open({
            title: 'Tạo mới nhóm nhà cung cấp',
            label: 'Tên nhóm nhà cung cấp',
            value: '',
            showDelete: false,
            onSave: function (name) {
                if (!name || !name.trim()) {
                    showPromptError('Vui lòng nhập tên nhóm nhà cung cấp.');
                    return false;
                }
                $.ajax({
                    url: '/NhaCungCap/CreateGroupQuick',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ tenNhom: name.trim() }),
                    success: function (res) {
                        if (res.success) {
                            window.KiotPrompt.close();
                            if (window.KiotToast) window.KiotToast.success(`Tạo nhóm "${res.tenNhom}" thành công.`);

                            // Bổ sung vào dropdown sidebar
                            const itemHtml = `
                                <div class="kiot-ms-item selected" data-val="${res.maNhomNcc}" data-name="${escapeHtml(res.tenNhom)}">
                                    <input type="checkbox" class="form-check-input" checked />
                                    <span class="kiot-ms-text">${escapeHtml(res.tenNhom)}</span>
                                    <button type="button" class="kiot-item-edit-btn hh-item-edit-btn" data-id="${res.maNhomNcc}" data-name="${escapeHtml(res.tenNhom)}" title="Sửa nhóm">
                                        <i class="bi bi-pencil" style="font-size:12px;pointer-events:none;"></i>
                                    </button>
                                </div>
                            `;
                            $('#dropdownNhomNcc').append(itemHtml);

                            // Bổ sung vào select trong modal tạo/sửa
                            $('#nccMaNhomNcc').append(`<option value="${res.maNhomNcc}" selected>${escapeHtml(res.tenNhom)}</option>`);

                            state.nhom.push({ val: String(res.maNhomNcc), name: res.tenNhom });
                            $('#dotNhomNcc').addClass('active');
                            KiotFilter.renderTagPills($('#boxNhomNcc'), state.nhom, 'Tất cả các nhóm', 2);
                            state.page = 1;
                            loadTable();
                        }
                    },
                    error: function (xhr) {
                        showPromptError(xhr.responseJSON?.message || 'Không thể tạo nhóm.');
                    }
                });
                return false;
            }
        });
    }

    function handleEditGroupSupplier(id, oldName) {
        if (!window.KiotPrompt || !id) return;
        window.KiotPrompt.open({
            title: 'Sửa nhóm nhà cung cấp',
            label: 'Tên nhóm nhà cung cấp',
            value: oldName,
            showDelete: true,
            onSave: function (newName) {
                if (!newName || !newName.trim()) {
                    showPromptError('Vui lòng nhập tên nhóm nhà cung cấp.');
                    return false;
                }
                if (newName.trim().toLowerCase() === oldName.toLowerCase()) {
                    window.KiotPrompt.close();
                    return false;
                }
                $.ajax({
                    url: '/NhaCungCap/UpdateGroupQuick',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ maNhomNcc: parseInt(id), tenNhom: newName.trim() }),
                    success: function (res) {
                        if (res.success) {
                            window.KiotPrompt.close();
                            if (window.KiotToast) window.KiotToast.success(`Đã đổi tên nhóm thành "${res.tenNhom}".`);

                            // Cập nhật dropdown sidebar
                            const $item = $(`#dropdownNhomNcc .kiot-ms-item[data-val="${id}"]`);
                            $item.attr('data-name', res.tenNhom);
                            $item.find('.kiot-ms-text').text(res.tenNhom);
                            $item.find('.kiot-item-edit-btn').attr('data-name', res.tenNhom);

                            // Cập nhật select modal
                            $(`#nccMaNhomNcc option[value="${id}"]`).text(res.tenNhom);

                            // Cập nhật state nếu đang lọc nhóm này
                            const target = state.nhom.find(x => String(x.val) === String(id));
                            if (target) {
                                target.name = res.tenNhom;
                                KiotFilter.renderTagPills($('#boxNhomNcc'), state.nhom, 'Tất cả các nhóm', 2);
                            }
                            loadTable();
                        }
                    },
                    error: function (xhr) {
                        showPromptError(xhr.responseJSON?.message || 'Không thể cập nhật tên nhóm.');
                    }
                });
                return false;
            },
            onDelete: function () {
                $.ajax({
                    url: '/NhaCungCap/DeleteGroupQuick',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ maNhomNcc: parseInt(id) }),
                    success: function (res) {
                        if (res.success) {
                            window.KiotPrompt.close();
                            if (window.KiotToast) window.KiotToast.success(res.message);

                            $(`#dropdownNhomNcc .kiot-ms-item[data-val="${id}"]`).remove();
                            $(`#nccMaNhomNcc option[value="${id}"]`).remove();

                            state.nhom = state.nhom.filter(x => String(x.val) !== String(id));
                            KiotFilter.renderTagPills($('#boxNhomNcc'), state.nhom, 'Tất cả các nhóm', 2);
                            state.page = 1;
                            loadTable();
                        }
                    },
                    error: function (xhr) {
                        showPromptError(xhr.responseJSON?.message || 'Không thể xóa nhóm nhà cung cấp.');
                    }
                });
                return false;
            }
        });
    }

    function showPromptError(msg) {
        const errEl = document.getElementById('kiotPromptErr');
        const inputEl = document.getElementById('kiotPromptInput');
        if (errEl) {
            errEl.textContent = msg;
            errEl.style.display = 'block';
        }
        if (inputEl) inputEl.classList.add('is-invalid');
    }

    /* ==========================================================================
       5. SẮP XẾP CỘT 3 TRẠNG THÁI & ẨN HIỆN CỘT
       ========================================================================== */
    function updateSortIcons() {
        $('#supplierTable thead th.sortable-th').each(function () {
            const col = $(this).data('col');
            let $icon = $(this).find('.sort-icon');
            $(this).removeClass('is-sorted sorted-asc sorted-desc');

            if (state.sortBy === col) {
                $(this).addClass('is-sorted');
                if ($icon.length === 0) {
                    $icon = $('<span class="sort-icon"></span>').appendTo($(this).find('.th-title-wrap'));
                }
                if (state.sortDir === 'asc') {
                    $(this).addClass('sorted-asc');
                    $icon.removeClass('d-none').html('<i class="bi bi-arrow-up"></i>');
                } else if (state.sortDir === 'desc') {
                    $(this).addClass('sorted-desc');
                    $icon.removeClass('d-none').html('<i class="bi bi-arrow-down"></i>');
                }
            } else {
                $icon.remove();
            }
        });
    }

    $(document).on('click', '#supplierTable thead th.sortable-th', function (e) {
        e.preventDefault();
        const col = $(this).data('col');
        if (!col) return;

        if (state.sortBy === col) {
            if (state.sortDir === 'asc') {
                state.sortDir = 'desc';
            } else if (state.sortDir === 'desc') {
                state.sortBy = '';
                state.sortDir = '';
            } else {
                state.sortDir = 'asc';
            }
        } else {
            state.sortBy = col;
            state.sortDir = 'asc';
        }

        state.page = 1;
        loadTable();
    });

    /* ==========================================================================
       5.1. TÙY CHỌN ẨN / HIỆN CỘT (COLUMN VISIBILITY) CHUẨN KIOTVIET
       ========================================================================== */
    const STORAGE_COLS_KEY = 'kiot_ncc_columns_v2';

    const DEFAULT_NCC_COLS = {
        ma: 1,
        ten: 1,
        sdt: 1,
        email: 1,
        nhom: 0,
        diachi: 0,
        masothue: 0,
        no: 1,
        tongmua: 1,
        ghi: 0,
        st: 0,
        ngaytao: 0
    };

    function applyColumnVisibility() {
        const $menu = $('#colMenu');
        if (!$menu.length) return;

        let visibleCols = 1; // 1 cột checkbox luôn hiển thị
        $menu.find('input[data-c]').each(function () {
            const col = $(this).data('c');
            const isChecked = $(this).is(':checked');
            if (isChecked) visibleCols++;
            $(`#supplierTable [data-col="${col}"]`).each(function () {
                this.style.display = isChecked ? '' : 'none';
            });
        });

        // 1. Cập nhật colspan chính xác theo số cột hiển thị để không sinh cột ma
        $('#supplierTable tr.product-detail-row > td').attr('colspan', visibleCols);
        $('#supplierTable tr.empty-row > td, #supplierTable tr:has(.empty) > td').attr('colspan', visibleCols);

        // 2. Gắn class last-visible-col cho ô hiển thị cuối cùng của mỗi dòng để khép kín hình chữ nhật
        $('#supplierTable .last-visible-col').removeClass('last-visible-col');
        $('#supplierTable tr').each(function () {
            $(this).children('th:visible, td:visible').last().addClass('last-visible-col');
        });
    }

    function initColumnToggle() {
        const $menu = $('#colMenu');
        if (!$menu.length) return;

        let savedCols = {};
        try {
            savedCols = JSON.parse(localStorage.getItem(STORAGE_COLS_KEY) || '{}');
        } catch (_) {}

        // Khôi phục trạng thái từ localStorage, fallback sang DEFAULT_NCC_COLS
        $menu.find('input[data-c]').each(function () {
            const col = $(this).data('c');
            if (col) {
                if (savedCols[col] !== undefined) {
                    $(this).prop('checked', savedCols[col] === 1 || savedCols[col] === true);
                } else if (DEFAULT_NCC_COLS[col] !== undefined) {
                    $(this).prop('checked', DEFAULT_NCC_COLS[col] === 1);
                }
            }
        });
        applyColumnVisibility();

        // Lắng nghe sự kiện click/change trên menu cột
        $menu.on('change', 'input[data-c]', function () {
            applyColumnVisibility();
            saveColumnState();
        });

        function saveColumnState() {
            const state = {};
            $menu.find('input[data-c]').each(function () {
                const col = $(this).data('c');
                if (col) {
                    state[col] = $(this).is(':checked') ? 1 : 0;
                }
            });
            localStorage.setItem(STORAGE_COLS_KEY, JSON.stringify(state));
        }
    }

    /* ==========================================================================
       6. MASTER-DETAIL ACCORDION (BUNG DÒNG CHI TIẾT & 3 TABS KHỚP CHUẨN HÀNG HÓA)
       ========================================================================== */
    function expandSupplierRow(id, toggle = true) {
        const $row = $(`#supplierTable tr.product-row[data-id="${id}"]`);
        const $detailRow = $(`#detail-${id}`);
        if (!$row.length || !$detailRow.length) return;

        const $wrap = $detailRow.find('.product-detail-panel-wrap');
        const isCurrentlyOpen = $detailRow.is(':visible');

        // Đóng các dòng chi tiết khác đang mở (hiệu ứng slideUp khớp Hàng hóa)
        $('#supplierTable .product-detail-row').not($detailRow).each(function () {
            const $other = $(this);
            $other.find('.product-detail-panel-wrap').slideUp(150, function () {
                $other.hide();
            });
        });
        $('#supplierTable .product-row').not($row).removeClass('selected');

        if (isCurrentlyOpen) {
            if (toggle) {
                $wrap.slideUp(150, function () {
                    $detailRow.hide();
                });
                $row.removeClass('selected');
                state.expandedId = null;
            }
        } else {
            // Cập nhật colspan và class khép kín viền hình chữ nhật trước khi bung mở
            const visibleCols = $('#supplierTable thead tr:first-child th:visible').length || 1;
            $detailRow.find('> td').attr('colspan', visibleCols);

            $row.children('td').removeClass('last-visible-col');
            $row.children('td:visible').last().addClass('last-visible-col');

            $row.addClass('selected');
            $detailRow.show();
            $wrap.hide().slideDown(150);
            state.expandedId = id;
        }
    }

    // Click dòng bảng để mở chi tiết (trừ checkbox, link, button)
    $(document).on('click', '#supplierTable tr.product-row', function (e) {
        if ($(e.target).closest('input, button, a, label, .cell-checkbox, .w-chk').length) return;
        const id = $(this).data('id');
        if (id) expandSupplierRow(id, true);
    });

    // Chuyển tabs trong Detail Panel (.product-detail-tab-btn khớp Hàng hóa)
    $(document).on('click', '.product-detail-tab-btn', function (e) {
        e.stopPropagation();
        const tabName = $(this).data('tab');
        const $panel = $(this).closest('.product-detail-panel');
        const $detailRow = $(this).closest('.product-detail-row');
        const id = $detailRow.attr('id') ? $detailRow.attr('id').replace('detail-', '') : '';

        $panel.find('.product-detail-tab-btn').removeClass('active');
        $(this).addClass('active');

        $panel.find('.tab-pane-content').hide();
        const $targetPane = $panel.find('.tab-' + tabName);
        $targetPane.fadeIn(120);

        // Nạp AJAX nếu là tab history hoặc debt và chưa nạp dữ liệu
        if ((tabName === 'history' || tabName === 'debt') && id) {
            const $dyn = $targetPane.find('.ncc-dyn-container[data-loaded="0"]');
            if ($dyn.length) {
                $.ajax({
                    url: `/NhaCungCap/GetDetail?id=${id}`,
                    type: 'GET',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    success: function (html) {
                        const $res = $('<div>').html(html);
                        const histHtml = $res.find('.ncc-tab-history').html();
                        const debtHtml = $res.find('.ncc-tab-debt').html();

                        if (histHtml) {
                            $panel.find('.tab-history').html(histHtml);
                        }
                        if (debtHtml) {
                            $panel.find('.tab-debt').html(debtHtml);
                        }
                    },
                    error: function () {
                        $targetPane.html('<div class="p-3 text-center text-danger small">Không thể nạp dữ liệu.</div>');
                    }
                });
            }
        }
    });

    /* ==========================================================================
       7. MODAL THÊM MỚI / CHỈNH SỬA NHÀ CUNG CẤP CHUẨN KIOTVIET (THEO HÀNG HÓA)
       ========================================================================== */
    function showModal(id) {
        $('#' + id).addClass('show');
        $('body').addClass('noscroll');
    }

    function hideModal(id) {
        $('#' + id).removeClass('show');
        if (!$('.hh-ov.show').length) {
            $('body').removeClass('noscroll');
        }
    }

    // Đóng overlay bằng data-close
    $(document).on('click', '[data-close]', function (e) {
        e.preventDefault();
        const targetId = $(this).data('close');
        if (targetId) hideModal(targetId);
    });

    // Đóng modal bằng phím Escape
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            const topModal = ['nccDeleteOv', 'nccEditGroupOv', 'nccPromptOv', 'nccModalOv']
                .map(id => document.getElementById(id))
                .find(el => el && el.classList.contains('show'));
            if (topModal) hideModal(topModal.id);
        }
    });

    // Accordion gập mở trong Modal chuẩn .hh-sec
    $(document).on('click', '.hh-sec-h', function () {
        $(this).closest('.hh-sec').toggleClass('open');
    });

    // 7.1. Custom Combobox Nhóm nhà cung cấp trong Modal
    const nccGroupCombobox = (function () {
        const $wrap = $('#wrapMaNhomNcc');
        const $box = $('#boxMaNhomNcc');
        const $input = $('#inputMaNhomNcc');
        const $dropdown = $('#dropdownMaNhomNcc');
        const $list = $('#listMaNhomNcc');
        const $select = $('#nccMaNhomNcc');
        const $search = $('#searchMaNhomNcc');

        function open() {
            $('.hh-cs-wrap').not($wrap).removeClass('open').find('.hh-cs-dropdown').hide();
            if (window.KiotFilter && window.KiotFilter.checkDropdownDirection && $wrap.length && $box.length && $dropdown.length) {
                window.KiotFilter.checkDropdownDirection($wrap[0], $box[0], $dropdown[0]);
            }
            $wrap.addClass('open');
            $dropdown.show();
            if ($search.length) {
                $search.val('').focus();
                filterItems('');
            }
        }

        function close() {
            $wrap.removeClass('open');
            $dropdown.hide();
        }

        function filterItems(kw) {
            const term = (kw || '').trim().toLowerCase();
            $list.find('.hh-cs-item').each(function () {
                const txt = $(this).find('span').text().toLowerCase();
                $(this).toggle(!term || txt.includes(term));
            });
        }

        function selectVal(val, text) {
            $select.val(val).trigger('change');
            $input.val(text || '');
            $list.find('.hh-cs-item').removeClass('selected').filter(function () {
                return String($(this).data('val')) === String(val);
            }).addClass('selected');
            close();
        }

        function syncFromSelect() {
            const curVal = $select.val();
            $list.empty();
            $select.find('option').each(function () {
                const v = $(this).val();
                if (!v) return;
                const t = $(this).text();
                const isSel = (String(v) === String(curVal));
                const $item = $(`
                    <div class="hh-cs-item ${isSel ? 'selected' : ''}" data-val="${v}">
                        <span>${escapeHtml(t)}</span>
                        <button type="button" class="hh-item-edit-btn" data-type="nhom" data-id="${v}" data-val="${escapeHtml(t)}" title="Sửa nhóm" aria-label="Sửa nhóm ${escapeHtml(t)}">
                            <svg viewBox="0 0 24 24"><use href="#i-pencil"/></svg>
                        </button>
                        <svg class="hh-check-icon" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg>
                    </div>
                `);
                $list.append($item);
            });
            updateUI();
        }

        function updateUI() {
            const curVal = $select.val();
            const $selectedOpt = $select.find(`option[value="${curVal}"]`);
            if (curVal && $selectedOpt.length) {
                $input.val($selectedOpt.text());
                $list.find('.hh-cs-item').removeClass('selected').filter(function () {
                    return String($(this).data('val')) === String(curVal);
                }).addClass('selected');
            } else {
                $input.val('');
                $list.find('.hh-cs-item').removeClass('selected');
            }
        }

        $box.on('click', function (e) {
            e.stopPropagation();
            if ($wrap.hasClass('open')) close();
            else open();
        });

        $search.on('click', function (e) {
            e.stopPropagation();
        }).on('input', function () {
            filterItems($(this).val());
        }).on('keydown', function (e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const $first = $list.find('.hh-cs-item:visible').first();
                if ($first.length) {
                    selectVal($first.data('val'), $first.find('span').text().trim());
                }
            }
        });

        $list.on('click', '.hh-cs-item', function (e) {
            if ($(e.target).closest('.hh-item-edit-btn').length) return;
            e.stopPropagation();
            const v = $(this).data('val');
            const t = $(this).find('span').text().trim();
            selectVal(v, t);
        });

        // Click nút bút chì ✎ trên từng item nhóm
        $list.on('click', '.hh-item-edit-btn', function (e) {
            e.stopPropagation();
            const id = $(this).data('id') || $(this).closest('.hh-cs-item').data('val');
            const val = $(this).data('val') || $(this).closest('.hh-cs-item').find('span').text().trim();
            close();
            openEditGroupModal(id, val);
        });

        $(document).on('click', function (e) {
            if (!$(e.target).closest($wrap).length) {
                close();
            }
        });

        return {
            open,
            close,
            select: selectVal,
            sync: syncFromSelect,
            updateUI
        };
    })();

    // 7.2. Quản lý Nhóm NCC qua Sub-modals (Tạo nhanh & Sửa/Xóa tại chỗ)
    $('#btnNewNhomNcc').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('#nccPromptInput').val('');
        $('#nccPromptErr').hide();
        showModal('nccPromptOv');
        setTimeout(() => $('#nccPromptInput').focus(), 40);
    });

    $('#nccPromptSave').on('click', function () {
        submitCreateGroupQuick();
    });

    $('#nccPromptInput').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitCreateGroupQuick();
        }
    });

    function submitCreateGroupQuick() {
        const name = $('#nccPromptInput').val().trim();
        if (!name) {
            $('#nccPromptErr').text('Vui lòng nhập tên nhóm nhà cung cấp.').show();
            $('#nccPromptInput').focus();
            return;
        }
        $('#nccPromptErr').hide();

        $.ajax({
            url: '/NhaCungCap/CreateGroupQuick',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ tenNhom: name }),
            success: function (res) {
                if (res.success) {
                    hideModal('nccPromptOv');
                    if (window.KiotToast) window.KiotToast.success(`Tạo nhóm "${res.tenNhom}" thành công.`);

                    // Bổ sung vào select modal & combobox
                    if (!$(`#nccMaNhomNcc option[value="${res.maNhomNcc}"]`).length) {
                        $('#nccMaNhomNcc').append(`<option value="${res.maNhomNcc}">${escapeHtml(res.tenNhom)}</option>`);
                    }
                    nccGroupCombobox.sync();
                    nccGroupCombobox.select(res.maNhomNcc, res.tenNhom);

                    // Bổ sung vào dropdown sidebar nếu chưa có
                    if (!$(`#dropdownNhomNcc .kiot-ms-item[data-val="${res.maNhomNcc}"]`).length) {
                        const itemHtml = `
                            <div class="kiot-ms-item" data-val="${res.maNhomNcc}" data-name="${escapeHtml(res.tenNhom)}">
                                <input type="checkbox" class="form-check-input" />
                                <span class="kiot-ms-text">${escapeHtml(res.tenNhom)}</span>
                                <button type="button" class="kiot-item-edit-btn hh-item-edit-btn" data-id="${res.maNhomNcc}" data-name="${escapeHtml(res.tenNhom)}" title="Sửa nhóm">
                                    <i class="bi bi-pencil" style="font-size:12px;pointer-events:none;"></i>
                                </button>
                            </div>
                        `;
                        $('#dropdownNhomNcc').append(itemHtml);
                    }
                }
            },
            error: function (xhr) {
                $('#nccPromptErr').text(xhr.responseJSON?.message || 'Không thể tạo nhóm.').show();
            }
        });
    }

    function openEditGroupModal(id, val) {
        if (!id) return;
        $('#nccEditGroupId').val(id);
        $('#nccEditGroupInput').val(val || '');
        $('#nccEditGroupErr').hide();
        showModal('nccEditGroupOv');
        setTimeout(() => $('#nccEditGroupInput').focus().select(), 40);
    }

    $('#btnEditGroupSave').on('click', function () {
        submitUpdateGroup();
    });

    $('#nccEditGroupInput').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitUpdateGroup();
        }
    });

    function submitUpdateGroup() {
        const id = parseInt($('#nccEditGroupId').val()) || 0;
        const newName = $('#nccEditGroupInput').val().trim();
        if (!newName) {
            $('#nccEditGroupErr').text('Vui lòng nhập tên nhóm nhà cung cấp.').show();
            $('#nccEditGroupInput').focus();
            return;
        }

        $.ajax({
            url: '/NhaCungCap/UpdateGroupQuick',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ maNhomNcc: id, tenNhom: newName }),
            success: function (res) {
                if (res.success) {
                    hideModal('nccEditGroupOv');
                    if (window.KiotToast) window.KiotToast.success(`Đã đổi tên nhóm thành "${res.tenNhom}".`);

                    // Cập nhật select modal & combobox
                    $(`#nccMaNhomNcc option[value="${id}"]`).text(res.tenNhom);
                    nccGroupCombobox.sync();
                    if (String($('#nccMaNhomNcc').val()) === String(id)) {
                        nccGroupCombobox.select(id, res.tenNhom);
                    }

                    // Cập nhật dropdown sidebar
                    const $sItem = $(`#dropdownNhomNcc .kiot-ms-item[data-val="${id}"]`);
                    $sItem.attr('data-name', res.tenNhom);
                    $sItem.find('.kiot-ms-text').text(res.tenNhom);
                    $sItem.find('.kiot-item-edit-btn').attr('data-name', res.tenNhom);

                    // Cập nhật state nếu đang lọc nhóm này
                    const target = state.nhom.find(x => String(x.val) === String(id));
                    if (target) {
                        target.name = res.tenNhom;
                        $('#dotNhomNcc').addClass('active');
                        KiotFilter.renderTagPills($('#boxNhomNcc'), state.nhom, 'Tất cả các nhóm', 2);
                    }
                }
            },
            error: function (xhr) {
                $('#nccEditGroupErr').text(xhr.responseJSON?.message || 'Không thể cập nhật nhóm.').show();
            }
        });
    }

    $('#btnEditGroupDelete').on('click', function () {
        const id = parseInt($('#nccEditGroupId').val()) || 0;
        if (!id) return;

        $.ajax({
            url: '/NhaCungCap/DeleteGroupQuick',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ maNhomNcc: id }),
            success: function (res) {
                if (res.success) {
                    hideModal('nccEditGroupOv');
                    if (window.KiotToast) window.KiotToast.success(res.message);

                    // Gỡ bỏ khỏi select modal & combobox
                    $(`#nccMaNhomNcc option[value="${id}"]`).remove();
                    nccGroupCombobox.sync();
                    if (String($('#nccMaNhomNcc').val()) === String(id)) {
                        nccGroupCombobox.select('', '');
                    }

                    // Gỡ bỏ khỏi sidebar
                    $(`#dropdownNhomNcc .kiot-ms-item[data-val="${id}"]`).remove();
                    state.nhom = state.nhom.filter(x => String(x.val) !== String(id));
                    $('#dotNhomNcc').toggleClass('active', state.nhom.length > 0);
                    KiotFilter.renderTagPills($('#boxNhomNcc'), state.nhom, 'Tất cả các nhóm', 2);
                    state.page = 1;
                    loadTable();
                }
            },
            error: function (xhr) {
                $('#nccEditGroupErr').text(xhr.responseJSON?.message || 'Không thể xóa nhóm này.').show();
            }
        });
    });

    // 7.3. Reset Form Nhà Cung Cấp
    function resetNccForm() {
        $('#nccId').val('0');
        $('#nccTenDonVi').val('');
        $('#nccFldTen').removeClass('invalid');
        $('#nccMaNcc').val('');
        $('#nccDienThoai').val('');
        $('#nccEmail').val('');
        $('#nccDiaChi').val('');
        $('#nccKhuVuc').val('');
        $('#nccPhuongXa').val('');
        $('#nccMaNhomNcc').val('');
        nccGroupCombobox.updateUI();
        $('#nccGhiChu').val('');
        $('#nccTenCongTy').val('');
        $('#nccMaSoThue').val('');
        $('#nccSoCccd').val('');
        $('#nccStatusWrap').hide();
        $('#nccTrangThaiSwitch').prop('checked', true);
        $('#btnDeleteNccInModal').hide();
        $('#btnSaveAndNewNcc').show();
        $('#nccModalTitle').text('Thêm mới nhà cung cấp');

        // Mở sẵn các accordion
        $('#nccModalOv .hh-sec').addClass('open');
    }

    // Tự động xóa lỗi khi người dùng gõ tên NCC
    $('#nccTenDonVi').on('input', function () {
        if ($(this).val().trim()) {
            $('#nccFldTen').removeClass('invalid');
        }
    });

    // Mở modal tạo mới
    $('#btnOpenCreateNccModal').on('click', function () {
        resetNccForm();
        showModal('nccModalOv');
        setTimeout(() => $('#nccTenDonVi').focus(), 40);
    });

    // Mở modal chỉnh sửa từ nút trong detail panel
    $(document).on('click', '.btn-edit-ncc', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        if (!id) return;

        resetNccForm();
        $('#nccId').val(id);
        $('#nccModalTitle').text('Cập nhật nhà cung cấp');
        $('#btnSaveAndNewNcc').hide();
        $('#btnDeleteNccInModal').show();
        $('#nccStatusWrap').show();

        $.ajax({
            url: `/NhaCungCap/GetItem?id=${id}`,
            type: 'GET',
            success: function (res) {
                if (res.success && res.data) {
                    const d = res.data;
                    $('#nccTenDonVi').val(d.tenDonVi);
                    $('#nccMaNcc').val(d.maNcc);
                    $('#nccDienThoai').val(d.dienThoai || '');
                    $('#nccEmail').val(d.email || '');
                    $('#nccDiaChi').val(d.diaChi || '');
                    $('#nccKhuVuc').val(d.khuVuc || '');
                    $('#nccPhuongXa').val(d.phuongXa || '');
                    $('#nccMaNhomNcc').val(d.maNhomNcc || '');
                    nccGroupCombobox.updateUI();
                    $('#nccGhiChu').val(d.ghiChu || '');
                    $('#nccTenCongTy').val(d.tenCongTy || '');
                    $('#nccMaSoThue').val(d.maSoThue || '');
                    $('#nccSoCccd').val(d.soCccd || '');

                    const isHoatDong = d.trangThai === 'HOAT_DONG';
                    $('#nccTrangThaiSwitch').prop('checked', isHoatDong);
                    $('#nccTrangThaiLabel').text(isHoatDong ? 'Đang hoạt động' : 'Ngừng hoạt động');

                    showModal('nccModalOv');
                    setTimeout(() => $('#nccTenDonVi').focus().select(), 40);
                }
            },
            error: function () {
                if (window.KiotToast) window.KiotToast.error('Không thể lấy thông tin nhà cung cấp.');
            }
        });
    });

    // Switch trạng thái trong modal edit
    $('#nccTrangThaiSwitch').on('change', function () {
        const isChecked = $(this).is(':checked');
        $('#nccTrangThaiLabel').text(isChecked ? 'Đang hoạt động' : 'Ngừng hoạt động');
    });

    // Xử lý Lưu form (POST)
    function submitNccForm(isSaveAndNew) {
        const ten = $('#nccTenDonVi').val().trim();
        if (!ten) {
            $('#nccFldTen').addClass('invalid');
            $('#nccTenDonVi').focus();
            return;
        }
        $('#nccFldTen').removeClass('invalid');

        const id = parseInt($('#nccId').val()) || 0;
        const payload = {
            maDonViCapHang: id,
            tenDonVi: ten,
            maNcc: $('#nccMaNcc').val().trim(),
            dienThoai: $('#nccDienThoai').val().trim(),
            email: $('#nccEmail').val().trim(),
            diaChi: $('#nccDiaChi').val().trim(),
            khuVuc: $('#nccKhuVuc').val().trim(),
            phuongXa: $('#nccPhuongXa').val().trim(),
            maNhomNcc: parseInt($('#nccMaNhomNcc').val()) || null,
            ghiChu: $('#nccGhiChu').val().trim(),
            tenCongTy: $('#nccTenCongTy').val().trim(),
            maSoThue: $('#nccMaSoThue').val().trim(),
            soCccd: $('#nccSoCccd').val().trim(),
            trangThai: $('#nccTrangThaiSwitch').is(':checked') ? 'HOAT_DONG' : 'NGUNG_HOAT_DONG'
        };

        const isEdit = id > 0;
        const url = isEdit ? `/NhaCungCap/Edit?id=${id}` : '/NhaCungCap/Create';

        const $btn = isSaveAndNew ? $('#btnSaveAndNewNcc') : $('#btnSaveNcc');
        $btn.prop('disabled', true);

        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (res) {
                $btn.prop('disabled', false);
                if (res.success) {
                    if (window.KiotToast) window.KiotToast.success(res.message);

                    if (isSaveAndNew) {
                        resetNccForm();
                        $('#nccTenDonVi').focus();
                    } else {
                        hideModal('nccModalOv');
                    }
                    loadTable();
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', false);
                const msg = xhr.responseJSON?.message || 'Có lỗi xảy ra khi lưu dữ liệu.';
                if (window.KiotToast) {
                    window.KiotToast.error(msg);
                } else {
                    alert(msg);
                }
            }
        });
    }

    $('#btnSaveNcc').on('click', () => submitNccForm(false));
    $('#btnSaveAndNewNcc').on('click', () => submitNccForm(true));

    /* ==========================================================================
       8. XÓA & ĐỔI TRẠNG THÁI NHÀ CUNG CẤP (RÀNG BUỘC CHỨNG TỪ RULE 5)
       ========================================================================== */
    function openDeleteSupplierModal(id, name) {
        if (!id) return;
        $('#delNccId').val(id);
        $('#delNccName').text(name || 'nhà cung cấp');
        $('#delNccErrorBox').hide();
        $('#btnConfirmDeleteNcc').show();
        showModal('nccDeleteOv');
    }

    // Nút Xóa trong modal Sửa
    $('#btnDeleteNccInModal').on('click', function () {
        const id = parseInt($('#nccId').val()) || 0;
        const name = $('#nccTenDonVi').val().trim();
        openDeleteSupplierModal(id, name);
    });

    // Nút Xóa trong Panel chi tiết
    $(document).on('click', '.btn-delete-ncc', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        const name = $(this).data('name') || 'nhà cung cấp';
        openDeleteSupplierModal(id, name);
    });

    // Xác nhận xóa trong modal #nccDeleteOv
    $('#btnConfirmDeleteNcc').on('click', function () {
        const id = parseInt($('#delNccId').val()) || 0;
        if (!id) return;

        const $btn = $(this);
        $btn.prop('disabled', true);

        $.ajax({
            url: `/NhaCungCap/Delete?id=${id}`,
            type: 'POST',
            success: function (res) {
                $btn.prop('disabled', false);
                if (res.success) {
                    hideModal('nccDeleteOv');
                    hideModal('nccModalOv');
                    if (window.KiotToast) window.KiotToast.success(res.message);
                    state.expandedId = null;
                    loadTable();
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', false);
                const res = xhr.responseJSON;
                if (res && res.hasTransaction) {
                    // Đã phát sinh phiếu nhập -> Chặn xóa và hiển thị nút chuyển Ngừng hoạt động
                    $('#delNccErrorMsg').text(res.message);
                    $('#delNccErrorBox').show();
                    $('#btnConfirmDeleteNcc').hide();
                } else {
                    if (window.KiotToast) window.KiotToast.error(res?.message || 'Không thể xóa nhà cung cấp.');
                    hideModal('nccDeleteOv');
                }
            }
        });
    });

    // Chuyển sang Ngừng hoạt động ngay từ modal xóa
    $('#btnSwitchNgungHdInDelModal').on('click', function () {
        const id = parseInt($('#delNccId').val()) || 0;
        if (!id) return;
        toggleSupplierStatus(id);
        hideModal('nccDeleteOv');
        hideModal('nccModalOv');
    });

    function toggleSupplierStatus(id) {
        if (!id) return;
        $.ajax({
            url: `/NhaCungCap/ToggleStatus?id=${id}`,
            type: 'POST',
            success: function (res) {
                if (res.success) {
                    if (window.KiotToast) window.KiotToast.success(res.message);
                    loadTable();
                }
            },
            error: function (xhr) {
                if (window.KiotToast) window.KiotToast.error(xhr.responseJSON?.message || 'Không thể đổi trạng thái.');
            }
        });
    }

    $(document).on('click', '.btn-toggle-status-ncc', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        toggleSupplierStatus(id);
    });

    /* ==========================================================================
       9. PHÂN TRANG & TÌM KIẾM TỪ KHÓA
       ========================================================================== */
    function bindPaginationEvents() {
        // Phân trang AJAX qua _Pagination.cshtml
        KiotFilter.bindPagination('#tableContainer', function (page) {
            state.page = page;
            loadTable();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Tìm kiếm F3 Debounce
    const debouncedSearch = KiotFilter.debounce(function () {
        state.q = $('#keywordSearch').val();
        state.page = 1;
        loadTable();
    }, 300);

    $('#keywordSearch').on('input', debouncedSearch);

    $(document).on('keydown', function (e) {
        if (e.key === 'F3') {
            e.preventDefault();
            $('#keywordSearch').focus().select();
        }
    });

    // Checkbox chọn tất cả dòng (khớp chuẩn Hàng hóa: #selectAllRows & .row-select)
    $(document).on('change', '#selectAllRows, #chkAll', function () {
        const isChecked = $(this).is(':checked');
        $('#supplierTable .row-select, #supplierTable input[data-sel]').prop('checked', isChecked);
    });

    $(document).on('change', '#supplierTable .row-select, #supplierTable input[data-sel]', function () {
        const total = $('#supplierTable .row-select, #supplierTable input[data-sel]').length;
        const checked = $('#supplierTable .row-select:checked, #supplierTable input[data-sel]:checked').length;
        $('#selectAllRows, #chkAll').prop('checked', total > 0 && total === checked);
    });

    // Reset bộ lọc khi nhấn "vào đây" trong empty state
    $(document).on('click', '#resetF', function (e) {
        e.preventDefault();
        state.q = '';
        state.nhom = [];
        state.tongMuaTu = null;
        state.tongMuaDen = null;
        state.thoiGian = 'ALL';
        state.fromDate = null;
        state.toDate = null;
        state.noTu = null;
        state.noDen = null;
        state.trangThai = 'HOAT_DONG';
        state.sortBy = '';
        state.sortDir = '';
        state.page = 1;
        $('#keywordSearch').val('');
        $('#dotNhomNcc').removeClass('active');
        $('#dotTrangThai').removeClass('active');
        KiotFilter.renderTagPills($('#boxNhomNcc'), [], 'Tất cả các nhóm', 2);
        $('#dropdownNhomNcc .kiot-ms-item').removeClass('selected').find('input[type="checkbox"]').prop('checked', false);
        loadTable();
    });

    // Nút Xuất file Excel
    $('#btnExportExcel').on('click', function () {
        if (window.KiotToast) {
            window.KiotToast.info('Đang chuẩn bị file dữ liệu Excel...');
        }
        window.location.href = `/NhaCungCap/Index?export=excel&q=${encodeURIComponent(state.q)}`;
    });

    // Nút Tải lại bảng
    $('#btnReloadTable').on('click', function () {
        const $btn = $(this);
        $btn.addClass('spinning');
        loadTable();
        setTimeout(() => $btn.removeClass('spinning'), 600);
    });

    /* ==========================================================================
       10. KHỞI CHẠY LẦN ĐẦU
       ========================================================================== */
    initSidebarFilters();
    initColumnToggle();
    bindPaginationEvents();

})(jQuery);
