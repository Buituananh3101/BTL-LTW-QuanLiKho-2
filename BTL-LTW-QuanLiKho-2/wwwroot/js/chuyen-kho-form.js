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

    // ===== CHỌN NGÀY GIỜ LẬP PHIẾU CHUẨN KIỂM TỒN =====
    const $fDate = $('#fDate');
    const $dtPop = $('#dtPop');
    let createdDate = new Date();
    if ($fDate.length && $fDate.val()) {
        const parts = $fDate.val().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
        if (parts) {
            const parsed = new Date(+parts[3], +parts[2] - 1, +parts[1], +parts[4], +parts[5]);
            if (!isNaN(parsed.getTime())) {
                createdDate = parsed;
            }
        }
    }

    const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const DT = { y: createdDate.getFullYear(), m: createdDate.getMonth() };

    function p2(n) { return String(n).padStart(2, '0'); }
    function sod(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    function dFull(d) {
        return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
    }
    function dTime(d) {
        return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
    }
    function formatLocalIso(d) {
        if (!d || isNaN(d.getTime())) return null;
        return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
    }

    function calHTML(y, m, sel) {
        const first = new Date(y, m, 1), pad = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), today = sod(new Date()).getTime();
        let h = '<div class="cal"><div class="cal-g">' + DOW.map(x => `<span class="dow">${x}</span>`).join('');
        for (let i = 0; i < pad; i++) h += '<span></span>';
        for (let d = 1; d <= days; d++) {
            const t = new Date(y, m, d).getTime();
            let c = 'd';
            if (t === today) c += ' today';
            if (t === sel) c += ' sel';
            h += `<button type="button" class="${c}" data-t="${t}">${d}</button>`;
        }
        return h + '</div></div>';
    }

    function paintDt() {
        if (!$dtPop.length) return;
        const sel = sod(createdDate).getTime(), times = [];
        for (let h = 0; h < 24; h++) {
            for (const m of [0, 30]) times.push(`${p2(h)}:${p2(m)}`);
        }
        const cur = dTime(createdDate);
        $dtPop.html(`
            <div style="flex:1">
                <div class="dtnav">
                    <button type="button" class="rp-nav" data-dn="-1"><i class="bi bi-chevron-left"></i></button>
                    <span>Tháng ${DT.m + 1}/${DT.y}</span>
                    <button type="button" class="rp-nav" data-dn="1"><i class="bi bi-chevron-right"></i></button>
                </div>
                ${calHTML(DT.y, DT.m, sel)}
            </div>
            <div class="times">
                ${times.map(t => `<button type="button" data-tm="${t}" class="${t === cur ? 'cur' : ''}">${t}</button>`).join('')}
            </div>
        `);
        const $times = $dtPop.find('.times');
        const $cur = $times.find('.cur');
        if ($times.length && $cur.length) {
            $times[0].scrollTop = $cur[0].offsetTop - ($times[0].clientHeight / 2) + ($cur[0].clientHeight / 2);
        }
    }

    if ($fDate.length && $dtPop.length) {
        let lastFocusTime = 0;

        const openDatePicker = () => {
            DT.y = createdDate.getFullYear();
            DT.m = createdDate.getMonth();
            paintDt();
            $('.pop.show').not($dtPop).removeClass('show');
            $dtPop.addClass('show');
        };

        $fDate.on('focus', function () {
            lastFocusTime = Date.now();
            openDatePicker();
        });

        $fDate.on('click', function (e) {
            e.stopPropagation();
            if (Date.now() - lastFocusTime < 300) {
                return;
            }
            if ($dtPop.hasClass('show')) {
                $dtPop.removeClass('show');
            } else {
                openDatePicker();
            }
        });

        $fDate.on('change', function () {
            const m = $(this).val().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
            if (m) {
                const d = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
                if (!isNaN(d.getTime())) {
                    createdDate = d;
                }
            }
            $(this).val(dFull(createdDate));
        });

        $dtPop.on('click', function (e) {
            e.stopPropagation();
            const $n = $(e.target).closest('[data-dn]');
            const $d = $(e.target).closest('button.d');
            const $t = $(e.target).closest('[data-tm]');

            if ($n.length) {
                const step = parseInt($n.data('dn'), 10);
                const x = new Date(DT.y, DT.m + step, 1);
                DT.y = x.getFullYear();
                DT.m = x.getMonth();
                paintDt();
            }
            if ($d.length) {
                const t = parseInt($d.data('t'), 10);
                const x = new Date(t);
                createdDate = new Date(x.getFullYear(), x.getMonth(), x.getDate(), createdDate.getHours(), createdDate.getMinutes());
                $fDate.val(dFull(createdDate));
                paintDt();
            }
            if ($t.length) {
                const parts = $t.data('tm').split(':');
                createdDate = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate(), parseInt(parts[0], 10), parseInt(parts[1], 10));
                $fDate.val(dFull(createdDate));
                paintDt();
            }
        });
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
        if (!item) return;
        const id = item.id || item.maHang;
        const code = item.code || item.maHangNoiBo || '';
        const name = item.name || item.tenHang || '';
        const unit = item.unit || item.tenDvt || '';
        const cost = Number(item.cost !== undefined ? item.cost : (item.gia !== undefined ? item.gia : item.giaVon)) || 0;
        const stock = Number(item.stock !== undefined ? item.stock : item.tonKho) || 0;

        let $existing = $(`#itemsTableBody tr.item-line-row[data-id="${id}"]`);
        if ($existing.length) {
            const $qtyInput = $existing.find('.line-qty');
            const currentQty = Number($qtyInput.val().replace(/\D/g, '')) || 0;
            $qtyInput.val(currentQty + 1);
            if (window.KiotToast) {
                KiotToast.success(`Đã tăng số lượng ${name} thành ${currentQty + 1}`);
            }
        } else {
            const isOver = 1 > stock;
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
                        <input type="text" class="qty line-qty ${isOver ? 'over' : ''}" value="1" inputmode="numeric" />
                        <span class="hint-over" style="${isOver ? '' : 'display: none;'}">Vượt tồn</span>
                    </td>
                    <td class="text-end num row-cost">${fmt(cost)}</td>
                    <td class="text-end num fw-bold text-dark row-amount">${fmt(cost)}</td>
                </tr>
            `;
            $('#itemsTableBody').prepend(rowHtml);
        }

        checkEmptyState();
    }

    // 1. Tìm kiếm Autocomplete hàng hóa (F3)
    if (typeof initF3ProductSearch === 'function') {
        initF3ProductSearch({
            inputSelector: '#productSearchInput',
            dropdownSelector: '#autocompleteDropdown',
            apiUrl: urls.searchProducts,
            getWarehouseId: function () {
                return currentWhId || Number($app.data('warehouse-id')) || 0;
            },
            onSelect: function (product) {
                addProduct(product);
            }
        });
    } else {
        let suggestList = [];
        let activeSuggestIdx = 0;

        function renderSuggestDropdown() {
            const $drop = $('#autocompleteDropdown');
            if (!suggestList.length) {
                $drop.html('<div class="p-3 text-center text-muted small">Không tìm thấy hàng hóa phù hợp</div>').show().addClass('show');
                return;
            }

            let html = '';
            suggestList.forEach((p, idx) => {
                const isAct = idx === activeSuggestIdx ? 'active' : '';
                const name = p.name || p.tenHang || '';
                const code = p.code || p.maHangNoiBo || '';
                const unit = p.unit || p.tenDvt || '';
                const cost = Number(p.cost !== undefined ? p.cost : (p.gia !== undefined ? p.gia : p.giaVon)) || 0;
                const stock = Number(p.stock !== undefined ? p.stock : p.tonKho) || 0;
                const firstLetter = (name || 'H').trim()[0].toUpperCase();

                html += `
                    <div class="kk-autocomplete-item ${isAct}" data-idx="${idx}">
                        <div class="d-flex align-items-center gap-2">
                            <div class="kk-item-thumb bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; border-radius: 6px;">
                                ${firstLetter}
                            </div>
                            <div>
                                <div class="fw-semibold text-dark text-truncate" style="max-width: 280px;">${name}</div>
                                <div class="text-muted small">${code} ${unit ? '(' + unit + ')' : ''}</div>
                            </div>
                        </div>
                        <div class="text-end ms-auto">
                            <div class="text-primary fw-bold small">Tồn gửi: ${fmt(stock)}</div>
                            <div class="text-muted small">Giá vốn: ${fmt(cost)}</div>
                        </div>
                    </div>
                `;
            });

            $drop.html(html).show().addClass('show');
        }

        let searchTimer = null;
        $('#productSearchInput').on('input', function () {
            clearTimeout(searchTimer);
            const query = $(this).val().trim();
            if (!query) {
                suggestList = [];
                $('#autocompleteDropdown').hide().removeClass('show').empty();
                return;
            }

            searchTimer = setTimeout(function () {
                $.get(urls.searchProducts, { q: query, whId: currentWhId }, function (data) {
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
                    const item = suggestList[activeSuggestIdx];
                    suggestList = [];
                    $('#autocompleteDropdown').hide().removeClass('show').empty();
                    addProduct(item);
                    $(this).val('').focus();
                }
            } else if (e.key === 'Escape') {
                suggestList = [];
                $('#autocompleteDropdown').hide().removeClass('show').empty();
            }
        });

        $(document).on('mousedown click', '.kk-autocomplete-item', function (e) {
            e.preventDefault();
            const idx = $(this).data('idx') !== undefined ? $(this).data('idx') : $(this).data('index');
            if (suggestList && suggestList[idx]) {
                const item = suggestList[idx];
                suggestList = [];
                $('#autocompleteDropdown').hide().removeClass('show').empty();
                addProduct(item);
                $('#productSearchInput').val('').focus();
            }
        });

        // Đóng dropdown khi click ra ngoài
        $(document).on('click', function (e) {
            if (!$(e.target).closest('.nh-search-wrap').length) {
                suggestList = [];
                $('#autocompleteDropdown').hide().removeClass('show').empty();
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

    // Khởi tạo
    checkEmptyState();

})(jQuery);
