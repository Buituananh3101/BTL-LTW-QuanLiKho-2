/**
 * chuyen-kho-form.js - Quản lý form Lập / Sửa Phiếu Chuyển Kho chuẩn KiotViet
 */
(function ($) {
    'use strict';

    const $app = $('#ckFormApp');
    if (!$app.length) return;

    const urls = {
        searchProducts: $app.data('search-products-url') || '/ChuyenKho/SearchProducts',
        save: $app.data('save-url') || '/ChuyenKho/Save',
        index: $app.data('index-url') || '/ChuyenKho/Index'
    };

    const currentWhId = Number($app.data('warehouse-id')) || 0;
    const docId = Number($app.data('id')) || 0;

    // Định dạng số tiếng Việt
    function fmt(n) {
        return (Number(n) || 0).toLocaleString('vi-VN');
    }

    // Cập nhật trạng thái hiển thị bảng / rỗng
    function checkEmptyState() {
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
    function addProduct(item) {
        let $existing = $(`#itemsTableBody tr.item-line-row[data-id="${item.id}"]`);
        if ($existing.length) {
            const $qtyInput = $existing.find('.line-qty');
            const currentQty = Number($qtyInput.val().replace(/\D/g, '')) || 0;
            $qtyInput.val(currentQty + 1);
            if (window.KiotToast) {
                KiotToast.success(`Đã tăng số lượng ${item.name} thành ${currentQty + 1}`);
            }
        } else {
            const isOver = 1 > item.stock;
            const rowHtml = `
                <tr class="item-line-row" data-id="${item.id}" data-cost="${item.cost}" data-stock="${item.stock}">
                    <td class="w-del text-center">
                        <button type="button" class="del btn-remove-line" title="Xóa dòng"><i class="bi bi-trash"></i></button>
                    </td>
                    <td class="w-stt text-center row-stt">1</td>
                    <td class="w-code fw-semibold">${item.code}</td>
                    <td class="w-name">${item.name}</td>
                    <td class="w-dvt">${item.unit || ''}</td>
                    <td class="text-end num row-stock">${fmt(item.stock)}</td>
                    <td class="text-end">
                        <input type="text" class="qty line-qty ${isOver ? 'over' : ''}" value="1" inputmode="numeric" />
                        <span class="hint-over" style="${isOver ? '' : 'display: none;'}">Vượt tồn</span>
                    </td>
                    <td class="text-end num row-cost">${fmt(item.cost)}</td>
                    <td class="text-end num fw-bold text-dark row-amount">${fmt(item.cost)}</td>
                </tr>
            `;
            $('#itemsTableBody').prepend(rowHtml);
        }

        checkEmptyState();
    }

    // 1. Tìm kiếm Autocomplete hàng hóa (F3)
    let suggestList = [];
    let activeSuggestIdx = 0;

    function renderSuggestDropdown() {
        const $drop = $('#autocompleteDropdown');
        if (!suggestList.length) {
            $drop.removeClass('show').empty();
            return;
        }

        let html = '';
        suggestList.forEach((p, idx) => {
            const isAct = idx === activeSuggestIdx ? 'active' : '';
            const firstLetter = (p.name || 'H').trim()[0].toUpperCase();
            html += `
                <div class="kk-autocomplete-item ${isAct}" data-idx="${idx}">
                    <div class="d-flex align-items-center gap-2">
                        <div class="kk-item-thumb bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; border-radius: 6px;">
                            ${firstLetter}
                        </div>
                        <div>
                            <div class="fw-semibold text-dark text-truncate" style="max-width: 280px;">${p.name}</div>
                            <div class="text-muted small">${p.code} ${p.unit ? '(' + p.unit + ')' : ''}</div>
                        </div>
                    </div>
                    <div class="text-end ms-auto">
                        <div class="text-primary fw-bold small">Tồn gửi: ${fmt(p.stock)}</div>
                        <div class="text-muted small">Giá vốn: ${fmt(p.cost)}</div>
                    </div>
                </div>
            `;
        });

        $drop.html(html).addClass('show');
    }

    let searchTimer = null;
    $('#productSearchInput').on('input', function () {
        clearTimeout(searchTimer);
        const query = $(this).val().trim();
        if (!query) {
            suggestList = [];
            renderSuggestDropdown();
            return;
        }

        searchTimer = setTimeout(function () {
            $.get(urls.searchProducts, { q: query }, function (data) {
                suggestList = data || [];
                activeSuggestIdx = 0;
                renderSuggestDropdown();
            });
        }, 200);
    });

    $('#productSearchInput').on('keydown', function (e) {
        if (e.key === 'ArrowDown' && suggestList.length) {
            e.preventDefault();
            activeSuggestIdx = (activeSuggestIdx + 1) % suggestList.length;
            renderSuggestDropdown();
        } else if (e.key === 'ArrowUp' && suggestList.length) {
            e.preventDefault();
            activeSuggestIdx = (activeSuggestIdx - 1 + suggestList.length) % suggestList.length;
            renderSuggestDropdown();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestList.length && suggestList[activeSuggestIdx]) {
                addProduct(suggestList[activeSuggestIdx]);
                $(this).val('');
                suggestList = [];
                renderSuggestDropdown();
            }
        } else if (e.key === 'Escape') {
            suggestList = [];
            renderSuggestDropdown();
        }
    });

    $(document).on('mousedown', '.kk-autocomplete-item', function (e) {
        e.preventDefault();
        const idx = $(this).data('idx');
        if (suggestList[idx]) {
            addProduct(suggestList[idx]);
            $('#productSearchInput').val('').focus();
            suggestList = [];
            renderSuggestDropdown();
        }
    });

    // Đóng dropdown khi click ra ngoài
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.nh-search-wrap').length) {
            suggestList = [];
            renderSuggestDropdown();
        }
        if (!$(e.target).closest('#tNote, #notes').length) {
            $('#notes').removeClass('show');
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
            $('#btnToggleRightPanel').click();
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

    // 4. Thu gọn / mở rộng panel phải (F4)
    $('#btnToggleRightPanel').on('click', function () {
        const $panel = $('#rightPanel');
        const isCollapsed = $panel.hasClass('panel-collapsed');

        if (isCollapsed) {
            $panel.removeClass('panel-collapsed');
            $(this).removeClass('collapsed');
            $('#rightPanelToggleIcon').removeClass('bi-chevron-left').addClass('bi-chevron-right');
        } else {
            $panel.addClass('panel-collapsed');
            $(this).addClass('collapsed');
            $('#rightPanelToggleIcon').removeClass('bi-chevron-right').addClass('bi-chevron-left');
        }
    });

    // Popup lưu ý
    $('#tNote').on('click', function (e) {
        e.stopPropagation();
        $('#notes').toggleClass('show');
    });

    // 5. Submit lưu phiếu (Lưu tạm hoặc Chuyển hàng)
    function submitTransfer(actionType) {
        $('#fErr').empty();
        const khoNhanId = parseInt($('#fKhoNhan').val());
        if (!khoNhanId || khoNhanId <= 0) {
            $('#fErr').text('Vui lòng chọn kho nhận.');
            $('#fKhoNhan').focus();
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
            MaKhoDich: khoNhanId,
            NgayLap: $('#fDate').val() || null,
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

    // Khởi tạo
    checkEmptyState();

})(jQuery);
