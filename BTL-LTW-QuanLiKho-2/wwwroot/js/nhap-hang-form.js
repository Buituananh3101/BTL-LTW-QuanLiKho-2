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

    // 2. Thêm hoặc cộng dồn mặt hàng vào bảng
    function addProductLine(product, qty, price, discount) {
        qty = parseFloat(qty) || 1;
        price = parseFloat(price) !== undefined && !isNaN(parseFloat(price)) ? parseFloat(price) : (parseFloat(product.gia) || 0);
        discount = parseFloat(discount) || 0;

        const existingRow = $(`#itemsTableBody tr.line-item-row[data-id="${product.maHang}"]`);
        if (existingRow.length) {
            const $qtyInput = existingRow.find('.line-qty');
            const currentQty = parseFloat($qtyInput.val()) || 0;
            $qtyInput.val(currentQty + qty).trigger('input');
            highlightRow(existingRow);
            return;
        }

        $('#emptyLineRow').remove();

        const rowHtml = `
            <tr class="line-item-row" data-id="${product.maHang}" data-code="${product.maHangNoiBo}" data-name="${product.tenHang}" data-unit="${product.tenDvt || ''}">
                <td class="text-center line-stt">1</td>
                <td class="fw-medium text-primary">${product.maHangNoiBo}</td>
                <td>
                    <div class="fw-semibold text-dark">${product.tenHang}</div>
                    <div class="text-muted small">Tồn kho: <strong class="text-primary">${(product.tonKho || 0).toLocaleString('vi-VN')}</strong></div>
                </td>
                <td class="text-center text-muted">${product.tenDvt || '---'}</td>
                <td class="text-end">
                    <input type="number" class="line-qty form-control form-control-sm text-end" value="${qty}" min="1" step="any" />
                </td>
                <td class="text-end">
                    <input type="text" class="line-price form-control form-control-sm text-end kiot-num" value="${price.toLocaleString('vi-VN')}" />
                </td>
                <td class="text-end">
                    <input type="text" class="line-discount form-control form-control-sm text-end kiot-num" value="${discount.toLocaleString('vi-VN')}" />
                </td>
                <td class="text-end fw-bold text-dark line-total">
                    ${((qty * price) - discount).toLocaleString('vi-VN')}
                </td>
                <td class="text-center">
                    <button type="button" class="btn-line-del" title="Xóa dòng này">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;

        $('#itemsTableBody').append(rowHtml);
        const newRow = $('#itemsTableBody tr.line-item-row').last();
        highlightRow(newRow);
        recalcAll();
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
    });

    // Xóa dòng
    $(document).on('click', '.btn-line-del', function () {
        $(this).closest('tr.line-item-row').remove();
        if ($('#itemsTableBody tr.line-item-row').length === 0) {
            $('#itemsTableBody').html(`
                <tr id="emptyLineRow">
                    <td colspan="9" class="text-center py-5 text-muted">
                        <i class="bi bi-box-seam fs-1 text-secondary opacity-50 d-block mb-2"></i>
                        <span>Chưa có mặt hàng nào. Nhấn <strong>F3</strong> hoặc chọn từ danh sách để thêm hàng.</span>
                    </td>
                </tr>
            `);
        }
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
        $('#nhFormWrap').toggleClass('panel-closed');
        const isCollapsed = $('#rightPanel').hasClass('collapsed');
        $('#rightPanelToggleIcon').attr('class', isCollapsed ? 'bi bi-chevron-left' : 'bi bi-chevron-right');
    });

    // 6. Tìm kiếm Nhà cung cấp Autocomplete
    let supplierSearchTimeout = null;
    const $supInput = $('#supplierSearchInput');
    const $supDropdown = $('#supplierDropdown');

    $supInput.on('input focus', function () {
        const q = $(this).val().trim();
        clearTimeout(supplierSearchTimeout);

        supplierSearchTimeout = setTimeout(function () {
            $.ajax({
                url: searchSuppliersUrl,
                type: 'GET',
                data: { q: q },
                success: function (list) {
                    renderSupplierDropdown(list);
                },
                error: function () {
                    $supDropdown.hide();
                }
            });
        }, 200);
    });

    function renderSupplierDropdown(list) {
        $supDropdown.empty();
        if (!list || list.length === 0) {
            $supDropdown.append('<div class="p-3 text-center text-muted small">Không tìm thấy nhà cung cấp</div>');
            $supDropdown.show();
            return;
        }

        list.forEach(function (s) {
            const html = `
                <div class="nh-supplier-item" data-id="${s.maDonViCapHang}" data-code="${s.maNcc}" data-name="${s.tenDonVi}" data-phone="${s.dienThoai}">
                    <div class="fw-bold text-dark">${s.tenDonVi}</div>
                    <div class="small text-muted d-flex justify-content-between">
                        <span>${s.maNcc} ${s.dienThoai ? '· ' + s.dienThoai : ''}</span>
                        <span>Nợ: <strong class="text-danger">${(s.noCanTra || 0).toLocaleString('vi-VN')} đ</strong></span>
                    </div>
                </div>
            `;
            $supDropdown.append(html);
        });
        $supDropdown.show();
    }

    $(document).on('click', '.nh-supplier-item', function () {
        const id = $(this).data('id');
        const name = $(this).data('name');
        $('#selectedSupplierId').val(id);
        $supInput.val(name);
        $supDropdown.hide();
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('.nh-supplier-wrap').length) {
            $supDropdown.hide();
        }
    });

    // 7. Thêm nhanh Nhà cung cấp bằng Modal
    $('#btnOpenAddSupplier').on('click', function () {
        $('#quickSupplierForm')[0].reset();
        const modal = new bootstrap.Modal(document.getElementById('quickSupplierModal'));
        modal.show();
        setTimeout(() => $('#qsName').focus(), 300);
    });

    $('#btnSubmitQuickSupplier').on('click', function () {
        const ten = $('#qsName').val().trim();
        if (!ten) {
            if (window.KiotToast) KiotToast.error('Vui lòng nhập tên nhà cung cấp.');
            $('#qsName').focus();
            return;
        }

        const data = {
            TenDonVi: ten,
            MaNcc: $('#qsCode').val().trim(),
            DienThoai: $('#qsPhone').val().trim(),
            DiaChi: $('#qsAddress').val().trim()
        };

        $.ajax({
            url: quickSupplierUrl,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (res) {
                if (res.success && res.supplier) {
                    $('#selectedSupplierId').val(res.supplier.maDonViCapHang);
                    $supInput.val(res.supplier.tenDonVi);
                    bootstrap.Modal.getInstance(document.getElementById('quickSupplierModal')).hide();
                    if (window.KiotToast) KiotToast.success('Đã thêm mới nhà cung cấp!');
                } else {
                    if (window.KiotToast) KiotToast.error(res.message || 'Lỗi khi tạo nhà cung cấp.');
                }
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.message || 'Không thể tạo nhà cung cấp.';
                if (window.KiotToast) KiotToast.error(msg);
            }
        });
    });

    // 8. Nhập từ file Excel (SheetJS)
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

    // 10. Phím tắt toàn cục F3, F4, F9, F10
    $(document).on('keydown', function (e) {
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
