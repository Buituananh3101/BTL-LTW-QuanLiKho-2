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
        sortBy: '',
        sortDir: '',
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

        const $container = $('#tableContainer');
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
                    const $row = $(`.ncc-row[data-id="${state.expandedId}"]`);
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

        // 3.3. Khối 2: Tổng mua (Khoảng giá trị)
        const parseNum = val => {
            if (!val) return null;
            const cleaned = String(val).replace(/[^0-9.-]/g, '');
            const n = parseFloat(cleaned);
            return isNaN(n) ? null : n;
        };

        const updateTongMuaFilter = KiotFilter.debounce(function () {
            const tu = parseNum($('#filterTongMuaTu').val());
            const den = parseNum($('#filterTongMuaDen').val());
            state.tongMuaTu = tu;
            state.tongMuaDen = den;
            $('#dotTongMua').toggleClass('active', tu !== null || den !== null);
            state.page = 1;
            loadTable();
        }, 400);

        $('#filterTongMuaTu, #filterTongMuaDen').on('input', updateTongMuaFilter);

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

        // 3.5. Khối 4: Nợ hiện tại (Khoảng giá trị)
        const updateNoFilter = KiotFilter.debounce(function () {
            const tu = parseNum($('#filterNoTu').val());
            const den = parseNum($('#filterNoDen').val());
            state.noTu = tu;
            state.noDen = den;
            $('#dotNo').toggleClass('active', tu !== null || den !== null);
            state.page = 1;
            loadTable();
        }, 400);

        $('#filterNoTu, #filterNoDen').on('input', updateNoFilter);

        // 3.6. Khối 5: Trạng thái (Checkbox HOAT_DONG / NGUNG_HOAT_DONG / Tất cả)
        $('input[data-s]').on('change', function () {
            const val = $(this).data('s');
            const isChecked = $(this).is(':checked');

            if (val === '') {
                // "Tất cả" được chọn
                if (isChecked) {
                    $('input[data-s]').not(this).prop('checked', false);
                    state.trangThai = '';
                } else {
                    $(this).prop('checked', true);
                }
            } else {
                $('input[data-s=""]').prop('checked', false);
                const checkedStatuses = $('input[data-s]:checked').map(function () { return $(this).data('s'); }).get().filter(x => x !== '');
                if (checkedStatuses.length === 1) {
                    state.trangThai = checkedStatuses[0];
                } else if (checkedStatuses.length === 0 || checkedStatuses.length === 2) {
                    state.trangThai = '';
                    if (checkedStatuses.length === 0) {
                        $('input[data-s=""]').prop('checked', true);
                    }
                }
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
            const $icon = $(this).find('.sort-icon');
            $(this).removeClass('is-sorted sorted-asc sorted-desc');

            if (state.sortBy === col) {
                $(this).addClass('is-sorted');
                if (state.sortDir === 'asc') {
                    $(this).addClass('sorted-asc');
                    $icon.removeClass('d-none').html('<i class="bi bi-arrow-up"></i>');
                } else if (state.sortDir === 'desc') {
                    $(this).addClass('sorted-desc');
                    $icon.removeClass('d-none').html('<i class="bi bi-arrow-down"></i>');
                }
            } else {
                $icon.addClass('d-none');
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

    // Ẩn/hiện cột
    function applyColumnVisibility() {
        $('.col-toggle').each(function () {
            const col = $(this).data('col');
            const isChecked = $(this).is(':checked');
            $(`#supplierTable [data-col="${col}"]`).toggle(isChecked);
        });
    }

    $(document).on('change', '.col-toggle', function () {
        applyColumnVisibility();
        const savedCols = {};
        $('.col-toggle').each(function () {
            savedCols[$(this).data('col')] = $(this).is(':checked');
        });
        localStorage.setItem('kiot_ncc_columns', JSON.stringify(savedCols));
    });

    function restoreColumnPreferences() {
        try {
            const saved = JSON.parse(localStorage.getItem('kiot_ncc_columns'));
            if (saved) {
                $('.col-toggle').each(function () {
                    const col = $(this).data('col');
                    if (saved[col] !== undefined) {
                        $(this).prop('checked', saved[col]);
                    }
                });
            }
        } catch (_) {}
    }

    /* ==========================================================================
       6. MASTER-DETAIL ACCORDION (BUNG DÒNG CHI TIẾT & 3 TABS)
       ========================================================================== */
    function expandSupplierRow(id, toggle = true) {
        const $row = $(`.ncc-row[data-id="${id}"]`);
        const $detailTr = $(`#nccDetailRow_${id}`);
        const $container = $(`#nccDetailContainer_${id}`);

        if (toggle && $row.hasClass('is-expanded')) {
            $row.removeClass('is-expanded');
            $detailTr.hide();
            state.expandedId = null;
            return;
        }

        // Đóng dòng cũ
        $('.ncc-row').removeClass('is-expanded');
        $('.ncc-detail-tr').hide();

        // Mở dòng mới
        $row.addClass('is-expanded');
        $detailTr.show();
        state.expandedId = id;

        // Gọi AJAX lấy HTML chi tiết nếu chưa nạp
        $.ajax({
            url: `/NhaCungCap/GetDetail?id=${id}`,
            type: 'GET',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            success: function (html) {
                $container.html(html);
            },
            error: function () {
                $container.html('<div class="p-3 text-center text-danger small">Không thể nạp thông tin chi tiết.</div>');
            }
        });
    }

    // Click dòng bảng để mở Master-Detail (trừ checkbox, link, button)
    $(document).on('click', '.ncc-row', function (e) {
        if ($(e.target).closest('input, button, a, label').length) return;
        const id = $(this).data('id');
        if (id) expandSupplierRow(id, true);
    });

    // Chuyển tabs trong Master-Detail
    $(document).on('click', '.ncc-detail-tab-btn', function (e) {
        e.preventDefault();
        const tab = $(this).data('tab');
        const $panel = $(this).closest('.ncc-detail-panel');

        $panel.find('.ncc-detail-tab-btn').removeClass('active');
        $(this).addClass('active');

        $panel.find('.ncc-tab-pane').hide();
        $panel.find(`.ncc-tab-${tab}`).show();
    });

    /* ==========================================================================
       7. MODAL THÊM MỚI / CHỈNH SỬA NHÀ CUNG CẤP (CHUẨN 3 ACCORDION)
       ========================================================================== */
    const nccModal = new bootstrap.Modal(document.getElementById('nccModal'));

    function resetNccForm() {
        $('#nccId').val('0');
        $('#nccTenDonVi').val('').removeClass('is-invalid');
        $('#nccMaNcc').val('');
        $('#nccDienThoai').val('');
        $('#nccEmail').val('');
        $('#nccDiaChi').val('');
        $('#nccKhuVuc').val('');
        $('#nccPhuongXa').val('');
        $('#nccMaNhomNcc').val('');
        $('#nccGhiChu').val('');
        $('#nccTenCongTy').val('');
        $('#nccMaSoThue').val('');
        $('#nccSoCccd').val('');
        $('#nccStatusWrap').hide();
        $('#nccTrangThaiSwitch').prop('checked', true);
        $('#btnSaveAndNewNcc').show();
        $('#nccModalLabel').html('<i class="bi bi-truck me-1 text-primary"></i> Thêm mới nhà cung cấp');

        // Thu gọn các accordion
        $('.kiot-sec').removeClass('open');
        $('.kiot-sec-b').hide();
    }

    // Mở modal tạo mới
    $('#btnOpenCreateNccModal').on('click', function () {
        resetNccForm();
        nccModal.show();
    });

    // Mở modal chỉnh sửa từ nút trong detail panel
    $(document).on('click', '.btn-edit-ncc', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        if (!id) return;

        resetNccForm();
        $('#nccId').val(id);
        $('#nccModalLabel').html('<i class="bi bi-pencil-square me-1 text-primary"></i> Cập nhật nhà cung cấp');
        $('#btnSaveAndNewNcc').hide();
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
                    $('#nccGhiChu').val(d.ghiChu || '');
                    $('#nccTenCongTy').val(d.tenCongTy || '');
                    $('#nccMaSoThue').val(d.maSoThue || '');
                    $('#nccSoCccd').val(d.soCccd || '');

                    const isHoatDong = d.trangThai === 'HOAT_DONG';
                    $('#nccTrangThaiSwitch').prop('checked', isHoatDong);
                    $('#nccTrangThaiLabel').text(isHoatDong ? 'Đang hoạt động' : 'Ngừng hoạt động');

                    // Mở sẵn accordion nếu có dữ liệu
                    if (d.diaChi || d.khuVuc || d.phuongXa) {
                        $('#nccDiaChi').closest('.kiot-sec').addClass('open').find('.kiot-sec-b').show();
                    }
                    if (d.maNhomNcc || d.ghiChu) {
                        $('#nccMaNhomNcc').closest('.kiot-sec').addClass('open').find('.kiot-sec-b').show();
                    }
                    if (d.tenCongTy || d.maSoThue || d.soCccd) {
                        $('#nccTenCongTy').closest('.kiot-sec').addClass('open').find('.kiot-sec-b').show();
                    }

                    nccModal.show();
                }
            },
            error: function () {
                if (window.KiotToast) window.KiotToast.error('Không thể lấy thông tin nhà cung cấp.');
            }
        });
    });

    // Accordion gập mở trong Modal
    $(document).on('click', '.kiot-sec-h', function () {
        const $sec = $(this).closest('.kiot-sec');
        $sec.toggleClass('open');
        $sec.find('.kiot-sec-b').slideToggle(200);
    });

    // Switch trạng thái trong modal edit
    $('#nccTrangThaiSwitch').on('change', function () {
        const isChecked = $(this).is(':checked');
        $('#nccTrangThaiLabel').text(isChecked ? 'Đang hoạt động' : 'Ngừng hoạt động');
    });

    // Thêm nhanh nhóm từ modal
    $('#btnQuickAddGroupInModal').on('click', function (e) {
        e.preventDefault();
        handleCreateGroupSupplier();
    });

    // Xử lý Lưu form (POST)
    function submitNccForm(isSaveAndNew) {
        const ten = $('#nccTenDonVi').val().trim();
        if (!ten) {
            $('#nccTenDonVi').addClass('is-invalid').focus();
            return;
        }
        $('#nccTenDonVi').removeClass('is-invalid');

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
                        nccModal.hide();
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
    function deleteSupplier(id, name) {
        if (!id) return;

        const doDelete = () => {
            $.ajax({
                url: `/NhaCungCap/Delete?id=${id}`,
                type: 'POST',
                success: function (res) {
                    if (res.success) {
                        if (window.KiotToast) window.KiotToast.success(res.message);
                        state.expandedId = null;
                        loadTable();
                    }
                },
                error: function (xhr) {
                    const res = xhr.responseJSON;
                    if (res && res.hasTransaction) {
                        // Nếu đã phát sinh chứng từ, thông báo và gợi ý chuyển sang Ngừng hoạt động
                        if (window.KiotConfirm) {
                            window.KiotConfirm.show({
                                title: 'Không thể xóa nhà cung cấp',
                                message: `${escapeHtml(res.message)}<br><br>Bạn có muốn chuyển nhà cung cấp này sang <strong>Ngừng hoạt động</strong> thay vì xóa không?`,
                                confirmText: 'Ngừng hoạt động',
                                onConfirm: function () {
                                    toggleSupplierStatus(id);
                                }
                            });
                        } else {
                            if (confirm(`${res.message}\n\nBạn có muốn chuyển sang Ngừng hoạt động không?`)) {
                                toggleSupplierStatus(id);
                            }
                        }
                    } else {
                        if (window.KiotToast) window.KiotToast.error(res?.message || 'Không thể xóa nhà cung cấp.');
                    }
                }
            });
        };

        if (window.KiotConfirm) {
            window.KiotConfirm.show({
                title: 'Xóa nhà cung cấp',
                message: `Bạn có chắc chắn muốn xóa nhà cung cấp <strong>${escapeHtml(name)}</strong>?<br><span class="text-muted small">Thao tác này sẽ xóa hoàn toàn thông tin nếu chưa từng phát sinh chứng từ.</span>`,
                confirmText: 'Đồng ý xóa',
                onConfirm: doDelete
            });
        } else if (confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${name}"?`)) {
            doDelete();
        }
    }

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

    $(document).on('click', '.btn-delete-ncc', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        const name = $(this).data('name') || 'nhà cung cấp';
        deleteSupplier(id, name);
    });

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

    // Checkbox select all
    $(document).on('change', '#selectAllNcc', function () {
        const isChecked = $(this).is(':checked');
        $('.row-select-ncc').prop('checked', isChecked);
    });

    $(document).on('change', '.row-select-ncc', function () {
        const allChecked = $('.row-select-ncc:checked').length === $('.row-select-ncc').length;
        $('#selectAllNcc').prop('checked', allChecked);
    });

    // Nút Xuất file Excel
    $('#btnExportExcel').on('click', function () {
        if (window.KiotToast) {
            window.KiotToast.info('Đang chuẩn bị file dữ liệu Excel...');
        }
        window.location.href = `/NhaCungCap/Index?export=excel&q=${encodeURIComponent(state.q)}`;
    });

    /* ==========================================================================
       10. KHỞI CHẠY LẦN ĐẦU
       ========================================================================== */
    restoreColumnPreferences();
    initSidebarFilters();
    applyColumnVisibility();
    bindPaginationEvents();

})(jQuery);
