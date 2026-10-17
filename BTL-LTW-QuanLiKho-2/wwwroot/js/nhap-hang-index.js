/**
 * nhap-hang-index.js
 * Quản lý danh sách Phiếu Nhập Hàng (Chuẩn KiotViet)
 * Tái sử dụng trọn vẹn khối Lego: KiotFilter, DateRange, MultiSelect, ColumnToggle, Star, Pagination
 */

$(function () {
    const $container = $('#kiotContainer');
    const filterUrl = $container.data('filter-url') || '/NhapHang/Filter';
    const cancelUrl = $container.data('cancel-url') || '/NhapHang/Cancel';
    const saveNoteUrl = $container.data('save-note-url') || '/NhapHang/SaveNote';
    const exportUrl = $container.data('export-url') || '/NhapHang/Export';

    let isStarredFilter = $container.data('is-starred') === true;
    let sortBy = $container.data('sort-by') || 'tg';
    let sortDir = $container.data('sort-dir') || 'desc';
    let currentPage = 1;
    let filterTimeout = null;

    // 1. Khởi tạo tiện ích thu gọn/mở rộng Sidebar (Phím F4)
    $('#btnToggleSidebar').on('click', function () {
        $('#sidebarFilterCol').toggleClass('collapsed');
        $(this).toggleClass('collapsed');
        const isCollapsed = $('#sidebarFilterCol').hasClass('collapsed');
        $('#sidebarToggleIcon').attr('class', isCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left');
    });

    // Mobile sidebar toggle
    $('#btnMobileFilter').on('click', function () {
        $('#sidebarFilterCol').addClass('show-mobile');
        $('#sidebarBackdrop').fadeIn(200);
    });
    $('#btnCloseSidebarMobile, #sidebarBackdrop').on('click', function () {
        $('#sidebarFilterCol').removeClass('show-mobile');
        $('#sidebarBackdrop').fadeOut(200);
    });

    // Phím tắt toàn cục F3 (Focus tìm kiếm) & F4 (Toggle sidebar)
    $(document).on('keydown', function (e) {
        if (e.key === 'F3' || e.keyCode === 114) {
            e.preventDefault();
            $('#keywordSearch').focus().select();
        } else if (e.key === 'F4' || e.keyCode === 115) {
            e.preventDefault();
            $('#btnToggleSidebar').trigger('click');
        }
    });

    // 2. Lắng nghe thay đổi tìm kiếm từ khóa F3
    $('#keywordSearch').on('input', function () {
        clearTimeout(filterTimeout);
        currentPage = 1;
        filterTimeout = setTimeout(triggerFilter, 300);
    });

    // Lọc theo số hóa đơn
    $('#invoiceNumberFilter').on('input', function () {
        clearTimeout(filterTimeout);
        currentPage = 1;
        filterTimeout = setTimeout(triggerFilter, 300);
    });

    // Lắng nghe thay đổi Checkbox trạng thái
    $(document).on('change', '.kiot-status-filter-block input[type="checkbox"]', function () {
        currentPage = 1;
        triggerFilter();
    });

    // Lắng nghe sự kiện Date Filter thay đổi từ component _KiotDateFilter
    $(document).on('kiotDateChanged', function () {
        currentPage = 1;
        triggerFilter();
    });

    // Lắng nghe sự kiện MultiSelect (Người tạo, Người nhập, NCC)
    $(document).on('kiotMultiSelectChanged', function () {
        currentPage = 1;
        triggerFilter();
    });

    // 3. Sắp xếp cột Sortable TH
    $(document).on('click', '.sortable-th', function () {
        const col = $(this).data('col');
        if (sortBy === col) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            sortBy = col;
            sortDir = 'desc';
        }
        currentPage = 1;
        triggerFilter();
    });

    // 4. Phân trang AJAX qua _Pagination.cshtml
    $(document).on('click', '.kiot-pagination-btn', function (e) {
        e.preventDefault();
        const p = $(this).data('page');
        if (p && p !== currentPage) {
            currentPage = p;
            triggerFilter();
        }
    });

    // Nút tải lại bảng
    $('#btnReloadTable').on('click', function () {
        triggerFilter();
    });

    // Reset filter
    $(document).on('click', '#resetF', function () {
        $('#keywordSearch').val('');
        $('#invoiceNumberFilter').val('');
        $('.kiot-status-filter-block input[type="checkbox"]').prop('checked', false);
        isStarredFilter = false;
        $('#starHeaderFilter').removeClass('starred');
        $('#starHeaderFilter i').removeClass('bi-star-fill').addClass('bi-star');
        currentPage = 1;
        triggerFilter();
    });

    // 5. Hàm thu thập tham số và nạp lại bảng qua AJAX
    function triggerFilter() {
        const params = {
            Q: $('#keywordSearch').val()?.trim() || '',
            SoHoaDon: $('#invoiceNumberFilter').val()?.trim() || '',
            DaDanhDau: isStarredFilter,
            SortBy: sortBy,
            SortDir: sortDir,
            Page: currentPage,
            PageSize: 15
        };

        // Lấy danh sách trạng thái đã chọn
        const selectedStatuses = [];
        $('.kiot-status-filter-block input[type="checkbox"]:checked').each(function () {
            selectedStatuses.push($(this).data('s'));
        });
        if (selectedStatuses.length > 0) {
            params.Statuses = selectedStatuses;
        }

        // Lấy thời gian từ DateFilter
        const dateFilterBlock = $('.kiot-date-filter-block');
        if (dateFilterBlock.length) {
            const dateRadio = $('input[name="dateFilterRadio"]:checked').val() || '';
            const quickBtn = $('.quick-date-btn.active');
            if (quickBtn.length) {
                params.DateFilterType = quickBtn.data('val');
            } else if (dateRadio) {
                params.DateFilterType = dateRadio;
            }
        }

        // Người tạo
        const selectedUsers = [];
        $('#dropdownNguoiTao .kiot-ms-item.selected').each(function () {
            selectedUsers.push($(this).data('val'));
        });
        if (selectedUsers.length > 0) params.CreatorId = selectedUsers[0];

        // Người nhập
        const selectedConfirmers = [];
        $('#dropdownNguoiNhap .kiot-ms-item.selected').each(function () {
            selectedConfirmers.push($(this).data('val'));
        });
        if (selectedConfirmers.length > 0) params.ConfirmerId = selectedConfirmers[0];

        // Nhà cung cấp
        const selectedNccs = [];
        $('#dropdownNhaCungCap .kiot-ms-item.selected').each(function () {
            selectedNccs.push($(this).data('val'));
        });
        if (selectedNccs.length > 0) params.NccId = selectedNccs[0];

        // Gửi AJAX nạp lại bảng
        $.ajax({
            url: filterUrl,
            type: 'GET',
            data: params,
            traditional: true,
            success: function (html) {
                $('#tableContainer').html(html);
                reinitTableFeatures();
            },
            error: function () {
                if (window.KiotToast) KiotToast.error('Không thể tải dữ liệu phiếu nhập hàng.');
            }
        });
    }

    // 6. Khởi tạo tính năng bảng (Khung chữ nhật, ẩn hiện cột, accordion)
    function reinitTableFeatures() {
        const $table = $('#receiptTable');
        if (!$table.length) return;

        // Tự động gán last-visible-col để đóng khung hình chữ nhật liền mạch
        updateLastVisibleCol();

        // Check All checkboxes
        $('#chkAll').off('change').on('change', function () {
            $('.row-select').prop('checked', $(this).prop('checked'));
        });
    }

    function updateLastVisibleCol() {
        $('#receiptTable').find('.last-visible-col').removeClass('last-visible-col');
        $('#receiptTable tbody tr.product-row').each(function () {
            $(this).children('td:visible').last().addClass('last-visible-col');
        });
    }

    // 7. Click dòng để mở/đóng Drawer Accordion xem chi tiết
    $(document).on('click', '#receiptTable tbody tr.product-row', function (e) {
        if ($(e.target).closest('input[type="checkbox"], .star-btn, a, button').length) {
            return;
        }

        const id = $(this).data('id');
        const $detailRow = $(`#dtl-${id}`);
        const $panelWrap = $detailRow.find('.product-detail-panel-wrap');
        const isCurrentOpen = $(this).hasClass('selected');

        // Đóng các dòng khác
        $('#receiptTable tbody tr.product-row').removeClass('selected');
        $('#receiptTable tbody tr.product-detail-row').hide().removeClass('selected');
        $('#receiptTable tbody .product-detail-panel-wrap').hide();

        if (!isCurrentOpen) {
            $(this).addClass('selected');
            $detailRow.show().addClass('selected');
            $panelWrap.slideDown(200);
            updateLastVisibleCol();
        }
    });

    // 8. Đánh dấu sao yêu thích (Silent Toggle, không hiện toast popup)
    window.toggleFavoriteReceipt = function (e, id, cell) {
        e.stopPropagation();
        const $starBtn = $(cell).find('.star-btn');
        const isCurrentStarred = $starBtn.hasClass('starred');
        const nextState = !isCurrentStarred;

        // Cập nhật giao diện lập tức (Optimistic UI)
        if (nextState) {
            $starBtn.addClass('starred');
            $starBtn.find('i').removeClass('bi-star').addClass('bi-star-fill');
        } else {
            $starBtn.removeClass('starred');
            $starBtn.find('i').removeClass('bi-star-fill').addClass('bi-star');
        }

        // Gọi AJAX âm thầm (không pop-up thông báo)
        $.ajax({
            url: `/NhapHang/ToggleFavorite?id=${id}`,
            type: 'POST',
            success: function (res) {
                if (!res.success) {
                    $starBtn.toggleClass('starred', isCurrentStarred);
                }
            },
            error: function () {
                $starBtn.toggleClass('starred', isCurrentStarred);
            }
        });
    };

    // 9. Nút lọc sao trên tiêu đề bảng
    window.toggleStarHeaderFilter = function (e) {
        e.stopPropagation();
        isStarredFilter = !isStarredFilter;
        $('#starHeaderFilter').toggleClass('starred', isStarredFilter);
        $('#starHeaderFilter i').toggleClass('bi-star-fill', isStarredFilter).toggleClass('bi-star', !isStarredFilter);
        currentPage = 1;
        triggerFilter();
    };

    // 10. Lưu ghi chú nhanh từ Accordion chi tiết
    $(document).on('click', '.btn-save-note', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        const note = $(this).closest('.product-detail-panel').find('.dp-note').val();

        $.ajax({
            url: `/NhapHang/SaveNote?id=${id}`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ ghiChu: note }),
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

    // 11. Hủy phiếu nhập hàng
    $(document).on('click', '.btn-cancel-doc', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        const code = $(this).data('code') || ('PN' + id);

        if (confirm(`Bạn có chắc chắn muốn hủy phiếu nhập hàng "${code}" không? Thao tác này không thể hoàn tác.`)) {
            $.ajax({
                url: `/NhapHang/Cancel?id=${id}`,
                type: 'POST',
                success: function (res) {
                    if (res.success) {
                        if (window.KiotToast) KiotToast.success(res.message || 'Đã hủy phiếu nhập hàng thành công!');
                        triggerFilter();
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
    });

    // 12. Xuất file Excel
    $('#btnExpList').on('click', function () {
        if (window.KiotToast) KiotToast.info('Đang chuẩn bị file danh sách phiếu nhập...');
        window.location.href = `${exportUrl}?type=list`;
    });

    $('#btnExpDetail').on('click', function () {
        if (window.KiotToast) KiotToast.info('Đang chuẩn bị file chi tiết phiếu nhập...');
        window.location.href = `${exportUrl}?type=detail`;
    });

    // 13. Tùy chọn ẩn hiện cột qua dropdown KiotViet
    $('#colMenu input[type="checkbox"]').on('change', function () {
        const col = $(this).data('c');
        const isChecked = $(this).prop('checked');
        $(`th[data-col="${col}"], td[data-col="${col}"]`).toggle(isChecked);
        updateLastVisibleCol();
    });

    // Khởi tạo bảng ban đầu
    reinitTableFeatures();
});
