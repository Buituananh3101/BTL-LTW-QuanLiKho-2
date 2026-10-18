/**
 * chuyen-kho-form.js - Quản lý form Lập / Sửa Phiếu Chuyển Kho chuẩn KiotViet
 */
(function ($) {
    'use strict';

    const $app = $('#ckFormApp');
    if (!$app.length) return;

    const urls = {
        searchProducts: $app.data('search-products-url') || '/ChuyenKho/SearchProducts',
        templateUrl: $app.data('template-url') || '/ChuyenKho/DownloadTemplate',
        importUrl: $app.data('import-url') || '/ChuyenKho/ImportExcel',
        save: $app.data('save-url') || '/ChuyenKho/Save',
        index: $app.data('index-url') || '/ChuyenKho/Index'
    };

    const currentWhId = Number($app.data('warehouse-id')) || 0;
    const docId = Number($app.data('id')) || 0;

    // Định dạng số tiếng Việt
    function fmt(n) {
        return (Number(n) || 0).toLocaleString('vi-VN');
    }

    // ===== CHỌN NGÀY GIỜ LẬP PHIẾU (LEGO KIOTDATETIMEPICKER) =====
    function formatLocalIso(d) {
        if (!d || isNaN(d.getTime())) return null;
        const p2 = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
    }

    let createdDate = new Date();
    const dtPicker = (window.KiotFilter && typeof KiotFilter.initDateTimePicker === 'function')
        ? KiotFilter.initDateTimePicker({
            inputSelector: '#fDate',
            popupSelector: '#dtPop',
            onChange: function (d) {
                createdDate = d;
            }
        })
        : null;
    if (dtPicker) createdDate = dtPicker.getDate();

    // ===== QUẢN LÝ LƯỚI DÒNG HÀNG HÓA (LEGO KIOTDOCGRID) =====
    const docGrid = (window.KiotFilter && typeof KiotFilter.initDocGrid === 'function')
        ? KiotFilter.initDocGrid({
            tableBodySelector: '#itemsTableBody',
            emptyBoxSelector: '#emptyLineBox',
            tableScrollSelector: '#tableScrollWrap',
            rowSelector: 'tr.item-line-row',
            sttSelector: '.row-stt',
            btnRemoveSelector: '.btn-remove-line',
            qtyInputSelector: '.line-qty',
            onRecalc: function () {
                recalcTotals();
            }
        })
        : null;

    function checkEmptyState() {
        if (docGrid) {
            docGrid.checkEmpty();
        } else {
            const count = $('#itemsTableBody tr.item-line-row').length;
            if (count === 0) {
                $('#tableScrollWrap').hide();
                $('#emptyLineBox').show();
            } else {
                $('#emptyLineBox').hide();
                $('#tableScrollWrap').show();
            }
            reindexRows();
            recalcTotals();
        }
    }

    // Đánh lại số thứ tự dòng
    function reindexRows() {
        $('#itemsTableBody tr.item-line-row').each(function (idx) {
            $(this).find('.row-stt').text(idx + 1);
        });
    }

    // Tính toán lại tổng số lượng và tổng giá trị
    function recalcTotals() {
        let totalItems = 0;
        let totalQty = 0;
        let totalValue = 0;

        $('#itemsTableBody tr.item-line-row').each(function () {
            totalItems++;
            const cost = Number($(this).data('cost')) || 0;
            const stock = Number($(this).data('stock')) || 0;
            const $qtyInput = $(this).find('.line-qty');
            const qty = Number($qtyInput.val().replace(/\D/g, '')) || 0;

            const isOver = qty > stock;
            $qtyInput.toggleClass('over', isOver);
            $(this).find('.hint-over').toggle(isOver);

            const amount = qty * cost;
            $(this).find('.row-amount').text(fmt(amount));

            totalQty += qty;
            totalValue += amount;
        });

        $('#lblItemCount').text(totalItems);
        $('#lblTotalQty, #lblSummaryQty').text(fmt(totalQty));
        $('#lblSummaryValue').text(fmt(totalValue));
    }

    // Thêm hàng hóa vào bảng
    function addProduct(item, customQty) {
        if (!item) return;
        const id = item.id || item.maHang;
        const code = item.code || item.maHangNoiBo || '';
        const name = item.name || item.tenHang || '';
        const unit = item.unit || item.tenDvt || '';
        const cost = Number(item.cost !== undefined ? item.cost : (item.gia !== undefined ? item.gia : item.giaVon)) || 0;
        const stock = Number(item.stock !== undefined ? item.stock : item.tonKho) || 0;
        const qty = Number(customQty) > 0 ? Number(customQty) : 1;

        let $existing = $(`#itemsTableBody tr.item-line-row[data-id="${id}"]`);
        if ($existing.length) {
            const $qtyInput = $existing.find('.line-qty');
            const currentQty = Number($qtyInput.val().replace(/\D/g, '')) || 0;
            const newQty = currentQty + qty;
            $qtyInput.val(fmt(newQty));
            const isOver = newQty > stock;
            $qtyInput.toggleClass('over', isOver);
            $existing.find('.hint-over').toggle(isOver);
            if (window.KiotToast && !customQty) {
                KiotToast.success(`Đã tăng số lượng ${name} thành ${newQty}`);
            }
        } else {
            const isOver = qty > stock;
            const amount = qty * cost;
            const rowHtml = `
                <tr class="item-line-row" data-id="${id}" data-cost="${cost}" data-stock="${stock}">
                    <td class="w-del text-center">
                        <button type="button" class="del btn-remove-line" title="Xóa dòng"><i class="bi bi-trash"></i></button>
                    </td>
                    <td class="w-stt text-center row-stt">1</td>
                    <td class="w-code fw-semibold">${code}</td>
                    <td class="w-name">${name}</td>
                    <td class="w-dvt">${unit}</td>
                    <td class="text-end num row-stock">${fmt(stock)}</td>
                    <td class="text-end">
                        <input type="text" class="qty line-qty ${isOver ? 'over' : ''}" value="${fmt(qty)}" inputmode="numeric" />
                        <span class="hint-over" style="${isOver ? '' : 'display: none;'}">Vượt tồn</span>
                    </td>
                    <td class="text-end num row-cost">${fmt(cost)}</td>
                    <td class="text-end num fw-bold text-dark row-amount">${fmt(amount)}</td>
                </tr>
            `;
            $('#itemsTableBody').prepend(rowHtml);
        }

        checkEmptyState();
    }

    // 1. Tìm kiếm Autocomplete hàng hóa (F3) dùng Lego KiotFilter.initProductSearch
    if (window.KiotFilter && typeof KiotFilter.initProductSearch === 'function') {
        KiotFilter.initProductSearch({
            inputSelector: '#productSearchInput',
            dropdownSelector: '#autocompleteDropdown',
            apiUrl: urls.searchProducts,
            getWarehouseId: function () {
                return $('#fKhoXuat').val() || currentWhId || 1;
            },
            onSelect: function (product) {
                addProduct(product);
            }
        });
    }

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#tNote, #notes').length) {
            $('#notes').removeClass('show');
        }
        if (!$(e.target).closest('#fDate, #dtPop').length) {
            $('#dtPop').removeClass('show');
        }
    });

    // Phím tắt F3
    $(document).on('keydown', function (e) {
        if (e.key === 'F3') {
            e.preventDefault();
            $('#productSearchInput').focus().select();
        } else if (e.key === 'F9') {
            e.preventDefault();
            $('#btnSaveDraft').click();
        } else if (e.key === 'F10') {
            e.preventDefault();
            $('#btnSendTransfer').click();
        } else if (e.key === 'F4') {
            e.preventDefault();
            toggleRightPanel();
        }
    });

    // 2. Chỉnh sửa số lượng dòng
    $(document).on('input', '.line-qty', function () {
        const raw = $(this).val().replace(/\D/g, '');
        $(this).val(raw);
        recalcTotals();
    });

    // 3. Xóa dòng hàng
    $(document).on('click', '.btn-remove-line', function () {
        $(this).closest('tr.item-line-row').remove();
        checkEmptyState();
    });

    // 4. Thu gọn / mở rộng panel phải (Right Menu - Phím tắt F4)
    function toggleRightPanel() {
        const $panel = $('#rightPanel');
        const $wrap = $('#ckFormWrap');
        const $btn = $('#btnToggleRightPanel');
        const $icon = $('#rightPanelToggleIcon');

        $panel.toggleClass('collapsed');
        const isCollapsed = $panel.hasClass('collapsed');
        $wrap.toggleClass('panel-collapsed', isCollapsed);
        $btn.toggleClass('collapsed', isCollapsed);

        $btn.attr('title', isCollapsed ? 'Mở rộng thông tin (Phím tắt F4)' : 'Thu gọn thông tin (Phím tắt F4)');
        $icon.attr('class', isCollapsed ? 'bi bi-chevron-left' : 'bi bi-chevron-right');
    }

    $(document).on('click', '#btnToggleRightPanel', function (e) {
        e.preventDefault();
        toggleRightPanel();
    });

    // Popup lưu ý
    $('#tNote').on('click', function (e) {
        e.stopPropagation();
        $('#notes').toggleClass('show');
    });

    // 4.1. Chọn kho nhận từ custom dropdown
    $(document).on('click', '.wh-item-opt', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        const name = $(this).data('name');

        $('#fKhoNhan').val(id);
        $('.wh-selected-text').text(name).removeClass('text-muted').addClass('text-dark fw-medium');
        $('.wh-item-opt').removeClass('active fw-semibold');
        $('.wh-item-opt .wh-check-icon').addClass('d-none');
        $(this).addClass('active fw-semibold').find('.wh-check-icon').removeClass('d-none');

        $('#btnSelectKhoNhan').removeClass('border-danger');
        $('#fErr').empty();

        // Đóng dropdown Bootstrap nếu đang mở
        const btn = document.getElementById('btnSelectKhoNhan');
        if (btn && window.bootstrap && window.bootstrap.Dropdown) {
            const inst = bootstrap.Dropdown.getInstance(btn);
            if (inst) inst.hide();
        }
    });

    // 5. Submit lưu phiếu (Lưu tạm hoặc Chuyển hàng)
    function submitTransfer(actionType) {
        $('#fErr').empty();
        $('#btnSelectKhoNhan').removeClass('border-danger');
        const khoNhanId = parseInt($('#fKhoNhan').val());
        if (!khoNhanId || khoNhanId <= 0) {
            $('#fErr').text('Vui lòng chọn kho nhận.');
            $('#btnSelectKhoNhan').addClass('border-danger').focus();
            return;
        }

        const lines = [];
        let hasOverStock = false;
        let hasZeroQty = false;

        $('#itemsTableBody tr.item-line-row').each(function () {
            const hangId = parseInt($(this).data('id'));
            const stock = Number($(this).data('stock')) || 0;
            const qty = Number($(this).find('.line-qty').val().replace(/\D/g, '')) || 0;

            if (qty <= 0) {
                hasZeroQty = true;
            }
            if (qty > stock) {
                hasOverStock = true;
            }

            lines.push({
                MaHang: hangId,
                SoLuong: qty
            });
        });

        if (!lines.length) {
            $('#fErr').text('Vui lòng chọn ít nhất một mặt hàng để chuyển.');
            $('#productSearchInput').focus();
            return;
        }

        if (hasZeroQty) {
            $('#fErr').text('Có mặt hàng chưa nhập số lượng chuyển.');
            return;
        }

        if (actionType === 'SEND' && hasOverStock) {
            $('#fErr').text('Có mặt hàng chuyển vượt quá số lượng tồn kho gửi. Vui lòng kiểm tra lại.');
            return;
        }

        const payload = {
            MaPhieuChuyen: docId > 0 ? docId : null,
            MaPhieu: ($('#txtDocCode').val() || '').trim().toUpperCase() || null,
            MaKhoDich: khoNhanId,
            NgayLap: formatLocalIso(createdDate),
            GhiChu: $('#fNote').val() || null,
            ActionType: actionType,
            Lines: lines
        };

        const $btns = $('.ck-actions button');
        $btns.prop('disabled', true);

        $.ajax({
            url: urls.save,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (res) {
                if (res && res.success) {
                    if (window.KiotToast) KiotToast.success(res.message);
                    setTimeout(function () {
                        window.location.href = urls.index;
                    }, 500);
                } else {
                    $btns.prop('disabled', false);
                    $('#fErr').text(res?.message || 'Không thể lưu phiếu.');
                }
            },
            error: function (xhr) {
                $btns.prop('disabled', false);
                const msg = xhr.responseJSON?.message || 'Đã xảy ra lỗi khi lưu phiếu.';
                $('#fErr').text(msg);
            }
        });
    }

    $('#btnSaveDraft').on('click', function () {
        submitTransfer('SAVE_DRAFT');
    });

    $('#btnSendTransfer').on('click', function () {
        if (window.KiotConfirm && typeof KiotConfirm.show === 'function') {
            KiotConfirm.show({
                title: 'Xác nhận chuyển hàng',
                message: 'Tồn kho tại kho gửi sẽ <b>giảm ngay lập tức</b>. Phiếu chuyển sẽ chuyển sang trạng thái <b>Đang chuyển</b>. Bạn có chắc chắn muốn chuyển?',
                confirmText: 'Chuyển hàng',
                confirmClass: 'btn-success',
                onConfirm: function () {
                    submitTransfer('SEND');
                }
            });
        } else {
            submitTransfer('SEND');
        }
    });

    // Tự động viết hoa mã chuyển hàng khi người dùng nhập tay
    $('#txtDocCode').on('input', function () {
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.toUpperCase();
        if (start !== null && end !== null) {
            this.setSelectionRange(start, end);
        }
    });

    // ===== NHẬP TỪ FILE EXCEL & TẢI MẪU =====
    $('#btnDownloadTemplate').on('click', function () {
        window.location.href = urls.templateUrl;
    });

    $('#btnPickExcel, #btnImportExcel').on('click', function () {
        $('#excelFileInput').click();
    });

    $('#excelFileInput').on('change', function (e) {
        const files = e.target.files;
        if (!files || !files.length) return;
        const file = files[0];

        const formData = new FormData();
        formData.append('file', file);
        formData.append('warehouseId', currentWhId);

        if (window.KiotToast) KiotToast.info('Đang đối soát dữ liệu file với hệ thống...');

        $.ajax({
            url: urls.importUrl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (res) {
                if (res && res.success && res.items && res.items.length) {
                    let importedCount = 0;
                    res.items.forEach(item => {
                        addProduct(item, item.qty || item.soLuong);
                        importedCount++;
                    });
                    if (window.KiotToast) {
                        KiotToast.success(`Đã nạp thành công ${importedCount} mặt hàng từ file!`);
                    }
                } else {
                    if (window.KiotToast) {
                        KiotToast.warning(res?.message || 'Không tìm thấy mặt hàng nào phù hợp trong file.');
                    }
                }
            },
            error: function (xhr) {
                const msg = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : 'Lỗi khi nhập file dữ liệu.';
                if (window.KiotToast) KiotToast.error(msg);
            },
            complete: function () {
                $('#excelFileInput').val('');
            }
        });
    });

    // Khởi tạo
    checkEmptyState();

})(jQuery);
