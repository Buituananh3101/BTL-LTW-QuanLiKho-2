/**
 * nguoi-dung-index.js - Quản lý tương tác màn hình Người dùng & Phân quyền
 * Chuẩn hóa 100% theo khuôn mẫu chuyên nghiệp LEGO
 */
(function ($) {
    'use strict';

    // 1. Quản lý trạng thái bộ lọc
    let currentPage = 1;
    let selectedVaiTroIds = [];
    let selectedKhoIds = [];
    let selectedTrangThais = ['HOAT_DONG'];
    let vaiTroNames = {};
    let khoNames = {};
    let currentSortBy = '';
    let currentSortDir = '';

    // 2. Khởi tạo Sidebar thu gọn (F4)
    if (window.KiotFilter) {
        KiotFilter.initSidebar({
            storageKey: 'kiot_user_sidebar'
        });
    }

    // 3. Helper modal overlay chuyên nghiệp
    function showOverlay(id) {
        const ov = document.getElementById(id);
        if (ov) ov.classList.add('show');
    }

    function hideOverlay(id) {
        const ov = document.getElementById(id);
        if (ov) ov.classList.remove('show');
    }

    // Đóng modal khi bấm nút [data-close] hoặc click nền mờ
    $(document).on('click', '[data-close]', function () {
        const targetId = $(this).data('close');
        hideOverlay(targetId);
    });

    $('.hh-ov').on('click', function (e) {
        if (e.target === this) {
            $(this).removeClass('show');
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            $('.hh-ov.show').removeClass('show');
        }
    });

    // 4. Token CSRF
    function getCsrfToken() {
        return $('input[name="__RequestVerificationToken"]').first().val() ||
               $('input[name="__RequestVerificationToken"]', '#userForm').val() || '';
    }

    // 5. Nạp bảng dữ liệu AJAX
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

        selectedVaiTroIds.forEach(id => params.append('VaiTroIds', id));
        selectedKhoIds.forEach(id => params.append('KhoIds', id));
        selectedTrangThais.forEach(st => params.append('TrangThais', st));

        $('#userTableContainer').css('opacity', '0.5');

        $.ajax({
            url: '/NguoiDung/Filter?' + params.toString(),
            type: 'GET',
            success: function (html) {
                $('#userTableContainer').html(html).css('opacity', '1');
            },
            error: function () {
                $('#userTableContainer').css('opacity', '1');
                if (window.KiotToast) KiotToast.error('Không thể tải dữ liệu người dùng.');
            }
        });
    }

    // 5.1. Bắt sự kiện click sắp xếp cột 3 trạng thái chuẩn kiểm kho (Không sort -> ASC -> DESC -> Không sort)
    $(document).on('click', '#userTable thead th.sortable-th', function (e) {
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

    // Tìm kiếm F3 (Debounce 350ms)
    $('#keywordSearch').on('input', KiotFilter.debounce(function () {
        loadTable(1);
    }, 350));

    $(document).on('keydown', function (e) {
        if (e.key === 'F3') {
            e.preventDefault();
            $('#keywordSearch').focus().select();
        }
    });

    // Nút tải lại bảng
    $('#btnReloadTable').on('click', function () {
        loadTable(1);
        if (window.KiotToast) KiotToast.info('Đã làm mới dữ liệu.');
    });

    // Phân trang AJAX
    if (window.KiotFilter && KiotFilter.bindPagination) {
        KiotFilter.bindPagination('#userTableContainer', function (page) {
            loadTable(page);
        });
    } else {
        $(document).on('click', '.page-ajax', function (e) {
            e.preventDefault();
            const page = parseInt($(this).data('page'));
            if (!isNaN(page) && page > 0) loadTable(page);
        });
    }

    // 6. Xử lý bộ lọc Sidebar (Lego hệ thống)
    function renderMultiSelect(boxSelector, dropdownSelector, selectedIds, namesMap, dotSelector, placeholder) {
        const $box = $(boxSelector);
        const $dropdown = $(dropdownSelector);
        if (!$box.length || !$dropdown.length) return;

        if (dotSelector) {
            $(dotSelector).toggleClass('active', selectedIds.length > 0);
        }

        $dropdown.find('.kiot-ms-item').each(function () {
            const val = parseInt($(this).data('val'), 10);
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
        } else {
            if (selectedItems.length === 0) {
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
    }

    function renderVaiTroMultiSelect() {
        renderMultiSelect('#boxVaiTro', '#dropdownVaiTro', selectedVaiTroIds, vaiTroNames, '#dotVaiTro', 'Chọn vai trò');
    }

    function renderKhoMultiSelect() {
        renderMultiSelect('#boxKho', '#dropdownKho', selectedKhoIds, khoNames, '#dotKho', 'Chọn chi nhánh kho');
    }

    function setupMultiSelectDropdown(boxSelector, dropdownSelector, selectedIds, namesMap, renderFn) {
        const $box = $(boxSelector);
        const $dropdown = $(dropdownSelector);
        if (!$box.length || !$dropdown.length) return;

        // Cache trước tên từ các mục trong dropdown HTML
        $dropdown.find('.kiot-ms-item').each(function () {
            const val = parseInt($(this).data('val'), 10);
            const name = $(this).data('name') || $(this).find('.kiot-ms-text').text().trim() || $(this).find('span').text().trim();
            if (!isNaN(val) && name) namesMap[val] = name;
        });

        // 1. Click vào box để mở / đóng dropdown
        $box.on('click', function (e) {
            const $tagRemove = $(e.target).closest('.tag-remove, .kiot-tag-close');
            if ($tagRemove.length) {
                e.stopPropagation();
                const $pill = $tagRemove.closest('.kiot-pill-tag').length ? $tagRemove.closest('.kiot-pill-tag') : $tagRemove;
                const val = parseInt($pill.data('val'), 10);
                const idx = selectedIds.indexOf(val);
                if (idx !== -1) {
                    selectedIds.splice(idx, 1);
                    renderFn();
                    loadTable(1);
                }
                return;
            }

            e.stopPropagation();

            $('.kiot-ms-dropdown').not($dropdown).removeClass('show drop-up').css('max-height', '');
            $('.kiot-multiselect-box').not($box).removeClass('open');

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
            const val = parseInt($(this).data('val'), 10);
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
            loadTable(1);
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

    // Khởi tạo các Multi-Select
    setupMultiSelectDropdown('#boxVaiTro', '#dropdownVaiTro', selectedVaiTroIds, vaiTroNames, renderVaiTroMultiSelect);
    setupMultiSelectDropdown('#boxKho', '#dropdownKho', selectedKhoIds, khoNames, renderKhoMultiSelect);
    renderVaiTroMultiSelect();
    renderKhoMultiSelect();

    // Checkbox Trạng thái
    $(document).on('change', '#sidebarFilterCol input[data-s]', function () {
        selectedTrangThais = $('#sidebarFilterCol input[data-s]:checked').map(function () {
            return $(this).data('s');
        }).get();
        const isDefault = selectedTrangThais.length === 1 && selectedTrangThais[0] === 'HOAT_DONG';
        $('#dotTrangThai').toggleClass('active', !isDefault && selectedTrangThais.length > 0);
        loadTable(1);
    });

    // Đóng các dropdown khi click ra ngoài
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.kiot-multiselect-box, .kiot-ms-dropdown').length) {
            $('.kiot-ms-dropdown').removeClass('show drop-up').css('max-height', '');
            $('.kiot-multiselect-box').removeClass('open');
        }
    });

    // 7. Toggle ẩn/hiện mật khẩu
    function setupPasswordToggle(btnId, inputId, iconId) {
        $(btnId).on('click', function () {
            const input = $(inputId);
            const icon = $(iconId);
            const isPassword = input.attr('type') === 'password';
            input.attr('type', isPassword ? 'text' : 'password');
            icon.toggleClass('bi-eye bi-eye-slash');
        });
    }
    setupPasswordToggle('#btnToggleUserPw', '#userMatKhau', '#iconUserPw');
    setupPasswordToggle('#btnToggleNewPw', '#pwdMatKhauMoi', '#iconNewPw');

    // 8. Cập nhật số lượng kho được chọn & class selected
    function updateWarehouseSelectionState() {
        let count = 0;
        $('.kho-card-item').each(function () {
            const chk = $(this).find('.user-kho-chk');
            if (chk.is(':checked')) {
                $(this).addClass('selected');
                count++;
            } else {
                $(this).removeClass('selected');
            }
        });
        $('#selectedWarehouseCount').text(count + ' kho');
    }

    $(document).on('click', '.kho-card-item', function (e) {
        if ($(e.target).is('input[type="checkbox"]')) {
            updateWarehouseSelectionState();
            return;
        }
        const chk = $(this).find('.user-kho-chk');
        chk.prop('checked', !chk.is(':checked'));
        updateWarehouseSelectionState();
    });

    $(document).on('change', '.user-kho-chk', function () {
        updateWarehouseSelectionState();
    });

    $('#btnSelectAllKho').on('click', function () {
        $('.user-kho-chk').prop('checked', true);
        updateWarehouseSelectionState();
    });

    $('#btnDeselectAllKho').on('click', function () {
        $('.user-kho-chk').prop('checked', false);
        updateWarehouseSelectionState();
    });

    const ADMIN_DEFAULT_NOTE = 'Tài khoản có vai trò Quản lý mặc định có toàn quyền thao tác trên toàn bộ các chi nhánh kho trong hệ thống.';

    // 9. Cập nhật phân quyền theo Vai trò
    function updateRoleDescription() {
        const sel = $('#userMaVaiTro');
        const roleText = sel.find('option:selected').data('name') || sel.find('option:selected').text();
        const roleVal = parseInt(sel.val()) || 0;
        const currentGhiChu = ($('#userGhiChu').val() || '').trim();

        if (roleText.includes('Quản lý') || roleVal === 1) {
            $('.user-kho-chk').prop('checked', true);
            updateWarehouseSelectionState();
            if (!currentGhiChu) {
                $('#userGhiChu').val(ADMIN_DEFAULT_NOTE);
            }
        } else {
            if (currentGhiChu === ADMIN_DEFAULT_NOTE) {
                $('#userGhiChu').val('');
            }
        }
    }

    $('#userMaVaiTro').on('change', updateRoleDescription);

    // Trạng thái checkbox ở chân modal
    $('#userTrangThaiChk').on('change', function () {
        const isChecked = $(this).is(':checked');
        $('#userTrangThaiText').text(isChecked ? 'Đang hoạt động' : 'Khóa tài khoản');
    });

    // 10. Mở Modal Thêm mới người dùng
    $('#btnOpenCreateUserModal').on('click', function () {
        $('#userFormAlert').addClass('d-none').text('');
        $('.hh-f').removeClass('invalid');
        $('#userMaTaiKhoan').val('0');
        $('#userMaNv').val('0');
        $('#userHoTen').val('');
        $('#userDienThoai').val('');
        $('#userEmail').val('');
        $('#userDiaChi').val('');
        $('#userGhiChu').val('');
        $('#userTenDangNhap').val('').prop('disabled', false);
        $('#badgeFixedUsername').addClass('d-none');
        $('#userMatKhau').val('').attr('type', 'password');
        $('#iconUserPw').removeClass('bi-eye-slash').addClass('bi-eye');
        $('#userMatKhauRequired').show();
        $('#userMatKhauHint').text('(Tối thiểu 6 ký tự)');
        $('#userMaVaiTro').val('2'); // Mặc định Thủ kho
        $('#userTrangThaiChk').prop('checked', true);
        $('#userTrangThaiText').text('Đang hoạt động');

        // Mặc định chọn kho đầu tiên
        $('.user-kho-chk').prop('checked', false);
        $('.user-kho-chk').first().prop('checked', true);
        updateWarehouseSelectionState();
        updateRoleDescription();

        $('#userModalTitle').text('Thêm mới người dùng');
        showOverlay('userModalOv');
        setTimeout(() => $('#userTenDangNhap').focus(), 150);
    });

    // 11. Mở Modal Cập nhật người dùng
    $(document).on('click', '.btn-edit-user', function () {
        const id = $(this).data('id');
        $('#userFormAlert').addClass('d-none').text('');
        $('.hh-f').removeClass('invalid');

        $.ajax({
            url: '/NguoiDung/GetItem?id=' + id,
            type: 'GET',
            success: function (res) {
                if (!res.success) {
                    if (window.KiotToast) KiotToast.error(res.message);
                    return;
                }
                const d = res.data;
                $('#userMaTaiKhoan').val(d.maTaiKhoan);
                $('#userMaNv').val(d.maNv);
                $('#userHoTen').val(d.hoTen);
                $('#userDienThoai').val(d.dienThoai || '');
                $('#userEmail').val(d.email || '');
                $('#userDiaChi').val(d.diaChi || '');
                $('#userGhiChu').val(d.ghiChu || '');
                $('#userTenDangNhap').val(d.tenDangNhap).prop('disabled', true);
                $('#badgeFixedUsername').removeClass('d-none');
                $('#userMatKhau').val('').attr('type', 'password');
                $('#iconUserPw').removeClass('bi-eye-slash').addClass('bi-eye');
                $('#userMatKhauRequired').hide();
                $('#userMatKhauHint').text('(Để trống nếu không đổi)');
                $('#userMaVaiTro').val(d.maVaiTro);
                $('#userTrangThaiChk').prop('checked', d.trangThai === 'HOAT_DONG');
                $('#userTrangThaiText').text(d.trangThai === 'HOAT_DONG' ? 'Đang hoạt động' : 'Khóa tài khoản');

                // Tick các kho đã phân công
                $('.user-kho-chk').prop('checked', false);
                if (d.khoIds && d.khoIds.length) {
                    d.khoIds.forEach(kId => {
                        $(`#chkKho_${kId}`).prop('checked', true);
                    });
                }
                updateWarehouseSelectionState();
                updateRoleDescription();

                $('#userModalTitle').text('Cập nhật người dùng: ' + d.tenDangNhap);
                showOverlay('userModalOv');
                setTimeout(() => $('#userHoTen').focus(), 150);
            },
            error: function () {
                if (window.KiotToast) KiotToast.error('Không thể lấy thông tin người dùng.');
            }
        });
    });

    // 11.1. Lưu Người dùng (Thêm mới / Cập nhật)
    $('#btnSaveUser').on('click', function () {
        const maTaiKhoan = parseInt($('#userMaTaiKhoan').val()) || 0;
        const hoTen = $('#userHoTen').val().trim();
        const dienThoai = $('#userDienThoai').val().trim();
        const email = $('#userEmail').val().trim();
        const diaChi = $('#userDiaChi').val().trim();
        const ghiChu = $('#userGhiChu').val().trim();
        const tenDangNhap = $('#userTenDangNhap').val().trim();
        const matKhau = ($('#userMatKhau').val() || '').trim();
        const maVaiTro = parseInt($('#userMaVaiTro').val()) || 0;
        const trangThai = $('#userTrangThaiChk').is(':checked') ? 'HOAT_DONG' : 'KHOA';
        const khoIds = $('.user-kho-chk:checked').map(function () {
            return parseInt($(this).val());
        }).get();

        const alertBox = $('#userFormAlert');
        alertBox.addClass('d-none').text('');
        $('.hh-f').removeClass('invalid');

        // Validation client-side với class .invalid của hang-hoa-form.css
        if (!tenDangNhap) {
            $('#fldTenDangNhap').addClass('invalid');
            $('#userTenDangNhap').focus();
            return;
        }

        const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
        if (!usernameRegex.test(tenDangNhap) || tenDangNhap.length < 3) {
            $('#fldTenDangNhap').addClass('invalid');
            $('#userTenDangNhap').focus();
            return;
        }

        if (maTaiKhoan === 0 && (!matKhau || matKhau.length < 6)) {
            $('#fldMatKhau').addClass('invalid');
            $('#userMatKhau').focus();
            return;
        }

        if (maTaiKhoan > 0 && matKhau && matKhau.length < 6) {
            $('#fldMatKhau').addClass('invalid');
            $('#userMatKhau').focus();
            return;
        }

        if (!hoTen) {
            $('#fldHoTen').addClass('invalid');
            $('#userHoTen').focus();
            return;
        }

        const roleText = $('#userMaVaiTro option:selected').data('name') || $('#userMaVaiTro option:selected').text();
        const isAdmin = roleText.includes('Quản lý') || maVaiTro === 1;

        if (!isAdmin && khoIds.length === 0) {
            alertBox.removeClass('d-none').text('Vui lòng phân công ít nhất một chi nhánh kho làm việc.');
            return;
        }

        const payload = {
            maTaiKhoan: maTaiKhoan,
            maNv: parseInt($('#userMaNv').val()) || 0,
            hoTen: hoTen,
            dienThoai: dienThoai || null,
            email: email || null,
            diaChi: diaChi || null,
            ghiChu: ghiChu || null,
            tenDangNhap: tenDangNhap,
            matKhau: matKhau || null,
            maVaiTro: maVaiTro,
            trangThai: trangThai,
            khoIds: khoIds
        };

        const btn = $(this);
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Đang lưu...');

        const url = maTaiKhoan === 0 ? '/NguoiDung/Create' : '/NguoiDung/Edit';

        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (res) {
                btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Lưu người dùng');
                if (res.success) {
                    hideOverlay('userModalOv');
                    if (window.KiotToast) KiotToast.success(res.message);
                    loadTable(maTaiKhoan === 0 ? 1 : currentPage);
                } else {
                    alertBox.removeClass('d-none').html(res.message);
                }
            },
            error: function (xhr) {
                btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Lưu người dùng');
                let errMsg = 'Lỗi hệ thống';
                if (xhr.responseJSON) {
                    if (xhr.responseJSON.message) {
                        errMsg = xhr.responseJSON.message;
                    } else if (xhr.responseJSON.errors) {
                        errMsg = Object.values(xhr.responseJSON.errors).flat().join('<br/>');
                    } else if (xhr.responseJSON.title) {
                        errMsg = xhr.responseJSON.title;
                    }
                } else if (xhr.responseText && xhr.responseText.length < 500 && !xhr.responseText.includes('<!DOCTYPE')) {
                    errMsg = xhr.responseText;
                } else if (xhr.statusText) {
                    errMsg += ': ' + xhr.statusText;
                }
                alertBox.removeClass('d-none').html(errMsg);
            }
        });
    });

    // 12. Khóa / Mở khóa tài khoản
    $(document).on('click', '.btn-toggle-status', function () {
        const id = $(this).data('id');
        const username = $(this).data('username') || '';
        const currentStatus = $(this).data('status');
        const isLocking = currentStatus === 'HOAT_DONG';
        const actionTitle = isLocking ? 'Khóa tài khoản' : 'Mở khóa tài khoản';
        const safeUsername = $('<div>').text(username).html();

        const doToggle = function () {
            $.ajax({
                url: '/NguoiDung/ToggleStatus?id=' + id,
                type: 'POST',
                success: function (res) {
                    if (res.success) {
                        if (window.KiotToast) KiotToast.success(res.message);
                        loadTable(currentPage);
                    } else {
                        if (window.KiotToast) KiotToast.error(res.message);
                    }
                },
                error: function (xhr) {
                    if (window.KiotToast) KiotToast.error(xhr.responseJSON?.message || 'Không thể thực hiện thao tác.');
                }
            });
        };

        if (window.KiotConfirm && typeof window.KiotConfirm.show === 'function') {
            window.KiotConfirm.show({
                title: actionTitle,
                icon: isLocking ? 'bi-lock-fill' : 'bi-unlock-fill',
                iconColor: isLocking ? '#dc2626' : '#0d6efd',
                message: isLocking
                    ? `Bạn có chắc chắn muốn <strong>khóa tài khoản</strong> của người dùng <strong>${safeUsername}</strong> không?<br><span class="text-muted small mt-1 d-block">Sau khi khóa, người dùng này sẽ không thể đăng nhập vào hệ thống.</span>`
                    : `Bạn có chắc chắn muốn <strong>mở khóa tài khoản</strong> của người dùng <strong>${safeUsername}</strong> không?<br><span class="text-muted small mt-1 d-block">Người dùng này sẽ có thể đăng nhập và tiếp tục thao tác trên hệ thống.</span>`,
                confirmText: isLocking ? 'Đồng ý khóa' : 'Đồng ý mở khóa',
                confirmClass: isLocking ? 'btn btn-danger' : 'btn btn-primary',
                cancelText: 'Bỏ qua',
                onConfirm: doToggle
            });
        } else {
            doToggle();
        }
    });

    // 13. Mở Modal Đổi mật khẩu
    $(document).on('click', '.btn-reset-pwd', function () {
        const id = $(this).data('id');
        const username = $(this).data('username');

        $('#pwdFormAlert').addClass('d-none').text('');
        $('#pwdMaTaiKhoan').val(id);
        $('#pwdTenDangNhapText').text(username);
        $('#pwdMatKhauMoi').val('').attr('type', 'password');
        $('#pwdXacNhanMatKhau').val('');
        $('#iconNewPw').removeClass('bi-eye-slash').addClass('bi-eye');

        showOverlay('pwdModalOv');
        setTimeout(() => $('#pwdMatKhauMoi').focus(), 150);
    });

    // 14. Lưu Đổi mật khẩu
    $('#btnSavePassword').on('click', function () {
        const id = parseInt($('#pwdMaTaiKhoan').val()) || 0;
        const newPw = ($('#pwdMatKhauMoi').val() || '').trim();
        const confirmPw = ($('#pwdXacNhanMatKhau').val() || '').trim();
        const alertBox = $('#pwdFormAlert');
        alertBox.addClass('d-none').text('');

        if (!newPw || newPw.length < 6) {
            alertBox.removeClass('d-none').text('Mật khẩu mới phải có ít nhất 6 ký tự.');
            $('#pwdMatKhauMoi').focus();
            return;
        }

        if (newPw !== confirmPw) {
            alertBox.removeClass('d-none').text('Mật khẩu xác nhận không khớp.');
            $('#pwdXacNhanMatKhau').focus();
            return;
        }

        const btn = $(this);
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Đang lưu...');

        $.ajax({
            url: '/NguoiDung/ResetPassword',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                maTaiKhoan: id,
                matKhauMoi: newPw,
                xacNhanMatKhau: confirmPw
            }),
            success: function (res) {
                btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Lưu mật khẩu');
                if (res.success) {
                    hideOverlay('pwdModalOv');
                    if (window.KiotToast) KiotToast.success(res.message);
                } else {
                    alertBox.removeClass('d-none').html(res.message);
                }
            },
            error: function (xhr) {
                btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Lưu mật khẩu');
                alertBox.removeClass('d-none').text(xhr.responseJSON?.message || 'Lỗi hệ thống khi đặt lại mật khẩu.');
            }
        });
    });

})(jQuery);
