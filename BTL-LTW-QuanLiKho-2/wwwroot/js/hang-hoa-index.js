/**
 * hang-hoa-index.js – Quản lý tương tác trang Danh sách hàng hóa chuyên nghiệp
 * Bao gồm: Sidebar Drawer, Dual Calendar, Multi-select Tags, Sắp xếp cột 3 trạng thái, AJAX Paging, Star.
 */

$(document).ready(function () {
    const cfg = $('#hangHoaConfig');
    let currentPage = parseInt(cfg.data('page')) || 1;
    let currentSortBy = String(cfg.data('sort-by') || '');
    let currentSortDir = String(cfg.data('sort-dir') || '');
    let activeDuKienVal = String(cfg.data('du-kien') || 'ALL');
    let activeTgTaoVal = String(cfg.data('tg-tao') || 'ALL');
    let isStarredFilterActive = cfg.data('is-starred') === true || cfg.data('is-starred') === 'true';

    let activeTgTaoFrom = '';
    let activeTgTaoTo = '';

    const groupModalEl = document.getElementById('quickGroupModal');
    const groupModal = groupModalEl ? new bootstrap.Modal(groupModalEl) : null;

    // Cấu hình ẩn / hiện cột mặc định khớp chuyên nghiệp (13 cột dữ liệu + 2 cột cố định: checkbox, star)
    const DEFAULT_PRODUCT_COLS = {
        img: 1,
        mahang: 1,
        tenhang: 1,
        nhomhang: 0,
        dvt: 0,
        giaban: 1,
        giavon: 1,
        tonkho: 1,
        khachdat: 1,
        vitri: 0,
        ngaytao: 1,
        dukienhethang: 1,
        trangthai: 0
    };
    let productColumnToggler = null;

    function initColumnToggle() {
        if (window.KiotFilter && typeof window.KiotFilter.initColumnToggle === 'function') {
            productColumnToggler = window.KiotFilter.initColumnToggle({
                menuSelector: '#colMenu',
                tableSelector: '#productTable',
                storageKey: 'kiot_hang_hoa_cols_v1',
                defaultCols: DEFAULT_PRODUCT_COLS,
                extraColsCount: 2 // checkbox + star
            });
        }
    }

    function applyColumnVisibility() {
        if (productColumnToggler && typeof productColumnToggler.apply === 'function') {
            productColumnToggler.apply();
        }
    }

    // 1. Thu gọn / Mở rộng (Kéo vào / Kéo ra) sidebar bên trái
    let animTimer = null;
    function toggleSidebar(forceState) {
        const container = $('#kiotContainer');
        const isCollapsed = container.hasClass('sidebar-collapsed');
        const shouldCollapse = (typeof forceState === 'boolean') ? forceState : !isCollapsed;

        clearTimeout(animTimer);
        container.addClass('sidebar-animating');
        animTimer = setTimeout(() => {
            container.removeClass('sidebar-animating');
        }, 420);

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

    $(document).on('keydown', function (e) {
        if (e.key === 'F4') {
            e.preventDefault();
            toggleSidebar();
        }
    });

    $('#btnMobileFilter').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('#sidebarFilterCol').addClass('show-mobile');
        $('#sidebarBackdrop').addClass('show');
    });

    function closeMobileSidebar() {
        $('#sidebarFilterCol').removeClass('show-mobile');
        $('#sidebarBackdrop').removeClass('show');
    }

    $('#btnCloseSidebarMobile, #sidebarBackdrop').on('click', function (e) {
        e.preventDefault();
        closeMobileSidebar();
    });

    // Khởi tạo 2 bộ lọc ngày dùng KiotFilter.initDateFilter (Khối LEGO dùng chung)
    KiotFilter.initDateFilter('dk', function (from, to, text, val) {
        activeDuKienVal = val || 'ALL';
        currentPage = 1;
        loadTable();
    });

    KiotFilter.initDateFilter('tgt', function (from, to, text, val) {
        activeTgTaoVal = val || 'ALL';
        activeTgTaoFrom = from || '';
        activeTgTaoTo = to || '';
        currentPage = 1;
        loadTable();
    });


    // 3. Multi-select Tags Dropdown
    const filterState = {
        nhom: [],
        ncc: [],
        vitri: [],
        loaihang: []
    };

    /* ===== TIỆN ÍCH DÙNG CHUNG TỪ KIOTFILTER ===== */
    const escapeHtml = KiotFilter.escapeHtml;
    const checkSidebarDropdownDirection = KiotFilter.checkSidebarDropdownDirection;

    const filterPlaceholders = {
        nhom: 'Chọn nhóm hàng',
        ncc: 'Chọn nhà cung cấp',
        vitri: 'Chọn vị trí',
        loaihang: 'Chọn loại hàng'
    };

    const filterDotSelectors = {
        nhom: '#dotNhomHang',
        ncc: '#dotNcc',
        vitri: '#dotViTri',
        loaihang: '#dotLoaiHang'
    };

    function renderMultiSelectBox(key) {
        const boxId = key === 'nhom' ? '#boxNhomHang' :
                      key === 'ncc' ? '#boxNcc' :
                      key === 'vitri' ? '#boxViTri' : '#boxLoaiHang';
        const dropdownId = key === 'nhom' ? '#dropdownNhomHang' :
                           key === 'ncc' ? '#dropdownNcc' :
                           key === 'vitri' ? '#dropdownViTri' : '#dropdownLoaiHang';

        const box = $(boxId);
        const dropdown = $(dropdownId);
        const selected = filterState[key] || [];
        const placeholder = filterPlaceholders[key];
        const dot = $(filterDotSelectors[key]);

        dot.css('display', selected.length > 0 ? 'inline-block' : 'none');

        dropdown.find('.kiot-ms-item').each(function () {
            const val = String($(this).data('val'));
            const isSel = selected.some(x => String(x.val) === val);
            $(this).toggleClass('selected', isSel);
            $(this).find('input[type="checkbox"]').prop('checked', isSel);
        });

        KiotFilter.renderTagPills(box, selected, placeholder, 3);
    }

    function setupMultiSelect(boxId, dropdownId, key) {
        const box = $(boxId);
        const dropdown = $(dropdownId);

        box.on('click', function (e) {
            if ($(e.target).closest('.tag-remove').length) return;
            e.stopPropagation();
            $('.kiot-ms-dropdown').not(dropdown).removeClass('show drop-up').css('max-height', '');
            $('.kiot-multiselect-box').not(box).removeClass('open');
            $('.quick-date-popup, .dual-calendar-popup').hide();

            const willShow = !dropdown.hasClass('show');
            if (willShow) {
                checkSidebarDropdownDirection(box, dropdown);
                dropdown.addClass('show');
                box.addClass('open');
                dropdown.find('.kiot-ms-search input').focus();
            } else {
                dropdown.removeClass('show drop-up').css('max-height', '');
                box.removeClass('open');
            }
        });

        box.on('click', '.tag-remove', function (e) {
            e.stopPropagation();
            const val = String($(this).closest('.kiot-pill-tag').data('val'));
            filterState[key] = (filterState[key] || []).filter(x => String(x.val) !== val);
            renderMultiSelectBox(key);
            currentPage = 1;
            loadTable();
        });

        box.on('click', '.kiot-pill-more', function (e) {
            e.stopPropagation();
            $('.kiot-ms-dropdown').not(dropdown).removeClass('show drop-up').css('max-height', '');
            checkSidebarDropdownDirection(box, dropdown);
            dropdown.addClass('show');
            box.addClass('open');
        });

        dropdown.on('click', '.kiot-item-edit-btn, .hh-item-edit-btn', function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const id = $(this).data('id') || $(this).closest('.kiot-ms-item').data('val');
            const oldName = $(this).data('name') || $(this).closest('.kiot-ms-item').find('.kiot-ms-text, span').first().text().trim();
            if (typeof window.handleEditNhomHang === 'function') {
                window.handleEditNhomHang(id, oldName);
            }
        });

        dropdown.on('click', '.kiot-ms-item', function (e) {
            if ($(e.target).closest('.kiot-item-edit-btn, .hh-item-edit-btn').length) {
                return;
            }
            e.stopPropagation();
            const val = String($(this).data('val'));
            const name = $(this).data('name') || $(this).text().trim();
            const idx = (filterState[key] || []).findIndex(x => String(x.val) === val);

            if (idx >= 0) {
                filterState[key].splice(idx, 1);
            } else {
                filterState[key].push({ val: val, name: name });
            }

            renderMultiSelectBox(key);
            currentPage = 1;
            loadTable();
        });

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
    }

    setupMultiSelect('#boxNhomHang', '#dropdownNhomHang', 'nhom');
    setupMultiSelect('#boxNcc', '#dropdownNcc', 'ncc');
    setupMultiSelect('#boxViTri', '#dropdownViTri', 'vitri');
    setupMultiSelect('#boxLoaiHang', '#dropdownLoaiHang', 'loaihang');

    renderMultiSelectBox('nhom');
    renderMultiSelectBox('ncc');
    renderMultiSelectBox('vitri');
    renderMultiSelectBox('loaihang');

    // Single-select Tiêu chí tồn
    $('#boxTonKho').on('click', function (e) {
        e.stopPropagation();
        const box = $(this);
        const dropdown = $('#dropdownTonKho');

        $('.kiot-ms-dropdown, .kiot-ss-dropdown').not(dropdown).removeClass('show drop-up').css('max-height', '');
        $('.kiot-multiselect-box, .kiot-single-select-box').not(box).removeClass('open');
        $('.quick-date-popup, .dual-calendar-popup').hide();

        const willShow = !dropdown.hasClass('show');
        if (willShow) {
            checkSidebarDropdownDirection(box, dropdown);
            dropdown.addClass('show');
            box.addClass('open');
        } else {
            dropdown.removeClass('show drop-up').css('max-height', '');
            box.removeClass('open');
        }
    });

    $('#dropdownTonKho').on('click', '.kiot-ss-item', function (e) {
        e.stopPropagation();
        const val = $(this).data('val');
        const text = $(this).find('span').text().trim();

        $('#textTonKho').text(text);
        $('#dropdownTonKho .kiot-ss-item').removeClass('selected');
        $(this).addClass('selected');

        $('#dropdownTonKho').removeClass('show drop-up').css('max-height', '');
        $('#boxTonKho').removeClass('open');

        $('#filterTonKho').val(val).trigger('change');
    });

    $('.kiot-filter-box').on('scroll', function () {
        const openDropdown = $('.kiot-ms-dropdown.show, .kiot-ss-dropdown.show');
        if (openDropdown.length) {
            const box = openDropdown.siblings('.kiot-multiselect-box, .kiot-single-select-box');
            if (box.length) {
                checkSidebarDropdownDirection(box, openDropdown);
            }
        }
    });

    $(document).on('click', function (e) {
        if (!document.contains(e.target)) return;
        if ($(e.target).closest('.dual-calendar-popup, .quick-date-popup').length) return;
        // Chặn đóng dropdown nếu click xảy ra bên trong bất kỳ modal nào hoặc đang có modal hiển thị
        if ($(e.target).closest('#kiotPromptOv, #kiotConfirmOv, #quickGroupModal, #hhModalOv, #hhEditItemOv, .kiot-prompt-ov, .kiot-confirm-ov, .modal-box').length) return;
        if ($('#kiotPromptOv.show, #kiotConfirmOv.show, #quickGroupModal.show, #hhModalOv.show, #hhEditItemOv.show, .kiot-prompt-ov.show, .kiot-confirm-ov.show').length) return;

        const $targetBlock = $(e.target).closest('.f-block');
        if (!$targetBlock.length) {
            $('.quick-date-popup').hide();
            $('.dual-calendar-popup').hide();
            $('.kiot-ms-dropdown, .kiot-ss-dropdown').removeClass('show drop-up').css('max-height', '');
            $('.kiot-multiselect-box, .kiot-single-select-box').removeClass('open');
        } else {
            $('.dual-calendar-popup').not($targetBlock.find('.dual-calendar-popup')).hide();
            $('.quick-date-popup').not($targetBlock.find('.quick-date-popup')).hide();
            $('.kiot-ms-dropdown, .kiot-ss-dropdown').not($targetBlock.find('.kiot-ms-dropdown, .kiot-ss-dropdown')).removeClass('show drop-up').css('max-height', '');
            $('.kiot-multiselect-box, .kiot-single-select-box').not($targetBlock.find('.kiot-multiselect-box, .kiot-single-select-box')).removeClass('open');
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            if ($('#kiotPromptOv.show, #kiotConfirmOv.show, #quickGroupModal.show, #hhModalOv.show, #hhEditItemOv.show, .kiot-prompt-ov.show, .kiot-confirm-ov.show').length) {
                return;
            }
            $('.kiot-ms-dropdown, .kiot-ss-dropdown').removeClass('show drop-up').css('max-height', '');
            $('.kiot-multiselect-box, .kiot-single-select-box').removeClass('open');
            $('.quick-date-popup, .dual-calendar-popup').hide();
        }
    });

    // 4. Modal Tạo nhanh Nhóm hàng
    $('#btnOpenQuickGroupModal').on('click', function () {
        $('#quickGroupInput').val('');
        if (groupModal) groupModal.show();
        setTimeout(() => $('#quickGroupInput').focus(), 300);
    });

    $('#btnSaveQuickGroup').on('click', function () {
        const name = $('#quickGroupInput').val().trim();
        if (!name) {
            alert('Vui lòng nhập tên nhóm hàng.');
            return;
        }

        $.ajax({
            url: '/HangHoa/CreateGroupQuick',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ tenNhom: name }),
            success: function (res) {
                if (groupModal) groupModal.hide();
                $('#formMaNhom').append(`<option value="${res.maNhom}">${res.tenNhom}</option>`);

                const itemHtml = `<div class="kiot-ms-item selected" data-val="${res.maNhom}" data-name="${res.tenNhom}">
                    <input type="checkbox" class="form-check-input" checked />
                    <span class="kiot-ms-text">${res.tenNhom}</span>
                    <button type="button" class="kiot-item-edit-btn hh-item-edit-btn" data-id="${res.maNhom}" data-name="${res.tenNhom}" data-type="nhomhang" title="Sửa nhóm hàng" aria-label="Sửa ${res.tenNhom}">
                        <i class="bi bi-pencil" style="font-size:12px;pointer-events:none;"></i>
                    </button>
                </div>`;
                $('#dropdownNhomHang').append(itemHtml);

                // Đồng bộ vào modal tạo/sửa hàng hóa
                const formItemHtml = `<div class="hh-cs-item" data-val="${res.maNhom}">
                    <span>${res.tenNhom}</span>
                    <button type="button" class="hh-item-edit-btn" data-type="nhom" data-id="${res.maNhom}" data-val="${res.tenNhom}" title="Sửa nhóm hàng" aria-label="Sửa nhóm hàng ${res.tenNhom}">
                        <svg viewBox="0 0 24 24"><use href="#i-pencil"/></svg>
                    </button>
                    <svg class="hh-check-icon" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg>
                </div>`;
                $('#listMaNhom').append(formItemHtml);

                filterState.nhom.push({ val: String(res.maNhom), name: res.tenNhom });
                renderMultiSelectBox('nhom');
                currentPage = 1;
                loadTable();
            },
            error: function (xhr) {
                alert('Lỗi: ' + (xhr.responseJSON?.message || 'Không thể tạo nhóm.'));
            }
        });
    });

    // 4.1. Xử lý Sửa & Xóa Nhóm hàng dùng chung qua KiotPrompt
    window.handleEditNhomHang = function (id, oldName) {
        if (!id) return;
        oldName = (oldName || '').trim();

        if (window.KiotPrompt) {
            window.KiotPrompt.open({
                title: 'Sửa nhóm hàng',
                label: 'Tên nhóm hàng',
                value: oldName,
                showDelete: true,
                onSave: function (newName) {
                    const errEl = document.getElementById('kiotPromptErr');
                    const inputEl = document.getElementById('kiotPromptInput');

                    if (!newName || newName.trim() === '') {
                        if (errEl) {
                            errEl.textContent = 'Vui lòng nhập tên nhóm hàng.';
                            errEl.style.display = 'block';
                        }
                        if (inputEl) inputEl.classList.add('is-invalid');
                        return false;
                    }
                    if (newName.trim().toLowerCase() === oldName.toLowerCase()) {
                        window.KiotPrompt.close();
                        setTimeout(() => {
                            $('#dropdownNhomHang').addClass('show');
                            $('#boxNhomHang').addClass('open');
                        }, 50);
                        return false;
                    }

                    $.ajax({
                        url: '/HangHoa/UpdateGroupQuick',
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ maNhom: parseInt(id), tenNhom: newName.trim() }),
                        success: function (res) {
                            if (res.success) {
                                // 1. Cập nhật trong dropdown sidebar
                                const $sidebarItem = $(`#dropdownNhomHang .kiot-ms-item[data-val="${id}"]`);
                                $sidebarItem.attr('data-name', res.tenNhom);
                                $sidebarItem.find('span.kiot-ms-text, span').first().text(res.tenNhom);
                                $sidebarItem.find('.kiot-item-edit-btn').attr('data-name', res.tenNhom);

                                // 2. Cập nhật trong modal tạo/sửa hàng hóa
                                const $formItem = $(`#listMaNhom .hh-cs-item[data-val="${id}"]`);
                                if ($formItem.length) {
                                    $formItem.find('span').first().text(res.tenNhom);
                                    $formItem.find('.hh-item-edit-btn').attr('data-val', res.tenNhom);
                                }
                                $(`#formMaNhom option[value="${id}"]`).text(res.tenNhom);
                                if ($('#formMaNhom').val() == id) {
                                    $('#inputMaNhom').val(res.tenNhom);
                                }

                                // 3. Cập nhật tags lọc nếu đang chọn nhóm này
                                const selected = filterState.nhom.find(x => String(x.val) === String(id));
                                if (selected) {
                                    selected.name = res.tenNhom;
                                    renderMultiSelectBox('nhom');
                                }

                                // 4. Tải lại bảng để đồng bộ dữ liệu
                                currentPage = 1;
                                loadTable();

                                window.KiotPrompt.close();

                                // Đảm bảo dropdown nhóm hàng giữ nguyên trạng thái mở
                                setTimeout(() => {
                                    $('#dropdownNhomHang').addClass('show');
                                    $('#boxNhomHang').addClass('open');
                                }, 50);

                                if (typeof showToast === 'function') {
                                    showToast('Đã cập nhật nhóm hàng: ' + res.tenNhom);
                                }
                            }
                        },
                        error: function (xhr) {
                            if (errEl) {
                                errEl.textContent = xhr.responseJSON?.message || 'Không thể cập nhật nhóm hàng.';
                                errEl.style.display = 'block';
                            }
                            if (inputEl) inputEl.classList.add('is-invalid');
                        }
                    });
                    return false;
                },
                onDelete: function () {
                    $.ajax({
                        url: '/HangHoa/DeleteGroupQuick',
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ maNhom: parseInt(id) }),
                        success: function (res) {
                            if (res.success) {
                                // 1. Xóa khỏi dropdown sidebar
                                $(`#dropdownNhomHang .kiot-ms-item[data-val="${id}"]`).remove();

                                // 2. Xóa khỏi modal tạo/sửa hàng hóa
                                $(`#listMaNhom .hh-cs-item[data-val="${id}"]`).remove();
                                $(`#formMaNhom option[value="${id}"]`).remove();
                                if ($('#formMaNhom').val() == id) {
                                    $('#formMaNhom').val('');
                                    $('#inputMaNhom').val('');
                                }

                                // 3. Bỏ chọn khỏi bộ lọc nếu đang chọn
                                const idx = filterState.nhom.findIndex(x => String(x.val) === String(id));
                                if (idx >= 0) {
                                    filterState.nhom.splice(idx, 1);
                                    renderMultiSelectBox('nhom');
                                    currentPage = 1;
                                    loadTable();
                                }

                                // Giữ dropdown mở để người dùng quan sát kết quả
                                setTimeout(() => {
                                    $('#dropdownNhomHang').addClass('show');
                                    $('#boxNhomHang').addClass('open');
                                }, 50);

                                if (typeof showToast === 'function') {
                                    showToast(res.message || 'Đã xóa nhóm hàng.');
                                }
                            }
                        },
                        error: function (xhr) {
                            const msg = xhr.responseJSON?.message || 'Không thể xóa nhóm hàng vì đang có hàng hóa thuộc nhóm.';
                            if (window.KiotConfirm) {
                                window.KiotConfirm.show({
                                    title: 'Không thể xóa nhóm hàng',
                                    icon: 'bi-exclamation-triangle',
                                    iconColor: '#eab308',
                                    message: msg,
                                    isAlert: true,
                                    confirmText: 'Đã hiểu',
                                    confirmClass: 'btn btn-primary'
                                });
                            } else if (typeof showToast === 'function') {
                                showToast(msg, 'error');
                            } else {
                                alert(msg);
                            }

                            setTimeout(() => {
                                $('#dropdownNhomHang').addClass('show');
                                $('#boxNhomHang').addClass('open');
                            }, 50);
                        }
                    });
                }
            });
        }
    };

    // Bắt sự kiện click nút bút chì Sửa nhóm hàng từ dropdown sidebar & modal form
    $(document).on('click', '.kiot-item-edit-btn, .hh-item-edit-btn', function (e) {
        const type = $(this).data('type');
        if (type === 'nhomhang' || type === 'nhom' || $(this).closest('#dropdownNhomHang, #listMaNhom').length) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const id = $(this).data('id') || $(this).closest('[data-val]').data('val');
            const oldName = $(this).data('name') || $(this).data('val') || $(this).closest('.kiot-ms-item, .hh-cs-item').find('.kiot-ms-text, span').first().text().trim();
            window.handleEditNhomHang(id, oldName);
        }
    });

    $(document).on('click', '#kiotPromptCancel, #kiotPromptClose', function () {
        setTimeout(() => {
            $('#dropdownNhomHang').addClass('show');
            $('#boxNhomHang').addClass('open');
        }, 50);
    });

    // Phím tắt F3
    $(document).on('keydown', function (e) {
        if (e.key === 'F3') {
            e.preventDefault();
            $('#keywordSearch').focus().select();
        }
    });

    $('#btnOpenCreateModal').on('click', function () {
        if (typeof window.openCreateProductModal === 'function') {
            window.openCreateProductModal();
        }
    });

    // Mở modal Sửa
    $(document).on('click', '.btn-edit-product', function () {
        const id = $(this).data('id');
        if (typeof window.openEditProductModal === 'function') {
            window.openEditProductModal(id);
        }
    });

    // Modal Xóa
    $(document).on('click', '.btn-delete-product', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        const name = $(this).data('name') || '';
        if (typeof window.openDeleteProductModal === 'function') {
            window.openDeleteProductModal(id, name);
        }
    });

    // Tìm kiếm Debounce
    let searchTimeout = null;
    $('#keywordSearch').on('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
            currentPage = 1;
            loadTable();
        }, 300);
    }).on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            currentPage = 1;
            loadTable();
        }
    });

    $('.filter-change').on('change', function () {
        currentPage = 1;
        loadTable();
    });

    $('#btnReloadTable').on('click', function () {
        loadTable();
    });

    // Phân trang AJAX
    $(document).on('click', '.page-ajax', function (e) {
        e.preventDefault();
        const p = $(this).data('page');
        if (p && p > 0) {
            currentPage = p;
            loadTable();
        }
    });

    // Checkbox chọn tất cả
    $(document).on('change', '#selectAllRows', function () {
        $('.row-select').prop('checked', $(this).is(':checked'));
    });

    // Inline Accordion chi tiết hàng hóa
    $(document).on('click', '.product-row', function (e) {
        if ($(e.target).closest('input[type="checkbox"], .star-btn, button, a.btn-delete-product').length) {
            return;
        }

        const id = $(this).data('id');
        const $detailRow = $('#detail-' + id);
        const $wrap = $detailRow.find('.product-detail-panel-wrap');
        const isCurrentlyOpen = $detailRow.is(':visible');

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
        } else {
            $(this).addClass('selected');
            const visibleCols = $('#productTable thead tr:first-child th:visible').length || 11;
            $detailRow.find('> td').attr('colspan', visibleCols);
            const $cells = $(this).children('td:visible');
            $cells.removeClass('last-visible-col');
            $cells.last().addClass('last-visible-col');
            $detailRow.show();
            $wrap.stop(true, true).hide().slideDown(150);
        }
    });

    // Chuyển Tab chi tiết
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

    // Nạp nhanh dữ liệu Thẻ kho thực tế từ API /BaoCao/GetTheKhoQuick
    function loadTheKhoQuick($panel) {
        const $box = $panel.find('.thekho-quick-box');
        if (!$box.length) return;
        if ($box.attr('data-loaded') === 'true') return;

        const maHang = parseInt($box.data('ma-hang'), 10);
        if (!maHang) return;

        const $tbody = $box.find('.thekho-quick-tbody');
        $tbody.html('<tr><td colspan="8" class="text-center py-3 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Đang nạp dữ liệu thẻ kho...</td></tr>');

        $.ajax({
            url: '/BaoCao/GetTheKhoQuick',
            type: 'GET',
            data: { maHang: maHang, soLuong: 10 },
            success: function (res) {
                if (res && res.success && res.data && res.data.length) {
                    let html = '';
                    res.data.forEach(function (d) {
                        const codeHtml = d.urlChiTiet
                            ? `<a href="${d.urlChiTiet}" class="text-primary text-decoration-none fw-semibold">${escapeHtml(d.maChungTuHienThi)}</a>`
                            : `<span class="fw-semibold text-dark">${escapeHtml(d.maChungTuHienThi)}</span>`;

                        const timeStr = d.ngayGiaoDich ? new Date(d.ngayGiaoDich).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
                        const tang = d.soLuongTang > 0 ? `<span class="text-success fw-bold">+${d.soLuongTang.toLocaleString('vi-VN')}</span>` : '-';
                        const giam = d.soLuongGiam > 0 ? `<span class="text-danger fw-bold">-${d.soLuongGiam.toLocaleString('vi-VN')}</span>` : '-';
                        const ton = `<span class="fw-bold">${d.tonLuyKe.toLocaleString('vi-VN')}</span>`;
                        const giaStr = d.donGia > 0 ? d.donGia.toLocaleString('vi-VN') + ' ₫' : '-';

                        // Chuẩn hóa badge class loại giao dịch đồng bộ chuyên nghiệp
                        const badgeClass = (d.badgeClass && d.badgeClass.startsWith('badge-'))
                            ? d.badgeClass
                            : (function (loai) {
                                switch (loai) {
                                    case 'PHIEU_NHAP': return 'badge-nhap';
                                    case 'XUAT_BAN': return 'badge-xuat-ban';
                                    case 'XUAT_HUY': return 'badge-xuat-huy';
                                    case 'CHUYEN_XUAT': return 'badge-chuyen-xuat';
                                    case 'CHUYEN_NHAP': return 'badge-chuyen-nhap';
                                    case 'KIEM_KE': return 'badge-kiem-ke';
                                    case 'TRA_HANG_NHAP': return 'badge-tra-hang';
                                    default: return 'badge-kiem-ke';
                                }
                            })(d.loaiChungTu);

                        html += `<tr>
                            <td>${codeHtml}</td>
                            <td class="text-muted small">${timeStr}</td>
                            <td><span class="badge-tk ${badgeClass}">${escapeHtml(d.tenLoaiChungTu)}</span></td>
                            <td class="text-end text-muted">${giaStr}</td>
                            <td class="text-end">${tang}</td>
                            <td class="text-end">${giam}</td>
                            <td class="text-end">${ton}</td>
                            <td class="small text-muted text-truncate" style="max-width: 150px;" title="${escapeHtml(d.doiTac || '')}">${escapeHtml(d.doiTac || '-')}</td>
                        </tr>`;
                    });
                    $tbody.html(html);
                    $panel.find('.thekho-count-text').text(`Hiển thị ${res.data.length} giao dịch gần nhất`);
                    $box.attr('data-loaded', 'true');
                } else {
                    $tbody.html('<tr><td colspan="8" class="text-center py-4 text-muted fst-italic"><i class="bi bi-inbox fs-4 d-block mb-1 text-secondary"></i>Chưa phát sinh giao dịch xuất nhập kho nào cho mặt hàng này</td></tr>');
                    $panel.find('.thekho-count-text').text('0 giao dịch');
                    $box.attr('data-loaded', 'true');
                }
            },
            error: function () {
                $tbody.html('<tr><td colspan="8" class="text-center py-3 text-danger"><i class="bi bi-exclamation-triangle me-1"></i>Không thể nạp dữ liệu thẻ kho. Vui lòng thử lại sau.</td></tr>');
            }
        });
    }

    // Sao chép hàng hóa
    $(document).on('click', '.btn-copy-product', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        if (typeof window.openEditProductModal === 'function') {
            window.openEditProductModal(id, true);
        }
    });

    // Toggle Star
    window.toggleFavoriteProduct = function (e, id, el) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const $cell = $(el);
        const $btn = $cell.hasClass('star-btn') ? $cell : $cell.find('.star-btn');
        if (!$btn.length || !id) return;

        $.ajax({
            url: '/HangHoa/ToggleFavorite',
            type: 'POST',
            data: { id: id },
            success: function (res) {
                if (res && res.success) {
                    if (res.isFavorite) {
                        $btn.addClass('starred')
                            .attr('title', 'Bỏ đánh dấu sao')
                            .html('<i class="bi bi-star-fill"></i>');
                    } else {
                        $btn.removeClass('starred')
                            .attr('title', 'Đánh dấu sao')
                            .html('<i class="bi bi-star"></i>');

                        if (isStarredFilterActive) {
                            const $tr = $btn.closest('tr');
                            const $detail = $('#detail-' + id);
                            $detail.remove();
                            $tr.fadeOut(250, function () {
                                $(this).remove();
                                if ($('#productTable tbody tr.product-row').length === 0) {
                                    loadTable();
                                }
                            });
                        }
                    }
                }
            },
            error: function (xhr) {
                console.error('Lỗi khi cập nhật đánh dấu sao:', xhr);
                alert('Có lỗi khi cập nhật đánh dấu sao.');
            }
        });
    };

    window.toggleStarHeaderFilter = function (e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        isStarredFilterActive = !isStarredFilterActive;
        currentPage = 1;
        loadTable();
    };

    $(document).on('click', '.star-btn:not(#starHeaderFilter)', function (e) {
        const id = $(this).data('id');
        window.toggleFavoriteProduct(e, id, this);
    });

    $(document).on('click', '#starHeaderFilter', function (e) {
        window.toggleStarHeaderFilter(e);
    });

    // Sắp xếp cột 3 trạng thái
    $(document).on('click', '#productTable thead th.sortable-th', function (e) {
        e.preventDefault();
        const col = $(this).data('col');
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
        loadTable();
    });

    function loadTable() {
        const q = $('#keywordSearch').val()?.trim() || '';
        const nhom = (filterState.nhom || []).map(x => x.val).join(',');
        const tonKho = $('#filterTonKho').val() || 'ALL';
        const nhaCungCap = (filterState.ncc || []).map(x => x.val).join(';');
        const viTri = (filterState.vitri || []).map(x => x.val).join(';');
        const loaiHang = (filterState.loaihang || []).map(x => x.val).join(';');

        let duKien = activeDuKienVal || 'ALL';
        if ($('#dkCustom').is(':checked') && duKien === 'ALL') {
            duKien = 'CUSTOM';
        }

        let tgTao = activeTgTaoVal || 'ALL';
        let tgTaoFrom = '';
        let tgTaoTo = '';
        if ($('#tgtCustom').is(':checked')) {
            tgTao = 'CUSTOM';
            tgTaoFrom = activeTgTaoFrom;
            tgTaoTo = activeTgTaoTo;
        }

        $('#dotNhomHang').css('display', filterState.nhom.length > 0 ? 'inline-block' : 'none');
        $('#dotTonKho').css('display', tonKho !== 'ALL' ? 'inline-block' : 'none');
        $('#dotDuKien').css('display', duKien !== 'ALL' ? 'inline-block' : 'none');
        $('#dotTgTao').css('display', tgTao !== 'ALL' ? 'inline-block' : 'none');
        $('#dotNcc').css('display', filterState.ncc.length > 0 ? 'inline-block' : 'none');
        $('#dotViTri').css('display', filterState.vitri.length > 0 ? 'inline-block' : 'none');
        $('#dotLoaiHang').css('display', filterState.loaihang.length > 0 ? 'inline-block' : 'none');

        const hasAnyActiveFilter = filterState.nhom.length > 0 || tonKho !== 'ALL' || duKien !== 'ALL' || tgTao !== 'ALL' || filterState.ncc.length > 0 || filterState.vitri.length > 0 || filterState.loaihang.length > 0;
        $('#btnMobileFilter').toggleClass('has-filter', hasAnyActiveFilter);

        $.ajax({
            url: '/HangHoa/Filter',
            type: 'GET',
            data: {
                q: q,
                nhom: nhom,
                tonKhoFilter: tonKho,
                nhaCungCap: nhaCungCap,
                viTri: viTri,
                loaiHang: loaiHang,
                duKienFilter: duKien,
                tgTaoFilter: tgTao,
                tgTaoFrom: tgTaoFrom,
                tgTaoTo: tgTaoTo,
                daDanhDau: isStarredFilterActive,
                sortBy: currentSortBy,
                sortDir: currentSortDir,
                page: currentPage
            },
            beforeSend: function () {
                $('#productTableContainer').css('opacity', '0.6');
            },
            success: function (html) {
                $('#productTableContainer').html(html).css('opacity', '1');
                applyColumnVisibility();
            },
            error: function () {
                $('#productTableContainer').css('opacity', '1');
                alert('Có lỗi khi tải danh sách hàng hóa.');
            }
        });
    }

    window.getCurrentFilterParams = function () {
        const q = $('#keywordSearch').val()?.trim() || '';
        const nhom = (filterState.nhom || []).map(x => x.val).join(',');
        const tonKho = $('#filterTonKho').val() || 'ALL';
        const nhaCungCap = (filterState.ncc || []).map(x => x.val).join(';');
        const viTri = (filterState.vitri || []).map(x => x.val).join(';');
        const loaiHang = (filterState.loaihang || []).map(x => x.val).join(';');

        let duKien = activeDuKienVal || 'ALL';
        if ($('#dkCustom').is(':checked') && duKien === 'ALL') {
            duKien = 'CUSTOM';
        }

        let tgTao = activeTgTaoVal || 'ALL';
        let tgTaoFrom = '';
        let tgTaoTo = '';
        if ($('#tgtCustom').is(':checked')) {
            tgTao = 'CUSTOM';
            tgTaoFrom = activeTgTaoFrom;
            tgTaoTo = activeTgTaoTo;
        }

        return {
            q: q,
            nhom: nhom,
            tonKho: tonKho,
            nhaCungCap: nhaCungCap,
            viTri: viTri,
            loaiHang: loaiHang,
            duKien: duKien,
            tgTao: tgTao,
            tgTaoFrom: tgTaoFrom,
            tgTaoTo: tgTaoTo,
            daDanhDau: isStarredFilterActive
        };
    };

    window.loadTable = loadTable;

    // Khởi tạo ẩn / hiện cột
    initColumnToggle();
});
