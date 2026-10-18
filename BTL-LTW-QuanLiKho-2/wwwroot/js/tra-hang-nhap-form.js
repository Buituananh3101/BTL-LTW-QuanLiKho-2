/**
 * tra-hang-nhap-form.js
 * Quản lý màn hình Lập / Sửa / Xem Phiếu Trả Hàng Nhập (Chuẩn KiotViet & Prototype)
 * Autocomplete F3, Kiểm tra vượt tồn, Phím tắt F3/F4/F8/F9/F10, Panel trượt mượt
 */

$(function () {
    'use strict';

    const $app = $('#thnFormApp');
    if (!$app.length) return;

    const isReadOnly = $app.data('is-readonly') === true;
    const warehouseId = parseInt($app.data('warehouse-id'), 10) || 1;
    const docId = parseInt($app.data('id') || '0', 10);
    const saveUrl = $app.data('save-url') || '/TraHangNhap/Save';
    const indexUrl = $app.data('index-url') || '/TraHangNhap/Index';
    const searchProductsUrl = $app.data('search-products-url') || '/TraHangNhap/SearchProduct';
    const searchSuppliersUrl = $app.data('search-suppliers-url') || '/TraHangNhap/SearchSupplier';
    const templateUrl = $app.data('template-url') || '/TraHangNhap/DownloadTemplate';
    const importUrl = $app.data('import-url') || '/TraHangNhap/ImportExcel';

    let discMode = 'vnd'; // 'vnd' hoặc 'pct'
    let discVal = 0;
    let paidAuto = docId <= 0; // Tự động điền tiền NCC trả bằng Cần trả nếu là phiếu mới

    /* ===== 1. TIỆN ÍCH ĐỊNH DẠNG SỐ & NGÀY THÁNG ===== */
    function fmt(n) {
        return (Number(n) || 0).toLocaleString('vi-VN');
    }

    function digits(s) {
        return Number(String(s || '').replace(/\D/g, '') || 0);
    }

    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function p2(n) { return String(n).padStart(2, '0'); }

    /* ===== 2. POPUP CHỌN NGÀY GIỜ (LEGO KIOTDATETIMEPICKER) ===== */
    const $fDateIso = $('#fDateIso');
    function formatLocalIso(d) {
        if (!d || isNaN(d.getTime())) return '';
        const p2 = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:00`;
    }

    let createdDate = new Date();
    if ($fDateIso.length && $fDateIso.val()) {
        const d = new Date($fDateIso.val());
        if (!isNaN(d.getTime())) createdDate = d;
    }

    const dtPicker = (window.KiotFilter && typeof KiotFilter.initDateTimePicker === 'function')
        ? KiotFilter.initDateTimePicker({
            inputSelector: '#fDateInp',
            popupSelector: '#dtPop',
            isReadOnly: isReadOnly,
            onChange: function (d, text, iso) {
                createdDate = d;
                if ($fDateIso.length) $fDateIso.val(iso || formatLocalIso(d));
            }
        })
        : null;
    if (dtPicker) {
        createdDate = dtPicker.getDate();
        if ($fDateIso.length) $fDateIso.val(dtPicker.getISO() || formatLocalIso(createdDate));
    }

    /* ===== 2.1. CHỌN NGƯỜI TRẢ TỪ DROPDOWN TÙY CHỈNH (ĐỒNG BỘ CHUYỂN KHO & KIOTVIET) ===== */
    $(document).on('click', '.payer-item-opt', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        const name = $(this).data('name');

        $('#fPayer').val(id);
        $('.payer-selected-text').text(name).removeClass('text-muted').addClass('text-dark fw-medium');
        $('.payer-item-opt').removeClass('active fw-semibold');
        $('.payer-item-opt .payer-check-icon').addClass('d-none');
        $(this).addClass('active fw-semibold').find('.payer-check-icon').removeClass('d-none');

        // Đóng dropdown Bootstrap nếu đang mở
        const btn = document.getElementById('btnSelectPayer');
        if (btn && window.bootstrap && window.bootstrap.Dropdown) {
            const inst = bootstrap.Dropdown.getInstance(btn);
            if (inst) inst.hide();
        }
    });

    /* ===== 3. QUẢN LÝ DANH SÁCH HÀNG HÓA TRẢ ===== */
    function checkEmptyState() {
        const hasRows = $('#itemsTableBody tr.line-item-row').length > 0;
        $('#tableScrollWrap').show();
        if (hasRows) {
            $('#emptyWrap').attr('style', 'display: none !important;');
        } else {
            $('#emptyWrap').attr('style', 'display: flex !important;');
        }
    }

    function renumberSTT() {
        let stt = 1;
        $('#itemsTableBody tr.line-item-row').each(function () {
            $(this).find('.line-stt').text(stt++);
        });
    }

    function recalculateTotals() {
        let totalItems = 0;
        let totalQty = 0;
        let subtotal = 0;

        $('#itemsTableBody tr.line-item-row').each(function () {
            totalItems++;
            const qty = digits($(this).find('.line-qty').val());
            const price = digits($(this).find('.line-price').val());
            const lineTotal = qty * price;

            totalQty += qty;
            subtotal += lineTotal;
            $(this).find('.line-total').text(fmt(lineTotal));

            const stock = Number($(this).data('stock')) || 0;
            const isOver = qty > stock;
            $(this).find('.line-qty').toggleClass('over', isOver);
            $(this).find('.hint-over').toggle(isOver);
        });

        $('#lblTotalItems').text(totalItems);
        $('#lblTotalQty').text(fmt(totalQty));
        $('#lblSubtotal').text(fmt(subtotal));

        // Tính giảm giá
        let discAmount = 0;
        if (discMode === 'pct') {
            discAmount = Math.round(subtotal * Math.min(discVal, 100) / 100);
        } else {
            discAmount = Math.min(discVal, subtotal);
        }

        const payable = Math.max(0, subtotal - discAmount);
        $('#lblPayable').text(fmt(payable));

        if (paidAuto) {
            $('#orderPaidInput').val(fmt(payable));
        }

        const paid = digits($('#orderPaidInput').val());
        const debt = payable - paid;
        $('#lblDebt').text(fmt(debt)).toggleClass('text-danger', debt > 0).toggleClass('text-dark', debt <= 0);

        checkEmptyState();
    }

    function addProductLine(p, qty, price) {
        qty = digits(qty) || 1;
        price = price !== undefined && price !== null ? digits(price) : (digits(p.cost) || 0);

        const $existing = $(`#itemsTableBody tr.line-item-row[data-id="${p.id}"]`);
        if ($existing.length) {
            const $qtyInp = $existing.find('.line-qty');
            const newQty = digits($qtyInp.val()) + qty;
            $qtyInp.val(fmt(newQty));
            recalculateTotals();
            if (window.KiotToast) KiotToast.info(`${p.name}: số lượng = ${newQty}`);
            return;
        }

        const delHtml = isReadOnly ? '' : `
            <td class="w-del text-center">
                <button type="button" class="del btn-line-del" title="Xóa dòng này">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        const rowHtml = `
            <tr class="line-item-row" data-id="${p.id}" data-code="${escapeHtml(p.code)}" data-name="${escapeHtml(p.name)}" data-unit="${escapeHtml(p.unit || '')}" data-cost="${p.cost || 0}" data-stock="${p.stock || 0}">
                ${delHtml}
                <td class="w-stt text-center line-stt">1</td>
                <td class="w-code">
                    <span class="code-text" title="${escapeHtml(p.code)}">${escapeHtml(p.code)}</span>
                </td>
                <td class="w-name">
                    <span class="name-text fw-semibold text-dark">${escapeHtml(p.name)}</span>
                    <div class="text-muted small col-tonkho">Tồn kho: <strong class="text-primary">${fmt(p.stock || 0)}</strong></div>
                </td>
                <td class="w-dvt text-center text-muted col-dvt">${escapeHtml(p.unit || '---')}</td>
                <td class="text-end">
                    <input type="text" class="inp text-end line-qty" value="${fmt(qty)}" inputmode="numeric" style="width: 90px; height: 32px;" />
                    <span class="hint-over text-danger small" style="display: none;">Vượt tồn (còn ${fmt(p.stock || 0)})</span>
                </td>
                <td class="text-end text-muted col-giavon">
                    <span>${fmt(p.cost || 0)}</span>
                </td>
                <td class="text-end">
                    <input type="text" class="inp text-end line-price kiot-num" value="${fmt(price)}" inputmode="numeric" style="width: 105px; height: 32px;" />
                </td>
                <td class="text-end fw-bold text-dark line-total">
                    ${fmt(qty * price)}
                </td>
            </tr>
        `;

        $('#itemsTableBody').prepend(rowHtml);
        renumberSTT();
        recalculateTotals();
    }

    // Xóa dòng hàng
    $(document).on('click', '.btn-line-del', function () {
        $(this).closest('tr.line-item-row').remove();
        renumberSTT();
        recalculateTotals();
    });

    // Sửa số lượng / giá trả
    $(document).on('input', '.line-qty', function () {
        const raw = digits($(this).val());
        $(this).val(raw > 0 ? fmt(raw) : '');
        recalculateTotals();
    });

    $(document).on('input', '.line-price', function () {
        const raw = digits($(this).val());
        $(this).val(raw ? fmt(raw) : '0');
        recalculateTotals();
    });

    /* ===== 4. AUTOCOMPLETE HÀNG HÓA F3 DÙNG LEGO KIOTFILTER.INITPRODUCTSEARCH ===== */
    if (!isReadOnly && window.KiotFilter && typeof KiotFilter.initProductSearch === 'function') {
        KiotFilter.initProductSearch({
            inputSelector: '#productSearchInput',
            dropdownSelector: '#autocompleteDropdown',
            apiUrl: searchProductsUrl,
            getWarehouseId: function () { return warehouseId; },
            onSelect: function (product) {
                addProductLine(product);
            }
        });
    }

    /* ===== 5. TÌM KIẾM & CHỌN NHÀ CUNG CẤP ===== */
    let supDebounce;
    $('#supQ').on('input focus', function () {
        clearTimeout(supDebounce);
        const q = $(this).val()?.trim() || '';

        supDebounce = setTimeout(function () {
            $.ajax({
                url: searchSuppliersUrl,
                type: 'GET',
                data: { q: q },
                success: function (list) {
                    const $box = $('#supsg');
                    if (!list || !list.length) {
                        $box.html('<div class="p-2 text-muted small text-center">Không tìm thấy nhà cung cấp</div>').show();
                        return;
                    }

                    const html = list.map(s => `
                        <div class="ac-item" data-id="${s.id}" data-name="${escapeHtml(s.name)}" data-code="${escapeHtml(s.code)}" data-phone="${escapeHtml(s.phone)}">
                            <div class="ac-thumb">${escapeHtml(s.name.charAt(0))}</div>
                            <div class="ac-info">
                                <b>${escapeHtml(s.name)}</b>
                                <small>${escapeHtml(s.code)} · ${escapeHtml(s.phone)}</small>
                            </div>
                        </div>
                    `).join('');

                    $box.html(html).show();
                }
            });
        }, 200);
    });

    $(document).on('mousedown', '#supsg .ac-item', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        const name = $(this).data('name');
        const code = $(this).data('code');
        const phone = $(this).data('phone');

        $('#selectedSupplierId').val(id);
        $('#supwrap').html(`
            <div class="supchip d-flex justify-content-between align-items-center p-2 rounded-2" style="background: #eef4ff; border: 1px solid #cfe0fb;">
                <div>
                    <b class="d-block text-dark small">${escapeHtml(name)}</b>
                    <small class="text-muted" style="font-size: 12px;">${escapeHtml(code)} · ${escapeHtml(phone)} · Nợ: <span class="text-danger fw-semibold">0</span></small>
                </div>
                <button type="button" class="btn-close" id="btnRemoveSup" aria-label="Bỏ chọn NCC" style="font-size: 10px;"></button>
            </div>
            <input type="hidden" id="selectedSupplierId" value="${id}" />
        `);
        $('#supsg').hide();
    });

    $(document).on('click', '#btnRemoveSup', function () {
        $('#supwrap').html(`
            <div class="supbox d-flex align-items-center border rounded-2 bg-white" style="height: 36px;">
                <input type="text" id="supQ" class="border-0 px-2 flex-grow-1" placeholder="Tìm nhà cung cấp (F4)..." autocomplete="off" style="outline: none; font-size: 13.5px;" />
                <button type="button" class="border-0 bg-transparent px-2 text-primary" id="btnOpenAddSupplier" title="Thêm mới nhanh nhà cung cấp">
                    <i class="bi bi-plus-lg"></i>
                </button>
            </div>
            <input type="hidden" id="selectedSupplierId" value="" />
            <div class="pop supsg shadow-sm rounded-2 position-absolute" id="supsg" style="display: none; top: 40px; left: 0; right: 0; max-height: 250px; overflow-y: auto; background: #fff; z-index: 50; border: 1px solid #e2e8f0;"></div>
        `);
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#supwrap').length) {
            $('#supsg').hide();
        }
    });

    /* ===== 6. GIẢM GIÁ & THANH TOÁN TIỀN NCC TRẢ (F8) ===== */
    $('#btnDiscVnd').on('click', function () {
        discMode = 'vnd';
        $(this).addClass('btn-primary active').removeClass('btn-outline-secondary');
        $('#btnDiscPct').removeClass('btn-primary active').addClass('btn-outline-secondary');
        recalculateTotals();
    });

    $('#btnDiscPct').on('click', function () {
        discMode = 'pct';
        $(this).addClass('btn-primary active').removeClass('btn-outline-secondary');
        $('#btnDiscVnd').removeClass('btn-primary active').addClass('btn-outline-secondary');
        recalculateTotals();
    });

    $('#orderDiscountInput').on('input', function () {
        discVal = digits($(this).val());
        if (discMode === 'pct' && discVal > 100) discVal = 100;
        $(this).val(discVal ? fmt(discVal) : '0');
        recalculateTotals();
    });

    $('#orderPaidInput').on('input', function () {
        paidAuto = false;
        const raw = digits($(this).val());
        $(this).val(fmt(raw));
        recalculateTotals();
    });

    /* ===== 7. ĐÓNG MỞ PANEL PHẢI (F4 - MƯỢT MÀ CHUẨN KIỂM KHO) ===== */
    function toggleRightPanel() {
        const $panel = $('#thnRightPanel');
        const $wrap = $('#thnFormWrap');
        const $btn = $('#btnToggleRightPanel');
        const $icon = $('#rightPanelToggleIcon');

        $panel.toggleClass('collapsed');
        const isCollapsed = $panel.hasClass('collapsed');
        $wrap.toggleClass('panel-collapsed', isCollapsed);
        $btn.toggleClass('collapsed', isCollapsed);

        $btn.attr('title', isCollapsed ? 'Mở rộng thông tin (Phím tắt F4)' : 'Thu gọn thông tin (Phím tắt F4)');
        $icon.attr('class', isCollapsed ? 'bi bi-chevron-left' : 'bi bi-chevron-right');
    }

    $('#btnToggleRightPanel').on('click', function (e) {
        e.preventDefault();
        toggleRightPanel();
    });

    // Tự động viết hoa mã phiếu khi gõ
    $('#txtDocCode').on('input', function () {
        $(this).val($(this).val().toUpperCase());
    });

    // Ẩn/hiện popup lưu ý & cột
    $('#tNote').on('click', function (e) {
        e.stopPropagation();
        $('#notes').toggleClass('show');
    });

    $('#tEye').on('click', function (e) {
        e.stopPropagation();
        $('#fCols').toggleClass('show');
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#tNote, #notes').length) $('#notes').removeClass('show');
        if (!$(e.target).closest('#tEye, #fCols').length) $('#fCols').removeClass('show');
    });

    $('#fCols input[data-fc]').on('change', function () {
        const col = $(this).data('fc');
        $(`.col-${col}`).toggle(this.checked);
    });

    /* ===== 8. IMPORT TỪ FILE EXCEL / CSV & TẢI MẪU ===== */
    $('#btnDownloadTemplate').on('click', function () {
        window.location.href = templateUrl;
    });

    $('#btnSelectFile').on('click', function () {
        $('#excelFileInput').click();
    });

    $('#btnImportExcel').on('click', function () {
        $('#excelFileInput').click();
    });

    $('#excelFileInput').on('change', function (e) {
        const files = e.target.files;
        if (!files || !files.length) return;
        const file = files[0];

        const formData = new FormData();
        formData.append('file', file);
        formData.append('warehouseId', warehouseId);

        if (window.KiotToast) KiotToast.info('Đang đối soát dữ liệu file với hệ thống...');

        $.ajax({
            url: importUrl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (res) {
                if (res && res.success && res.items && res.items.length) {
                    let importedCount = 0;
                    res.items.forEach(item => {
                        addProductLine(item, item.qty, item.price);
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

    /* ===== 9. GỬI DỮ LIỆU LƯU PHIẾU (F9 LƯU TẠM / F10 HOÀN THÀNH) ===== */
    function submitDoc(actionType) {
        $('#fErr').empty();
        const lines = [];
        let hasZero = false;
        let hasOver = false;

        $('#itemsTableBody tr.line-item-row').each(function () {
            const hangId = parseInt($(this).data('id'), 10);
            const qty = digits($(this).find('.line-qty').val());
            const price = digits($(this).find('.line-price').val());
            const cost = Number($(this).data('cost')) || 0;
            const stock = Number($(this).data('stock')) || 0;

            if (qty <= 0) hasZero = true;
            if (qty > stock) hasOver = true;

            lines.push({
                MaHang: hangId,
                SoLuong: qty,
                GiaVon: cost,
                DonGiaTra: price
            });
        });

        if (!lines.length) {
            $('#fErr').text('Vui lòng chọn ít nhất một mặt hàng để trả.');
            $('#productSearchInput').focus();
            return;
        }

        if (hasZero) {
            $('#fErr').text('Có mặt hàng chưa nhập số lượng trả hợp lệ (> 0).');
            return;
        }

        if (actionType === 'HOAN_THANH' && hasOver) {
            $('#fErr').text('Có mặt hàng trả vượt quá số lượng tồn kho hiện tại. Hệ thống không cho phép tồn âm.');
            return;
        }

        const supId = parseInt($('#selectedSupplierId').val(), 10);
        const subtotal = digits($('#lblSubtotal').text());
        let discAmount = discMode === 'pct' ? Math.round(subtotal * Math.min(discVal, 100) / 100) : Math.min(discVal, subtotal);
        const payable = Math.max(0, subtotal - discAmount);
        const paid = digits($('#orderPaidInput').val());

        if (paid > payable) {
            $('#fErr').text('Tiền NCC trả không được lớn hơn số tiền NCC cần trả.');
            return;
        }

        if ((!supId || supId <= 0) && paid < payable) {
            $('#fErr').text('Chưa chọn nhà cung cấp thì NCC phải thanh toán đủ (không thể ghi nhận công nợ bù trừ).');
            return;
        }

        const payload = {
            MaPhieuTraHang: docId,
            MaPhieu: ($('#txtDocCode').val() || '').trim().toUpperCase() || null,
            MaKho: warehouseId,
            NgayTra: $fDateIso.val() || null,
            MaNvtra: parseInt($('#fPayer').val(), 10) || null,
            MaDonViCapHang: supId > 0 ? supId : null,
            GhiChu: $('#fNote').val() || null,
            GiamGia: discAmount,
            DaThuNcc: paid,
            ActionType: actionType,
            Lines: lines
        };

        const $btns = $('#btnSaveDraft, #btnSaveComplete');
        $btns.prop('disabled', true);

        const token = $('input[name="__RequestVerificationToken"]').val();

        $.ajax({
            url: saveUrl,
            type: 'POST',
            contentType: 'application/json',
            headers: { 'RequestVerificationToken': token },
            data: JSON.stringify(payload),
            success: function (res) {
                if (res?.success) {
                    if (window.KiotToast) KiotToast.success(res.message);
                    setTimeout(function () {
                        window.location.href = indexUrl;
                    }, 500);
                } else {
                    $btns.prop('disabled', false);
                    $('#fErr').text(res?.message || 'Không thể lưu phiếu.');
                }
            },
            error: function (xhr) {
                $btns.prop('disabled', false);
                const msg = xhr.responseJSON?.message || 'Lỗi khi lưu phiếu trả hàng.';
                $('#fErr').text(msg);
            }
        });
    }

    $('#btnSaveDraft').on('click', function () {
        submitDoc('TAM');
    });

    $('#btnSaveComplete').on('click', function () {
        if (!confirm('Hoàn thành phiếu trả hàng nhập sẽ TRỪ TỒN KHO ngay lập tức và bù trừ công nợ NCC. Tiếp tục?')) return;
        submitDoc('HOAN_THANH');
    });

    /* ===== 10. PHÍM TẮT TOÀN CỤC ===== */
    $(document).on('keydown', function (e) {
        if (e.key === 'F3') {
            e.preventDefault();
            $('#productSearchInput').focus().select();
        } else if (e.key === 'F4') {
            e.preventDefault();
            toggleRightPanel();
        } else if (e.key === 'F8') {
            e.preventDefault();
            $('#orderPaidInput').focus().select();
        } else if (e.key === 'F9') {
            e.preventDefault();
            $('#btnSaveDraft').click();
        } else if (e.key === 'F10') {
            e.preventDefault();
            $('#btnSaveComplete').click();
        }
    });

    // Khởi tạo trạng thái ban đầu
    recalculateTotals();
});
