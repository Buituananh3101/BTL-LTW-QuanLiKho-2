/**
 * kho-index.js - Quản lý tương tác màn hình Chi nhánh Kho
 * Chuẩn hóa 100% theo khuôn mẫu chuyên nghiệp LEGO & Form Hàng Hóa
 */
(function ($) {
    'use strict';

    // 1. Quản lý trạng thái bộ lọc
    let currentPage = 1;
    let selectedTrangThais = ['HOAT_DONG'];
    let currentSortBy = '';
    let currentSortDir = '';

    // 2. Khởi tạo Sidebar thu gọn (F4)
    if (window.AppFilter && typeof AppFilter.initSidebar === 'function') {
        AppFilter.initSidebar({
            storageKey: 'kp_kho_sidebar'
        });
    }

    // 3. Helper modal overlay chuyên nghiệp
    function showOverlay(id) {
        const ov = document.getElementById(id);
        if (ov) {
            ov.classList.add('show');
            document.body.classList.add('noscroll');
        }
    }

    function resetUserDropdown() {
        $('#khoUserSelectWrap').removeClass('open');
        $('#khoUserDropdownMenu').hide();
        $('#searchUserInDropdown').val('');
        $('.kho-user-dropdown-item').show();
    }

    function hideOverlay(id) {
        const ov = document.getElementById(id);
        if (ov) {
            ov.classList.remove('show');
            if (id === 'khoModalOv') {
                resetUserDropdown();
            }
            if (!$('.hh-ov.show').length) {
                document.body.classList.remove('noscroll');
            }
        }
    }

    // Đóng modal khi bấm nút [data-close] hoặc click nền mờ
    $(document).on('click', '[data-close]', function () {
        const targetId = $(this).data('close');
        hideOverlay(targetId);
    });

    $('.hh-ov').on('click', function (e) {
        if (e.target === this) {
            hideOverlay(this.id);
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            $('.hh-ov.show').each(function () {
                hideOverlay(this.id);
            });
        }
    });

    // 4. Tab chuyển đổi Thông tin / Mô tả (Chuẩn Form Hàng Hóa)
    $(document).on('click', '#khoModalOv .hh-tab', function () {
        const tab = $(this).data('tab');
        $('#khoModalOv .hh-tab').removeClass('on');
        $(this).addClass('on');
        $('#khoModalOv .hh-pane').removeClass('on');
        $('#kho-pane-' + tab).addClass('on');
        const body = document.getElementById('khoModalBody');
        if (body) body.scrollTop = 0;
    });

    // 6. RTE Toolbar các nút định dạng trong Tab Mô tả
    $(document).on('mousedown', '#khoModalOv .hh-rte-bar button', function (e) {
        e.preventDefault();
        const cmd = $(this).data('cmd');
        if (cmd) {
            document.execCommand(cmd, false, null);
        }
    });

    // 7. Split Button Lưu tùy chọn chuyên nghiệp
    $(document).on('click', '#btnKhoCaret', function (e) {
        e.stopPropagation();
        $('#khoSplitMenu').toggleClass('show');
    });

    $(document).on('click', function () {
        $('#khoSplitMenu').removeClass('show');
    });

    // 8. Nạp bảng dữ liệu AJAX
    function loadTable(page) {
        if (page) currentPage = page;
        const q = $('#keywordSearch').val().trim();

        const params = new URLSearchParams();
        params.append('Page', currentPage);
        params.append('PageSize', 15);
        if (q) params.append('Q', q);

        if (currentSortBy) {
            params.append('SortBy', currentSortBy);
            params.append('SortDir', currentSortDir || 'asc');
        }

        selectedTrangThais.forEach(st => params.append('TrangThais', st));

        $('#khoTableContainer').css('opacity', '0.5');

        $.ajax({
            url: '/Kho/Filter?' + params.toString(),
            type: 'GET',
            success: function (html) {
                $('#khoTableContainer').html(html).css('opacity', '1');
            },
            error: function () {
                $('#khoTableContainer').css('opacity', '1');
                if (window.AppToast) AppToast.error('Không thể tải dữ liệu chi nhánh kho.');
            }
        });
    }

    // 8.1. Bắt sự kiện click sắp xếp cột 3 trạng thái
    $(document).on('click', '#khoTable thead th.sortable-th', function (e) {
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

        loadTable(1);
    });

    // 8.2. Tìm kiếm F3 (Debounce 350ms)
    $('#keywordSearch').on('input', AppFilter.debounce(function () {
        loadTable(1);
    }, 350));

    $(document).on('keydown', function (e) {
        if (e.key === 'F3') {
            e.preventDefault();
            $('#keywordSearch').focus().select();
        }
    });

    // 8.3. Nút tải lại bảng
    $('#btnReloadTable').on('click', function () {
        loadTable(1);
        if (window.AppToast) AppToast.info('Đã làm mới dữ liệu.');
    });

    // 8.4. Phân trang AJAX
    if (window.AppFilter && AppFilter.bindPagination) {
        AppFilter.bindPagination('#khoTableContainer', function (page) {
            loadTable(page);
        });
    } else {
        $(document).on('click', '.page-ajax', function (e) {
            e.preventDefault();
            const page = parseInt($(this).data('page'));
            if (!isNaN(page) && page > 0) loadTable(page);
        });
    }

    // 9. Checkbox bộ lọc Trạng thái ở Sidebar
    $(document).on('change', '#sidebarFilterCol input[data-s]', function () {
        selectedTrangThais = $('#sidebarFilterCol input[data-s]:checked').map(function () {
            return $(this).data('s');
        }).get();
        const isDefault = selectedTrangThais.length === 1 && selectedTrangThais[0] === 'HOAT_DONG';
        $('#dotTrangThai').toggleClass('active', !isDefault && selectedTrangThais.length > 0);
        loadTable(1);
    });

    // 10. Quản lý Dropdown chọn nhân sự phụ trách kho
    function updateUserSelectionState() {
        let count = 0;
        const selectedUsers = [];
        $('.kho-user-dropdown-item').each(function () {
            const chk = $(this).find('.kho-user-chk');
            const name = $(this).data('name') || '';
            const role = $(this).data('role') || '';
            const id = $(this).data('id');
            const isManager = role === 'Quản lý' || chk.is(':disabled');

            if (chk.is(':checked')) {
                $(this).addClass('selected');
                count++;
                selectedUsers.push({ id: id, name: name, role: role, isManager: isManager });
            } else {
                $(this).removeClass('selected');
            }
        });

        // Cập nhật badge số lượng
        $('#selectedUserBadge').text(count + ' nhân sự');

        // Cập nhật nội dung hiển thị trong Trigger Box
        const displayBox = $('#khoUserSelectedDisplay');
        if (count === 0) {
            displayBox.html('<span class="text-muted">Chọn nhân sự phụ trách kho...</span>');
        } else if (count <= 3) {
            let html = '';
            selectedUsers.forEach(function (u) {
                html += `<span class="kho-user-chip" data-id="${u.id}">
                            <i class="bi bi-person-fill text-primary" style="font-size: 11px;"></i>
                            <span>${u.name}</span>
                            ${!u.isManager ? `<button type="button" class="btn-remove-chip" data-id="${u.id}" title="Bỏ chọn">&times;</button>` : ''}
                         </span>`;
            });
            displayBox.html(html);
        } else {
            let html = '';
            // Hiện 2 người đầu kèm badge +X
            selectedUsers.slice(0, 2).forEach(function (u) {
                html += `<span class="kho-user-chip" data-id="${u.id}">
                            <i class="bi bi-person-fill text-primary" style="font-size: 11px;"></i>
                            <span>${u.name}</span>
                            ${!u.isManager ? `<button type="button" class="btn-remove-chip" data-id="${u.id}" title="Bỏ chọn">&times;</button>` : ''}
                         </span>`;
            });
            html += `<span class="badge bg-secondary-subtle text-secondary border ms-1" style="font-size: 11px; padding: 3px 6px;">+${count - 2} nhân sự khác</span>`;
            displayBox.html(html);
        }
    }

    // Mở / Đóng Dropdown
    $('#khoUserDropdownTrigger').on('click', function (e) {
        if ($(e.target).closest('.btn-remove-chip').length) return;
        e.stopPropagation();
        const wrap = $('#khoUserSelectWrap');
        const menu = $('#khoUserDropdownMenu');
        const isOpen = wrap.hasClass('open');

        if (isOpen) {
            wrap.removeClass('open');
            menu.hide();
        } else {
            wrap.addClass('open');
            menu.show();
            $('#searchUserInDropdown').val('').trigger('input').focus();
        }
    });

    // Bỏ chọn nhanh bằng nút X trên chip
    $(document).on('click', '.btn-remove-chip', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        const chk = $(`#chkUser_${id}`);
        if (chk.length && !chk.is(':disabled')) {
            chk.prop('checked', false);
            updateUserSelectionState();
        }
    });

    // Đóng Dropdown khi click ra ngoài
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#khoUserSelectWrap').length) {
            $('#khoUserSelectWrap').removeClass('open');
            $('#khoUserDropdownMenu').hide();
        }
    });

    // Tìm kiếm trong dropdown
    $('#searchUserInDropdown').on('input', function () {
        const kw = $(this).val().toLowerCase().trim();
        $('.kho-user-dropdown-item').each(function () {
            const name = String($(this).data('name') || '').toLowerCase();
            const username = String($(this).data('username') || '').toLowerCase();
            const match = !kw || name.includes(kw) || username.includes(kw);
            $(this).toggle(match);
        });
    });

    // Click chọn dòng trong dropdown
    $(document).on('click', '.kho-user-dropdown-item', function (e) {
        if ($(e.target).is('input[type="checkbox"]')) {
            updateUserSelectionState();
            return;
        }
        const chk = $(this).find('.kho-user-chk');
        if (chk.is(':disabled')) return; // Quản lý luôn được tick cố định
        chk.prop('checked', !chk.is(':checked'));
        updateUserSelectionState();
    });

    $(document).on('change', '.kho-user-chk', function () {
        updateUserSelectionState();
    });

    // Nút Chọn tất cả trong dropdown
    $('#btnDropdownSelectAll').on('click', function (e) {
        e.stopPropagation();
        $('.kho-user-chk').prop('checked', true);
        updateUserSelectionState();
    });

    // Nút Bỏ chọn trong dropdown
    $('#btnDropdownDeselectAll').on('click', function (e) {
        e.stopPropagation();
        $('.kho-user-chk:not(:disabled)').prop('checked', false);
        updateUserSelectionState();
    });

    // Trạng thái checkbox ở chân modal
    $('#khoTrangThaiChk').on('change', function () {
        const isChecked = $(this).is(':checked');
        $('#khoTrangThaiText').text(isChecked ? 'Đang hoạt động' : 'Ngừng hoạt động');
    });

    // Helper kích hoạt lại Tab Thông tin
    function resetModalTabs() {
        $('#khoModalOv .hh-tab').removeClass('on');
        $('#khoModalOv .hh-tab[data-tab="info"]').addClass('on');
        $('#khoModalOv .hh-pane').removeClass('on');
        $('#kho-pane-info').addClass('on');
    }

    // 11. Mở Modal Thêm mới chi nhánh kho
    $('#btnOpenCreateKhoModal').on('click', function () {
        resetUserDropdown();
        $('#khoFormAlert').addClass('d-none').text('');
        $('.hh-f').removeClass('invalid');
        $('#khoMaKho').val('0');
        $('#khoMaKhoDisplay').val('');
        $('#badgeAutoCode').removeClass('d-none');
        $('#khoTenKho').val('');
        $('#khoDiaChi').val('');
        $('#khoMoTaRte').html('');
        $('#khoTrangThaiChk').prop('checked', true);
        $('#khoTrangThaiText').text('Đang hoạt động');

        // Mặc định chọn các tài khoản Quản lý
        $('.kho-user-chk').each(function () {
            if ($(this).is(':disabled')) {
                $(this).prop('checked', true);
            } else {
                $(this).prop('checked', false);
            }
        });
        updateUserSelectionState();
        resetModalTabs();

        $('#khoModalTitle').text('Thêm mới chi nhánh kho');
        showOverlay('khoModalOv');
        setTimeout(() => $('#khoTenKho').focus(), 150);
    });

    // 12. Mở Modal Cập nhật chi nhánh kho
    $(document).on('click', '.btn-edit-kho', function () {
        const id = $(this).data('id');
        resetUserDropdown();
        $('#khoFormAlert').addClass('d-none').text('');
        $('.hh-f').removeClass('invalid');

        $.ajax({
            url: '/Kho/GetItem?id=' + id,
            type: 'GET',
            success: function (res) {
                if (!res.success) {
                    if (window.AppToast) AppToast.error(res.message);
                    return;
                }
                const d = res.data;
                $('#khoMaKho').val(d.maKho);
                $('#khoMaKhoDisplay').val('KHO-' + String(d.maKho).padStart(2, '0'));
                $('#badgeAutoCode').addClass('d-none');
                $('#khoTenKho').val(d.tenKho);
                $('#khoDiaChi').val(d.diaChi || '');
                $('#khoMoTaRte').html(d.moTa || '');
                $('#khoTrangThaiChk').prop('checked', d.trangThai === 'HOAT_DONG');
                $('#khoTrangThaiText').text(d.trangThai === 'HOAT_DONG' ? 'Đang hoạt động' : 'Ngừng hoạt động');

                // Tick các tài khoản đã được phân công
                $('.kho-user-chk').each(function () {
                    if ($(this).is(':disabled')) {
                        $(this).prop('checked', true);
                    } else {
                        const val = parseInt($(this).val());
                        $(this).prop('checked', d.taiKhoanIds && d.taiKhoanIds.includes(val));
                    }
                });
                updateUserSelectionState();
                resetModalTabs();

                $('#khoModalTitle').text('Cập nhật chi nhánh kho: ' + d.tenKho);
                showOverlay('khoModalOv');
                setTimeout(() => $('#khoTenKho').focus(), 150);
            },
            error: function () {
                if (window.AppToast) AppToast.error('Không thể lấy thông tin chi nhánh kho.');
            }
        });
    });

    // 13. Hàm lưu Chi nhánh kho chung hỗ trợ các chế độ (close, again, copy)
    function doSaveKho(actionType) {
        const maKho = parseInt($('#khoMaKho').val()) || 0;
        const tenKho = $('#khoTenKho').val().trim();
        const diaChi = $('#khoDiaChi').val().trim();
        const moTa = $('#khoMoTaRte').html().trim();
        const trangThai = $('#khoTrangThaiChk').is(':checked') ? 'HOAT_DONG' : 'NGUNG_HOAT_DONG';
        const taiKhoanIds = $('.kho-user-chk:checked').map(function () {
            return parseInt($(this).val());
        }).get();

        const alertBox = $('#khoFormAlert');
        alertBox.addClass('d-none').text('');
        $('.hh-f').removeClass('invalid');

        if (!tenKho) {
            resetModalTabs();
            $('#fldTenKho').addClass('invalid');
            $('#khoTenKho').focus();
            return;
        }

        const payload = {
            maKho: maKho,
            tenKho: tenKho,
            diaChi: diaChi || null,
            moTa: moTa || null,
            trangThai: trangThai,
            taiKhoanIds: taiKhoanIds
        };

        const btnSave = $('#btnSaveKho');
        const originalHtml = btnSave.html();
        btnSave.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Đang lưu...');
        $('#btnSaveKhoAndNew, #btnSaveKhoCopy, #btnKhoCaret').prop('disabled', true);

        const url = maKho === 0 ? '/Kho/Create' : '/Kho/Edit';

        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (res) {
                btnSave.prop('disabled', false).html(originalHtml);
                $('#btnSaveKhoAndNew, #btnSaveKhoCopy, #btnKhoCaret').prop('disabled', false);

                if (res.success) {
                    if (window.AppToast) AppToast.success(res.message);
                    loadTable(maKho === 0 ? 1 : currentPage);

                    if (actionType === 'again') {
                        // Lưu và tạo thêm kho mới
                        $('#khoMaKho').val('0');
                        $('#khoMaKhoDisplay').val('');
                        $('#badgeAutoCode').removeClass('d-none');
                        $('#khoTenKho').val('');
                        $('#khoDiaChi').val('');
                        $('#khoMoTaRte').html('');
                        $('#khoTrangThaiChk').prop('checked', true);
                        $('#khoTrangThaiText').text('Đang hoạt động');
                        resetModalTabs();
                        $('#khoModalTitle').text('Thêm mới chi nhánh kho');
                        $('#khoTenKho').focus();
                    } else if (actionType === 'copy') {
                        // Lưu và sao chép để tạo kho tiếp theo tương tự
                        $('#khoMaKho').val('0');
                        $('#khoMaKhoDisplay').val('');
                        $('#badgeAutoCode').removeClass('d-none');
                        $('#khoTenKho').val(tenKho + ' - Sao chép').focus().select();
                        resetModalTabs();
                        $('#khoModalTitle').text('Thêm mới chi nhánh kho (Sao chép)');
                    } else {
                        // Lưu và đóng modal
                        hideOverlay('khoModalOv');
                    }
                } else {
                    alertBox.removeClass('d-none').html(res.message);
                }
            },
            error: function (xhr) {
                btnSave.prop('disabled', false).html(originalHtml);
                $('#btnSaveKhoAndNew, #btnSaveKhoCopy, #btnKhoCaret').prop('disabled', false);
                let errMsg = 'Lỗi hệ thống';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errMsg = xhr.responseJSON.message;
                } else if (xhr.responseText && xhr.responseText.length < 500 && !xhr.responseText.includes('<!DOCTYPE')) {
                    errMsg = xhr.responseText;
                } else if (xhr.statusText) {
                    errMsg += ': ' + xhr.statusText;
                }
                alertBox.removeClass('d-none').html(errMsg);
            }
        });
    }

    // Gắn sự kiện các nút lưu
    $('#btnSaveKho').on('click', function () {
        doSaveKho('close');
    });

    $('#btnSaveKhoAndNew').on('click', function () {
        doSaveKho('again');
    });

    $('#btnSaveKhoCopy').on('click', function () {
        $('#khoSplitMenu').removeClass('show');
        doSaveKho('copy');
    });

    // 14. Chuyển đổi trạng thái nhanh (Kích hoạt / Ngừng hoạt động kho)
    $(document).on('click', '.btn-toggle-status', function () {
        const id = $(this).data('id');
        const name = $(this).data('name') || '';
        const currentStatus = $(this).data('status');
        const isDisabling = currentStatus === 'HOAT_DONG';
        const actionTitle = isDisabling ? 'Ngừng hoạt động (khóa) kho' : 'Kích hoạt lại kho';
        const safeName = $('<div>').text(name).html();

        const doToggle = function () {
            $.ajax({
                url: '/Kho/ToggleStatus?id=' + id,
                type: 'POST',
                success: function (res) {
                    if (res.success) {
                        if (window.AppToast) AppToast.success(res.message);
                        loadTable(currentPage);
                    } else {
                        if (window.AppToast) AppToast.error(res.message);
                    }
                },
                error: function (xhr) {
                    if (window.AppToast) AppToast.error(xhr.responseJSON?.message || 'Không thể thực hiện thao tác.');
                }
            });
        };

        if (window.AppConfirm && typeof window.AppConfirm.show === 'function') {
            window.AppConfirm.show({
                title: actionTitle,
                icon: isDisabling ? 'bi-lock-fill' : 'bi-unlock-fill',
                iconColor: isDisabling ? '#dc2626' : '#0d6efd',
                message: isDisabling
                    ? `Bạn có chắc chắn muốn <strong>ngừng hoạt động (khóa) chi nhánh kho</strong> <strong>${safeName}</strong> không?<br><span class="text-muted small mt-1 d-block">Sau khi ngừng hoạt động, nhân viên sẽ không thể tạo mới các chứng từ trên kho này.</span>`
                    : `Bạn có chắc chắn muốn <strong>kích hoạt chi nhánh kho</strong> <strong>${safeName}</strong> hoạt động trở lại không?`,
                confirmText: isDisabling ? 'Đồng ý ngừng hoạt động' : 'Đồng ý kích hoạt',
                confirmClass: isDisabling ? 'btn btn-danger' : 'btn btn-primary',
                cancelText: 'Bỏ qua',
                onConfirm: doToggle
            });
        } else {
            doToggle();
        }
    });

    // 15. Xóa chi nhánh kho (Nếu chưa có chứng từ -> Xóa vĩnh viễn; Nếu đã có chứng từ -> Chặn và hỏi chuyển sang Ngừng hoạt động / Khóa)
    $(document).on('click', '.btn-delete-kho', function () {
        const id = $(this).data('id');
        const name = $(this).data('name') || '';
        const safeName = $('<div>').text(name).html();

        const executeDelete = function (chuyenKhoa = false) {
            $.ajax({
                url: '/Kho/Delete?id=' + id + (chuyenKhoa ? '&chuyenKhoa=true' : ''),
                type: 'POST',
                success: function (res) {
                    if (res.success) {
                        if (window.AppToast) AppToast.success(res.message);
                        loadTable(currentPage);
                    } else if (res.hasTransaction) {
                        if (res.isLocked) {
                            if (window.AppToast) {
                                AppToast.warning(`Chi nhánh kho <b>${safeName}</b> đã phát sinh chứng từ và hiện đang ở trạng thái <b>Ngừng hoạt động</b>, không thể xóa vĩnh viễn.`);
                            }
                        } else {
                            setTimeout(function () {
                                if (window.AppConfirm && typeof window.AppConfirm.show === 'function') {
                                    window.AppConfirm.show({
                                        title: 'Không thể xóa chi nhánh kho',
                                        icon: 'bi-shield-exclamation',
                                        iconColor: '#f59e0b',
                                        message: `Chi nhánh kho <strong>${safeName}</strong> đã phát sinh chứng từ trong hệ thống nên <strong>không thể xóa vĩnh viễn</strong> để bảo toàn lịch sử dữ liệu.<br><br>Bạn có muốn chuyển sang <strong>NGỪNG HOẠT ĐỘNG (KHÓA KHO)</strong> để ngừng phân bổ chứng từ mới không?`,
                                        confirmText: 'Ngừng hoạt động kho',
                                        confirmClass: 'btn btn-warning text-dark fw-semibold',
                                        cancelText: 'Bỏ qua',
                                        onConfirm: function () {
                                            executeDelete(true);
                                        }
                                    });
                                } else {
                                    if (window.AppToast) AppToast.warning(res.message);
                                }
                            }, 200);
                        }
                    } else {
                        if (window.AppToast) AppToast.error(res.message);
                    }
                },
                error: function (xhr) {
                    if (window.AppToast) AppToast.error(xhr.responseJSON?.message || 'Không thể thực hiện thao tác xóa.');
                }
            });
        };

        if (window.AppConfirm && typeof window.AppConfirm.show === 'function') {
            window.AppConfirm.show({
                title: 'Xóa chi nhánh kho',
                icon: 'bi-trash3-fill',
                iconColor: '#dc2626',
                message: `Bạn có chắc chắn muốn xóa chi nhánh kho <strong>${safeName}</strong> không?<br><span class="text-muted small mt-1 d-block">Lưu ý: Chỉ chi nhánh kho chưa từng phát sinh chứng từ mới có thể xóa hoàn toàn khỏi hệ thống.</span>`,
                confirmText: 'Đồng ý xóa',
                confirmClass: 'btn btn-danger',
                cancelText: 'Bỏ qua',
                onConfirm: function () {
                    executeDelete(false);
                }
            });
        } else {
            executeDelete(false);
        }
    });

})(jQuery);
