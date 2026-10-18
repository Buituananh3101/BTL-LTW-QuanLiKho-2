/**
 * hang-hoa-index.js – Quản lý tương tác trang Danh sách hàng hóa KiotViet
 * Bao gồm: Sidebar Drawer, Dual Calendar, Multi-select Tags, Sắp xếp cột 3 trạng thái, AJAX Paging, Star.
 */

$(document).ready(function () {
    const cfg = $('#hangHoaConfig');
    let currentPage = parseInt(cfg.data('page')) || 1;
    let currentSortBy = String(cfg.data('sort-by') || '');
    let currentSortDir = String(cfg.data('sort-dir') || '');
    let activeDuKienVal = String(cfg.data('du-kien') || 'ALL');
    let activeTgTaoVal = String(cfg.data('tg-tao') || 'ALL');
    let isStarredFilterActive = cfg.data('is-starred') === true || cfg.data('is-starred') === 'true';

    let activeTgTaoFrom = '';
    let activeTgTaoTo = '';

    const groupModalEl = document.getElementById('quickGroupModal');
    const groupModal = groupModalEl ? new bootstrap.Modal(groupModalEl) : null;

    // 1. Thu gọn / Mở rộng (Kéo vào / Kéo ra) sidebar bên trái
    let animTimer = null;
    function toggleSidebar(forceState) {
        const container = $('#kiotContainer');
        const isCollapsed = container.hasClass('sidebar-collapsed');
        const shouldCollapse = (typeof forceState === 'boolean') ? forceState : !isCollapsed;

        clearTimeout(animTimer);
        container.addClass('sidebar-animating');
        animTimer = setTimeout(() => {
            container.removeClass('sidebar-animating');
        }, 420);

        if (shouldCollapse) {
            container.addClass('sidebar-collapsed');
            $('#sidebarToggleIcon').removeClass('bi-chevron-left').addClass('bi-chevron-right');
            $('#btnToggleSidebar').attr('title', 'Mở rộng bộ lọc (F4)');
            localStorage.setItem('kiot_sidebar_state', 'collapsed');
        } else {
            container.removeClass('sidebar-collapsed');
            $('#sidebarToggleIcon').removeClass('bi-chevron-right').addClass('bi-chevron-left');
            $('#btnToggleSidebar').attr('title', 'Thu gọn bộ lọc (F4)');
            localStorage.setItem('kiot_sidebar_state', 'expanded');
        }
    }

    if (localStorage.getItem('kiot_sidebar_state') === 'collapsed') {
        toggleSidebar(true);
    }

    $('#btnToggleSidebar').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar();
    });

    let toggleHoverTimer = null;
    $('#sidebarFilterCol, #btnToggleSidebar').on('mouseenter', function () {
        clearTimeout(toggleHoverTimer);
        $('#btnToggleSidebar').addClass('btn-visible');
    }).on('mouseleave', function () {
        clearTimeout(toggleHoverTimer);
        toggleHoverTimer = setTimeout(function () {
            if (!$('#sidebarFilterCol:hover').length && !$('#btnToggleSidebar:hover').length) {
                $('#btnToggleSidebar').removeClass('btn-visible');
            }
        }, 120);
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'F4') {
            e.preventDefault();
            toggleSidebar();
        }
    });

    $('#btnMobileFilter').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('#sidebarFilterCol').addClass('show-mobile');
        $('#sidebarBackdrop').addClass('show');
    });

    function closeMobileSidebar() {
        $('#sidebarFilterCol').removeClass('show-mobile');
        $('#sidebarBackdrop').removeClass('show');
    }

    $('#btnCloseSidebarMobile, #sidebarBackdrop').on('click', function (e) {
        e.preventDefault();
        closeMobileSidebar();
    });

    // Calendar state
    const todayObj = new Date();
    const calState = {
        tgt: {
            currentYear: todayObj.getFullYear(),
            currentMonth: todayObj.getMonth(),
            start: todayObj,
            end: todayObj
        },
        dk: {
            currentYear: todayObj.getFullYear(),
            currentMonth: todayObj.getMonth(),
            start: todayObj,
            end: todayObj
        }
    };

    function renderDualCalendar(target) {
        const y = calState[target].currentYear;
        const m = calState[target].currentMonth;
        renderMonth(target, 1, y, m);
        let y2 = y;
        let m2 = m + 1;
        if (m2 > 11) { m2 = 0; y2++; }
        renderMonth(target, 2, y2, m2);
        updateCalendarHeader(target);
    }

    function renderMonth(target, idx, year, month) {
        const prefix = target === 'tgt' ? '#tgt' : '#dk';
        $(`${prefix}MonthTitle${idx}`).text(`Tháng ${month + 1} ${year}`);
        const tbody = $(`${prefix}CalBody${idx}`).empty();

        const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        let tr = $('<tr>');
        let dayCount = 0;

        for (let i = 0; i < firstDayOfWeek; i++) {
            const d = daysInPrevMonth - firstDayOfWeek + i + 1;
            tr.append(`<td class="text-muted empty-day">${d}</td>`);
            dayCount++;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const curDate = new Date(year, month, day);
            const iso = curDate.getFullYear() + '-' + String(curDate.getMonth() + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            const td = $(`<td class="cal-day" data-target="${target}" data-iso="${iso}">${day}</td>`);

            const s = calState[target].start;
            const e = calState[target].end;
            if (s && e) {
                const curT = new Date(year, month, day).setHours(0,0,0,0);
                const sT = new Date(s).setHours(0,0,0,0);
                const eT = new Date(e).setHours(0,0,0,0);
                if (curT >= sT && curT <= eT) {
                    td.addClass('in-range');
                    if (curT === sT) td.addClass('range-start');
                    if (curT === eT) td.addClass('range-end');
                }
            }

            tr.append(td);
            dayCount++;
            if (dayCount % 7 === 0 || day === daysInMonth) {
                tbody.append(tr);
                tr = $('<tr>');
            }
        }
    }

    function updateCalendarHeader(target) {
        const s = calState[target].start;
        const e = calState[target].end;
        const prefix = target === 'tgt' ? '#tgt' : '#dk';
        if (s && e) {
            $(`${prefix}CalFromText`).text(formatDateVN(s));
            $(`${prefix}CalToText`).text(formatDateVN(e));
        }
    }

    function formatDateVN(date) {
        const d = new Date(date);
        return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    }

    function formatDateISO(date) {
        const d = new Date(date);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    renderDualCalendar('tgt');
    renderDualCalendar('dk');

    // Click ngày trong Calendar
    let selectingStart = true;
    $(document).on('click', '.cal-day', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const target = $(this).data('target');
        const iso = $(this).data('iso');
        const clickedDate = new Date(iso);

        if (selectingStart) {
            calState[target].start = clickedDate;
            calState[target].end = clickedDate;
            selectingStart = false;
        } else {
            if (clickedDate < calState[target].start) {
                calState[target].end = calState[target].start;
                calState[target].start = clickedDate;
            } else {
                calState[target].end = clickedDate;
            }
            selectingStart = true;
        }
        renderDualCalendar(target);
    });

    // Calendar Prev/Next
    $(document).on('click', '.btn-cal-prev', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const target = $(this).data('target');
        calState[target].currentMonth--;
        if (calState[target].currentMonth < 0) {
            calState[target].currentMonth = 11;
            calState[target].currentYear--;
        }
        renderDualCalendar(target);
    });

    $(document).on('click', '.btn-cal-next', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const target = $(this).data('target');
        calState[target].currentMonth++;
        if (calState[target].currentMonth > 11) {
            calState[target].currentMonth = 0;
            calState[target].currentYear++;
        }
        renderDualCalendar(target);
    });

    // Calendar "Hôm nay"
    $(document).on('click', '.btn-cal-today', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const target = $(this).data('target');
        const t = new Date();
        calState[target].currentYear = t.getFullYear();
        calState[target].currentMonth = t.getMonth();
        calState[target].start = t;
        calState[target].end = t;
        renderDualCalendar(target);
    });

    // Calendar "Áp dụng"
    $(document).on('click', '.btn-apply-calendar', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const target = $(this).data('target');
        const s = calState[target].start || new Date();
        const eDate = calState[target].end || s;
        const rangeText = `${formatDateVN(s)} - ${formatDateVN(eDate)}`;

        if (target === 'tgt') {
            $('#popupTgtCalendar').hide();
            $('#tgtCustom').prop('checked', true);
            activeTgTaoVal = 'CUSTOM';
            activeTgTaoFrom = formatDateISO(s);
            activeTgTaoTo = formatDateISO(eDate);
            $('#textTgtRange').text(rangeText);
            $('#textTgtCustom').text(rangeText);
        } else {
            $('#popupDkCalendar').hide();
            $('#dkCustom').prop('checked', true);
            activeDuKienVal = 'CUSTOM';
            $('#textDkRange').text(rangeText);
            $('#textDkCustom').text(rangeText);
        }
        currentPage = 1;
        loadTable();
    });

    function toggleFloatingPopup(triggerElement, popupSelector) {
        const popup = $(popupSelector);
        if (popup.is(':visible')) {
            popup.hide();
            return;
        }
        $('.quick-date-popup, .dual-calendar-popup').hide();

        const trigger = $(triggerElement);
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

    // 2. Mở Quick Date Popups
    $('#btnOpenDkQuick').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('#dkAll').prop('checked', true);
        toggleFloatingPopup(this, '#popupDkQuick');
    });

    $('#labelDkAll').on('click', function (e) {
        if ($(e.target).closest('#btnOpenDkQuick').length) return;
        e.stopPropagation();
        toggleFloatingPopup(this, '#popupDkQuick');
    });

    $('#btnOpenDkCalendar').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('#dkCustom').prop('checked', true);
        toggleFloatingPopup(this, '#popupDkCalendar');
    });

    $('#dkCustom').on('click', function (e) {
        e.stopPropagation();
        toggleFloatingPopup(this, '#popupDkCalendar');
    });

    $('#btnOpenTgtQuick').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('#tgtAll').prop('checked', true);
        toggleFloatingPopup(this, '#popupTgtQuick');
    });

    $('#labelTgtAll').on('click', function (e) {
        if ($(e.target).closest('#btnOpenTgtQuick').length) return;
        e.stopPropagation();
        toggleFloatingPopup(this, '#popupTgtQuick');
    });

    $('#btnOpenTgtCalendar').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('#tgtCustom').prop('checked', true);
        toggleFloatingPopup(this, '#popupTgtCalendar');
    });

    $('#tgtCustom').on('click', function (e) {
        e.stopPropagation();
        toggleFloatingPopup(this, '#popupTgtCalendar');
    });

    $('.kiot-filter-box').on('scroll', function () {
        $('.quick-date-popup, .dual-calendar-popup').hide();
    });

    $('#dkAll').on('change', function () {
        if ($(this).is(':checked')) {
            activeDuKienVal = 'ALL';
            $('#textDkRange').text('Toàn thời gian');
            $('#textDkCustom').text('Tùy chỉnh');
            $('#popupDkQuick .quick-date-btn, #popupDkQuick .quick-date-pill-all').removeClass('active');
            currentPage = 1;
            loadTable();
        }
    });

    $('#tgtAll').on('change', function () {
        if ($(this).is(':checked')) {
            activeTgTaoVal = 'ALL';
            activeTgTaoFrom = '';
            activeTgTaoTo = '';
            $('#textTgtRange').text('Toàn thời gian');
            $('#textTgtCustom').text('Tùy chỉnh');
            $('#popupTgtQuick .quick-date-btn, #popupTgtQuick .quick-date-pill-all').removeClass('active');
            currentPage = 1;
            loadTable();
        }
    });

    $(document).on('click', '.quick-date-btn, .quick-date-pill-all', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const target = $(this).data('target');
        const val = $(this).data('val');
        const text = $(this).text();
        if (target === 'dk') {
            activeDuKienVal = val;
            $('#textDkRange').text(text);
            $('#popupDkQuick').hide();
            $('#dkAll').prop('checked', true);
            $('#popupDkQuick').find('.quick-date-btn, .quick-date-pill-all').removeClass('active');
            $(this).addClass('active');
        } else {
            activeTgTaoVal = val;
            activeTgTaoFrom = '';
            activeTgTaoTo = '';
            $('#textTgtRange').text(text);
            $('#popupTgtQuick').hide();
            $('#tgtAll').prop('checked', true);
            $('#popupTgtQuick').find('.quick-date-btn, .quick-date-pill-all').removeClass('active');
            $(this).addClass('active');
        }
        currentPage = 1;
        loadTable();
    });

    $(document).on('click', '.btn-close-popup', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        $('.dual-calendar-popup').hide();
    });

    // 3. Multi-select Tags Dropdown
    const filterState = {
        nhom: [],
        ncc: [],
        vitri: [],
        loaihang: []
    };

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    const filterPlaceholders = {
        nhom: 'Chọn nhóm hàng',
        ncc: 'Chọn nhà cung cấp',
        vitri: 'Chọn vị trí',
        loaihang: 'Chọn loại hàng'
    };

    const filterDotSelectors = {
        nhom: '#dotNhomHang',
        ncc: '#dotNcc',
        vitri: '#dotViTri',
        loaihang: '#dotLoaiHang'
    };

    function renderMultiSelectBox(key) {
        const boxId = key === 'nhom' ? '#boxNhomHang' :
                      key === 'ncc' ? '#boxNcc' :
                      key === 'vitri' ? '#boxViTri' : '#boxLoaiHang';
        const dropdownId = key === 'nhom' ? '#dropdownNhomHang' :
                           key === 'ncc' ? '#dropdownNcc' :
                           key === 'vitri' ? '#dropdownViTri' : '#dropdownLoaiHang';

        const box = $(boxId);
        const dropdown = $(dropdownId);
        const selected = filterState[key] || [];
        const placeholder = filterPlaceholders[key];
        const dot = $(filterDotSelectors[key]);

        dot.css('display', selected.length > 0 ? 'inline-block' : 'none');

        dropdown.find('.kiot-ms-item').each(function () {
            const val = String($(this).data('val'));
            const isSel = selected.some(x => String(x.val) === val);
            $(this).toggleClass('selected', isSel);
            $(this).find('input[type="checkbox"]').prop('checked', isSel);
        });

        if (selected.length === 0) {
            box.html(`<span class="kiot-ms-placeholder">${placeholder}</span>`);
            return;
        }

        let html = '';
        const maxVisible = 3;

        if (selected.length <= maxVisible) {
            selected.forEach(item => {
                html += `
                    <span class="kiot-pill-tag" data-val="${escapeHtml(item.val)}">
                        <span class="tag-text">${escapeHtml(item.name)}</span>
                        <span class="tag-remove" title="Bỏ chọn">&times;</span>
                    </span>
                `;
            });
        } else {
            for (let i = 0; i < maxVisible; i++) {
                const item = selected[i];
                html += `
                    <span class="kiot-pill-tag" data-val="${escapeHtml(item.val)}">
                        <span class="tag-text">${escapeHtml(item.name)}</span>
                        <span class="tag-remove" title="Bỏ chọn">&times;</span>
                    </span>
                `;
            }
            const remaining = selected.length - maxVisible;
            const otherNames = selected.slice(maxVisible).map(x => x.name).join(', ');
            html += `
                <span class="kiot-pill-more" title="${escapeHtml(otherNames)}">+${remaining} khác</span>
            `;
        }

        box.html(html);
    }

    function checkSidebarDropdownDirection(box, dropdown) {
        if (!box.length || !dropdown.length) return;

        const boxRect = box[0].getBoundingClientRect();
        const filterBox = box.closest('.kiot-filter-box');
        
        let containerBottom = $(window).height();
        let containerTop = 0;

        if (filterBox.length) {
            const filterRect = filterBox[0].getBoundingClientRect();
            containerBottom = Math.min(filterRect.bottom, $(window).height());
            containerTop = Math.max(filterRect.top, 0);
        }

        const spaceBelow = containerBottom - boxRect.bottom;
        const spaceAbove = boxRect.top - containerTop;
        const neededHeight = 220;

        if (spaceBelow < neededHeight && spaceAbove > spaceBelow) {
            dropdown.addClass('drop-up');
            const maxH = Math.min(250, Math.max(120, spaceAbove - 10));
            dropdown.css('max-height', maxH + 'px');
        } else {
            dropdown.removeClass('drop-up');
            const maxH = Math.min(250, Math.max(120, spaceBelow - 10));
            dropdown.css('max-height', maxH + 'px');
        }
    }

    function setupMultiSelect(boxId, dropdownId, key) {
        const box = $(boxId);
        const dropdown = $(dropdownId);

        box.on('click', function (e) {
            if ($(e.target).closest('.tag-remove').length) return;
            e.stopPropagation();
            $('.kiot-ms-dropdown').not(dropdown).removeClass('show drop-up').css('max-height', '');
            $('.kiot-multiselect-box').not(box).removeClass('open');
            $('.quick-date-popup, .dual-calendar-popup').hide();

            const willShow = !dropdown.hasClass('show');
            if (willShow) {
                checkSidebarDropdownDirection(box, dropdown);
                dropdown.addClass('show');
                box.addClass('open');
                dropdown.find('.kiot-ms-search input').focus();
            } else {
                dropdown.removeClass('show drop-up').css('max-height', '');
                box.removeClass('open');
            }
        });

        box.on('click', '.tag-remove', function (e) {
            e.stopPropagation();
            const val = String($(this).closest('.kiot-pill-tag').data('val'));
            filterState[key] = (filterState[key] || []).filter(x => String(x.val) !== val);
            renderMultiSelectBox(key);
            currentPage = 1;
            loadTable();
        });

        box.on('click', '.kiot-pill-more', function (e) {
            e.stopPropagation();
            $('.kiot-ms-dropdown').not(dropdown).removeClass('show drop-up').css('max-height', '');
            checkSidebarDropdownDirection(box, dropdown);
            dropdown.addClass('show');
            box.addClass('open');
        });

        dropdown.on('click', '.kiot-ms-item', function (e) {
            e.stopPropagation();
            const val = String($(this).data('val'));
            const name = $(this).data('name') || $(this).text().trim();
            const idx = (filterState[key] || []).findIndex(x => String(x.val) === val);

            if (idx >= 0) {
                filterState[key].splice(idx, 1);
            } else {
                filterState[key].push({ val: val, name: name });
            }

            renderMultiSelectBox(key);
            currentPage = 1;
            loadTable();
        });

        dropdown.find('.kiot-ms-search input').on('input', function (e) {
            e.stopPropagation();
            const term = $(this).val().trim().toLowerCase();
            dropdown.find('.kiot-ms-item').each(function () {
                const text = ($(this).data('name') || $(this).text()).toLowerCase();
                if (!term || text.includes(term)) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        });
    }

    setupMultiSelect('#boxNhomHang', '#dropdownNhomHang', 'nhom');
    setupMultiSelect('#boxNcc', '#dropdownNcc', 'ncc');
    setupMultiSelect('#boxViTri', '#dropdownViTri', 'vitri');
    setupMultiSelect('#boxLoaiHang', '#dropdownLoaiHang', 'loaihang');

    renderMultiSelectBox('nhom');
    renderMultiSelectBox('ncc');
    renderMultiSelectBox('vitri');
    renderMultiSelectBox('loaihang');

    // Single-select Tiêu chí tồn
    $('#boxTonKho').on('click', function (e) {
        e.stopPropagation();
        const box = $(this);
        const dropdown = $('#dropdownTonKho');

        $('.kiot-ms-dropdown, .kiot-ss-dropdown').not(dropdown).removeClass('show drop-up').css('max-height', '');
        $('.kiot-multiselect-box, .kiot-single-select-box').not(box).removeClass('open');
        $('.quick-date-popup, .dual-calendar-popup').hide();

        const willShow = !dropdown.hasClass('show');
        if (willShow) {
            checkSidebarDropdownDirection(box, dropdown);
            dropdown.addClass('show');
            box.addClass('open');
        } else {
            dropdown.removeClass('show drop-up').css('max-height', '');
            box.removeClass('open');
        }
    });

    $('#dropdownTonKho').on('click', '.kiot-ss-item', function (e) {
        e.stopPropagation();
        const val = $(this).data('val');
        const text = $(this).find('span').text().trim();

        $('#textTonKho').text(text);
        $('#dropdownTonKho .kiot-ss-item').removeClass('selected');
        $(this).addClass('selected');

        $('#dropdownTonKho').removeClass('show drop-up').css('max-height', '');
        $('#boxTonKho').removeClass('open');

        $('#filterTonKho').val(val).trigger('change');
    });

    $('.kiot-filter-box').on('scroll', function () {
        const openDropdown = $('.kiot-ms-dropdown.show, .kiot-ss-dropdown.show');
        if (openDropdown.length) {
            const box = openDropdown.siblings('.kiot-multiselect-box, .kiot-single-select-box');
            if (box.length) {
                checkSidebarDropdownDirection(box, openDropdown);
            }
        }
    });

    $(document).on('click', function (e) {
        if (!document.contains(e.target)) return;
        if ($(e.target).closest('.dual-calendar-popup, .quick-date-popup').length) return;

        const $targetBlock = $(e.target).closest('.f-block');
        if (!$targetBlock.length) {
            $('.quick-date-popup').hide();
            $('.dual-calendar-popup').hide();
            $('.kiot-ms-dropdown, .kiot-ss-dropdown').removeClass('show drop-up').css('max-height', '');
            $('.kiot-multiselect-box, .kiot-single-select-box').removeClass('open');
        } else {
            $('.dual-calendar-popup').not($targetBlock.find('.dual-calendar-popup')).hide();
            $('.quick-date-popup').not($targetBlock.find('.quick-date-popup')).hide();
            $('.kiot-ms-dropdown, .kiot-ss-dropdown').not($targetBlock.find('.kiot-ms-dropdown, .kiot-ss-dropdown')).removeClass('show drop-up').css('max-height', '');
            $('.kiot-multiselect-box, .kiot-single-select-box').not($targetBlock.find('.kiot-multiselect-box, .kiot-single-select-box')).removeClass('open');
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            $('.kiot-ms-dropdown, .kiot-ss-dropdown').removeClass('show drop-up').css('max-height', '');
            $('.kiot-multiselect-box, .kiot-single-select-box').removeClass('open');
            $('.quick-date-popup, .dual-calendar-popup').hide();
        }
    });

    // 4. Modal Tạo nhanh Nhóm hàng
    $('#btnOpenQuickGroupModal').on('click', function () {
        $('#quickGroupInput').val('');
        if (groupModal) groupModal.show();
        setTimeout(() => $('#quickGroupInput').focus(), 300);
    });

    $('#btnSaveQuickGroup').on('click', function () {
        const name = $('#quickGroupInput').val().trim();
        if (!name) {
            alert('Vui lòng nhập tên nhóm hàng.');
            return;
        }

        $.ajax({
            url: '/HangHoa/CreateGroupQuick',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ tenNhom: name }),
            success: function (res) {
                if (groupModal) groupModal.hide();
                $('#formMaNhom').append(`<option value="${res.maNhom}">${res.tenNhom}</option>`);

                const itemHtml = `<div class="kiot-ms-item selected" data-val="${res.maNhom}" data-name="${res.tenNhom}">
                    <input type="checkbox" class="form-check-input" checked />
                    <span>${res.tenNhom}</span>
                </div>`;
                $('#dropdownNhomHang').append(itemHtml);

                filterState.nhom.push({ val: String(res.maNhom), name: res.tenNhom });
                renderMultiSelectBox('nhom');
                currentPage = 1;
                loadTable();
            },
            error: function (xhr) {
                alert('Lỗi: ' + (xhr.responseJSON?.message || 'Không thể tạo nhóm.'));
            }
        });
    });

    // Phím tắt F3
    $(document).on('keydown', function (e) {
        if (e.key === 'F3') {
            e.preventDefault();
            $('#keywordSearch').focus().select();
        }
    });

    $('#btnOpenCreateModal').on('click', function () {
        if (typeof window.openCreateProductModal === 'function') {
            window.openCreateProductModal();
        }
    });

    // Mở modal Sửa
    $(document).on('click', '.btn-edit-product', function () {
        const id = $(this).data('id');
        if (typeof window.openEditProductModal === 'function') {
            window.openEditProductModal(id);
        }
    });

    // Modal Xóa
    $(document).on('click', '.btn-delete-product', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        const name = $(this).data('name') || '';
        if (typeof window.openDeleteProductModal === 'function') {
            window.openDeleteProductModal(id, name);
        }
    });

    // Tìm kiếm Debounce
    let searchTimeout = null;
    $('#keywordSearch').on('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
            currentPage = 1;
            loadTable();
        }, 300);
    }).on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            currentPage = 1;
            loadTable();
        }
    });

    $('.filter-change').on('change', function () {
        currentPage = 1;
        loadTable();
    });

    $('#btnReloadTable').on('click', function () {
        loadTable();
    });

    // Phân trang AJAX
    $(document).on('click', '.page-ajax', function (e) {
        e.preventDefault();
        const p = $(this).data('page');
        if (p && p > 0) {
            currentPage = p;
            loadTable();
        }
    });

    // Checkbox chọn tất cả
    $(document).on('change', '#selectAllRows', function () {
        $('.row-select').prop('checked', $(this).is(':checked'));
    });

    // Inline Accordion chi tiết hàng hóa
    $(document).on('click', '.product-row', function (e) {
        if ($(e.target).closest('input[type="checkbox"], .star-btn, button, a.btn-delete-product').length) {
            return;
        }

        const id = $(this).data('id');
        const $detailRow = $('#detail-' + id);
        const $wrap = $detailRow.find('.product-detail-panel-wrap');
        const isCurrentlyOpen = $detailRow.is(':visible');

        $('.product-detail-row').not($detailRow).each(function () {
            const $other = $(this);
            $other.find('.product-detail-panel-wrap').slideUp(150, function () {
                $other.hide();
            });
        });
        $('.product-row').not(this).removeClass('selected');

        if (isCurrentlyOpen) {
            $wrap.slideUp(150, function () {
                $detailRow.hide();
            });
            $(this).removeClass('selected');
        } else {
            $(this).addClass('selected');
            $detailRow.show();
            $wrap.hide().slideDown(150);
        }
    });

    // Chuyển Tab chi tiết
    $(document).on('click', '.product-detail-tab-btn', function (e) {
        e.stopPropagation();
        const tabName = $(this).data('tab');
        const $panel = $(this).closest('.product-detail-panel');

        $panel.find('.product-detail-tab-btn').removeClass('active');
        $(this).addClass('active');

        $panel.find('.tab-pane-content').hide();
        $panel.find('.tab-' + tabName).fadeIn(120);
    });

    // Sao chép hàng hóa
    $(document).on('click', '.btn-copy-product', function (e) {
        e.stopPropagation();
        const id = $(this).data('id');
        if (typeof window.openEditProductModal === 'function') {
            window.openEditProductModal(id, true);
        }
    });

    // Toggle Star
    window.toggleFavoriteProduct = function (e, id, el) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const $cell = $(el);
        const $btn = $cell.hasClass('star-btn') ? $cell : $cell.find('.star-btn');
        if (!$btn.length || !id) return;

        $.ajax({
            url: '/HangHoa/ToggleFavorite',
            type: 'POST',
            data: { id: id },
            success: function (res) {
                if (res && res.success) {
                    if (res.isFavorite) {
                        $btn.addClass('starred')
                            .attr('title', 'Bỏ đánh dấu sao')
                            .html('<i class="bi bi-star-fill"></i>');
                    } else {
                        $btn.removeClass('starred')
                            .attr('title', 'Đánh dấu sao')
                            .html('<i class="bi bi-star"></i>');

                        if (isStarredFilterActive) {
                            const $tr = $btn.closest('tr');
                            const $detail = $('#detail-' + id);
                            $detail.remove();
                            $tr.fadeOut(250, function () {
                                $(this).remove();
                                if ($('#productTable tbody tr.product-row').length === 0) {
                                    loadTable();
                                }
                            });
                        }
                    }
                }
            },
            error: function (xhr) {
                console.error('Lỗi khi cập nhật đánh dấu sao:', xhr);
                alert('Có lỗi khi cập nhật đánh dấu sao.');
            }
        });
    };

    window.toggleStarHeaderFilter = function (e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        isStarredFilterActive = !isStarredFilterActive;
        currentPage = 1;
        loadTable();
    };

    $(document).on('click', '.star-btn:not(#starHeaderFilter)', function (e) {
        const id = $(this).data('id');
        window.toggleFavoriteProduct(e, id, this);
    });

    $(document).on('click', '#starHeaderFilter', function (e) {
        window.toggleStarHeaderFilter(e);
    });

    // Sắp xếp cột 3 trạng thái
    $(document).on('click', '#productTable thead th.sortable-th', function (e) {
        e.preventDefault();
        const col = $(this).data('col');
        if (!col) return;

        if (currentSortBy === col) {
            if (currentSortDir === 'asc') {
                currentSortDir = 'desc';
            } else if (currentSortDir === 'desc') {
                currentSortBy = '';
                currentSortDir = '';
            } else {
                currentSortDir = 'asc';
            }
        } else {
            currentSortBy = col;
            currentSortDir = 'asc';
        }

        currentPage = 1;
        loadTable();
    });

    function loadTable() {
        const q = $('#keywordSearch').val()?.trim() || '';
        const nhom = (filterState.nhom || []).map(x => x.val).join(',');
        const tonKho = $('#filterTonKho').val() || 'ALL';
        const nhaCungCap = (filterState.ncc || []).map(x => x.val).join(';');
        const viTri = (filterState.vitri || []).map(x => x.val).join(';');
        const loaiHang = (filterState.loaihang || []).map(x => x.val).join(';');

        let duKien = activeDuKienVal || 'ALL';
        if ($('#dkCustom').is(':checked') && duKien === 'ALL') {
            duKien = 'CUSTOM';
        }

        let tgTao = activeTgTaoVal || 'ALL';
        let tgTaoFrom = '';
        let tgTaoTo = '';
        if ($('#tgtCustom').is(':checked')) {
            tgTao = 'CUSTOM';
            tgTaoFrom = activeTgTaoFrom;
            tgTaoTo = activeTgTaoTo;
        }

        $('#dotNhomHang').css('display', filterState.nhom.length > 0 ? 'inline-block' : 'none');
        $('#dotTonKho').css('display', tonKho !== 'ALL' ? 'inline-block' : 'none');
        $('#dotDuKien').css('display', duKien !== 'ALL' ? 'inline-block' : 'none');
        $('#dotTgTao').css('display', tgTao !== 'ALL' ? 'inline-block' : 'none');
        $('#dotNcc').css('display', filterState.ncc.length > 0 ? 'inline-block' : 'none');
        $('#dotViTri').css('display', filterState.vitri.length > 0 ? 'inline-block' : 'none');
        $('#dotLoaiHang').css('display', filterState.loaihang.length > 0 ? 'inline-block' : 'none');

        const hasAnyActiveFilter = filterState.nhom.length > 0 || tonKho !== 'ALL' || duKien !== 'ALL' || tgTao !== 'ALL' || filterState.ncc.length > 0 || filterState.vitri.length > 0 || filterState.loaihang.length > 0;
        $('#btnMobileFilter').toggleClass('has-filter', hasAnyActiveFilter);

        $.ajax({
            url: '/HangHoa/Filter',
            type: 'GET',
            data: {
                q: q,
                nhom: nhom,
                tonKhoFilter: tonKho,
                nhaCungCap: nhaCungCap,
                viTri: viTri,
                loaiHang: loaiHang,
                duKienFilter: duKien,
                tgTaoFilter: tgTao,
                tgTaoFrom: tgTaoFrom,
                tgTaoTo: tgTaoTo,
                daDanhDau: isStarredFilterActive,
                sortBy: currentSortBy,
                sortDir: currentSortDir,
                page: currentPage
            },
            beforeSend: function () {
                $('#productTableContainer').css('opacity', '0.6');
            },
            success: function (html) {
                $('#productTableContainer').html(html).css('opacity', '1');
            },
            error: function () {
                $('#productTableContainer').css('opacity', '1');
                alert('Có lỗi khi tải danh sách hàng hóa.');
            }
        });
    }

    window.getCurrentFilterParams = function () {
        const q = $('#keywordSearch').val()?.trim() || '';
        const nhom = (filterState.nhom || []).map(x => x.val).join(',');
        const tonKho = $('#filterTonKho').val() || 'ALL';
        const nhaCungCap = (filterState.ncc || []).map(x => x.val).join(';');
        const viTri = (filterState.vitri || []).map(x => x.val).join(';');
        const loaiHang = (filterState.loaihang || []).map(x => x.val).join(';');

        let duKien = activeDuKienVal || 'ALL';
        if ($('#dkCustom').is(':checked') && duKien === 'ALL') {
            duKien = 'CUSTOM';
        }

        let tgTao = activeTgTaoVal || 'ALL';
        let tgTaoFrom = '';
        let tgTaoTo = '';
        if ($('#tgtCustom').is(':checked')) {
            tgTao = 'CUSTOM';
            tgTaoFrom = activeTgTaoFrom;
            tgTaoTo = activeTgTaoTo;
        }

        return {
            q: q,
            nhom: nhom,
            tonKho: tonKho,
            nhaCungCap: nhaCungCap,
            viTri: viTri,
            loaiHang: loaiHang,
            duKien: duKien,
            tgTao: tgTao,
            tgTaoFrom: tgTaoFrom,
            tgTaoTo: tgTaoTo,
            daDanhDau: isStarredFilterActive
        };
    };

    window.loadTable = loadTable;
});
