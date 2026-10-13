/**
 * f3-product-search.js
 * Component tìm kiếm hàng hóa Autocomplete hỗ trợ phím tắt F3 chuẩn phong cách KiotViet
 * Dùng chung cho: Lập phiếu kiểm kho, Lập phiếu nhập kho, Lập phiếu xuất kho, Chuyển kho
 */

function initF3ProductSearch(options) {
    const config = Object.assign({
        inputSelector: '#productSearchInput',
        dropdownSelector: '#autocompleteDropdown',
        apiUrl: '/PhieuKiemKe/SearchProducts',
        getWarehouseId: function () { return 1; },
        onSelect: function (product) { console.log('Selected:', product); },
        debounceMs: 200
    }, options);

    const $input = $(config.inputSelector);
    const $dropdown = $(config.dropdownSelector);
    let searchTimeout = null;

    // 1. Phím tắt F3 toàn cầu: Focus vào ô tìm kiếm hàng hóa
    $(document).on('keydown', function (e) {
        if (e.key === 'F3' || e.keyCode === 114) {
            e.preventDefault();
            $input.focus().select();
        }
    });

    // 2. Lắng nghe gõ phím tìm kiếm (debounce)
    $input.on('input', function () {
        const q = $(this).val().trim();
        clearTimeout(searchTimeout);

        if (q.length === 0) {
            $dropdown.hide();
            return;
        }

        searchTimeout = setTimeout(function () {
            $.ajax({
                url: config.apiUrl,
                type: 'GET',
                data: { q: q, warehouseId: config.getWarehouseId() },
                success: function (items) {
                    renderDropdown(items);
                },
                error: function () {
                    $dropdown.hide();
                }
            });
        }, config.debounceMs);
    });

    // 3. Render HTML dropdown kết quả gợi ý
    function renderDropdown(items) {
        $dropdown.empty();

        if (!items || items.length === 0) {
            $dropdown.append('<div class="p-3 text-center text-muted small">Không tìm thấy hàng hóa phù hợp</div>');
            $dropdown.show();
            return;
        }

        items.forEach(function (item) {
            const html = `
                <div class="kk-autocomplete-item" 
                     data-id="${item.maHang}" 
                     data-code="${item.maHangNoiBo}" 
                     data-name="${item.tenHang}" 
                     data-unit="${item.tenDvt || ''}" 
                     data-group="${item.tenNhom || ''}" 
                     data-stock="${item.tonKho || 0}" 
                     data-cost="${item.gia || 0}">
                    <div class="d-flex align-items-center">
                        <div class="kk-item-thumb">📦</div>
                        <div>
                            <div class="fw-bold text-dark">${item.tenHang}</div>
                            <div class="small text-muted">${item.maHangNoiBo} · ${item.tenDvt || 'Đơn vị'}</div>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="small text-muted">Tồn: <strong class="text-primary">${(item.tonKho || 0).toLocaleString('vi-VN')}</strong></div>
                        <div class="small text-muted">Giá: ${(item.gia || 0).toLocaleString('vi-VN')} đ</div>
                    </div>
                </div>
            `;
            $dropdown.append(html);
        });

        $dropdown.show();
    }

    // 4. Click chọn một sản phẩm
    $(document).on('click', `${config.dropdownSelector} .kk-autocomplete-item`, function () {
        const product = {
            maHang: $(this).data('id'),
            maHangNoiBo: $(this).data('code'),
            tenHang: $(this).data('name'),
            tenDvt: $(this).data('unit'),
            tenNhom: $(this).data('group'),
            tonKho: parseFloat($(this).data('stock')) || 0,
            gia: parseFloat($(this).data('cost')) || 0
        };

        config.onSelect(product);

        $dropdown.hide();
        $input.val('').focus();
    });

    // 5. Đóng dropdown khi click ngoài
    $(document).on('click', function (e) {
        if (!$(e.target).closest($input).length && !$(e.target).closest($dropdown).length) {
            $dropdown.hide();
        }
    });
}
