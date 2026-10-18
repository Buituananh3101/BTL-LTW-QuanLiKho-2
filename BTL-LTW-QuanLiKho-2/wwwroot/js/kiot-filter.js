/**
 * kiot-filter.js – Bộ thư viện JavaScript giao diện chuẩn KiotViet dùng chung
 * Phục vụ các màn hình Danh mục: Hàng hóa, Khách hàng, Nhà cung cấp, Quản lý Kho...
 */

window.KiotFilter = (function ($) {
    'use strict';

    // 1. Debounce chống spam request khi người dùng gõ tìm kiếm
    function debounce(func, wait) {
        let timeout;
        return function () {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait || 300);
        };
    }

    // 2. Quản lý trạng thái Thu gọn / Mở rộng Sidebar bên trái (Phím tắt F4)
    function initSidebar(options) {
        const opt = $.extend({
            containerSelector: '#kiotContainer',
            btnToggleSelector: '#btnToggleSidebar',
            iconSelector: '#sidebarToggleIcon',
            storageKey: 'kiot_sidebar_state'
        }, options);

        const container = $(opt.containerSelector);
        let animTimer = null;

        function toggleSidebar(forceState) {
            const isCollapsed = container.hasClass('sidebar-collapsed');
            const shouldCollapse = (typeof forceState === 'boolean') ? forceState : !isCollapsed;

            clearTimeout(animTimer);
            container.addClass('sidebar-animating');
            animTimer = setTimeout(() => {
                container.removeClass('sidebar-animating');
            }, 420);

            if (shouldCollapse) {
                container.addClass('sidebar-collapsed');
                $(opt.iconSelector).removeClass('bi-chevron-left').addClass('bi-chevron-right');
                $(opt.btnToggleSelector).attr('title', 'Mở rộng bộ lọc (F4)');
                localStorage.setItem(opt.storageKey, 'collapsed');
            } else {
                container.removeClass('sidebar-collapsed');
                $(opt.iconSelector).removeClass('bi-chevron-right').addClass('bi-chevron-left');
                $(opt.btnToggleSelector).attr('title', 'Thu gọn bộ lọc (F4)');
                localStorage.setItem(opt.storageKey, 'expanded');
            }
        }

        // Khôi phục trạng thái đã lưu
        if (localStorage.getItem(opt.storageKey) === 'collapsed') {
            toggleSidebar(true);
        }

        // Click nút
        $(opt.btnToggleSelector).on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });

        // Phím tắt F4
        $(document).on('keydown', function (e) {
            if (e.key === 'F4') {
                e.preventDefault();
                toggleSidebar();
            }
        });
    }

    // 3. Khởi tạo Dropdown Single-Select (Chọn 1 tiêu chí)
    function initSingleSelect(boxSelector, dropdownSelector, onSelectCallback) {
        const box = $(boxSelector);
        const dropdown = $(dropdownSelector);

        box.on('click', function (e) {
            e.stopPropagation();
            $('.kiot-ss-dropdown, .kiot-ms-dropdown').not(dropdown).removeClass('show');
            dropdown.toggleClass('show');
        });

        dropdown.find('.kiot-ss-item').on('click', function (e) {
            e.stopPropagation();
            dropdown.find('.kiot-ss-item').removeClass('selected');
            $(this).addClass('selected');

            const val = $(this).data('val');
            const text = $(this).find('span').text().trim();
            box.find('span').first().text(text);
            dropdown.removeClass('show');

            if (typeof onSelectCallback === 'function') {
                onSelectCallback(val, text);
            }
        });

        $(document).on('click', function (e) {
            if (!$(e.target).closest(box).length && !$(e.target).closest(dropdown).length) {
                dropdown.removeClass('show');
            }
        });
    }

    // 4. Khởi tạo Dropdown Multi-Select (Chọn nhiều tiêu chí kèm ô tìm kiếm con)
    function initMultiSelect(boxSelector, dropdownSelector, placeholder, onChangeCallback) {
        const box = $(boxSelector);
        const dropdown = $(dropdownSelector);
        const searchInput = dropdown.find('.kiot-ms-search input');

        box.on('click', function (e) {
            e.stopPropagation();
            $('.kiot-ss-dropdown, .kiot-ms-dropdown').not(dropdown).removeClass('show');
            dropdown.toggleClass('show');
            if (dropdown.hasClass('show')) {
                searchInput.focus();
            }
        });

        // Tìm kiếm con trong danh sách
        searchInput.on('input', function () {
            const kw = $(this).val().toLowerCase().trim();
            dropdown.find('.kiot-ms-item').each(function () {
                const name = ($(this).data('name') || $(this).text()).toLowerCase();
                $(this).toggle(name.includes(kw));
            });
        });

        // Checkbox click
        dropdown.on('click', '.kiot-ms-item', function (e) {
            e.stopPropagation();
            const checkbox = $(this).find('input[type="checkbox"]');
            if (!$(e.target).is('input[type="checkbox"]')) {
                checkbox.prop('checked', !checkbox.prop('checked'));
            }
            updatePlaceholder();
            if (typeof onChangeCallback === 'function') {
                onChangeCallback(getSelectedValues(), getSelectedNames());
            }
        });

        function getSelectedValues() {
            return dropdown.find('.kiot-ms-item input:checked').map(function () {
                return $(this).closest('.kiot-ms-item').data('val');
            }).get();
        }

        function getSelectedNames() {
            return dropdown.find('.kiot-ms-item input:checked').map(function () {
                return $(this).closest('.kiot-ms-item').data('name');
            }).get();
        }

        function updatePlaceholder() {
            const names = getSelectedNames();
            if (names.length === 0) {
                box.html(`<span class="kiot-ms-placeholder">${placeholder}</span>`);
            } else if (names.length <= 2) {
                box.text(names.join(', '));
            } else {
                box.text(`${names[0]}, ${names[1]} (+${names.length - 2})`);
            }
        }

        $(document).on('click', function (e) {
            if (!$(e.target).closest(box).length && !$(e.target).closest(dropdown).length) {
                dropdown.removeClass('show');
            }
        });
    }

    // 5. Gắn sự kiện phân trang AJAX cho bất kỳ bảng dữ liệu nào
    function bindPagination(containerSelector, onPageChangeCallback) {
        $(containerSelector).on('click', '.page-ajax', function (e) {
            e.preventDefault();
            const page = parseInt($(this).data('page'));
            if (!isNaN(page) && page > 0 && typeof onPageChangeCallback === 'function') {
                onPageChangeCallback(page);
            }
        });
    }

    return {
        debounce: debounce,
        initSidebar: initSidebar,
        initSingleSelect: initSingleSelect,
        initMultiSelect: initMultiSelect,
        bindPagination: bindPagination
    };
})(jQuery);
