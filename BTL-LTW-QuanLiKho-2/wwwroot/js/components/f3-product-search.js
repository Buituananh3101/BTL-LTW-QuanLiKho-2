/**
 * f3-product-search.js
 * Component tìm kiếm hàng hóa Autocomplete hỗ trợ phím tắt F3 chuẩn phong cách KiotViet
 * Dùng chung cho: Lập phiếu kiểm kho, Lập phiếu nhập kho, Lập phiếu xuất kho, Chuyển kho
 */

function initF3ProductSearch(options) {
    const config = Object.assign({
        inputSelector: '#productSearchInput',
        dropdownSelector: '#autocompleteDropdown',
        apiUrl: '/NhapHang/SearchProducts',
        getWarehouseId: function () { return 1; },
        onSelect: function (product) { console.log('Selected:', product); },
        debounceMs: 200
    }, options);

    const $input = $(config.inputSelector);
    const $dropdown = $(config.dropdownSelector);
    let searchTimeout = null;
    let currentItems = [];
    let activeIndex = -1;

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function setActiveIndex(idx, scrollIntoView) {
        if (!currentItems.length) {
            activeIndex = -1;
            return;
        }
        if (idx < 0) idx = currentItems.length - 1;
        if (idx >= currentItems.length) idx = 0;
        activeIndex = idx;

        const $items = $dropdown.find('.kk-autocomplete-item');
        $items.removeClass('active');
        const $target = $items.filter(`[data-index="${activeIndex}"]`);
        $target.addClass('active');

        if (scrollIntoView && $target.length) {
            const dropdownEl = $dropdown[0];
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

    function selectProduct(product) {
        if (!product) return;
        config.onSelect(product);
        $dropdown.hide();
        currentItems = [];
        activeIndex = -1;
        $input.val('').focus();
    }

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
            currentItems = [];
            activeIndex = -1;
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
                    currentItems = [];
                    activeIndex = -1;
                    $dropdown.hide();
                }
            });
        }, config.debounceMs);
    });

    // 3. Phím điều hướng danh sách (ArrowDown, ArrowUp, Enter, Escape)
    $input.on('keydown', function (e) {
        if (!$dropdown.is(':visible') || !currentItems.length) {
            if (e.key === 'Escape') {
                $dropdown.hide();
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(activeIndex + 1, true);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(activeIndex - 1, true);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < currentItems.length) {
                selectProduct(currentItems[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            $dropdown.hide();
        }
    });

    // 4. Mở lại dropdown khi focus nếu có text
    $input.on('focus', function () {
        if ($(this).val().trim().length > 0 && currentItems.length > 0) {
            $dropdown.show();
        }
    });

    // 5. Render HTML dropdown kết quả gợi ý
    function renderDropdown(items) {
        $dropdown.empty();
        currentItems = items || [];
        activeIndex = currentItems.length > 0 ? 0 : -1;

        if (!currentItems || currentItems.length === 0) {
            $dropdown.append('<div class="p-3 text-center text-muted small">Không tìm thấy hàng hóa phù hợp</div>');
            $dropdown.show();
            return;
        }

        currentItems.forEach(function (item, idx) {
            const tenHang = item.tenHang || item.TenHang || '';
            const maHangNoiBo = item.maHangNoiBo || item.MaHangNoiBo || '';
            const tenDvt = item.tenDvt || item.TenDvt || '';
            const tenNhom = item.tenNhom || item.TenNhom || '';
            const tonKho = parseFloat(item.tonKho !== undefined ? item.tonKho : item.TonKho) || 0;
            const gia = parseFloat(item.gia !== undefined ? item.gia : item.Gia) || 0;
            const maHang = item.maHang || item.MaHang;

            const firstChar = (tenHang.trim().length > 0) ? tenHang.trim()[0].toUpperCase() : 'H';
            const unitText = tenDvt ? ` · ${escapeHtml(tenDvt)}` : '';
            const isActive = idx === activeIndex ? ' active' : '';

            const html = `
                <div class="kk-autocomplete-item${isActive}" 
                     data-index="${idx}"
                     data-id="${maHang}" 
                     data-code="${escapeHtml(maHangNoiBo)}" 
                     data-name="${escapeHtml(tenHang)}" 
                     data-unit="${escapeHtml(tenDvt)}" 
                     data-group="${escapeHtml(tenNhom)}" 
                     data-stock="${tonKho}" 
                     data-cost="${gia}">
                    <div class="kk-item-main">
                        <div class="kk-item-thumb">${firstChar}</div>
                        <div class="kk-item-info">
                            <div class="kk-item-name" title="${escapeHtml(tenHang)}">${escapeHtml(tenHang)}</div>
                            <div class="kk-item-code">${escapeHtml(maHangNoiBo)}${unitText}</div>
                        </div>
                    </div>
                    <div class="kk-item-meta">
                        <div class="kk-item-stock">Tồn: <strong>${tonKho.toLocaleString('vi-VN')}</strong></div>
                        <div class="kk-item-price">Giá: <b>${gia.toLocaleString('vi-VN')} đ</b></div>
                    </div>
                </div>
            `;
            $dropdown.append(html);
        });

        $dropdown.show();
    }

    // 6. Đồng bộ hover chuột với activeIndex
    $dropdown.on('mouseenter', '.kk-autocomplete-item', function () {
        const idx = parseInt($(this).data('index'), 10);
        if (!isNaN(idx)) {
            setActiveIndex(idx, false);
        }
    });

    // 7. Click chọn một sản phẩm
    $dropdown.on('click', '.kk-autocomplete-item', function () {
        const idx = parseInt($(this).data('index'), 10);
        if (!isNaN(idx) && currentItems[idx]) {
            selectProduct(currentItems[idx]);
        } else {
            const product = {
                maHang: $(this).data('id'),
                maHangNoiBo: $(this).data('code'),
                tenHang: $(this).data('name'),
                tenDvt: $(this).data('unit'),
                tenNhom: $(this).data('group'),
                tonKho: parseFloat($(this).data('stock')) || 0,
                gia: parseFloat($(this).data('cost')) || 0
            };
            selectProduct(product);
        }
    });

    // 8. Đóng dropdown khi click ngoài
    $(document).on('click', function (e) {
        if (!$(e.target).closest($input).length && !$(e.target).closest($dropdown).length) {
            $dropdown.hide();
        }
    });
}
