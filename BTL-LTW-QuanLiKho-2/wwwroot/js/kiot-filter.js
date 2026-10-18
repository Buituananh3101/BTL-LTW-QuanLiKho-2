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

    function initDateFilter(target, onApplyCallback) {
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

        // Mở popup chọn nhanh
        $(`#btnOpen${tgtCap}Quick, #label${tgtCap}All`).on('click', function (e) {
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

            if (typeof onApplyCallback === 'function') {
                onApplyCallback(null, null, labelText, val);
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

            if (typeof onApplyCallback === 'function') {
                onApplyCallback(formatDateISO(s), formatDateISO(eDate), rangeText, 'CUSTOM');
            }
        });

        // Tự đóng khi click ra ngoài
        $(document).on('click', function (e) {
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
            currentTable.find('tr.product-detail-row > td, tr.kiot-detail-row > td, tr.dtl > td, tr.empty-row > td, tr:has(.empty) > td').attr('colspan', actualVisibleCols);

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
                const isSel = selected.includes(val);

                html += `
                    <div class="kiot-combobox-item hh-multiselect-item ${isSel ? 'selected' : ''}" data-val="${escapeHtml(val)}">
                        <span class="kiot-combobox-text hh-multiselect-text">${escapeHtml(text)}</span>
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
            const $row = $(opt.rowSelector).filter(function () {
                return String($(this).data('id')) === String(id);
            });
            const $detailRow = getDetailRow(id, $row);
            if (!$row.length || !$detailRow.length) return;

            const $wrap = $detailRow.find(opt.wrapSelector);
            const isCurrentlyOpen = $detailRow.is(':visible');

            // Đóng các dòng chi tiết khác đang mở (hiệu ứng slideUp khớp KiotViet)
            const allDetailRows = $(opt.tableSelector ? `${opt.tableSelector} tr.product-detail-row, ${opt.tableSelector} tr.kiot-detail-row, ${opt.tableSelector} tr.dtl` : 'tr.product-detail-row, tr.kiot-detail-row, tr.dtl');
            allDetailRows.not($detailRow).each(function () {
                const $other = $(this);
                $other.find(opt.wrapSelector).slideUp(opt.slideDuration, function () {
                    $other.hide();
                });
            });
            $(opt.tableSelector ? `${opt.tableSelector} ${opt.rowSelector}` : opt.rowSelector).not($row).removeClass('selected open is-expanded');

            if (isCurrentlyOpen && forceOpen !== true) {
                // Đóng dòng
                $wrap.slideUp(opt.slideDuration, function () {
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

                // Gắn class last-visible-col cho ô hiển thị cuối cùng của mỗi dòng để khép kín hình chữ nhật
                $row.closest('table').find('.last-visible-col').removeClass('last-visible-col');
                $row.children('td:visible').last().addClass('last-visible-col');

                $row.addClass('selected open is-expanded');
                $detailRow.show();
                $wrap.hide().slideDown(opt.slideDuration);

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

        // Lắng nghe click dòng bảng
        const clickSelector = opt.tableSelector ? `${opt.tableSelector} ${opt.rowSelector}` : opt.rowSelector;
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
        initEntityActions: initEntityActions
    };
})(jQuery);
