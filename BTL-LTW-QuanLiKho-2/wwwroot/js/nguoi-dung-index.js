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
    if (window.AppFilter) {
        AppFilter.initSidebar({
            storageKey: 'kp_user_sidebar'
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
        if (id === 'userModalOv') {
            $('#dropdownUserKho').removeClass('show');
            $('#boxUserKho').removeClass('open');
            $('#wrapMaVaiTro').removeClass('open');
            $('#dropdownMaVaiTro').hide();
        }
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
            if ($('#dropdownMaVaiTro').is(':visible')) {
                $('#wrapMaVaiTro').removeClass('open');
                $('#dropdownMaVaiTro').hide();
                e.stopPropagation();
                return;
            }
            if ($('#dropdownUserKho').hasClass('show')) {
                $('#dropdownUserKho').removeClass('show');
                $('#boxUserKho').removeClass('open');
                e.stopPropagation();
                return;
            }
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
                if (window.AppToast) AppToast.error('Không thể tải dữ liệu người dùng.');
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
    $('#keywordSearch').on('input', AppFilter.debounce(function () {
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
        if (window.AppToast) AppToast.info('Đã làm mới dữ liệu.');
    });

    // Phân trang AJAX
    if (window.AppFilter && AppFilter.bindPagination) {
        AppFilter.bindPagination('#userTableContainer', function (page) {
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
                    loadTable(1);
                }
                return;
            }

            e.stopPropagation();

            $('.kp-ms-dropdown').not($dropdown).removeClass('show drop-up').css('max-height', '');
            $('.kp-multiselect-box').not($box).removeClass('open');

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
            loadTable(1);
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
        if (!$(e.target).closest('.kp-multiselect-box, .kp-ms-dropdown').length) {
            $('.kp-ms-dropdown').removeClass('show drop-up').css('max-height', '');
            $('.kp-multiselect-box').removeClass('open');
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

    // 8. Cập nhật số lượng kho được chọn & class selected & render tag pills trong box dropdown
    function updateWarehouseSelectionState() {
        const checkedItems = [];
        $('.user-kho-chk').each(function () {
            const isChecked = $(this).is(':checked');
            const $item = $(this).closest('.user-kho-ms-item');
            $item.toggleClass('selected', isChecked);
            if (isChecked) {
                const val = parseInt($(this).val(), 10);
                const name = $item.data('name') || $item.find('.kp-ms-text').text().trim();
                checkedItems.push({ id: val, name: name });
            }
        });

        const count = checkedItems.length;
        const totalCount = $('.user-kho-chk').length;
        $('#selectedWarehouseCount').text(count + ' kho');

        const $box = $('#boxUserKho');
        if (!$box.length) return;

        if (count === 0) {
            $box.html('<span class="kp-ms-placeholder" id="placeholderUserKho">Chọn chi nhánh kho</span><i class="bi bi-chevron-down kp-select-chevron ms-auto text-secondary"></i>');
        } else if (count === totalCount && totalCount > 2) {
            $box.html(`<span class="kp-pill-tag" data-val="all" style="background-color: var(--blue, #0070f4);"><span class="tag-text">Tất cả chi nhánh (${count} kho)</span></span><i class="bi bi-chevron-down kp-select-chevron ms-auto text-secondary"></i>`);
        } else if (count <= 2) {
            let html = '';
            checkedItems.forEach(it => {
                html += `<span class="kp-pill-tag" data-val="${it.id}"><span class="tag-text">${it.name}</span><span class="tag-remove" data-id="${it.id}" title="Bỏ chọn">&times;</span></span>`;
            });
            html += '<i class="bi bi-chevron-down kp-select-chevron ms-auto text-secondary"></i>';
            $box.html(html);
        } else {
            let html = '';
            checkedItems.slice(0, 2).forEach(it => {
                html += `<span class="kp-pill-tag" data-val="${it.id}"><span class="tag-text">${it.name}</span><span class="tag-remove" data-id="${it.id}" title="Bỏ chọn">&times;</span></span>`;
            });
            html += `<span class="kp-pill-more">+${count - 2}</span>`;
            html += '<i class="bi bi-chevron-down kp-select-chevron ms-auto text-secondary"></i>';
            $box.html(html);
        }
    }

    // Toggle mở/đóng dropdown kho trong modal người dùng
    $('#boxUserKho').on('click', function (e) {
        const $removeBtn = $(e.target).closest('.tag-remove');
        if ($removeBtn.length) {
            e.stopPropagation();
            const id = $removeBtn.data('id');
            $(`#chkKho_${id}`).prop('checked', false);
            updateWarehouseSelectionState();
            return;
        }

        const $dd = $('#dropdownUserKho');
        const isOpen = $dd.hasClass('show');
        if (isOpen) {
            $dd.removeClass('show');
            $(this).removeClass('open');
        } else {
            $('.kp-ms-dropdown').not('#dropdownUserKho').removeClass('show');
            $('.kp-multiselect-box').not('#boxUserKho').removeClass('open');
            $dd.addClass('show');
            $(this).addClass('open');
            $('#searchUserKho').val('').trigger('input');
            setTimeout(() => $('#searchUserKho').focus(), 100);
        }
    });

    // Click vào item trong dropdown để toggle chọn kho
    $(document).on('click', '.user-kho-ms-item', function (e) {
        e.stopPropagation();
        const chk = $(this).find('.user-kho-chk');
        if (!$(e.target).is('input[type="checkbox"]') && !$(e.target).is('label')) {
            chk.prop('checked', !chk.is(':checked'));
        }
        updateWarehouseSelectionState();
    });

    // Ngăn đóng dropdown khi click vào ô tìm kiếm
    $('#searchUserKho').on('click', function (e) {
        e.stopPropagation();
    });

    // Tìm kiếm chi nhánh realtime trong dropdown
    $('#searchUserKho').on('input', function () {
        const kw = $(this).val().toLowerCase().trim();
        let matched = 0;
        $('.user-kho-ms-item').each(function () {
            const name = ($(this).data('name') || $(this).text()).toLowerCase();
            const match = !kw || name.includes(kw);
            $(this).toggle(match);
            if (match) matched++;
        });
        $('#emptyUserKho').toggleClass('d-none', matched > 0);
    });

    $(document).on('change', '.user-kho-chk', function () {
        updateWarehouseSelectionState();
    });

    $('#btnSelectAllKho').on('click', function (e) {
        e.stopPropagation();
        $('.user-kho-chk').prop('checked', true);
        updateWarehouseSelectionState();
    });

    $('#btnDeselectAllKho').on('click', function (e) {
        e.stopPropagation();
        $('.user-kho-chk').prop('checked', false);
        updateWarehouseSelectionState();
    });

    // Đóng dropdown khi click ra ngoài
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#boxUserKho, #dropdownUserKho').length) {
            $('#dropdownUserKho').removeClass('show');
            $('#boxUserKho').removeClass('open');
        }
    });

    const ADMIN_DEFAULT_NOTE = 'Tài khoản có vai trò Quản lý mặc định có toàn quyền thao tác trên toàn bộ các chi nhánh kho trong hệ thống.';

    // 9. Quản lý Dropdown Vai trò người dùng (Custom Select chuẩn Danh sách hàng hóa)
    function setRoleDropdown(val) {
        const $select = $('#userMaVaiTro');
        $select.val(val);
        const $opt = $select.find(`option[value="${val}"]`);
        const roleText = $opt.data('name') || $opt.text() || 'Chọn vai trò';
        $('#inputMaVaiTro').val(roleText);
        $('#listMaVaiTro .hh-cs-item').removeClass('selected').filter(function () {
            return String($(this).data('val')) === String(val);
        }).addClass('selected');
        updateRoleDescription();
    }

    // Mở / đóng dropdown Vai trò
    $('#boxMaVaiTro').on('click', function (e) {
        e.stopPropagation();
        const $wrap = $('#wrapMaVaiTro');
        const $dd = $('#dropdownMaVaiTro');
        const isOpen = $wrap.hasClass('open');

        // Đóng các dropdown khác nếu đang mở
        $('#dropdownUserKho').removeClass('show');
        $('#boxUserKho').removeClass('open');
        $('.hh-cs-wrap').not($wrap).removeClass('open').find('.hh-cs-dropdown').hide();

        if (isOpen) {
            $wrap.removeClass('open');
            $dd.hide();
        } else {
            $wrap.addClass('open');
            $dd.show();
        }
    });

    // Chọn item trong dropdown Vai trò
    $(document).on('click', '#listMaVaiTro .hh-cs-item', function (e) {
        e.stopPropagation();
        const val = $(this).data('val');
        setRoleDropdown(val);
        $('#wrapMaVaiTro').removeClass('open');
        $('#dropdownMaVaiTro').hide();
    });

    // Đóng dropdown Vai trò khi click ra ngoài
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#wrapMaVaiTro').length) {
            $('#wrapMaVaiTro').removeClass('open');
            $('#dropdownMaVaiTro').hide();
        }
    });

    // Cập nhật phân quyền theo Vai trò
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
        setRoleDropdown('2'); // Mặc định Thủ kho
        $('#userTrangThaiChk').prop('checked', true);
        $('#userTrangThaiText').text('Đang hoạt động');

        // Mặc định chọn kho đầu tiên
        $('.user-kho-chk').prop('checked', false);
        $('.user-kho-chk').first().prop('checked', true);
        updateWarehouseSelectionState();

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
                    if (window.AppToast) AppToast.error(res.message);
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
                setRoleDropdown(d.maVaiTro);
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

                $('#userModalTitle').text('Cập nhật người dùng: ' + d.tenDangNhap);
                showOverlay('userModalOv');
                setTimeout(() => $('#userHoTen').focus(), 150);
            },
            error: function () {
                if (window.AppToast) AppToast.error('Không thể lấy thông tin người dùng.');
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
                    if (window.AppToast) AppToast.success(res.message);
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

    // 12. Xóa người dùng (Nếu chưa có giao dịch -> Xóa vĩnh viễn; Nếu đã có giao dịch -> Chỉ cho phép Khóa tài khoản)
    $(document).on('click', '.btn-delete-user', function () {
        const id = $(this).data('id');
        const username = $(this).data('username') || '';
        const safeUsername = $('<div>').text(username).html();

        const executeDelete = function () {
            $.ajax({
                url: '/NguoiDung/Delete?id=' + id,
                type: 'POST',
                success: function (res) {
                    if (res.success) {
                        if (window.AppToast) AppToast.success(res.message);
                        loadTable(currentPage);
                    } else if (res.hasTransaction) {
                        // Đã phát sinh giao dịch: Chặn xóa và hỏi có muốn chuyển sang Khóa tài khoản không
                        if (res.isLocked) {
                            if (window.AppToast) {
                                AppToast.warning(`Người dùng <b>${safeUsername}</b> đã phát sinh chứng từ và hiện đang ở trạng thái <b>Bị khóa</b>, không thể xóa vĩnh viễn.`);
                            }
                        } else {
                            setTimeout(function () {
                                if (window.AppConfirm && typeof window.AppConfirm.show === 'function') {
                                    window.AppConfirm.show({
                                        title: 'Không thể xóa người dùng',
                                        icon: 'bi-shield-exclamation',
                                        iconColor: '#f59e0b',
                                        message: `Người dùng <strong>${safeUsername}</strong> đã phát sinh chứng từ trong hệ thống (nhập, xuất, kiểm kê hoặc bán hàng) nên <strong>không thể xóa vĩnh viễn</strong> để bảo toàn lịch sử dữ liệu.<br><br>Bạn có muốn chuyển sang <strong>KHÓA TÀI KHOẢN</strong> để ngừng quyền truy cập của người dùng này không?`,
                                        confirmText: 'Khóa tài khoản',
                                        confirmClass: 'btn btn-warning text-dark fw-semibold',
                                        cancelText: 'Bỏ qua',
                                        onConfirm: function () {
                                            $.ajax({
                                                url: '/NguoiDung/Delete?id=' + id + '&chuyenKhoa=true',
                                                type: 'POST',
                                                success: function (lockRes) {
                                                    if (lockRes.success) {
                                                        if (window.AppToast) AppToast.success(lockRes.message);
                                                        loadTable(currentPage);
                                                    } else {
                                                        if (window.AppToast) AppToast.error(lockRes.message);
                                                    }
                                                },
                                                error: function (xhr) {
                                                    if (window.AppToast) AppToast.error(xhr.responseJSON?.message || 'Không thể khóa tài khoản.');
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    if (window.AppToast) AppToast.warning(res.message);
                                }
                            }, 200);
                        }
                    } else {
                        if (window.AppToast) AppToast.error(res.message || 'Không thể xóa người dùng.');
                    }
                },
                error: function (xhr) {
                    if (window.AppToast) AppToast.error(xhr.responseJSON?.message || 'Đã xảy ra lỗi khi thực hiện thao tác.');
                }
            });
        };

        if (window.AppConfirm && typeof window.AppConfirm.show === 'function') {
            window.AppConfirm.show({
                title: 'Xác nhận xóa người dùng',
                icon: 'bi-trash-fill',
                iconColor: '#dc2626',
                message: `Bạn có chắc chắn muốn xóa người dùng <strong>${safeUsername}</strong> không?<br><span class="text-muted small mt-1 d-block">Hệ thống sẽ kiểm tra giao dịch: nếu chưa phát sinh phiếu sẽ xóa vĩnh viễn, nếu đã có chứng từ sẽ yêu cầu chuyển sang khóa tài khoản.</span>`,
                confirmText: 'Xóa người dùng',
                confirmClass: 'btn btn-danger',
                cancelText: 'Bỏ qua',
                onConfirm: executeDelete
            });
        } else {
            if (confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}" không?`)) {
                executeDelete();
            }
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
                    if (window.AppToast) AppToast.success(res.message);
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
