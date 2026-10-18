/**
 * kiot-filter.js – Bộ thư viện JavaScript giao diện chuẩn KiotViet dùng chung
 * Phục vụ các màn hình Danh mục & Chứng từ: Hàng hóa, Kiểm kho, Nhập kho, Khách hàng, NCC...
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

    // 2. Định dạng ngày tháng
    function formatDateVN(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    }

    function formatDateISO(date) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    // 3. Quản lý trạng thái Thu gọn / Mở rộng Sidebar bên trái (Phím tắt F4 & Mobile Drawer)
    function initSidebar(options) {
        const opt = $.extend({
            containerSelector: '#kiotContainer',
            btnToggleSelector: '#btnToggleSidebar',
            iconSelector: '#sidebarToggleIcon',
            mobileBtnSelector: '#btnMobileFilter',
            mobileCloseSelector: '#btnCloseSidebarMobile',
            backdropSelector: '#sidebarBackdrop',
            sidebarColSelector: '#sidebarFilterCol',
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

        if (localStorage.getItem(opt.storageKey) === 'collapsed') {
            toggleSidebar(true);
        }

        $(opt.btnToggleSelector).on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });

        $(document).on('keydown', function (e) {
            if (e.key === 'F4') {
                e.preventDefault();
                toggleSidebar();
            }
        });

        // Mobile drawer
        $(opt.mobileBtnSelector).on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(opt.sidebarColSelector).addClass('show-mobile');
            $(opt.backdropSelector).addClass('show');
        });

        function closeMobileSidebar() {
            $(opt.sidebarColSelector).removeClass('show-mobile');
            $(opt.backdropSelector).removeClass('show');
        }

        $(`${opt.mobileCloseSelector}, ${opt.backdropSelector}`).on('click', function (e) {
            e.preventDefault();
            closeMobileSidebar();
        });
    }

    // 4. Tự động kiểm tra và lật hướng Dropdown (Auto-flip Drop-up) khi tràn mép dưới
    function autoFlipDirection(box, dropdown) {
        const $box = $(box);
        const $dd = $(dropdown);
        if (!$box.length || !$dd.length) return;

        const rect = $box[0].getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow < 220 && spaceAbove > spaceBelow) {
            $dd.addClass('drop-up');
        } else {
            $dd.removeClass('drop-up');
        }
    }

    // 5. Khởi tạo Dropdown Single-Select (Chọn 1 tiêu chí)
    function initSingleSelect(boxSelector, dropdownSelector, onSelectCallback) {
        const box = $(boxSelector);
        const dropdown = $(dropdownSelector);

        box.on('click', function (e) {
            e.stopPropagation();
            $('.kiot-ss-dropdown, .kiot-ms-dropdown, .quick-date-popup, .dual-calendar-popup').not(dropdown).removeClass('show');
            autoFlipDirection(box, dropdown);
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

    // 6. Khởi tạo Dropdown Multi-Select (Chọn nhiều tiêu chí kèm ô tìm kiếm con)
    function initMultiSelect(boxSelector, dropdownSelector, placeholder, onChangeCallback) {
        const box = $(boxSelector);
        const dropdown = $(dropdownSelector);
        const searchInput = dropdown.find('.kiot-ms-search input');

        box.on('click', function (e) {
            e.stopPropagation();
            $('.kiot-ss-dropdown, .kiot-ms-dropdown, .quick-date-popup, .dual-calendar-popup').not(dropdown).removeClass('show');
            autoFlipDirection(box, dropdown);
            dropdown.toggleClass('show');
            if (dropdown.hasClass('show')) {
                searchInput.focus();
            }
        });

        searchInput.on('input', function () {
            const kw = $(this).val().toLowerCase().trim();
            dropdown.find('.kiot-ms-item').each(function () {
                const name = ($(this).data('name') || $(this).text()).toLowerCase();
                $(this).toggle(name.includes(kw));
            });
        });

        dropdown.on('click', '.kiot-item-edit-btn, .hh-item-edit-btn', function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const id = $(this).data('id') || $(this).closest('.kiot-ms-item').data('val');
            const oldName = $(this).data('name') || $(this).closest('.kiot-ms-item').find('.kiot-ms-text, span').first().text().trim();
            if (typeof window.handleEditNhomHang === 'function') {
                window.handleEditNhomHang(id, oldName);
            }
        });

        dropdown.on('click', '.kiot-ms-item', function (e) {
            if ($(e.target).closest('.kiot-item-edit-btn, .hh-item-edit-btn').length) {
                return;
            }
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

    // 7. Định vị Floating Popup (Quick date & Dual Calendar) chống tràn màn hình
    function toggleFloatingPopup(triggerElement, popupSelector) {
        const popup = $(popupSelector);
        if (popup.is(':visible')) {
            popup.hide();
            return;
        }

        $('.quick-date-popup, .dual-calendar-popup').hide();

        const trigger = $(triggerElement);
        if (!trigger.length) return;

        const rect = trigger[0].getBoundingClientRect();
        const popupWidth = popup.outerWidth() || (popupSelector.includes('Calendar') ? 540 : 330);

        let left = rect.left;
        let top = rect.bottom + 6;

        const maxRight = $(window).width() - 10;
        if (left + popupWidth > maxRight) {
            left = maxRight - popupWidth;
        }
        if (left < 10) left = 10;

        const popupHeight = popup.outerHeight() || 300;
        if (top + popupHeight > $(window).height() - 10) {
            top = Math.max(10, rect.top - popupHeight - 6);
        }

        popup.css({
            position: 'fixed',
            top: top + 'px',
            left: left + 'px',
            zIndex: 1060
        }).show();
    }

    // 8. Quản lý Bộ lọc Thời gian & Lịch 2 tháng (Dual Calendar) dùng chung
    const calState = {};

    function initDateFilter(targetOrOptions, onApplyCallback) {
        let target = 'date';
        let callback = onApplyCallback;

        if (typeof targetOrOptions === 'object' && targetOrOptions !== null) {
            target = targetOrOptions.target || 'date';
            callback = targetOrOptions.onChange || targetOrOptions.onApply || onApplyCallback;
        } else if (typeof targetOrOptions === 'string') {
            target = targetOrOptions;
        }

        const tgtCap = target.charAt(0).toUpperCase() + target.slice(1);
        const todayObj = new Date();

        calState[target] = {
            currentYear: todayObj.getFullYear(),
            currentMonth: todayObj.getMonth(),
            start: todayObj,
            end: todayObj,
            selectingStart: true
        };

        const quickPopupSelector = `#popup${tgtCap}Quick`;
        const calPopupSelector = `#popup${tgtCap}Calendar`;

        // Chặn nổi bọt khi click bên trong popup thời gian
        $(`${quickPopupSelector}, ${calPopupSelector}`).on('click', function (e) {
            e.stopPropagation();
        });

        // Mở popup chọn nhanh
        $(`#btnOpen${tgtCap}Quick, #label${tgtCap}All, #${target}All`).on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(`#${target}All`).prop('checked', true);
            toggleFloatingPopup(this, quickPopupSelector);
        });

        // Mở popup lịch tùy chỉnh
        $(`#btnOpen${tgtCap}Calendar, #label${tgtCap}Custom, #${target}Custom`).on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(`#${target}Custom`).prop('checked', true);
            renderDualCalendar(target);
            toggleFloatingPopup(this, calPopupSelector);
        });

        // Click nút chọn nhanh (Quick date pill/btn)
        $(quickPopupSelector).on('click', '.quick-date-btn, .quick-date-pill-all', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const val = $(this).data('val') || 'ALL';
            const labelText = $(this).text().trim();
            $(`#text${tgtCap}Range`).text(labelText);
            $(`#${target}All`).prop('checked', true);
            $(quickPopupSelector).hide();

            $(`#dot${tgtCap}`).toggleClass('on', val !== 'ALL');
            $(`#${target}FromInput`).val('');
            $(`#${target}ToInput`).val('');

            if (typeof callback === 'function') {
                callback(null, null, labelText, val);
            }
        });

        // Render lịch 2 tháng
        function renderDualCalendar(tgt) {
            const st = calState[tgt];
            const y = st.currentYear;
            const m = st.currentMonth;

            renderMonth(tgt, 1, y, m);

            let y2 = y;
            let m2 = m + 1;
            if (m2 > 11) { m2 = 0; y2++; }
            renderMonth(tgt, 2, y2, m2);

            updateCalendarHeader(tgt);
        }

        function renderMonth(tgt, idx, year, month) {
            $(`#${tgt}MonthTitle${idx}`).text(`Tháng ${month + 1} ${year}`);
            const tbody = $(`#${tgt}CalBody${idx}`).empty();

            const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPrevMonth = new Date(year, month, 0).getDate();

            let tr = $('<tr>');
            for (let i = 0; i < firstDayOfWeek; i++) {
                const day = daysInPrevMonth - firstDayOfWeek + i + 1;
                tr.append(`<td class="text-muted other-month" style="opacity: 0.35;">${day}</td>`);
            }

            const st = calState[tgt];
            const sTime = st.start ? new Date(st.start).setHours(0, 0, 0, 0) : null;
            const eTime = st.end ? new Date(st.end).setHours(0, 0, 0, 0) : null;
            const todayTime = new Date().setHours(0, 0, 0, 0);

            for (let day = 1; day <= daysInMonth; day++) {
                if (tr.children().length === 7) {
                    tbody.append(tr);
                    tr = $('<tr>');
                }

                const curTime = new Date(year, month, day).setHours(0, 0, 0, 0);
                let cls = 'cal-day';
                if (curTime === todayTime) cls += ' today';
                if (sTime && curTime === sTime) cls += ' sel-start selected';
                if (eTime && curTime === eTime) cls += ' sel-end selected';
                if (sTime && eTime && curTime > sTime && curTime < eTime) cls += ' in-range';

                tr.append(`<td class="${cls}" data-target="${tgt}" data-y="${year}" data-m="${month}" data-d="${day}">${day}</td>`);
            }

            while (tr.children().length < 7) {
                tr.append('<td class="text-muted other-month" style="opacity: 0.35;"></td>');
            }
            tbody.append(tr);
        }

        function updateCalendarHeader(tgt) {
            const st = calState[tgt];
            if (st.start && st.end) {
                $(`#${tgt}CalFromText`).text(formatDateVN(st.start));
                $(`#${tgt}CalToText`).text(formatDateVN(st.end));
            }
        }

        // Click ngày trong lịch
        $(calPopupSelector).on('click', '.cal-day', function (e) {
            e.stopPropagation();
            const tgt = $(this).data('target');
            const y = parseInt($(this).data('y'));
            const m = parseInt($(this).data('m'));
            const d = parseInt($(this).data('d'));
            const clicked = new Date(y, m, d);

            const st = calState[tgt];
            if (st.selectingStart) {
                st.start = clicked;
                st.end = clicked;
                st.selectingStart = false;
            } else {
                if (clicked < st.start) {
                    st.end = st.start;
                    st.start = clicked;
                } else {
                    st.end = clicked;
                }
                st.selectingStart = true;
            }
            renderDualCalendar(tgt);
        });

        // Tháng trước / sau
        $(calPopupSelector).on('click', '.btn-cal-prev', function (e) {
            e.stopPropagation();
            const tgt = $(this).data('target');
            const st = calState[tgt];
            st.currentMonth--;
            if (st.currentMonth < 0) {
                st.currentMonth = 11;
                st.currentYear--;
            }
            renderDualCalendar(tgt);
        });

        $(calPopupSelector).on('click', '.btn-cal-next', function (e) {
            e.stopPropagation();
            const tgt = $(this).data('target');
            const st = calState[tgt];
            st.currentMonth++;
            if (st.currentMonth > 11) {
                st.currentMonth = 0;
                st.currentYear++;
            }
            renderDualCalendar(tgt);
        });

        // Nút Hôm nay
        $(calPopupSelector).on('click', '.btn-cal-today', function (e) {
            e.stopPropagation();
            const tgt = $(this).data('target');
            const t = new Date();
            const st = calState[tgt];
            st.currentYear = t.getFullYear();
            st.currentMonth = t.getMonth();
            st.start = t;
            st.end = t;
            renderDualCalendar(tgt);
        });

        // Nút Đóng / Bỏ qua
        $(calPopupSelector).on('click', '.btn-close-popup', function (e) {
            e.stopPropagation();
            $(calPopupSelector).hide();
        });

        // Nút Áp dụng lịch
        $(calPopupSelector).on('click', '.btn-apply-calendar', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const tgt = $(this).data('target');
            const st = calState[tgt];
            const s = st.start || new Date();
            const eDate = st.end || s;
            const rangeText = `${formatDateVN(s)} - ${formatDateVN(eDate)}`;

            $(`#text${tgtCap}Custom`).text(rangeText);
            $(`#${tgt}Custom`).prop('checked', true);
            $(`#dot${tgtCap}`).addClass('on');
            $(calPopupSelector).hide();

            $(`#${tgt}FromInput`).val(formatDateISO(s));
            $(`#${tgt}ToInput`).val(formatDateISO(eDate));

            if (typeof callback === 'function') {
                callback(formatDateISO(s), formatDateISO(eDate), rangeText, 'CUSTOM');
            }
        });

        // Tự đóng khi click ra ngoài
        const docDateEvent = `click.kiotDateFilter_${target}`;
        $(document).off(docDateEvent).on(docDateEvent, function (e) {
            if (!$(e.target).closest(`.kiot-date-filter-block[data-date-target="${target}"], ${quickPopupSelector}, ${calPopupSelector}`).length) {
                $(quickPopupSelector).hide();
                $(calPopupSelector).hide();
            }
        });
    }

    // 9. Quản lý Ẩn / Hiện Cột bảng dữ liệu (Column Visibility) Chuẩn KiotViet
    function initColumnToggle(menuSelectorOrOptions, tableSelector, storageKey) {
        let opt = {};
        if (typeof menuSelectorOrOptions === 'object') {
            opt = menuSelectorOrOptions;
        } else {
            opt = {
                menuSelector: menuSelectorOrOptions,
                tableSelector: tableSelector,
                storageKey: storageKey
            };
        }

        const menu = $(opt.menuSelector);
        const currentStorageKey = opt.storageKey || 'kiot_column_visibility';
        const defaultCols = opt.defaultCols || {};

        if (!menu.length) {
            return {
                apply: function () {},
                save: function () {}
            };
        }

        // Đọc cấu hình từ localStorage
        let savedCols = {};
        try {
            savedCols = JSON.parse(localStorage.getItem(currentStorageKey) || '{}');
        } catch (_) { }

        // Khôi phục trạng thái checkbox và ẩn cột
        menu.find('input[data-c], input[type="checkbox"]').each(function () {
            const col = $(this).data('c');
            if (col) {
                if (savedCols[col] !== undefined) {
                    $(this).prop('checked', savedCols[col] === 1 || savedCols[col] === true);
                } else if (defaultCols[col] !== undefined) {
                    $(this).prop('checked', defaultCols[col] === 1 || defaultCols[col] === true);
                }
            }
        });

        function applyVisibility() {
            const currentTable = $(opt.tableSelector);
            if (!currentTable.length) return;

            let visibleCount = 0;
            menu.find('input[data-c], input[type="checkbox"]').each(function () {
                const col = $(this).data('c');
                const isChecked = $(this).is(':checked');
                if (col) {
                    if (isChecked) visibleCount++;
                    currentTable.find(`[data-col="${col}"], .col-${col}`).each(function () {
                        this.style.display = isChecked ? '' : 'none';
                    });
                }
            });

            // 1. Cập nhật colspan chính xác theo số cột hiển thị để không sinh cột ma
            const actualVisibleCols = currentTable.find('thead tr:first-child th:visible').length || (visibleCount + (opt.extraColsCount || 0));
            currentTable.find('tr.product-detail-row > td, tr.kiot-detail-row > td, tr.dtl > td, tr.detail-row > td, tr.empty-row > td, tr:has(.empty) > td').attr('colspan', actualVisibleCols);

            // 2. Gắn class last-visible-col cho ô hiển thị cuối cùng của mỗi dòng để khép kín hình chữ nhật
            currentTable.find('.last-visible-col').removeClass('last-visible-col');
            currentTable.find('tr').each(function () {
                $(this).children('th:visible, td:visible').last().addClass('last-visible-col');
            });

            if (typeof opt.onApply === 'function') {
                opt.onApply(actualVisibleCols);
            }
        }

        function saveState() {
            const state = {};
            menu.find('input[data-c], input[type="checkbox"]').each(function () {
                const col = $(this).data('c');
                if (col) {
                    state[col] = $(this).is(':checked') ? 1 : 0;
                }
            });
            localStorage.setItem(currentStorageKey, JSON.stringify(state));
        }

        applyVisibility();

        menu.off('change.kiotCol', 'input[data-c], input[type="checkbox"]').on('change.kiotCol', 'input[data-c], input[type="checkbox"]', function () {
            applyVisibility();
            saveState();
        });

        return {
            apply: applyVisibility,
            save: saveState
        };
    }

    // 10. Gắn sự kiện Đánh dấu sao Yêu thích (Favorite Star)
    function bindStarToggle(tableSelector, toggleUrl, callback) {
        $(tableSelector).on('click', '.star-btn, .btn-star, .star', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const btn = $(this);
            const id = btn.data('id') || btn.closest('tr').data('id');
            if (!id || !toggleUrl) return;

            $.ajax({
                url: toggleUrl,
                type: 'POST',
                data: { id: id },
                success: function (res) {
                    if (res.success) {
                        const isFav = res.isFavorite !== undefined ? res.isFavorite : res.isStarred;
                        btn.toggleClass('starred on', !!isFav);
                        btn.find('i').toggleClass('bi-star-fill text-warning', !!isFav).toggleClass('bi-star text-muted', !isFav);

                        if (window.KiotToast) {
                            window.KiotToast.success(isFav ? 'Đã thêm vào mục yêu thích.' : 'Đã bỏ đánh dấu sao.');
                        }

                        if (typeof callback === 'function') {
                            callback(id, isFav);
                        }
                    }
                },
                error: function () {
                    if (window.KiotToast) {
                        window.KiotToast.error('Không thể cập nhật đánh dấu sao.');
                    }
                }
            });
        });
    }

    // 11. Gắn sự kiện phân trang AJAX
    function bindPagination(containerSelector, onPageChangeCallback) {
        $(containerSelector).on('click', '.page-ajax', function (e) {
            e.preventDefault();
            const page = parseInt($(this).data('page'));
            if (!isNaN(page) && page > 0 && typeof onPageChangeCallback === 'function') {
                onPageChangeCallback(page);
            }
        });
    }

    // 12. Xử lý escape ký tự HTML an toàn
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 13. Tự động kiểm tra và đảo hướng Dropdown trên Sidebar (Drop-up khi gần mép dưới)
    function checkSidebarDropdownDirection(box, dropdown) {
        const $box = $(box);
        const $dd = $(dropdown);
        if (!$box.length || !$dd.length) return;

        const boxRect = $box[0].getBoundingClientRect();
        const filterBox = $box.closest('.kiot-filter-box');

        let containerBottom = window.innerHeight;
        let containerTop = 0;

        if (filterBox.length) {
            const filterRect = filterBox[0].getBoundingClientRect();
            containerBottom = Math.min(filterRect.bottom, window.innerHeight);
            containerTop = Math.max(filterRect.top, 0);
        }

        const spaceBelow = containerBottom - boxRect.bottom;
        const spaceAbove = boxRect.top - containerTop;
        const neededHeight = 220;

        if (spaceBelow < neededHeight && spaceAbove > spaceBelow) {
            $dd.addClass('drop-up');
            const maxH = Math.min(250, Math.max(120, spaceAbove - 10));
            $dd.css('max-height', maxH + 'px');
        } else {
            $dd.removeClass('drop-up');
            const maxH = Math.min(250, Math.max(120, spaceBelow - 10));
            $dd.css('max-height', maxH + 'px');
        }
    }

    // 14. Render danh sách Tag Chips trong ô Multi-select (.kiot-pill-tag & .kiot-pill-more)
    function renderTagPills(boxElement, selectedItems, placeholder, maxVisible) {
        const box = $(boxElement);
        if (!box.length) return;
        maxVisible = maxVisible || 3;

        if (!selectedItems || selectedItems.length === 0) {
            box.html(`<span class="kiot-ms-placeholder">${escapeHtml(placeholder)}</span>`);
            return;
        }

        let html = '';
        const visibleCount = Math.min(selectedItems.length, maxVisible);
        for (let i = 0; i < visibleCount; i++) {
            const item = selectedItems[i];
            html += `
                <span class="kiot-pill-tag" data-val="${escapeHtml(item.val)}">
                    <span class="tag-text">${escapeHtml(item.name)}</span>
                    <span class="tag-remove" title="Bỏ chọn">&times;</span>
                </span>
            `;
        }

        if (selectedItems.length > maxVisible) {
            const remaining = selectedItems.length - maxVisible;
            const otherNames = selectedItems.slice(maxVisible).map(x => x.name).join(', ');
            html += `<span class="kiot-pill-more" title="${escapeHtml(otherNames)}">+${remaining} khác</span>`;
        }

        box.html(html);
    }

    // 15. KiotCombobox – Dropdown vừa gõ vừa chọn kèm icon Bút chì ✎ sửa/xóa trực tiếp (Chuẩn KiotViet)
    function initCombobox(options) {
        const opt = $.extend({
            wrapSelector: '',        // Container .kiot-combobox-wrap hoặc selector
            boxSelector: '',         // Box chứa input .kiot-combobox-box
            inputSelector: '',       // Ô input gõ tìm/nhập
            dropdownSelector: '',    // Dropdown list .kiot-combobox-dropdown
            listSelector: '',        // Khối chứa items .kiot-combobox-list
            tagsSelector: '',        // Khối hiển thị tags đã chọn (nếu multi)
            hiddenInputSelector: '', // Ô hidden lưu value gửi form
            items: [],               // Mảng các chuỗi hoặc { val, text }
            placeholder: 'Chọn hoặc nhập...',
            allowAddNew: true,
            allowEdit: true,
            onSelect: null,
            onAddNew: null,
            onEditItem: null,
            onDeleteItem: null
        }, options);

        const $wrap = $(opt.wrapSelector);
        const $box = opt.boxSelector ? $(opt.boxSelector) : $wrap.find('.kiot-combobox-box, .hh-multiselect-box');
        const $input = opt.inputSelector ? $(opt.inputSelector) : $wrap.find('input[type="text"]');
        const $dropdown = opt.dropdownSelector ? $(opt.dropdownSelector) : $wrap.find('.kiot-combobox-dropdown, .hh-multiselect-dropdown');
        const $list = opt.listSelector ? $(opt.listSelector) : $dropdown.find('.kiot-combobox-list, .hh-multiselect-list, .hh-cs-list');
        const $tags = opt.tagsSelector ? $(opt.tagsSelector) : $box.find('.kiot-combobox-tags, .hh-multiselect-tags');
        const $hidden = opt.hiddenInputSelector ? $(opt.hiddenInputSelector) : $wrap.find('input[type="hidden"]');

        let selected = [];

        function renderList(searchKw) {
            if (!$list.length) return;
            const kw = (searchKw || '').trim().toLowerCase();
            const filtered = (opt.items || []).filter(item => {
                const name = String(typeof item === 'object' ? item.text : item).toLowerCase();
                return !kw || name.includes(kw);
            });

            if (filtered.length === 0) {
                $list.html('<div class="p-2 text-center text-muted small">Không tìm thấy mục phù hợp</div>');
                return;
            }

            let html = '';
            filtered.forEach(item => {
                const val = typeof item === 'object' ? item.val : item;
                const text = typeof item === 'object' ? item.text : item;
                const level = (typeof item === 'object' && item.level) ? Number(item.level) : 0;
                const isSel = selected.includes(val);
                const indentStyle = level > 0 ? `style="padding-left: ${12 + level * 16}px;"` : '';
                const treePrefix = level > 0 ? `<span class="kiot-tree-branch text-muted me-1" style="font-family:monospace;font-size:12px;">└─</span>` : '';

                html += `
                    <div class="kiot-combobox-item hh-multiselect-item ${isSel ? 'selected' : ''}" data-val="${escapeHtml(val)}" ${indentStyle}>
                        <span class="kiot-combobox-text hh-multiselect-text">${treePrefix}${escapeHtml(text)}</span>
                        ${opt.allowEdit ? `
                        <button type="button" class="kiot-item-edit-btn hh-item-edit-btn" data-val="${escapeHtml(val)}" title="Sửa">
                            <i class="bi bi-pencil" style="font-size:12px;pointer-events:none;"></i>
                        </button>` : ''}
                        ${isSel ? '<i class="bi bi-check-lg text-primary ms-2"></i>' : ''}
                    </div>
                `;
            });
            $list.html(html);
        }

        function openDropdown() {
            $wrap.addClass('open');
            $dropdown.show();
            renderList($input.val());
        }

        function closeDropdown() {
            $wrap.removeClass('open');
            $dropdown.hide();
        }

        // Click box -> focus input & open
        $box.on('click', function (e) {
            if (e.target.closest('.tag-del, .hh-loc-tag-del, .tag-remove')) return;
            $input.focus();
            openDropdown();
        });

        $input.on('focus', function () {
            openDropdown();
        });

        $input.on('input', function () {
            openDropdown();
            renderList($(this).val());
        });

        // Click item hoặc nút edit
        $list.on('click', function (e) {
            e.stopPropagation();
            const editBtn = e.target.closest('.kiot-item-edit-btn, .hh-item-edit-btn');
            if (editBtn) {
                const val = editBtn.dataset.val;
                if (opt.onEditItem) {
                    opt.onEditItem(val, e);
                } else if (window.KiotPrompt) {
                    window.KiotPrompt.open({
                        title: 'Sửa mục',
                        label: 'Tên',
                        value: val,
                        showDelete: true,
                        onSave: function (newVal) {
                            const idx = opt.items.indexOf(val);
                            if (idx >= 0) opt.items[idx] = newVal;
                            const sIdx = selected.indexOf(val);
                            if (sIdx >= 0) selected[sIdx] = newVal;
                            renderList($input.val());
                            openDropdown();
                        },
                        onDelete: function () {
                            const idx = opt.items.indexOf(val);
                            if (idx >= 0) opt.items.splice(idx, 1);
                            const sIdx = selected.indexOf(val);
                            if (sIdx >= 0) selected.splice(sIdx, 1);
                            renderList($input.val());
                            openDropdown();
                        }
                    });
                }
                return;
            }

            const item = e.target.closest('.kiot-combobox-item, .hh-multiselect-item');
            if (item) {
                const val = item.dataset.val;
                const idx = selected.indexOf(val);
                if (idx >= 0) {
                    selected.splice(idx, 1);
                } else {
                    selected.push(val);
                }
                if ($hidden.length) $hidden.val(selected.join(';'));
                if (opt.onSelect) opt.onSelect(val, selected);
                renderList($input.val());
                $input.val('').focus();
            }
        });

        // Click ra ngoài -> đóng (ngoại trừ khi đang thao tác trong modal prompt / confirm / edit modal)
        $(document).on('click', function (e) {
            if ($(e.target).closest('#kiotPromptOv, #kiotConfirmOv, #hhEditItemOv, #hhPromptOv, .kiot-prompt-ov, .kiot-confirm-ov, .modal-box').length > 0) {
                return;
            }
            if ($('#kiotPromptOv.show, #kiotConfirmOv.show, #hhEditItemOv.show, #hhPromptOv.show, .kiot-prompt-ov.show, .kiot-confirm-ov.show').length > 0) {
                return;
            }
            if (!$wrap.is(e.target) && $wrap.has(e.target).length === 0) {
                closeDropdown();
            }
        });

        return {
            open: openDropdown,
            close: closeDropdown,
            getSelected: () => selected,
            setSelected: (arr) => { selected = arr || []; renderList(''); },
            setItems: (newItems) => { opt.items = newItems || []; renderList($input.val()); }
        };
    }

    // 16. Khởi tạo bộ lọc Khoảng giá trị (Từ - Tới) chuẩn KiotViet (.fromto / _KiotValueFilter)
    function initValueFilter(id, onChangeCallback) {
        const fromInput = $(`#filter${id}Tu`);
        const toInput = $(`#filter${id}Den`);
        const dot = $(`#dot${id}`);

        const parseNum = val => {
            if (!val) return null;
            const cleaned = String(val).replace(/[^0-9.-]/g, '');
            const n = parseFloat(cleaned);
            return isNaN(n) ? null : n;
        };

        const updateHandler = debounce(function () {
            const tu = parseNum(fromInput.val());
            const den = parseNum(toInput.val());
            if (dot.length) {
                dot.toggleClass('active on', tu !== null || den !== null);
            }
            if (typeof onChangeCallback === 'function') {
                onChangeCallback(tu, den);
            }
        }, 400);

        fromInput.add(toInput).on('input', updateHandler);
    }

    // 17. Khởi tạo bộ lọc Trạng thái dạng Pills chuẩn KiotViet (.pills / .pill / _KiotStatusFilter)
    function initStatusFilter(containerSelector, onSelectCallback) {
        const container = $(containerSelector);
        if (!container.length) return;

        container.on('click', '.pill', function (e) {
            e.preventDefault();
            const btn = $(this);
            container.find('.pill').removeClass('on');
            btn.addClass('on');
            const val = btn.data('st') !== undefined ? btn.data('st') : btn.data('val');
            if (typeof onSelectCallback === 'function') {
                onSelectCallback(val);
            }
        });
    }

    // 18. Quản lý Master-Detail Accordion & Tabs trong Bảng (Chuẩn KiotViet)
    function initRowDetail(options) {
        const opt = $.extend({
            tableSelector: '',                                  // Selector bảng hoặc container (e.g. '#supplierTable')
            rowSelector: '.product-row, .tbl-row, .kiot-row',  // Dòng dữ liệu chính
            detailRowSelector: null,                           // Selector / Hàm lấy dòng chi tiết. Mặc định '#detail-{id}' hoặc '#dtl-{id}'
            wrapSelector: '.product-detail-panel-wrap, .kiot-detail-panel-wrap', // Khung bọc có hiệu ứng slideDown
            tabBtnSelector: '.product-detail-tab-btn, .kiot-detail-tab-btn, .detail-tab-btn',
            tabPaneSelector: '.tab-pane-content, .tab-pane, .kiot-tab-pane',
            excludeClickSelector: 'input, button, a, label, .cell-checkbox, .cell-star, .star-btn, .w-chk, .kiot-item-edit-btn',
            slideDuration: 150,
            fadeDuration: 120,
            autoCenter: false,                                 // Mặc định không tự động cuộn (giữ nguyên vị trí cuộn của người dùng)
            onOpen: null,                                      // callback(id, $row, $detailRow)
            onClose: null,                                     // callback(id, $row, $detailRow)
            onTabChange: null                                  // callback(tabName, id, $pane, $panel)
        }, options);

        function scrollToCenter($row, $detailRow) {
            if (!$row || !$row.length || !$detailRow || !$detailRow.length) return;
            const $scrollContainer = $detailRow.closest('.kiot-table-scroll-body');
            if (!$scrollContainer.length) return;

            const containerHeight = $scrollContainer.innerHeight();
            const containerTop = $scrollContainer.offset().top;
            const currentScrollTop = $scrollContainer.scrollTop();

            const rowTop = $row.offset().top;
            const detailHeight = $detailRow.outerHeight();
            const rowHeight = $row.outerHeight();
            const blockHeight = rowHeight + detailHeight;

            // Tọa độ đỉnh của dòng tính theo chiều dài cuộn thực tế của bảng
            const blockTopInContainer = (rowTop - containerTop) + currentScrollTop;

            let targetScrollTop;
            if (blockHeight <= containerHeight) {
                // Toàn bộ khối chi tiết (hàng + bảng con) nằm lọt trong container:
                // Căn chính xác ra GIỮA màn hình (khoảng trống trên và dưới cân đối hoàn hảo)
                targetScrollTop = blockTopInContainer - (containerHeight - blockHeight) / 2;
            } else {
                // Nếu bảng chi tiết dài hơn chiều cao màn hình:
                // Đưa dòng lên sát mép trên kèm khoảng đệm 12px để người dùng xem từ trên xuống
                targetScrollTop = blockTopInContainer - 12;
            }

            targetScrollTop = Math.max(0, targetScrollTop);

            // Cuộn ngang: nếu trước đó người dùng cuộn ngang xem các cột bên phải
            // thì tự động kéo về 0 để toàn bộ bảng chi tiết 992px hiển thị trọn vẹn ở giữa
            const currentScrollLeft = $scrollContainer.scrollLeft();
            const scrollProps = { scrollTop: targetScrollTop };
            if (currentScrollLeft > 0) {
                scrollProps.scrollLeft = 0;
            }

            $scrollContainer.stop(true).animate(scrollProps, 250);
        }

        function getDetailRow(id, $row) {
            if (typeof opt.detailRowSelector === 'function') {
                return opt.detailRowSelector(id, $row);
            }
            if (typeof opt.detailRowSelector === 'string') {
                return $(opt.detailRowSelector.replace('{id}', id));
            }
            const $byDetail = $(`#detail-${id}, #dtl-${id}`);
            if ($byDetail.length) return $byDetail;
            const $next = $row.next('tr.product-detail-row, tr.kiot-detail-row, tr.dtl');
            if ($next.length) return $next;
            return $(`tr.product-detail-row[data-id="${id}"], tr.kiot-detail-row[data-id="${id}"]`);
        }

        function toggleRow(id, forceOpen) {
            const $tableEl = opt.tableSelector ? $(opt.tableSelector) : $(document);
            const $row = $tableEl.find(opt.rowSelector).filter(function () {
                return String($(this).data('id')) === String(id);
            });
            const $detailRow = getDetailRow(id, $row);
            if (!$row.length || !$detailRow.length) return;

            const $wrap = $detailRow.find(opt.wrapSelector);
            const isCurrentlyOpen = $detailRow.is(':visible');

            if (isCurrentlyOpen && forceOpen === true) return;

            // Đóng ngay lập tức các dòng chi tiết khác đang mở (tránh 2 hiệu ứng slide đồng thời làm rung giật bảng)
            const allDetailRows = opt.tableSelector
                ? $tableEl.find('tr.product-detail-row, tr.kiot-detail-row, tr.dtl')
                : $('tr.product-detail-row, tr.kiot-detail-row, tr.dtl');
            allDetailRows.not($detailRow).each(function () {
                const $other = $(this);
                $other.find(opt.wrapSelector).stop(true, true).hide();
                $other.hide();
            });
            $tableEl.find(opt.rowSelector).not($row).removeClass('selected open is-expanded');

            if (isCurrentlyOpen && forceOpen !== true) {
                // Đóng dòng
                $wrap.stop(true, true).slideUp(opt.slideDuration, function () {
                    $detailRow.hide();
                });
                $row.removeClass('selected open is-expanded');
                if (typeof opt.onClose === 'function') {
                    opt.onClose(id, $row, $detailRow);
                }
            } else {
                // Mở dòng: Cập nhật colspan chính xác theo số cột hiển thị
                const visibleCols = $row.closest('table').find('thead tr:first-child th:visible').length || 1;
                $detailRow.find('> td').attr('colspan', visibleCols);

                // Gắn class last-visible-col cho ô hiển thị cuối cùng của dòng được chọn để khép kín hình chữ nhật
                // Tối ưu: chỉ xử lý trực tiếp trên $row, không query find('tr') duyệt toàn bộ DOM gây giật
                const $cells = $row.children('td:visible');
                $cells.removeClass('last-visible-col');
                $cells.last().addClass('last-visible-col');

                $row.addClass('selected open is-expanded');
                $detailRow.show();
                $wrap.stop(true, true).hide().slideDown(opt.slideDuration);

                // Tự động cuộn khối chi tiết nếu được cấu hình tường minh (mặc định false)
                if (opt.autoCenter === true) {
                    setTimeout(function () {
                        scrollToCenter($row, $detailRow);
                    }, opt.slideDuration + 30);
                }

                if (typeof opt.onOpen === 'function') {
                    opt.onOpen(id, $row, $detailRow);
                }
            }
        }

        // Lắng nghe click dòng bảng (chuẩn hóa selector tránh xung đột khi có dấu phẩy)
        const clickSelector = opt.tableSelector
            ? opt.rowSelector.split(',').map(s => `${opt.tableSelector} ${s.trim()}`).join(', ')
            : opt.rowSelector;
        $(document).off('click.kiotRowDetail', clickSelector).on('click.kiotRowDetail', clickSelector, function (e) {
            if ($(e.target).closest(opt.excludeClickSelector).length) return;
            const id = $(this).data('id');
            if (id !== undefined && id !== null) {
                toggleRow(id);
            }
        });

        // Lắng nghe click chuyển tab trong Detail Panel
        const tabClickSelector = opt.tableSelector ? `${opt.tableSelector} ${opt.tabBtnSelector}` : opt.tabBtnSelector;
        $(document).off('click.kiotRowTab', tabClickSelector).on('click.kiotRowTab', tabClickSelector, function (e) {
            e.stopPropagation();
            const $btn = $(this);
            const tabName = $btn.data('tab');
            const $panel = $btn.closest('.product-detail-panel, .kiot-detail-panel, .ncc-detail-panel');
            const $detailRow = $btn.closest('tr');
            let id = $detailRow.attr('id') ? $detailRow.attr('id').replace(/^(detail-|dtl-)/, '') : $detailRow.data('id');
            if (!id) {
                id = $detailRow.prev(opt.rowSelector).data('id');
            }

            $panel.find(opt.tabBtnSelector).removeClass('active');
            $btn.addClass('active');

            $panel.find(opt.tabPaneSelector).hide();
            const $targetPane = $panel.find(`.tab-${tabName}, .ncc-tab-${tabName}, [data-tab-pane="${tabName}"]`);
            $targetPane.fadeIn(opt.fadeDuration);

            if (typeof opt.onTabChange === 'function') {
                opt.onTabChange(tabName, id, $targetPane, $panel);
            }
        });

        return {
            expand: function (id) { toggleRow(id, true); },
            collapse: function (id) { toggleRow(id, false); },
            toggle: function (id) { toggleRow(id); },
            scrollToCenter: scrollToCenter
        };
    }

    // 19. Quản lý các nút Thao tác Thực thể (Edit, Delete, Toggle Status, Copy) Chuẩn KiotViet
    function initEntityActions(options) {
        const opt = $.extend({
            containerSelector: document,
            editSelector: '.btn-edit-product, .btn-edit-ncc, .kiot-btn-edit',
            deleteSelector: '.btn-delete-product, .btn-delete-ncc, .kiot-btn-delete',
            statusSelector: '.btn-toggle-status-ncc, .btn-toggle-status, .kiot-btn-status',
            copySelector: '.btn-copy-product, .kiot-btn-copy',
            onEdit: null,
            onDelete: null,
            onToggleStatus: null,
            onCopy: null
        }, options);

        const $c = $(opt.containerSelector);

        // Edit
        $c.off('click.kiotActionEdit', opt.editSelector).on('click.kiotActionEdit', opt.editSelector, function (e) {
            e.preventDefault();
            const $btn = $(this);
            const id = $btn.data('id') || $btn.closest('[data-id]').data('id');
            if (typeof opt.onEdit === 'function') {
                opt.onEdit(id, this, e);
            }
        });

        // Delete
        $c.off('click.kiotActionDelete', opt.deleteSelector).on('click.kiotActionDelete', opt.deleteSelector, function (e) {
            e.preventDefault();
            e.stopPropagation();
            const $btn = $(this);
            const id = $btn.data('id') || $btn.closest('[data-id]').data('id');
            let name = $btn.data('name');
            if (!name) {
                const $row = $btn.closest('tr.product-row, tr.tbl-row');
                if ($row.length) {
                    name = $row.find('[data-col="ten"], .cell-product-name').text().trim();
                } else {
                    const $detailRow = $btn.closest('tr');
                    const $prev = $detailRow.prev('tr');
                    if ($prev.length) name = $prev.find('[data-col="ten"], .cell-product-name').text().trim();
                }
            }
            if (typeof opt.onDelete === 'function') {
                opt.onDelete(id, name, this, e);
            }
        });

        // Toggle Status
        $c.off('click.kiotActionStatus', opt.statusSelector).on('click.kiotActionStatus', opt.statusSelector, function (e) {
            e.preventDefault();
            const $btn = $(this);
            const id = $btn.data('id') || $btn.closest('[data-id]').data('id');
            const status = $btn.data('status') || ($btn.text().includes('Ngừng') ? 'HOAT_DONG' : 'NGUNG_GIAO_DICH');
            let name = $btn.data('name');
            if (!name) {
                const $row = $btn.closest('tr.product-row, tr.tbl-row');
                if ($row.length) {
                    name = $row.find('[data-col="ten"], .cell-product-name').text().trim();
                } else {
                    const $detailRow = $btn.closest('tr');
                    const $prev = $detailRow.prev('tr');
                    if ($prev.length) name = $prev.find('[data-col="ten"], .cell-product-name').text().trim();
                }
            }
            if (typeof opt.onToggleStatus === 'function') {
                opt.onToggleStatus(id, name, status, this, e);
            }
        });

        // Copy
        if (opt.copySelector) {
            $c.off('click.kiotActionCopy', opt.copySelector).on('click.kiotActionCopy', opt.copySelector, function (e) {
                e.preventDefault();
                e.stopPropagation();
                const $btn = $(this);
                const id = $btn.data('id') || $btn.closest('[data-id]').data('id');
                if (typeof opt.onCopy === 'function') {
                    opt.onCopy(id, this, e);
                }
            });
        }
    }

    // 20. Khởi tạo Bộ Chọn Ngày Giờ Lập Phiếu (DateTimePicker 24h) Chuẩn KiotViet
    function initDateTimePicker(options) {
        const opt = $.extend({
            inputSelector: '#fDate',
            popupSelector: '#dtPop',
            initialDate: null,
            isReadOnly: false,
            stepMinutes: 30,
            onChange: null
        }, options);

        const $inp = $(opt.inputSelector);
        const $pop = $(opt.popupSelector);
        if (!$inp.length || !$pop.length || opt.isReadOnly) return null;

        let currentDate = opt.initialDate ? (opt.initialDate instanceof Date ? opt.initialDate : new Date(opt.initialDate)) : null;
        if (!currentDate || isNaN(currentDate.getTime())) {
            const rawVal = $inp.val();
            if (rawVal) {
                const parts = rawVal.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
                if (parts) {
                    const parsed = new Date(+parts[3], +parts[2] - 1, +parts[1], +parts[4], +parts[5]);
                    if (!isNaN(parsed.getTime())) currentDate = parsed;
                }
            }
        }
        if (!currentDate || isNaN(currentDate.getTime())) {
            currentDate = new Date();
        }

        const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        const DT = { y: currentDate.getFullYear(), m: currentDate.getMonth() };

        function p2(n) { return String(n).padStart(2, '0'); }
        function sod(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
        function dTime(d) { return `${p2(d.getHours())}:${p2(d.getMinutes())}`; }
        function dFull(d) {
            return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${dTime(d)}`;
        }
        function formatISO(d) {
            return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
        }

        function renderCal(y, m, sel) {
            const first = new Date(y, m, 1);
            const pad = (first.getDay() + 6) % 7;
            const days = new Date(y, m + 1, 0).getDate();
            const today = sod(new Date()).getTime();

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

        function renderPopup() {
            if (!$pop.length) return;
            const sel = sod(currentDate).getTime();
            const times = [];
            for (let h = 0; h < 24; h++) {
                for (let m = 0; m < 60; m += opt.stepMinutes) {
                    times.push(`${p2(h)}:${p2(m)}`);
                }
            }
            const curH = currentDate.getHours();
            const curM = currentDate.getMinutes();
            const roundedM = Math.floor(curM / opt.stepMinutes) * opt.stepMinutes;
            const curSlot = `${p2(curH)}:${p2(roundedM)}`;

            $pop.html(`
                <div style="flex:1">
                    <div class="dtnav">
                        <button type="button" class="rp-nav" data-dn="-1" title="Tháng trước"><i class="bi bi-chevron-left"></i></button>
                        <span>Tháng ${DT.m + 1}/${DT.y}</span>
                        <button type="button" class="rp-nav" data-dn="1" title="Tháng sau"><i class="bi bi-chevron-right"></i></button>
                    </div>
                    ${renderCal(DT.y, DT.m, sel)}
                </div>
                <div class="times">
                    ${times.map(t => `<button type="button" data-tm="${t}" class="${t === curSlot ? 'cur' : ''}">${t}</button>`).join('')}
                </div>
            `);
            const $times = $pop.find('.times');
            const $cur = $times.find('.cur');
            if ($times.length && $cur.length) {
                $times[0].scrollTop = $cur[0].offsetTop - ($times[0].clientHeight / 2) + ($cur[0].clientHeight / 2);
            }
        }

        let lastFocusTime = 0;
        function openPopup() {
            DT.y = currentDate.getFullYear();
            DT.m = currentDate.getMonth();
            renderPopup();
            $('.pop.show, .dtpop.show').not($pop).removeClass('show');
            $pop.attr('data-owner', opt.inputSelector).addClass('show');
        }

        function closePopup() {
            $pop.removeClass('show');
        }

        $inp.on('focus', function () {
            lastFocusTime = Date.now();
            openPopup();
        });

        $inp.on('click', function (e) {
            e.stopPropagation();
            if (Date.now() - lastFocusTime < 300) return;
            if ($pop.hasClass('show')) {
                closePopup();
            } else {
                openPopup();
            }
        });

        $inp.on('change', function () {
            const val = $(this).val();
            const m = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
            if (m) {
                const d = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
                if (!isNaN(d.getTime())) {
                    currentDate = d;
                    if (typeof opt.onChange === 'function') {
                        opt.onChange(currentDate, dFull(currentDate), formatISO(currentDate));
                    }
                }
            }
            $inp.val(dFull(currentDate));
        });

        $pop.off('click.kiotDtPop').on('click.kiotDtPop', function (e) {
            e.stopPropagation();
            const $n = $(e.target).closest('[data-dn]');
            const $d = $(e.target).closest('button.d');
            const $t = $(e.target).closest('[data-tm]');

            if ($n.length) {
                const dn = parseInt($n.data('dn'), 10);
                const x = new Date(DT.y, DT.m + dn, 1);
                DT.y = x.getFullYear();
                DT.m = x.getMonth();
                renderPopup();
            }

            if ($d.length) {
                const tVal = parseInt($d.data('t'), 10);
                const x = new Date(tVal);
                currentDate = new Date(x.getFullYear(), x.getMonth(), x.getDate(), currentDate.getHours(), currentDate.getMinutes());
                $inp.val(dFull(currentDate));
                renderPopup();
                if (typeof opt.onChange === 'function') {
                    opt.onChange(currentDate, dFull(currentDate), formatISO(currentDate));
                }
            }

            if ($t.length) {
                const [h, m] = String($t.data('tm')).split(':');
                currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), parseInt(h, 10), parseInt(m, 10));
                $inp.val(dFull(currentDate));
                renderPopup();
                if (typeof opt.onChange === 'function') {
                    opt.onChange(currentDate, dFull(currentDate), formatISO(currentDate));
                }
                closePopup();
            }
        });

        const docEventNamespace = `click.kiotDtPop_${opt.popupSelector.replace(/[^a-zA-Z0-9_-]/g, '')}`;
        $(document).off(docEventNamespace).on(docEventNamespace, function (e) {
            if (!$(e.target).closest(`${opt.inputSelector}, ${opt.popupSelector}`).length) {
                closePopup();
            }
        });

        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && $pop.hasClass('show')) {
                closePopup();
            }
        });

        if (!$inp.val() || !$inp.val().trim()) {
            $inp.val(dFull(currentDate));
        }

        return {
            getDate: () => currentDate,
            setDate: function (d) {
                currentDate = d instanceof Date ? d : new Date(d);
                if (isNaN(currentDate.getTime())) currentDate = new Date();
                $inp.val(dFull(currentDate));
                renderPopup();
            },
            getText: () => dFull(currentDate),
            getISO: () => formatISO(currentDate),
            open: openPopup,
            close: closePopup
        };
    }

    // 21. Khởi tạo Tìm kiếm Hàng hóa Autocomplete F3 Chuẩn KiotViet
    function initProductSearch(options) {
        const opt = $.extend({
            inputSelector: '#productSearchInput',
            dropdownSelector: '#autocompleteDropdown',
            apiUrl: '/NhapHang/SearchProducts',
            getWarehouseId: function () { return 1; },
            onSelect: function (product) {},
            debounceMs: 200,
            placeholder: 'Tìm mặt hàng (F3)...'
        }, options);

        const $inp = $(opt.inputSelector);
        const $dropdown = $(opt.dropdownSelector);
        if (!$inp.length || !$dropdown.length) return null;

        let searchTimeout = null;
        let currentItems = [];
        let activeIndex = -1;

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
                const el = $dropdown[0], tel = $target[0];
                if (tel.offsetTop < el.scrollTop) {
                    el.scrollTop = tel.offsetTop;
                } else if (tel.offsetTop + tel.offsetHeight > el.scrollTop + el.clientHeight) {
                    el.scrollTop = tel.offsetTop + tel.offsetHeight - el.clientHeight;
                }
            }
        }

        function selectProduct(product) {
            if (!product) return;
            opt.onSelect(product);
            $dropdown.removeClass('show').hide();
            currentItems = [];
            activeIndex = -1;
            $inp.val('').focus();
        }

        // Phím F3 toàn cục focus ô tìm kiếm
        const f3EventName = 'keydown.kiotF3_' + opt.inputSelector.replace(/[^a-zA-Z0-9_-]/g, '');
        $(document).off(f3EventName).on(f3EventName, function (e) {
            if (e.key === 'F3' || e.keyCode === 114) {
                e.preventDefault();
                $inp.focus().select();
            }
        });

        // Gõ phím tìm kiếm debounce
        $inp.off('input.kiotF3').on('input.kiotF3', function () {
            const q = $(this).val().trim();
            clearTimeout(searchTimeout);

            if (q.length === 0) {
                currentItems = [];
                activeIndex = -1;
                $dropdown.removeClass('show').hide();
                return;
            }

            searchTimeout = setTimeout(function () {
                const whId = typeof opt.getWarehouseId === 'function' ? opt.getWarehouseId() : opt.getWarehouseId;
                $.ajax({
                    url: opt.apiUrl,
                    type: 'GET',
                    data: { q: q, warehouseId: whId, whId: whId },
                    success: function (items) {
                        renderDropdown(items);
                    },
                    error: function () {
                        currentItems = [];
                        activeIndex = -1;
                        $dropdown.removeClass('show').hide();
                    }
                });
            }, opt.debounceMs);
        });

        // Phím điều hướng Up, Down, Enter, Escape
        $inp.off('keydown.kiotF3Nav').on('keydown.kiotF3Nav', function (e) {
            const isVisible = $dropdown.is(':visible') || $dropdown.hasClass('show');
            if (!isVisible || !currentItems.length) {
                if (e.key === 'Escape') {
                    $dropdown.removeClass('show').hide();
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
                $dropdown.removeClass('show').hide();
            }
        });

        // Focus lại nếu có text
        $inp.off('focus.kiotF3').on('focus.kiotF3', function () {
            if ($(this).val().trim().length > 0 && currentItems.length > 0) {
                $dropdown.addClass('show').show();
            }
        });

        function renderDropdown(items) {
            $dropdown.empty();
            currentItems = items || [];
            activeIndex = currentItems.length > 0 ? 0 : -1;

            if (!currentItems || currentItems.length === 0) {
                $dropdown.append('<div class="p-3 text-center text-muted small">Không tìm thấy hàng hóa phù hợp</div>');
                $dropdown.addClass('show').show();
                return;
            }

            currentItems.forEach(function (item, idx) {
                const tenHang = item.tenHang || item.TenHang || '';
                const maHangNoiBo = item.maHangNoiBo || item.MaHangNoiBo || '';
                const tenDvt = item.tenDvt || item.TenDvt || '';
                const tenNhom = item.tenNhom || item.TenNhom || '';
                const tonKho = parseFloat(item.tonKho !== undefined ? item.tonKho : (item.TonKho !== undefined ? item.TonKho : 0)) || 0;
                const gia = parseFloat(item.gia !== undefined ? item.gia : (item.Gia !== undefined ? item.Gia : (item.giaVon !== undefined ? item.giaVon : 0))) || 0;
                const maHang = item.maHang || item.MaHang || item.id || item.Id;

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

            $dropdown.addClass('show').show();
        }

        $dropdown.off('mouseenter.kiotF3').on('mouseenter.kiotF3', '.kk-autocomplete-item', function () {
            const idx = parseInt($(this).data('index'), 10);
            if (!isNaN(idx)) setActiveIndex(idx, false);
        });

        $dropdown.off('click.kiotF3').on('click.kiotF3', '.kk-autocomplete-item', function (e) {
            e.stopPropagation();
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

        const docClickEvent = 'click.kiotF3_' + opt.inputSelector.replace(/[^a-zA-Z0-9_-]/g, '');
        $(document).off(docClickEvent).on(docClickEvent, function (e) {
            if (!$(e.target).closest($inp).length && !$(e.target).closest($dropdown).length) {
                $dropdown.removeClass('show').hide();
            }
        });

        return {
            focus: () => $inp.focus(),
            clear: () => { $inp.val(''); $dropdown.removeClass('show').hide(); },
            close: () => $dropdown.removeClass('show').hide()
        };
    }

    // 22. Quản lý Lưới Dòng Hàng Hóa Chứng Từ (Document Grid) Chuẩn KiotViet
    function initDocGrid(options) {
        const opt = $.extend({
            tableBodySelector: '#itemsTableBody',
            emptyBoxSelector: '#emptyLineBox',
            tableScrollSelector: '#tableScrollWrap',
            rowSelector: '.item-line-row',
            sttSelector: '.row-stt',
            btnRemoveSelector: '.btn-remove-line, [data-del], .del',
            qtyInputSelector: '.line-qty, [data-qty], .qty',
            onRecalc: null,
            onRemove: null,
            confirmDelete: false,
            confirmTitle: 'Xác nhận xóa hàng hóa',
            confirmMessage: 'Bạn có chắc chắn muốn bỏ sản phẩm này khỏi phiếu?'
        }, options);

        const $tbody = $(opt.tableBodySelector);
        if (!$tbody.length) return null;

        function updateSTT() {
            $tbody.find(opt.rowSelector).each(function (idx) {
                $(this).find(opt.sttSelector).text(idx + 1);
            });
        }

        function checkEmptyState() {
            const count = $tbody.find(opt.rowSelector).length;
            if (count === 0) {
                if (opt.tableScrollSelector) $(opt.tableScrollSelector).hide();
                if (opt.emptyBoxSelector) $(opt.emptyBoxSelector).show();
            } else {
                if (opt.tableScrollSelector) $(opt.tableScrollSelector).show();
                if (opt.emptyBoxSelector) $(opt.emptyBoxSelector).hide();
            }
            updateSTT();
            if (typeof opt.onRecalc === 'function') {
                opt.onRecalc(count);
            }
        }

        $tbody.off('click.kiotDocDel').on('click.kiotDocDel', opt.btnRemoveSelector, function (e) {
            e.preventDefault();
            e.stopPropagation();
            const $row = $(this).closest(opt.rowSelector);
            const rowId = $row.data('id') || $row.data('i');

            function doRemove() {
                $row.remove();
                checkEmptyState();
                if (typeof opt.onRemove === 'function') {
                    opt.onRemove(rowId, $row);
                }
            }

            if (opt.confirmDelete && window.KiotConfirm) {
                KiotConfirm.show({
                    title: opt.confirmTitle,
                    message: opt.confirmMessage,
                    confirmText: 'Xóa',
                    confirmClass: 'btn-danger',
                    onConfirm: doRemove
                });
            } else {
                doRemove();
            }
        });

        $tbody.off('input.kiotDocQty change.kiotDocQty').on('input.kiotDocQty change.kiotDocQty', opt.qtyInputSelector, function () {
            if (typeof opt.onRecalc === 'function') {
                opt.onRecalc($tbody.find(opt.rowSelector).length);
            }
        });

        checkEmptyState();

        return {
            checkEmpty: checkEmptyState,
            updateSTT: updateSTT,
            recalc: () => { if (typeof opt.onRecalc === 'function') opt.onRecalc($tbody.find(opt.rowSelector).length); },
            getCount: () => $tbody.find(opt.rowSelector).length
        };
    }

    // 21. KiotImageUploader – Quản lý tải ảnh (1 ảnh chính + 4 ảnh phụ, nén Canvas, kéo-thả, paste Ctrl+V)
    function initImageUploader(options) {
        const opt = $.extend({
            mainBoxSelector: '#hhImgMain',
            thumbsBoxSelector: '#hhThumbs',
            fileInputSelector: '#hhImgFile',
            fileReplaceMainSelector: '#hhImgFileReplaceMain',
            modalSelector: '#hhModalOv',
            maxImages: 5,
            maxDimension: 1200,
            quality: 0.88,
            maxFileSizeMB: 15,
            initialImages: [],
            onToast: function (msg, type) {
                if (window.KiotToast) {
                    if (type === 'error') KiotToast.error(msg);
                    else if (type === 'warning') KiotToast.warning(msg);
                    else KiotToast.info(msg);
                } else if (typeof showToast === 'function') {
                    showToast(msg);
                }
            },
            onConfirm: function (msg, title, cb) {
                if (window.KiotConfirm) {
                    window.KiotConfirm.show({
                        title: title || 'Xác nhận xóa',
                        message: msg,
                        confirmText: 'Xóa',
                        confirmClass: 'btn-danger',
                        onConfirm: cb
                    });
                } else if (confirm(msg)) {
                    cb();
                }
            },
            onChange: null
        }, options);

        const $mainBox = $(opt.mainBoxSelector);
        const $thumbsBox = $(opt.thumbsBoxSelector);
        const $fileInput = $(opt.fileInputSelector);
        const $fileReplaceMain = $(opt.fileReplaceMainSelector);
        const $modal = $(opt.modalSelector);

        let imgs = [];
        if (opt.initialImages && opt.initialImages.length) {
            imgs = opt.initialImages.map(item => {
                if (typeof item === 'string') return { base64: item, url: item };
                return { base64: item.base64 || item.url, url: item.url || item.base64 };
            });
        }

        function notifyChange() {
            if (typeof opt.onChange === 'function') {
                opt.onChange(imgs);
            }
        }

        // Nén và tối ưu kích thước ảnh bằng Canvas (nền trắng chống lỗi nền đen của PNG/WebP trong suốt khi xuất JPEG)
        function compressImage(file, maxDimension, quality) {
            const maxDim = maxDimension || opt.maxDimension;
            const q = quality || opt.quality;
            return new Promise((resolve) => {
                if (!file || !file.type || !file.type.startsWith('image/')) {
                    resolve(null);
                    return;
                }
                const reader = new FileReader();
                reader.onload = e => {
                    const img = new Image();
                    img.onload = () => {
                        let width = img.width;
                        let height = img.height;

                        if (width > maxDim || height > maxDim) {
                            if (width > height) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                            } else {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');

                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';

                        // Đổ nền trắng tinh khiết
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, width, height);

                        ctx.drawImage(img, 0, 0, width, height);
                        const compressed = canvas.toDataURL('image/jpeg', q);
                        resolve(compressed);
                    };
                    img.onerror = () => resolve(e.target.result);
                    img.src = e.target.result;
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
            });
        }

        function renderImgs() {
            if (!$mainBox.length || !$thumbsBox.length) return;

            // 1. Render Ảnh chính (imgs[0])
            if (imgs.length > 0 && imgs[0]) {
                $mainBox.html(`
                    <img src="${imgs[0].url}" alt="Ảnh chính hàng hóa">
                    <span class="hh-main-badge">Ảnh chính</span>
                    <button type="button" class="hh-main-x" id="btnRemoveMainImg" title="Xóa ảnh chính" aria-label="Xóa ảnh chính">×</button>
                    <div class="hh-main-change-hint">Bấm để đổi ảnh</div>
                `);
            } else {
                $mainBox.html(`
                    <svg class="hh-ic" style="width:44px;height:44px;"><use href="#i-img"/></svg>
                    <span>Chưa có ảnh</span>
                    <small style="font-size:11.5px;color:#9ca3af;margin-top:2px;">(Bấm để thêm ảnh chính)</small>
                `);
            }

            // 2. Render đúng (maxImages - 1) ảnh phụ bên phải
            const maxSubs = Math.max(1, opt.maxImages - 1);
            const subImgs = imgs.slice(1);
            let h = '';

            for (let i = 0; i < maxSubs; i++) {
                if (i < subImgs.length) {
                    h += `
                        <div class="hh-th" data-sub-idx="${i}" role="button" tabindex="0" title="Ảnh phụ ${i + 1} (Bấm để đổi thành ảnh chính)">
                            <img src="${subImgs[i].url}" alt="Ảnh phụ ${i + 1}">
                            <button type="button" class="hh-th-x" data-del-sub="${i}" aria-label="Xóa ảnh phụ ${i + 1}">×</button>
                        </div>
                    `;
                } else if (i === subImgs.length && imgs.length < opt.maxImages) {
                    h += `
                        <button type="button" class="hh-th add" id="btnAddImgThumb" title="Thêm ảnh phụ (${imgs.length}/${opt.maxImages})">
                            <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;"><path d="M12 5v14M5 12h14"/></svg>
                        </button>
                    `;
                } else {
                    h += `
                        <div class="hh-th placeholder" tabindex="-1" aria-hidden="true" title="Vị trí ảnh ${i + 2}">
                            <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                    `;
                }
            }

            $thumbsBox.html(h);
        }

        // Click vùng ảnh chính
        $mainBox.off('click.kiotImg').on('click.kiotImg', function (e) {
            if ($(e.target).closest('#btnRemoveMainImg').length) {
                e.stopPropagation();
                if (imgs.length > 0) {
                    opt.onConfirm('Bạn có chắc chắn muốn xóa ảnh đại diện chính này không? Thao tác này không thể hoàn tác.', 'Xóa ảnh chính', function () {
                        imgs.splice(0, 1);
                        renderImgs();
                        notifyChange();
                        opt.onToast('Đã xóa ảnh chính');
                    });
                }
                return;
            }
            if (!imgs.length) {
                $fileInput.trigger('click');
            } else if ($fileReplaceMain.length) {
                $fileReplaceMain.trigger('click');
            } else {
                $fileInput.trigger('click');
            }
        });

        // Click thumbs
        $thumbsBox.off('click.kiotImg').on('click.kiotImg', function (e) {
            const delBtn = e.target.closest('[data-del-sub]');
            if (delBtn) {
                e.stopPropagation();
                const subIdx = +delBtn.dataset.delSub;
                opt.onConfirm('Bạn có chắc chắn muốn xóa ảnh phụ này không? Thao tác này không thể hoàn tác.', 'Xóa ảnh phụ', function () {
                    imgs.splice(subIdx + 1, 1);
                    renderImgs();
                    notifyChange();
                    opt.onToast('Đã xóa ảnh phụ');
                });
                return;
            }

            const addBtn = e.target.closest('#btnAddImgThumb');
            if (addBtn) {
                e.stopPropagation();
                $fileInput.trigger('click');
                return;
            }

            const th = e.target.closest('[data-sub-idx]');
            if (th) {
                const subIdx = +th.dataset.subIdx;
                const targetIdx = subIdx + 1;
                if (targetIdx < imgs.length) {
                    const tmp = imgs[0];
                    imgs[0] = imgs[targetIdx];
                    imgs[targetIdx] = tmp;
                    renderImgs();
                    notifyChange();
                    opt.onToast('Đã đổi làm ảnh chính');
                }
            }
        });

        // Input file change (thêm ảnh)
        $fileInput.off('change.kiotImg').on('change.kiotImg', async function (e) {
            const files = [...(e.target.files || [])];
            if (!files.length) return;

            for (const f of files) {
                if (imgs.length >= opt.maxImages) {
                    opt.onToast('Chỉ được chọn tối đa ' + opt.maxImages + ' ảnh (1 ảnh chính và ' + (opt.maxImages - 1) + ' ảnh phụ).', 'warning');
                    break;
                }
                if (f.size > opt.maxFileSizeMB * 1024 * 1024) {
                    opt.onToast('Ảnh "' + f.name + '" vượt quá dung lượng ' + opt.maxFileSizeMB + 'MB.', 'warning');
                    continue;
                }

                const b64 = await compressImage(f);
                if (b64 && imgs.length < opt.maxImages) {
                    imgs.push({ base64: b64, url: b64 });
                    renderImgs();
                    notifyChange();
                }
            }
            this.value = '';
        });

        // Input file change (thay ảnh chính)
        if ($fileReplaceMain.length) {
            $fileReplaceMain.off('change.kiotImg').on('change.kiotImg', async function (e) {
                const file = e.target.files && e.target.files[0];
                if (!file) return;

                if (file.size > opt.maxFileSizeMB * 1024 * 1024) {
                    opt.onToast('Ảnh "' + file.name + '" vượt quá dung lượng ' + opt.maxFileSizeMB + 'MB.', 'warning');
                    return;
                }

                const b64 = await compressImage(file);
                if (b64) {
                    if (imgs.length > 0) {
                        imgs[0] = { base64: b64, url: b64 };
                    } else {
                        imgs.push({ base64: b64, url: b64 });
                    }
                    renderImgs();
                    notifyChange();
                    opt.onToast('Đã thay đổi ảnh chính');
                }
                this.value = '';
            });
        }

        // Kéo thả ảnh vào mainBox
        $mainBox.off('dragenter.kiotImg dragover.kiotImg dragleave.kiotImg drop.kiotImg');
        $mainBox.on('dragenter.kiotImg dragover.kiotImg', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $mainBox.addClass('drag-over');
        });
        $mainBox.on('dragleave.kiotImg drop.kiotImg', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $mainBox.removeClass('drag-over');
        });
        $mainBox.on('drop.kiotImg', async function (e) {
            const dt = e.originalEvent?.dataTransfer;
            const files = [...(dt?.files || [])].filter(f => f.type && f.type.startsWith('image/'));
            if (!files.length) return;

            for (const f of files) {
                if (imgs.length >= opt.maxImages) {
                    opt.onToast('Chỉ được chọn tối đa ' + opt.maxImages + ' ảnh.', 'warning');
                    break;
                }
                if (f.size > opt.maxFileSizeMB * 1024 * 1024) {
                    opt.onToast('Ảnh "' + f.name + '" vượt quá dung lượng ' + opt.maxFileSizeMB + 'MB.', 'warning');
                    continue;
                }
                const b64 = await compressImage(f);
                if (b64 && imgs.length < opt.maxImages) {
                    imgs.push({ base64: b64, url: b64 });
                    renderImgs();
                    notifyChange();
                }
            }
        });

        // Dán ảnh từ Clipboard Ctrl + V
        $(window).off('paste.kiotImgUploader');
        $(window).on('paste.kiotImgUploader', async function (e) {
            if ($modal.length && ($modal.hasClass('hidden') || $modal.css('display') === 'none' || !$modal.is(':visible'))) {
                return;
            }

            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && active.type !== 'file') {
                return;
            }

            const clipboardData = e.originalEvent?.clipboardData || e.clipboardData;
            const items = clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        if (imgs.length >= opt.maxImages) {
                            opt.onToast('Chỉ được chọn tối đa ' + opt.maxImages + ' ảnh.', 'warning');
                            break;
                        }
                        const b64 = await compressImage(file);
                        if (b64 && imgs.length < opt.maxImages) {
                            imgs.push({ base64: b64, url: b64 });
                            renderImgs();
                            notifyChange();
                            opt.onToast('Đã thêm ảnh từ clipboard');
                        }
                    }
                }
            }
        });

        // Render khởi tạo
        renderImgs();

        return {
            getImages: () => imgs,
            setImages: (arr, mainIndex = 0) => {
                imgs = (arr || []).map(item => {
                    if (typeof item === 'string') return { base64: item, url: item };
                    return { base64: item.base64 || item.url, url: item.url || item.base64 };
                });
                if (mainIndex > 0 && mainIndex < imgs.length) {
                    const mainImg = imgs.splice(mainIndex, 1)[0];
                    imgs.unshift(mainImg);
                }
                renderImgs();
                notifyChange();
            },
            clear: () => {
                imgs = [];
                renderImgs();
                notifyChange();
            },
            compressImage: compressImage,
            render: renderImgs
        };
    }

    // 22. KiotListPage – Bộ máy điều khiển trang danh sách chuẩn KiotViet (Boilerplate Engine)
    function createListPage(options) {
        const opt = $.extend({
            containerSelector: '#kiotContainer',
            filterUrl: '',
            tableSelector: '#mainTable, .kiot-table, .tbl',
            tableWrapperSelector: '#tableContainer, #tableWrapper',
            searchInputSelector: '#keywordSearch, #filterSearch, #topSearch, input[name="Q"]',
            storageKeyCols: '',
            defaultCols: null,
            extraColsCount: 2,
            initialState: {},
            dateFilterId: 'date',
            rowDetailOptions: null,
            toggleStarUrl: '',
            buildParams: null,
            onTableLoaded: null,
            onPaintFilters: null
        }, options);

        const $container = $(opt.containerSelector);
        const filterUrl = opt.filterUrl || $container.data('filter-url') || '';
        const toggleStarUrl = opt.toggleStarUrl || $container.data('toggle-star-url') || '';
        const isStarredInit = $container.data('is-starred') === true || $container.data('is-starred') === 'true';

        // Khởi tạo state F tập trung
        const F = $.extend({
            q: $(opt.searchInputSelector).val() || '',
            mode: 'preset',
            preset: 'ALL',
            fromDate: null,
            toDate: null,
            statuses: [],
            starred: isStarredInit,
            sortBy: $container.data('sort-by') || '',
            sortDir: $container.data('sort-dir') || '',
            page: 1,
            pageSize: 15,
            openId: null
        }, opt.initialState);

        let columnToggler = null;
        let rowDetailHandler = null;
        let searchTimer = null;

        // 1. Quản lý ẩn/hiện cột
        if (opt.storageKeyCols && opt.defaultCols && typeof initColumnToggle === 'function') {
            columnToggler = initColumnToggle({
                menuSelector: '#colMenu',
                tableSelector: opt.tableSelector,
                storageKey: opt.storageKeyCols,
                defaultCols: opt.defaultCols,
                extraColsCount: opt.extraColsCount
            });
        }

        function applyColumnVisibility() {
            if (columnToggler && typeof columnToggler.apply === 'function') {
                columnToggler.apply();
            }
        }

        // 2. Quản lý Accordion Drawer Master-Detail
        function initRowDetailHandler() {
            if (opt.rowDetailOptions && typeof initRowDetail === 'function') {
                const rowDetailConfig = $.extend({
                    tableSelector: opt.tableSelector,
                    rowSelector: 'tr.product-row, tr.tbl-row',
                    detailRowSelector: '#dtl-{id}',
                    wrapSelector: '.product-detail-panel-wrap, .kiot-detail-panel-wrap',
                    tabBtnSelector: '.product-detail-tab-btn, .dp-tab',
                    tabPaneSelector: '.tab-pane-content, .tab-pane, .dp-pane',
                    excludeClickSelector: 'input, button, a, label, .w-chk, .w-star, .cell-star, .star-btn, .cell-checkbox, .row-select',
                    onOpen: function (id) {
                        F.openId = id;
                    },
                    onClose: function () {
                        F.openId = null;
                    }
                }, opt.rowDetailOptions);

                rowDetailHandler = initRowDetail(rowDetailConfig);
            }
        }

        // 3. Tải bảng dữ liệu qua AJAX
        function loadTable() {
            if (!filterUrl) return;
            const $wrap = $(opt.tableWrapperSelector);
            if ($wrap.length) $wrap.css('opacity', '0.6');

            const params = new URLSearchParams();
            if (F.q && F.q.trim()) params.append('Q', F.q.trim());

            if (F.mode === 'preset' || (F.preset && !F.fromDate)) {
                params.append('DateFilterType', F.preset || 'ALL');
            } else {
                params.append('DateFilterType', 'CUSTOM');
            }

            if (F.fromDate) {
                const fromStr = typeof F.fromDate === 'string' ? F.fromDate : formatDateISO(F.fromDate);
                if (fromStr) params.append('FromDate', fromStr);
            }
            if (F.toDate) {
                const toStr = typeof F.toDate === 'string' ? F.toDate : formatDateISO(F.toDate);
                if (toStr) params.append('ToDate', toStr);
            }

            if (Array.isArray(F.statuses)) {
                F.statuses.forEach(s => params.append('Statuses', s));
            }

            if (F.starred) {
                params.append('DaDanhDau', 'true');
            }

            if (F.sortBy) {
                params.append('SortBy', F.sortBy);
                params.append('SortDir', F.sortDir || 'asc');
            }

            params.append('Page', F.page);
            params.append('PageSize', F.pageSize);

            // Hook cho phép module riêng thêm tham số lọc đặc thù
            if (typeof opt.buildParams === 'function') {
                opt.buildParams(params, F);
            }

            const fetchUrl = filterUrl.includes('?') 
                ? `${filterUrl}&${params.toString()}` 
                : `${filterUrl}?${params.toString()}`;

            $.ajax({
                url: fetchUrl,
                type: 'GET',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                success: function (html) {
                    if ($wrap.length) {
                        $wrap.html(html).css('opacity', '1');
                    }
                    applyColumnVisibility();
                    initRowDetailHandler();

                    if (F.openId && rowDetailHandler && typeof rowDetailHandler.expand === 'function') {
                        rowDetailHandler.expand(F.openId);
                    }

                    if (typeof opt.onTableLoaded === 'function') {
                        opt.onTableLoaded($wrap, F);
                    }
                    paintFilters();
                },
                error: function () {
                    if ($wrap.length) $wrap.css('opacity', '1');
                    if (window.KiotToast) {
                        KiotToast.error('Không thể tải dữ liệu bảng.');
                    }
                }
            });
        }

        // 4. Vẽ lại các chỉ thị bộ lọc
        function paintFilters() {
            const $starHeader = $('#starHeaderFilter');
            if ($starHeader.length) {
                $starHeader.toggleClass('starred', !!F.starred);
            }

            if (typeof opt.onPaintFilters === 'function') {
                opt.onPaintFilters(F);
            }
        }

        // 5. Gắn sự kiện chuẩn hóa toàn hệ thống
        // Ô tìm kiếm (Debounce + Enter)
        const $searchInput = $(opt.searchInputSelector);
        if ($searchInput.length) {
            $searchInput.off('input.kiotList').on('input.kiotList', function () {
                clearTimeout(searchTimer);
                F.q = $(this).val();
                searchTimer = setTimeout(() => {
                    F.page = 1;
                    loadTable();
                }, 350);
            });

            $searchInput.off('keydown.kiotList').on('keydown.kiotList', function (e) {
                if (e.key === 'Enter') {
                    clearTimeout(searchTimer);
                    F.q = $(this).val();
                    F.page = 1;
                    loadTable();
                }
            });
        }

        // Phân trang AJAX
        $(document).off('click.kiotListPageAjax', '.page-ajax').on('click.kiotListPageAjax', '.page-ajax', function (e) {
            e.preventDefault();
            const p = parseInt($(this).data('page'));
            if (p && p > 0 && p !== F.page) {
                F.page = p;
                loadTable();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        // Sắp xếp cột 3 trạng thái (Không sort -> ASC -> DESC -> Không sort)
        $(document).off('click.kiotListSort', `${opt.tableSelector} thead th.sortable-th`).on('click.kiotListSort', `${opt.tableSelector} thead th.sortable-th`, function (e) {
            e.preventDefault();
            const col = $(this).data('col');
            if (!col) return;

            if (F.sortBy === col) {
                if (F.sortDir === 'asc') {
                    F.sortDir = 'desc';
                } else if (F.sortDir === 'desc') {
                    F.sortBy = '';
                    F.sortDir = '';
                } else {
                    F.sortDir = 'asc';
                }
            } else {
                F.sortBy = col;
                F.sortDir = 'asc';
            }

            F.page = 1;
            loadTable();
        });

        // Đánh dấu sao trên Header
        $(document).off('click.kiotListStarHeader', '#starHeaderFilter').on('click.kiotListStarHeader', '#starHeaderFilter', function (e) {
            e.preventDefault();
            e.stopPropagation();
            F.starred = !F.starred;
            F.page = 1;
            loadTable();
        });

        // Đánh dấu sao trên dòng bảng
        if (toggleStarUrl) {
            $(document).off('click.kiotListStarRow', '.star-btn:not(#starHeaderFilter)').on('click.kiotListStarRow', '.star-btn:not(#starHeaderFilter)', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const $btn = $(this);
                const id = $btn.data('id');
                if (!id) return;

                $.ajax({
                    url: `${toggleStarUrl}?id=${id}`,
                    type: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    success: function (res) {
                        if (res && res.success) {
                            if (res.isFavorite) {
                                $btn.addClass('starred').attr('title', 'Bỏ đánh dấu sao').html('<i class="bi bi-star-fill"></i>');
                            } else {
                                $btn.removeClass('starred').attr('title', 'Đánh dấu sao').html('<i class="bi bi-star"></i>');
                                if (F.starred) {
                                    const $tr = $btn.closest('tr');
                                    $(`#dtl-${id}`).remove();
                                    $tr.remove();
                                    if ($(`${opt.tableSelector} tbody tr.tbl-row, ${opt.tableSelector} tbody tr.product-row`).length === 0) {
                                        loadTable();
                                    }
                                }
                            }
                        }
                    }
                });
            });
        }

        // Phím tắt toàn cục: F3 focus tìm kiếm & F4 gập mở sidebar
        $(document).off('keydown.kiotListHotkeys').on('keydown.kiotListHotkeys', function (e) {
            if (e.key === 'F3') {
                e.preventDefault();
                const $inp = $(opt.searchInputSelector);
                if ($inp.length) {
                    $inp.focus().select();
                }
            } else if (e.key === 'F4') {
                const $toggleBtn = $('#btnToggleSidebar');
                if ($toggleBtn.length) {
                    e.preventDefault();
                    $toggleBtn.trigger('click');
                }
            }
        });

        // Tự động khởi tạo Sidebar nếu có
        if (typeof initSidebar === 'function' && $('#sidebarFilterCol').length) {
            initSidebar({
                containerSelector: opt.containerSelector,
                sidebarSelector: '#sidebarFilterCol',
                toggleBtnSelector: '#btnToggleSidebar',
                mobileBtnSelector: '#btnMobileFilter',
                closeMobileBtnSelector: '#btnCloseSidebarMobile',
                backdropSelector: '#sidebarBackdrop'
            });
        }

        // Tự động kết nối bộ lọc ngày tháng
        if (opt.dateFilterId && typeof initDateFilter === 'function') {
            initDateFilter(opt.dateFilterId, function (from, to, text, val) {
                F.mode = val === 'CUSTOM' ? 'custom' : 'preset';
                F.preset = val;
                F.fromDate = from;
                F.toDate = to;
                F.page = 1;
                loadTable();
            });
        }

        initRowDetailHandler();
        applyColumnVisibility();

        return {
            state: F,
            loadTable: loadTable,
            reload: function (resetPage) {
                if (resetPage) F.page = 1;
                loadTable();
            },
            paintFilters: paintFilters,
            columnToggler: columnToggler,
            rowDetail: rowDetailHandler
        };
    }

    return {
        debounce: debounce,
        escapeHtml: escapeHtml,
        formatDateVN: formatDateVN,
        formatDateISO: formatDateISO,
        initSidebar: initSidebar,
        checkSidebarDropdownDirection: checkSidebarDropdownDirection,
        renderTagPills: renderTagPills,
        initSingleSelect: initSingleSelect,
        initMultiSelect: initMultiSelect,
        toggleFloatingPopup: toggleFloatingPopup,
        initDateFilter: initDateFilter,
        initColumnToggle: initColumnToggle,
        bindStarToggle: bindStarToggle,
        bindPagination: bindPagination,
        initCombobox: initCombobox,
        initValueFilter: initValueFilter,
        initStatusFilter: initStatusFilter,
        initRowDetail: initRowDetail,
        initEntityActions: initEntityActions,
        initDateTimePicker: initDateTimePicker,
        initProductSearch: initProductSearch,
        initDocGrid: initDocGrid,
        initImageUploader: initImageUploader,
        createListPage: createListPage
    };
})(jQuery);

// Global alias cho backwards compatibility
if (typeof window !== 'undefined' && window.KiotFilter) {
    window.initF3ProductSearch = window.KiotFilter.initProductSearch;
}

