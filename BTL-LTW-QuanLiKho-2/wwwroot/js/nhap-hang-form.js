/**
 * nhap-hang-form.js
 * Quản lý màn hình Lập / Sửa / Xem Phiếu Nhập Hàng (Chuẩn KiotViet)
 * Hỗ trợ Autocomplete F3, Import Excel, Tính toán tự động, Phím tắt F4/F9/F10
 */

$(function () {
    const $app = $('#nhFormApp');
    const isReadOnly = $app.data('is-readonly') === true;
    const warehouseId = $app.data('warehouse-id') || 1;
    const docId = parseInt($app.data('id') || '0', 10);
    const saveUrl = $app.data('save-url') || '/NhapHang/Save';
    const indexUrl = $app.data('index-url') || '/NhapHang/Index';
    const searchSuppliersUrl = $app.data('search-suppliers-url') || '/NhapHang/SearchSuppliers';
    const quickSupplierUrl = $app.data('quick-supplier-url') || '/NhapHang/QuickCreateSupplier';

    // 1. Khởi tạo Autocomplete tìm kiếm hàng hóa F3
    if (!isReadOnly && typeof initF3ProductSearch === 'function') {
        initF3ProductSearch({
            inputSelector: '#productSearchInput',
            dropdownSelector: '#autocompleteDropdown',
            apiUrl: $app.data('search-products-url') || '/NhapHang/SearchProducts',
            getWarehouseId: function () { return warehouseId; },
            onSelect: function (product) {
                addProductLine(product);
                $('#productSearchInput').val('').focus();
            }
        });
    }

    // ===== CHỌN NGÀY GIỜ LẬP PHIẾU =====
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

    if ($fDate.length && $dtPop.length && !isReadOnly) {
        let lastFocusTime = 0;

        const openDatePicker = () => {
            DT.y = createdDate.getFullYear();
            DT.m = createdDate.getMonth();
            paintDt();
            $('.pop.show').not($dtPop).removeClass('show');
            $dtPop.attr('data-owner', '#fDate');
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

    // Danh sách thao tác gần đây
    const recentActions = [];
    function logAction(type, name, qty) {
        recentActions.unshift({ type, name, qty });
        if (recentActions.length > 20) recentActions.pop();
        renderRecentList();
    }
    function renderRecentList() {
        if (!recentActions.length) {
            $('#recentList').html('<li class="muted">Chưa có thao tác</li>');
            return;
        }
        const html = recentActions.map(r => `
            <li>
                <i class="bi bi-${r.type === 'add' ? 'plus-circle' : 'pencil'} text-primary me-2"></i>
                <span>${escapeHtml(r.name)} (${r.qty})</span>
            </li>
        `).join('');
        $('#recentList').html(html);
    }

    function checkEmptyState() {
        const hasRows = $('#itemsTableBody tr.line-item-row').length > 0;
        if (hasRows) {
            $('#tableScrollWrap').show();
            $('#emptyLineBox').attr('style', 'display: none !important;');
        } else {
            $('#tableScrollWrap').hide();
            $('#emptyLineBox').attr('style', 'display: flex !important;');
        }
    }

    // 2. Thêm hoặc cộng dồn mặt hàng vào bảng
    function addProductLine(product, qty, price, discount) {
        qty = parseFloat(qty) || 1;
        price = parseFloat(price) !== undefined && !isNaN(parseFloat(price)) ? parseFloat(price) : (parseFloat(product.gia) || 0);
        discount = parseFloat(discount) || 0;

        const existingRow = $(`#itemsTableBody tr.line-item-row[data-id="${product.maHang}"]`);
        if (existingRow.length) {
            const $qtyInput = existingRow.find('.line-qty');
            const currentQty = parseFloat($qtyInput.val()) || 0;
            const newQty = currentQty + qty;
            $qtyInput.val(newQty).trigger('input');
            highlightRow(existingRow);
            logAction('edit', product.tenHang, newQty);
            return;
        }

        const delColHtml = isReadOnly ? '' : `
            <td class="w-del text-center">
                <button type="button" class="del btn-line-del" title="Xóa dòng này">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        const rowHtml = `
            <tr class="line-item-row" data-id="${product.maHang}" data-code="${product.maHangNoiBo}" data-name="${product.tenHang}" data-unit="${product.tenDvt || ''}">
                ${delColHtml}
                <td class="w-stt text-center line-stt">1</td>
                <td class="w-code">
                    <span class="code-text" title="${product.maHangNoiBo}">${product.maHangNoiBo}</span>
                </td>
                <td class="w-name">
                    <span class="name-text fw-semibold text-dark">${product.tenHang}</span>
                    <div class="text-muted small col-tonkho">Tồn kho: <strong class="text-primary">${(product.tonKho || 0).toLocaleString('vi-VN')}</strong></div>
                </td>
                <td class="w-dvt text-center text-muted col-dvt">${product.tenDvt || '---'}</td>
                <td class="text-end">
                    <input type="number" class="qty line-qty" value="${qty}" min="1" step="any" style="width: 80px;" />
                </td>
                <td class="text-end">
                    <input type="text" class="qty line-price kiot-num" value="${price.toLocaleString('vi-VN')}" style="width: 100px;" />
                </td>
                <td class="text-end col-giamgia">
                    <input type="text" class="qty line-discount kiot-num" value="${discount.toLocaleString('vi-VN')}" style="width: 90px;" />
                </td>
                <td class="text-end fw-bold text-dark line-total">
                    ${((qty * price) - discount).toLocaleString('vi-VN')}
                </td>
            </tr>
        `;

        $('#itemsTableBody').append(rowHtml);
        const newRow = $('#itemsTableBody tr.line-item-row').last();
        highlightRow(newRow);
        checkEmptyState();
        recalcAll();
        logAction('add', product.tenHang, qty);
    }

    function highlightRow($row) {
        $row.css('background-color', '#eff6ff');
        setTimeout(() => $row.css('background-color', ''), 600);
    }

    // 3. Xử lý sửa trực tiếp Số lượng, Đơn giá, Giảm giá trên từng dòng
    $(document).on('input change', '.line-qty, .line-price, .line-discount', function () {
        const $row = $(this).closest('tr.line-item-row');
        const qty = parseFloat($row.find('.line-qty').val()) || 0;
        const price = parseFormattedNumber($row.find('.line-price').val()) || 0;
        const discount = parseFormattedNumber($row.find('.line-discount').val()) || 0;

        const lineTotal = Math.max(0, (qty * price) - discount);
        $row.find('.line-total').text(lineTotal.toLocaleString('vi-VN'));

        recalcAll();
        const pName = $row.data('name') || '';
        logAction('edit', pName, qty);
    });

    // Xóa dòng
    $(document).on('click', '.btn-line-del', function () {
        $(this).closest('tr.line-item-row').remove();
        checkEmptyState();
        recalcAll();
    });

    // Thay đổi giảm giá toàn phiếu
    $('#orderDiscountInput').on('input change', function () {
        recalcAll();
    });

    // 4. Tính toán toàn bộ phiếu nhập
    function recalcAll() {
        let totalItems = 0;
        let totalQty = 0;
        let subtotal = 0;

        $('#itemsTableBody tr.line-item-row').each(function (idx) {
            totalItems++;
            $(this).find('.line-stt').text(idx + 1);

            const qty = parseFloat($(this).find('.line-qty').val()) || 0;
            const price = parseFormattedNumber($(this).find('.line-price').val()) || 0;
            const discount = parseFormattedNumber($(this).find('.line-discount').val()) || 0;
            const lineTotal = Math.max(0, (qty * price) - discount);

            totalQty += qty;
            subtotal += lineTotal;
        });

        const orderDiscount = parseFormattedNumber($('#orderDiscountInput').val()) || 0;
        const payable = Math.max(0, subtotal - orderDiscount);

        $('#lblTotalItems').text(totalItems);
        $('#lblTotalQty').text(totalQty.toLocaleString('vi-VN'));
        $('#lblSubtotal').text(subtotal.toLocaleString('vi-VN'));
        $('#lblPayable').text(payable.toLocaleString('vi-VN'));
    }

    function parseFormattedNumber(val) {
        if (!val) return 0;
        const clean = val.toString().replace(/[^\d.-]/g, '');
        return parseFloat(clean) || 0;
    }

    // 5. Thu gọn / Mở rộng Panel bên phải (F4)
    $('#btnToggleRightPanel').on('click', function () {
        $('#rightPanel').toggleClass('collapsed');
        $('#nhFormWrap').toggleClass('panel-closed panel-collapsed');
        const isCollapsed = $('#rightPanel').hasClass('collapsed');
        $(this).attr('title', isCollapsed ? 'Mở rộng thông tin (Phím tắt F4)' : 'Thu gọn thông tin (Phím tắt F4)');
        $('#rightPanelToggleIcon').attr('class', isCollapsed ? 'bi bi-chevron-left' : 'bi bi-chevron-right');
    });

    // 6. Tìm kiếm Nhà cung cấp Autocomplete & Quản lý chọn NCC
    let supplierSearchTimeout = null;
    let currentSuppliers = [];
    let activeSupplierIdx = -1;
    const $supInput = $('#supplierSearchInput');
    const $supDropdown = $('#supplierDropdown');
    const $btnClearSup = $('#btnClearSupplier');

    function setActiveSupplierIdx(idx, scrollIntoView) {
        if (!currentSuppliers.length) {
            activeSupplierIdx = -1;
            return;
        }
        if (idx < 0) idx = currentSuppliers.length - 1;
        if (idx >= currentSuppliers.length) idx = 0;
        activeSupplierIdx = idx;

        const $items = $supDropdown.find('.nh-supplier-item');
        $items.removeClass('active');
        const $target = $items.filter(`[data-index="${activeSupplierIdx}"]`);
        $target.addClass('active');

        if (scrollIntoView && $target.length) {
            const dropdownEl = $supDropdown[0];
            const targetEl = $target[0];
            const targetTop = targetEl.offsetTop;
            const targetBottom = targetTop + targetEl.offsetHeight;
            const dropdownTop = dropdownEl.scrollTop;
            const dropdownBottom = dropdownTop + dropdownEl.clientHeight;

            if (targetTop < dropdownTop) {
                dropdownEl.scrollTop = targetTop;
            } else if (targetBottom > dropdownBottom) {
                dropdownEl.scrollTop = targetBottom - dropdownEl.clientHeight;
            }
        }
    }

    function selectSupplier(id, name) {
        $('#selectedSupplierId').val(id || '');
        $supInput.val(name || '');
        $btnClearSup.toggle(Boolean(id || name));
        $supDropdown.hide();
        currentSuppliers = [];
        activeSupplierIdx = -1;
    }

    $supInput.on('input focus', function () {
        const q = $(this).val().trim();
        clearTimeout(supplierSearchTimeout);

        if (!$(this).val()) {
            $('#selectedSupplierId').val('');
            $btnClearSup.hide();
        } else {
            $btnClearSup.show();
        }

        supplierSearchTimeout = setTimeout(function () {
            $.ajax({
                url: searchSuppliersUrl,
                type: 'GET',
                data: { q: q },
                success: function (list) {
                    renderSupplierDropdown(list);
                },
                error: function () {
                    currentSuppliers = [];
                    activeSupplierIdx = -1;
                    $supDropdown.hide();
                }
            });
        }, 200);
    });

    $supInput.on('keydown', function (e) {
        if (!$supDropdown.is(':visible') || !currentSuppliers.length) {
            if (e.key === 'Escape') $supDropdown.hide();
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSupplierIdx(activeSupplierIdx + 1, true);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSupplierIdx(activeSupplierIdx - 1, true);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeSupplierIdx >= 0 && activeSupplierIdx < currentSuppliers.length) {
                const s = currentSuppliers[activeSupplierIdx];
                selectSupplier(s.maDonViCapHang, s.tenDonVi);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            $supDropdown.hide();
        }
    });

    function renderSupplierDropdown(list) {
        $supDropdown.empty();
        currentSuppliers = list || [];
        activeSupplierIdx = currentSuppliers.length > 0 ? 0 : -1;

        if (!currentSuppliers || currentSuppliers.length === 0) {
            $supDropdown.append(`
                <div class="p-3 text-center text-muted small">
                    <div class="mb-2">Không tìm thấy nhà cung cấp phù hợp</div>
                    <button type="button" class="btn btn-sm btn-outline-primary" id="btnQuickAddFromDropdown" style="font-size: 12px; padding: 3px 10px;">
                        <i class="bi bi-plus-lg me-1"></i>Thêm mới nhà cung cấp
                    </button>
                </div>
            `);
            $supDropdown.show();
            return;
        }

        currentSuppliers.forEach(function (s, idx) {
            const tenDonVi = s.tenDonVi || '';
            const maNcc = s.maNcc || '';
            const phone = s.dienThoai || '';
            const debt = parseFloat(s.noCanTra) || 0;
            const subText = [maNcc, phone].filter(Boolean).join(' · ');
            const isActive = idx === activeSupplierIdx ? ' active' : '';

            const html = `
                <div class="nh-supplier-item${isActive}" data-index="${idx}" data-id="${s.maDonViCapHang}" data-code="${escapeHtml(maNcc)}" data-name="${escapeHtml(tenDonVi)}" data-phone="${escapeHtml(phone)}">
                    <div class="sup-name" title="${escapeHtml(tenDonVi)}">${escapeHtml(tenDonVi)}</div>
                    <div class="sup-meta">
                        <span>${escapeHtml(subText)}</span>
                        <span class="sup-debt">Nợ: ${debt.toLocaleString('vi-VN')} đ</span>
                    </div>
                </div>
            `;
            $supDropdown.append(html);
        });
        $supDropdown.show();
    }

    $supDropdown.on('mouseenter', '.nh-supplier-item', function () {
        const idx = parseInt($(this).data('index'), 10);
        if (!isNaN(idx)) {
            setActiveSupplierIdx(idx, false);
        }
    });

    $(document).on('click', '.nh-supplier-item', function () {
        const id = $(this).data('id');
        const name = $(this).data('name');
        selectSupplier(id, name);
    });

    $supDropdown.on('click', '#btnQuickAddFromDropdown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $supDropdown.hide();
        $('#btnOpenAddSupplier').click();
    });

    $btnClearSup.on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        selectSupplier('', '');
        $supInput.focus();
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('.nh-supplier-wrap').length) {
            $supDropdown.hide();
        }
    });

    // Helper escapeHtml
    function escapeHtml(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // 7. Quản lý Modal Thêm mới Nhà Cung Cấp Đầy Đủ (Kế thừa từ Nhà Cung Cấp)
    function showNccModal(id) {
        const $m = $('#' + id);
        $m.addClass('show');
        $('body').addClass('modal-open');
    }

    function hideNccModal(id) {
        const $m = $('#' + id);
        $m.removeClass('show');
        if (!$('.hh-ov.show').length) {
            $('body').removeClass('modal-open');
        }
    }

    $(document).on('click', '[data-close]', function () {
        const target = $(this).data('close');
        hideNccModal(target);
    });

    $(document).on('click', '.hh-ov', function (e) {
        if (e.target === this) {
            hideNccModal(this.id);
        }
    });

    // Accordion Sections (.hh-sec)
    $(document).on('click', '.hh-sec-h', function () {
        $(this).closest('.hh-sec').toggleClass('open');
    });

    // Custom Combobox Nhóm NCC trong Modal
    const nccGroupCombobox = (function () {
        const $wrap = $('#wrapMaNhomNcc');
        if (!$wrap.length) return { select: function(){}, updateUI: function(){}, sync: function(){} };

        const $box = $('#boxMaNhomNcc');
        const $input = $('#inputMaNhomNcc');
        const $dropdown = $('#dropdownMaNhomNcc');
        const $search = $('#searchMaNhomNcc');
        const $list = $('#listMaNhomNcc');
        const $select = $('#nccMaNhomNcc');

        function open() {
            $wrap.addClass('open');
            $dropdown.show();
            $search.val('').focus();
            filterItems('');
        }

        function close() {
            $wrap.removeClass('open');
            $dropdown.hide();
        }

        function filterItems(keyword) {
            const q = (keyword || '').toLowerCase().trim();
            $list.find('.hh-cs-item').each(function () {
                const text = $(this).find('span').text().toLowerCase();
                $(this).toggle(text.includes(q));
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
                            <svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
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

    // Tạo nhanh nhóm NCC
    $('#btnNewNhomNcc').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('#nccPromptInput').val('');
        $('#nccPromptErr').hide();
        showNccModal('nccPromptOv');
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

        $.ajax({
            url: '/NhaCungCap/CreateGroupQuick',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ tenNhom: name }),
            success: function (res) {
                if (res.success) {
                    hideNccModal('nccPromptOv');
                    if (window.KiotToast) window.KiotToast.success(`Tạo nhóm "${res.tenNhom}" thành công.`);
                    if (!$(`#nccMaNhomNcc option[value="${res.maNhomNcc}"]`).length) {
                        $('#nccMaNhomNcc').append(`<option value="${res.maNhomNcc}">${escapeHtml(res.tenNhom)}</option>`);
                    }
                    nccGroupCombobox.sync();
                    nccGroupCombobox.select(res.maNhomNcc, res.tenNhom);
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
        showNccModal('nccEditGroupOv');
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
                    hideNccModal('nccEditGroupOv');
                    if (window.KiotToast) window.KiotToast.success(`Đã đổi tên nhóm thành "${res.tenNhom}".`);
                    $(`#nccMaNhomNcc option[value="${id}"]`).text(res.tenNhom);
                    nccGroupCombobox.sync();
                    if (String($('#nccMaNhomNcc').val()) === String(id)) {
                        nccGroupCombobox.select(id, res.tenNhom);
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
                    hideNccModal('nccEditGroupOv');
                    if (window.KiotToast) window.KiotToast.success(res.message);
                    $(`#nccMaNhomNcc option[value="${id}"]`).remove();
                    nccGroupCombobox.sync();
                    if (String($('#nccMaNhomNcc').val()) === String(id)) {
                        nccGroupCombobox.select('', '');
                    }
                }
            },
            error: function (xhr) {
                $('#nccEditGroupErr').text(xhr.responseJSON?.message || 'Không thể xóa nhóm này.').show();
            }
        });
    });

    // Reset và mở Modal Nhà Cung Cấp
    function resetSupplierModal() {
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
        $('#btnDeleteNccInModal').hide();
        $('#btnSaveAndNewNcc').show();
        $('#nccModalTitle').text('Thêm mới nhà cung cấp');
        $('#nccModalOv .hh-sec').addClass('open');
    }

    $('#nccTenDonVi').on('input', function () {
        if ($(this).val().trim()) {
            $('#nccFldTen').removeClass('invalid');
        }
    });

    $('#btnOpenAddSupplier').on('click', function () {
        resetSupplierModal();
        showNccModal('nccModalOv');
        setTimeout(() => $('#nccTenDonVi').focus(), 40);
    });

    // Submit Modal Nhà Cung Cấp (Lưu / Lưu & Thêm mới)
    function submitSupplierModal(isSaveAndNew) {
        const ten = $('#nccTenDonVi').val().trim();
        if (!ten) {
            $('#nccFldTen').addClass('invalid');
            $('#nccTenDonVi').focus();
            return;
        }
        $('#nccFldTen').removeClass('invalid');

        const payload = {
            maDonViCapHang: 0,
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
            trangThai: 'HOAT_DONG'
        };

        const $btn = isSaveAndNew ? $('#btnSaveAndNewNcc') : $('#btnSaveNcc');
        const oldHtml = $btn.html();
        $btn.prop('disabled', true).text('Đang lưu...');

        $.ajax({
            url: '/NhaCungCap/Create',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (res) {
                $btn.prop('disabled', false).html(oldHtml);
                if (res.success) {
                    if (window.KiotToast) KiotToast.success(res.message || 'Thêm nhà cung cấp thành công!');

                    // Tự động gán NCC vừa tạo vào ô chọn NCC trên form Nhập hàng
                    const newId = res.id || res.supplier?.maDonViCapHang;
                    const newName = res.supplier?.tenDonVi || ten;
                    selectSupplier(newId, newName);

                    if (isSaveAndNew) {
                        resetSupplierModal();
                        $('#nccTenDonVi').focus();
                    } else {
                        hideNccModal('nccModalOv');
                    }
                } else {
                    if (window.KiotToast) KiotToast.error(res.message || 'Lỗi khi lưu nhà cung cấp.');
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', false).html(oldHtml);
                const msg = xhr.responseJSON?.message || 'Không thể tạo nhà cung cấp.';
                if (window.KiotToast) KiotToast.error(msg);
            }
        });
    }

    $('#btnSaveNcc').on('click', function () {
        submitSupplierModal(false);
    });

    // 8. Tùy chọn hiển thị cột & Lưu ý
    $('#tEye').on('click', function (e) {
        e.stopPropagation();
        $('#dtPop').removeClass('show');
        $('#notes').removeClass('show');
        $('#fCols').toggleClass('show');
    });

    $('#tNote').on('click', function (e) {
        e.stopPropagation();
        $('#dtPop').removeClass('show');
        $('#fCols').removeClass('show');
        $('#notes').toggleClass('show');
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#tEye, #fCols').length) {
            $('#fCols').removeClass('show');
        }
        if (!$(e.target).closest('#tNote, #notes').length) {
            $('#notes').removeClass('show');
        }
        if (!$(e.target).closest('#fDate, #dtPop').length) {
            $('#dtPop').removeClass('show');
        }
    });

    $('#fCols input[type="checkbox"]').on('change', function () {
        const colKey = $(this).data('fc');
        const isChecked = $(this).is(':checked');
        if (colKey === 'dvt') {
            $('.col-dvt').toggle(isChecked);
        } else if (colKey === 'tonkho') {
            $('.col-tonkho').toggle(isChecked);
        } else if (colKey === 'giamgia') {
            $('.col-giamgia').toggle(isChecked);
        }
    });

    // Nút Chọn file dữ liệu từ empty state
    $('#btnPickExcel').on('click', function () {
        $('#excelFileInput').click();
    });

    // Tải file mẫu Excel
    $('#btnDownloadTemplate').on('click', function () {
        if (typeof XLSX !== 'undefined') {
            const sampleData = [
                ['STT', 'Mã hàng', 'Tên hàng', 'ĐVT', 'Số lượng', 'Đơn giá', 'Giảm giá'],
                [1, 'SP00001', 'Bia Sài Gòn Lager', 'Lon', 10, 12000, 0],
                [2, 'SP00002', 'Nước ngọt Coca Cola 330ml', 'Lon', 24, 10000, 0]
            ];
            const ws = XLSX.utils.aoa_to_sheet(sampleData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'MauNhapHang');
            XLSX.writeFile(wb, 'MauNhapHang_KiotViet.xlsx');
        } else {
            alert('Tính năng tải file mẫu đang chuẩn bị...');
        }
    });

    // 9. Nhập từ file Excel (SheetJS)
    $('#btnImportExcel').on('click', function () {
        $('#excelFileInput').click();
    });

    $('#excelFileInput').on('change', function (e) {
        const files = e.target.files;
        if (!files || !files.length) return;
        const file = files[0];

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (!json || json.length < 2) {
                    if (window.KiotToast) KiotToast.warning('File Excel không có dữ liệu.');
                    return;
                }

                // Tìm cột mã hàng, số lượng, giá
                let codeIdx = 1, qtyIdx = 4, priceIdx = 5;
                const header = json[0];
                for (let i = 0; i < header.length; i++) {
                    const h = (header[i] || '').toString().toLowerCase();
                    if (h.includes('mã hàng') || h.includes('barcode')) codeIdx = i;
                    if (h.includes('số lượng') || h.includes('sl')) qtyIdx = i;
                    if (h.includes('đơn giá') || h.includes('giá nhập')) priceIdx = i;
                }

                let importedCount = 0;
                for (let r = 1; r < json.length; r++) {
                    const row = json[r];
                    if (!row || !row[codeIdx]) continue;

                    const code = row[codeIdx].toString().trim();
                    const qty = parseFloat(row[qtyIdx]) || 1;
                    const price = parseFloat(row[priceIdx]) || 0;

                    // Thêm sản phẩm tạm thời dựa trên mã
                    addProductLine({
                        maHang: 0,
                        maHangNoiBo: code,
                        tenHang: `Hàng nhập (${code})`,
                        tenDvt: 'Cái',
                        gia: price,
                        tonKho: 0
                    }, qty, price, 0);

                    importedCount++;
                }

                if (window.KiotToast) KiotToast.success(`Đã nạp ${importedCount} mặt hàng từ file Excel!`);
            } catch (err) {
                if (window.KiotToast) KiotToast.error('Không thể đọc file Excel: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
        $(this).val('');
    });

    // 9. Lưu phiếu (Lưu tạm F9 hoặc Hoàn thành F10)
    $('#btnSaveDraft').on('click', function () {
        submitDoc('TAM');
    });

    $('#btnSaveComplete').on('click', function () {
        submitDoc('HOAN_THANH');
    });

    function submitDoc(actionType) {
        const lines = [];
        $('#itemsTableBody tr.line-item-row').each(function () {
            const maHang = parseInt($(this).data('id'), 10);
            const qty = parseFloat($(this).find('.line-qty').val()) || 0;
            const price = parseFormattedNumber($(this).find('.line-price').val()) || 0;
            const discount = parseFormattedNumber($(this).find('.line-discount').val()) || 0;

            if (maHang > 0 && qty > 0) {
                lines.push({
                    MaHang: maHang,
                    SoLuong: qty,
                    DonGiaNhap: price,
                    GiamGia: discount
                });
            }
        });

        if (lines.length === 0) {
            if (window.KiotToast) KiotToast.error('Vui lòng thêm ít nhất 1 mặt hàng vào phiếu nhập.');
            $('#productSearchInput').focus();
            return;
        }

        const supplierId = parseInt($('#selectedSupplierId').val() || '0', 10);

        const payload = {
            MaPhieuNhap: docId,
            MaPhieu: $('#txtDocCode').val().trim(),
            MaKho: warehouseId,
            NgayLap: formatLocalIso(createdDate),
            MaDonViCapHang: supplierId > 0 ? supplierId : null,
            SoHoaDon: $('#txtInvoiceNo').val().trim(),
            GhiChu: $('#txtDocNote').val().trim(),
            GiamGia: parseFormattedNumber($('#orderDiscountInput').val()) || 0,
            ActionType: actionType,
            Lines: lines
        };

        const $btn = actionType === 'HOAN_THANH' ? $('#btnSaveComplete') : $('#btnSaveDraft');
        const oldHtml = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Đang xử lý...');

        $.ajax({
            url: saveUrl,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (res) {
                if (res.success) {
                    if (window.KiotToast) KiotToast.success(res.message || 'Lưu phiếu nhập thành công!');
                    setTimeout(function () {
                        window.location.href = indexUrl;
                    }, 500);
                } else {
                    $btn.prop('disabled', false).html(oldHtml);
                    if (window.KiotToast) KiotToast.error(res.message || 'Lỗi khi lưu phiếu nhập.');
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', false).html(oldHtml);
                const msg = xhr.responseJSON?.message || 'Đã xảy ra lỗi máy chủ khi lưu phiếu.';
                if (window.KiotToast) KiotToast.error(msg);
            }
        });
    }

    // 10. Phím tắt toàn cục F3, F4, F9, F10, Escape
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            $('#dtPop').removeClass('show');
            $('#fCols').removeClass('show');
            $('#notes').removeClass('show');
        }

        if (isReadOnly) return;

        if (e.key === 'F3' || e.keyCode === 114) {
            e.preventDefault();
            $('#productSearchInput').focus().select();
        } else if (e.key === 'F4' || e.keyCode === 115) {
            e.preventDefault();
            $('#btnToggleRightPanel').trigger('click');
        } else if (e.key === 'F9' || e.keyCode === 120) {
            e.preventDefault();
            $('#btnSaveDraft').trigger('click');
        } else if (e.key === 'F10' || e.keyCode === 121) {
            e.preventDefault();
            $('#btnSaveComplete').trigger('click');
        }
    });

    // Tự động sinh mã nếu đang tạo mới và chưa có mã
    if (docId === 0 && !$('#txtDocCode').val()) {
        $.ajax({
            url: '/NhapHang/GetNextCode',
            type: 'GET',
            success: function (res) {
                if (res.success && res.code) {
                    $('#txtDocCode').attr('placeholder', res.code);
                }
            }
        });
    }

    // Tính toán ban đầu
    recalcAll();
});
