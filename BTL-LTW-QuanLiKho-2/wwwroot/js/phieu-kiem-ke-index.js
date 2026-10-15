/**
 * phieu-kiem-ke-index.js - Quản lý tương tác màn hình danh sách phiếu kiểm kho
 * Chuẩn hóa 100% theo khuôn mẫu LEGO KiotViet của module Danh sách hàng hóa
 */
(function () {
    'use strict';

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const app = $('#kiotContainer') || $('#kkIndexApp');
    if (!app) return;

    const filterUrl = app.dataset.filterUrl;
    const noteUrl = app.dataset.noteUrl;
    const cancelUrl = app.dataset.cancelUrl;
    const exportUrl = app.dataset.exportUrl;
    let currentWhId = parseInt(app.dataset.warehouseId) || 0;

    // Trạng thái bộ lọc
    const F = {
        q: '',
        mode: 'preset',
        preset: 'thangnay',
        from: null,
        to: null,
        statuses: ['NHAP', 'DA_DIEU_CHINH'],
        creatorIds: [],
        creatorNames: {},
        page: 1,
        size: 15,
        cols: { ma: 1, tg: 1, tt: 1, cl: 1, tang: 1, giam: 1, cb: 1, slt: 1, ghi: 1, st: 1, kho: 1 },
        collapsed: false,
        openId: null
    };

    /* ===== PRESETS KHOẢNG NGÀY ===== */
    const PRESETS = [
        ['Theo ngày', [['homnay', 'Hôm nay'], ['homqua', 'Hôm qua']]],
        ['Theo tuần', [['tuannay', 'Tuần này'], ['tuantruoc', 'Tuần trước'], ['7ngay', '7 ngày qua']]],
        ['Theo tháng', [['thangnay', 'Tháng này'], ['thangtruoc', 'Tháng trước'], ['30ngay', '30 ngày qua']]],
        ['Theo quý', [['quynay', 'Quý này'], ['quytruoc', 'Quý trước']]],
        ['Theo năm', [['namnay', 'Năm nay'], ['namtruoc', 'Năm trước']]],
        ['Toàn bộ', [['toanthoigian', 'Toàn thời gian']]]
    ];

    const p2 = n => String(n).padStart(2, '0');
    const formatDateVN = d => {
        const dt = new Date(d);
        return `${p2(dt.getDate())}/${p2(dt.getMonth() + 1)}/${dt.getFullYear()}`;
    };
    const sod = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const eod = d => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    const addD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

    function presetRange(k) {
        const now = new Date(), t = sod(now), y = t.getFullYear(), m = t.getMonth(), dow = (t.getDay() + 6) % 7, q = Math.floor(m / 3);
        switch (k) {
            case 'homnay': return [t, eod(t)];
            case 'homqua': return [addD(t, -1), eod(addD(t, -1))];
            case 'tuannay': return [addD(t, -dow), eod(addD(t, 6 - dow))];
            case 'tuantruoc': return [addD(t, -dow - 7), eod(addD(t, -dow - 1))];
            case '7ngay': return [addD(t, -6), eod(t)];
            case 'thangnay': return [new Date(y, m, 1), eod(new Date(y, m + 1, 0))];
            case 'thangtruoc': return [new Date(y, m - 1, 1), eod(new Date(y, m, 0))];
            case '30ngay': return [addD(t, -29), eod(t)];
            case 'quynay': return [new Date(y, q * 3, 1), eod(new Date(y, q * 3 + 3, 0))];
            case 'quytruoc': return [new Date(y, q * 3 - 3, 1), eod(new Date(y, q * 3, 0))];
            case 'namnay': return [new Date(y, 0, 1), eod(new Date(y, 11, 31))];
            case 'namtruoc': return [new Date(y - 1, 0, 1), eod(new Date(y - 1, 11, 31))];
            case 'toanthoigian': return [new Date(2000, 0, 1), new Date(y + 10, 11, 31)];
            default: return [new Date(y, m, 1), eod(new Date(y, m + 1, 0))];
        }
    }

    function presetLabel(k) {
        if (k === 'toanthoigian') return 'Toàn thời gian';
        for (const g of PRESETS) {
            for (const p of g[1]) {
                if (p[0] === k) return p[1];
            }
        }
        return 'Tháng này';
    }

    function getActiveRange() {
        if (F.mode === 'preset') return presetRange(F.preset);
        return [sod(F.from || new Date()), eod(F.to || F.from || new Date())];
    }

    /* ===== FLOATING POPUP ĐỊNH VỊ FIXED (CHUẨN HÀNG HÓA) ===== */
    function toggleFloatingPopup(triggerElement, popupSelector) {
        const popup = $(popupSelector);
        if (!popup) return;
        const isVisible = popup.style.display === 'block';
        $$('.quick-date-popup, .dual-calendar-popup').forEach(p => p.style.display = 'none');
        if (isVisible) return;

        const rect = triggerElement.getBoundingClientRect();
        const popupWidth = popupSelector.includes('Calendar') ? 540 : 330;

        let left = rect.left;
        let top = rect.bottom + 6;

        const maxRight = window.innerWidth - 10;
        if (left + popupWidth > maxRight) {
            left = maxRight - popupWidth;
        }
        if (left < 10) left = 10;

        const popupHeight = 320;
        if (top + popupHeight > window.innerHeight - 10) {
            top = Math.max(10, rect.top - popupHeight - 6);
        }

        popup.style.position = 'fixed';
        popup.style.top = top + 'px';
        popup.style.left = left + 'px';
        popup.style.zIndex = '1060';
        popup.style.display = 'block';
    }

    /* ===== LỊCH TÙY CHỈNH 2 THÁNG (DUAL CALENDAR) ===== */
    const todayObj = new Date();
    const calState = {
        currentYear: todayObj.getFullYear(),
        currentMonth: todayObj.getMonth(),
        start: todayObj,
        end: todayObj
    };

    function renderDualCalendar() {
        const y = calState.currentYear;
        const m = calState.currentMonth;
        renderCalMonth(1, y, m);
        let y2 = y;
        let m2 = m + 1;
        if (m2 > 11) { m2 = 0; y2++; }
        renderCalMonth(2, y2, m2);
        updateCalendarHeader();
    }

    function renderCalMonth(idx, year, month) {
        const titleEl = $(`#calMonthTitle${idx}`);
        if (titleEl) titleEl.textContent = `Tháng ${month + 1} ${year}`;
        const tbody = $(`#calBody${idx}`);
        if (!tbody) return;
        tbody.innerHTML = '';

        const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        let tr = document.createElement('tr');
        let dayCount = 0;

        for (let i = 0; i < firstDayOfWeek; i++) {
            const d = daysInPrevMonth - firstDayOfWeek + i + 1;
            const td = document.createElement('td');
            td.className = 'text-muted empty-day';
            td.textContent = d;
            tr.appendChild(td);
            dayCount++;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const curDate = new Date(year, month, day);
            const iso = curDate.getFullYear() + '-' + p2(curDate.getMonth() + 1) + '-' + p2(day);
            const td = document.createElement('td');
            td.className = 'cal-day';
            td.dataset.iso = iso;
            td.textContent = day;

            const s = calState.start;
            const e = calState.end;
            if (s && e) {
                const curT = new Date(year, month, day).setHours(0, 0, 0, 0);
                const sT = new Date(s).setHours(0, 0, 0, 0);
                const eT = new Date(e).setHours(0, 0, 0, 0);
                if (curT >= sT && curT <= eT) {
                    td.classList.add('selected');
                }
            }

            tr.appendChild(td);
            dayCount++;
            if (dayCount % 7 === 0 || day === daysInMonth) {
                tbody.appendChild(tr);
                tr = document.createElement('tr');
            }
        }
    }

    function updateCalendarHeader() {
        const s = calState.start;
        const e = calState.end;
        if (s && e) {
            const fromText = $('#calFromText'), toText = $('#calToText');
            if (fromText) fromText.textContent = formatDateVN(s);
            if (toText) toText.textContent = formatDateVN(e);
        }
    }

    /* ===== TIỆN ÍCH ESCAPE & ĐỊNH HƯỚNG DROPDOWN ===== */
    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function checkSidebarDropdownDirection(box, dropdown) {
        if (!box || !dropdown) return;
        const boxRect = box.getBoundingClientRect();
        const filterBox = box.closest('.kiot-filter-box');

        let containerBottom = window.innerHeight;
        let containerTop = 0;

        if (filterBox) {
            const filterRect = filterBox.getBoundingClientRect();
            containerBottom = Math.min(filterRect.bottom, window.innerHeight);
            containerTop = Math.max(filterRect.top, 0);
        }

        const spaceBelow = containerBottom - boxRect.bottom;
        const spaceAbove = boxRect.top - containerTop;
        const neededHeight = 220;

        if (spaceBelow < neededHeight && spaceAbove > spaceBelow) {
            dropdown.classList.add('drop-up');
            const maxH = Math.min(250, Math.max(120, spaceAbove - 10));
            dropdown.style.maxHeight = maxH + 'px';
        } else {
            dropdown.classList.remove('drop-up');
            const maxH = Math.min(250, Math.max(120, spaceBelow - 10));
            dropdown.style.maxHeight = maxH + 'px';
        }
    }

    function renderCreatorMultiSelect() {
        const box = $('#boxNguoiTao');
        const dropdown = $('#dropdownNguoiTao');
        if (!box || !dropdown) return;

        const selectedIds = F.creatorIds || [];
        const dot = $('#dotUser');
        if (dot) {
            dot.style.display = selectedIds.length > 0 ? 'inline-block' : 'none';
        }

        $$('.kiot-ms-item', dropdown).forEach(item => {
            const val = parseInt(item.dataset.val);
            const isSel = selectedIds.includes(val);
            item.classList.toggle('selected', isSel);
            const chk = $('input[type="checkbox"]', item);
            if (chk) chk.checked = isSel;
        });

        if (selectedIds.length === 0) {
            box.innerHTML = '<span class="kiot-ms-placeholder">Chọn người tạo</span>';
            return;
        }

        let html = '';
        const maxVisible = 3;

        if (selectedIds.length <= maxVisible) {
            selectedIds.forEach(id => {
                const name = F.creatorNames[id] || ('NV ' + id);
                html += `
                    <span class="kiot-pill-tag" data-val="${id}">
                        <span class="tag-text">${escapeHtml(name)}</span>
                        <span class="tag-remove" title="Bỏ chọn">&times;</span>
                    </span>
                `;
            });
        } else {
            for (let i = 0; i < maxVisible; i++) {
                const id = selectedIds[i];
                const name = F.creatorNames[id] || ('NV ' + id);
                html += `
                    <span class="kiot-pill-tag" data-val="${id}">
                        <span class="tag-text">${escapeHtml(name)}</span>
                        <span class="tag-remove" title="Bỏ chọn">&times;</span>
                    </span>
                `;
            }
            const remaining = selectedIds.length - maxVisible;
            const otherNames = selectedIds.slice(maxVisible).map(id => F.creatorNames[id] || ('NV ' + id)).join(', ');
            html += `
                <span class="kiot-pill-more" title="${escapeHtml(otherNames)}">+${remaining} khác</span>
            `;
        }

        box.innerHTML = html;
    }

    /* ===== CẬP NHẬT GIAO DIỆN BỘ LỌC ===== */
    function paintFilters() {
        const rdP = $('#rdPreset'), rdC = $('#rdCustom');
        if (rdP) rdP.checked = F.mode === 'preset';
        if (rdC) rdC.checked = F.mode === 'custom';

        const pTxt = $('#presetTxt'), cTxt = $('#customTxt');
        if (pTxt) pTxt.textContent = F.mode === 'preset' ? presetLabel(F.preset) : 'Tháng này';
        const [a, b] = getActiveRange();
        if (cTxt) cTxt.textContent = F.mode === 'custom' ? `${formatDateVN(a)} - ${formatDateVN(b)}` : 'Tùy chỉnh';

        $('#dotDate')?.classList.toggle('on', !(F.mode === 'preset' && F.preset === 'thangnay'));
        $('#dotSt')?.classList.toggle('on', !(F.statuses.length === 2 && F.statuses.includes('NHAP') && F.statuses.includes('DA_DIEU_CHINH')));
        $('#dotUser')?.classList.toggle('on', F.creatorIds.length > 0);

        // Active state cho nút trong popupQuickDate
        $$('#popupQuickDate .quick-date-btn, #popupQuickDate .quick-date-pill-all').forEach(btn => {
            btn.classList.toggle('active', F.mode === 'preset' && btn.dataset.val === F.preset);
        });

        // Render box người tạo chuẩn KiotViet
        renderCreatorMultiSelect();
    }

    /* ===== NẠP BẢNG DỮ LIỆU BẰNG AJAX ===== */
    let searchTimer = null;
    function loadTable() {
        const [a, b] = getActiveRange();
        const params = new URLSearchParams();

        if (F.q.trim()) params.append('Q', F.q.trim());
        params.append('DateFilterType', F.mode === 'preset' ? F.preset.toUpperCase() : 'CUSTOM');
        params.append('FromDate', a.toISOString());
        params.append('ToDate', b.toISOString());

        F.statuses.forEach(s => params.append('Statuses', s));
        F.creatorIds.forEach(id => params.append('CreatorIds', id));

        params.append('Page', F.page);
        params.append('PageSize', F.size);

        fetch(`${filterUrl}?${params.toString()}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(res => res.text())
        .then(html => {
            const wrap = $('#tableWrapper');
            if (wrap) wrap.innerHTML = html;
            applyColumnVisibility();
            bindTableEvents();
        })
        .catch(err => {
            console.error('Lỗi khi tải bảng kiểm kho:', err);
            toast('Không thể tải dữ liệu bảng kiểm kho.');
        });
    }

    function applyColumnVisibility() {
        for (const [col, show] of Object.entries(F.cols)) {
            $$(`[data-col="${col}"]`).forEach(el => {
                el.style.display = show ? '' : 'none';
            });
        }
    }

    /* ===== SỰ KIỆN THANH CÔNG CỤ & SIDEBAR ===== */
    function bindSidebarEvents() {
        // Tìm kiếm nhanh mã phiếu (Debounce 300ms)
        const sInp = $('#keywordSearch') || $('#q');
        if (sInp) {
            sInp.addEventListener('input', e => {
                clearTimeout(searchTimer);
                F.q = e.target.value;
                searchTimer = setTimeout(() => {
                    F.page = 1;
                    loadTable();
                }, 300);
            });
        }

        // Phím tắt F3 focus vào ô tìm kiếm
        document.addEventListener('keydown', e => {
            if (e.key === 'F3') {
                e.preventDefault();
                sInp?.focus();
            } else if (e.key === 'F4') {
                e.preventDefault();
                toggleSidebar();
            }
        });

        // Toggle Sidebar KiotViet
        const toggleBtn = $('#btnToggleSidebar');
        function toggleSidebar() {
            const container = $('#kiotContainer');
            if (container) {
                container.classList.toggle('sidebar-collapsed');
                const isCollapsed = container.classList.contains('sidebar-collapsed');
                const icon = $('#sidebarToggleIcon');
                if (icon) {
                    icon.classList.toggle('bi-chevron-right', isCollapsed);
                    icon.classList.toggle('bi-chevron-left', !isCollapsed);
                }
            }
        }
        if (toggleBtn) toggleBtn.onclick = toggleSidebar;

        // Mobile Sidebar Filter Drawer
        const btnMob = $('#btnMobileFilter'), btnCloseMob = $('#btnCloseSidebarMobile'), backdrop = $('#sidebarBackdrop');
        if (btnMob) {
            btnMob.onclick = () => {
                $('#sidebarFilterCol')?.classList.add('show-mobile');
                backdrop?.classList.add('show');
            };
        }
        const closeMobileFilter = () => {
            $('#sidebarFilterCol')?.classList.remove('show-mobile');
            backdrop?.classList.remove('show');
        };
        if (btnCloseMob) btnCloseMob.onclick = closeMobileFilter;
        if (backdrop) backdrop.onclick = closeMobileFilter;

        // Nút Reload bảng
        const btnReload = $('#btnReloadTable');
        if (btnReload) {
            btnReload.onclick = () => {
                btnReload.classList.add('spinning');
                loadTable();
                setTimeout(() => btnReload.classList.remove('spinning'), 600);
            };
        }

        // Xuất file
        const btnExpList = $('#btnExpList');
        if (btnExpList) {
            btnExpList.onclick = () => triggerExport('list');
        }
        const btnExpDetail = $('#btnExpDetail');
        if (btnExpDetail) {
            btnExpDetail.onclick = () => triggerExport('detail');
        }

        function triggerExport(type) {
            const [a, b] = getActiveRange();
            const p = new URLSearchParams();
            p.append('type', type);
            if (F.q.trim()) p.append('Q', F.q.trim());
            p.append('DateFilterType', F.mode === 'preset' ? F.preset.toUpperCase() : 'CUSTOM');
            p.append('FromDate', a.toISOString());
            p.append('ToDate', b.toISOString());
            F.statuses.forEach(s => p.append('Statuses', s));
            F.creatorIds.forEach(id => p.append('CreatorIds', id));
            window.location.href = `${exportUrl}?${p.toString()}`;
            toast('Đang xuất file dữ liệu...');
        }

        // Ẩn / hiện cột qua dropdown
        const colMenu = $('#colMenu');
        if (colMenu) {
            colMenu.onchange = e => {
                const col = e.target.dataset.c;
                if (col) {
                    F.cols[col] = e.target.checked ? 1 : 0;
                    applyColumnVisibility();
                }
            };
        }

        // 1. Popup Chọn nhanh thời gian (Quick Date)
        const openQuickDate = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const rdP = $('#rdPreset');
            if (rdP) rdP.checked = true;
            const targetEl = $('#btnOpenQuickDate') || $('#labelPreset') || e.currentTarget;
            toggleFloatingPopup(targetEl, '#popupQuickDate');
        };
        const btnOpenQuick = $('#btnOpenQuickDate'), labelPreset = $('#labelPreset');
        if (btnOpenQuick) btnOpenQuick.onclick = openQuickDate;
        if (labelPreset) labelPreset.onclick = openQuickDate;

        const rdP = $('#rdPreset');
        if (rdP) {
            rdP.onchange = () => {
                F.mode = 'preset';
                F.page = 1;
                paintFilters();
                loadTable();
            };
        }

        // Click nút chọn khoảng ngày nhanh trong popupQuickDate
        document.addEventListener('click', e => {
            const btn = e.target.closest('#popupQuickDate .quick-date-btn, #popupQuickDate .quick-date-pill-all');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            const val = btn.dataset.val;
            const text = btn.textContent.trim();

            const pop = $('#popupQuickDate');
            if (pop) pop.style.display = 'none';
            const rdP = $('#rdPreset');
            if (rdP) rdP.checked = true;

            $$('#popupQuickDate .quick-date-btn, #popupQuickDate .quick-date-pill-all').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            F.mode = 'preset';
            F.preset = val;
            F.page = 1;
            const pTxt = $('#presetTxt');
            if (pTxt) pTxt.textContent = text;
            paintFilters();
            loadTable();
        });

        // 2. Popup Lịch 2 tháng tùy chỉnh (Dual Calendar)
        const openCalendar = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const rdC = $('#rdCustom');
            if (rdC) rdC.checked = true;
            renderDualCalendar();
            const targetEl = $('#btnOpenCalendar') || $('#labelCustom') || e?.currentTarget;
            toggleFloatingPopup(targetEl, '#popupCalendar');
        };
        const btnOpenCal = $('#btnOpenCalendar'), labelCustom = $('#labelCustom');
        if (btnOpenCal) btnOpenCal.onclick = openCalendar;
        if (labelCustom) labelCustom.onclick = openCalendar;

        const rdC = $('#rdCustom');
        if (rdC) {
            rdC.onchange = () => {
                openCalendar(null);
            };
        }

        // Click ngày trong Dual Calendar
        let selectingStart = true;
        document.addEventListener('click', e => {
            const calDay = e.target.closest('#popupCalendar .cal-day');
            if (calDay) {
                e.preventDefault();
                e.stopPropagation();
                const iso = calDay.dataset.iso;
                const clickedDate = new Date(iso);

                if (selectingStart) {
                    calState.start = clickedDate;
                    calState.end = clickedDate;
                    selectingStart = false;
                } else {
                    if (clickedDate < calState.start) {
                        calState.end = calState.start;
                        calState.start = clickedDate;
                    } else {
                        calState.end = clickedDate;
                    }
                    selectingStart = true;
                }
                renderDualCalendar();
                return;
            }

            const prevBtn = e.target.closest('#popupCalendar .btn-cal-prev');
            if (prevBtn) {
                e.preventDefault();
                e.stopPropagation();
                calState.currentMonth--;
                if (calState.currentMonth < 0) {
                    calState.currentMonth = 11;
                    calState.currentYear--;
                }
                renderDualCalendar();
                return;
            }

            const nextBtn = e.target.closest('#popupCalendar .btn-cal-next');
            if (nextBtn) {
                e.preventDefault();
                e.stopPropagation();
                calState.currentMonth++;
                if (calState.currentMonth > 11) {
                    calState.currentMonth = 0;
                    calState.currentYear++;
                }
                renderDualCalendar();
                return;
            }

            const todayBtn = e.target.closest('#popupCalendar .btn-cal-today');
            if (todayBtn) {
                e.preventDefault();
                e.stopPropagation();
                const t = new Date();
                calState.currentYear = t.getFullYear();
                calState.currentMonth = t.getMonth();
                calState.start = t;
                calState.end = t;
                renderDualCalendar();
                return;
            }

            const closeBtn = e.target.closest('#popupCalendar .btn-close-popup');
            if (closeBtn) {
                e.preventDefault();
                e.stopPropagation();
                const pop = $('#popupCalendar');
                if (pop) pop.style.display = 'none';
                return;
            }

            const applyBtn = e.target.closest('#popupCalendar .btn-apply-calendar');
            if (applyBtn) {
                e.preventDefault();
                e.stopPropagation();
                const s = calState.start || new Date();
                const eDate = calState.end || s;
                const rangeText = `${formatDateVN(s)} - ${formatDateVN(eDate)}`;

                const pop = $('#popupCalendar');
                if (pop) pop.style.display = 'none';
                const rdC = $('#rdCustom');
                if (rdC) rdC.checked = true;

                F.mode = 'custom';
                F.from = s;
                F.to = eDate;
                F.page = 1;
                const cTxt = $('#customTxt');
                if (cTxt) cTxt.textContent = rangeText;
                paintFilters();
                loadTable();
                return;
            }
        });

        // 3. Đóng popup khi cuộn sidebar hoặc click ngoài hoặc phím ESC
        const filterBox = $('.kiot-filter-box');
        if (filterBox) {
            filterBox.addEventListener('scroll', () => {
                $$('.quick-date-popup, .dual-calendar-popup').forEach(p => p.style.display = 'none');
                const openDropdown = $('.kiot-ms-dropdown.show');
                if (openDropdown) {
                    const box = openDropdown.parentElement?.querySelector('.kiot-multiselect-box');
                    if (box) checkSidebarDropdownDirection(box, openDropdown);
                }
            });
        }

        document.addEventListener('click', e => {
            const targetBlock = e.target.closest('.f-block');
            if (!targetBlock) {
                $$('.quick-date-popup, .dual-calendar-popup').forEach(p => p.style.display = 'none');
                $$('.kiot-ms-dropdown').forEach(d => {
                    d.classList.remove('show', 'drop-up');
                    d.style.maxHeight = '';
                });
                $$('.kiot-multiselect-box').forEach(b => b.classList.remove('open'));
            } else {
                $$('.dual-calendar-popup, .quick-date-popup').forEach(p => {
                    if (!targetBlock.contains(p)) p.style.display = 'none';
                });
                $$('.kiot-ms-dropdown').forEach(d => {
                    if (!targetBlock.contains(d)) {
                        d.classList.remove('show', 'drop-up');
                        d.style.maxHeight = '';
                    }
                });
                $$('.kiot-multiselect-box').forEach(b => {
                    if (!targetBlock.contains(b)) b.classList.remove('open');
                });
            }
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                $$('.quick-date-popup, .dual-calendar-popup').forEach(p => p.style.display = 'none');
                $$('.kiot-ms-dropdown').forEach(d => {
                    d.classList.remove('show', 'drop-up');
                    d.style.maxHeight = '';
                });
                $$('.kiot-multiselect-box').forEach(b => b.classList.remove('open'));
            }
        });

        // Checkbox trạng thái
        $$('[data-s]').forEach(c => {
            c.onchange = () => {
                const s = c.dataset.s;
                if (c.checked) {
                    if (!F.statuses.includes(s)) F.statuses.push(s);
                } else {
                    F.statuses = F.statuses.filter(x => x !== s);
                }
                F.page = 1;
                paintFilters();
                loadTable();
            };
        });

        // Multi-select Người tạo (Chuẩn LEGO KiotViet từ Danh sách Hàng hóa)
        const boxNguoiTao = $('#boxNguoiTao');
        const dropdownNguoiTao = $('#dropdownNguoiTao');

        if (boxNguoiTao && dropdownNguoiTao) {
            // Nạp trước cache tên người tạo từ HTML
            $$('.kiot-ms-item', dropdownNguoiTao).forEach(item => {
                const val = parseInt(item.dataset.val);
                const name = item.dataset.name || item.querySelector('span')?.textContent.trim();
                if (val && name) {
                    F.creatorNames[val] = name;
                }
            });

            // Click vào box để mở / đóng dropdown
            boxNguoiTao.addEventListener('click', e => {
                if (e.target.closest('.tag-remove')) return;
                e.stopPropagation();

                $$('.kiot-ms-dropdown').forEach(d => {
                    if (d !== dropdownNguoiTao) {
                        d.classList.remove('show', 'drop-up');
                        d.style.maxHeight = '';
                    }
                });
                $$('.kiot-multiselect-box').forEach(b => {
                    if (b !== boxNguoiTao) b.classList.remove('open');
                });
                $$('.quick-date-popup, .dual-calendar-popup').forEach(p => p.style.display = 'none');

                const willShow = !dropdownNguoiTao.classList.contains('show');
                if (willShow) {
                    checkSidebarDropdownDirection(boxNguoiTao, dropdownNguoiTao);
                    dropdownNguoiTao.classList.add('show');
                    boxNguoiTao.classList.add('open');
                    const searchInput = $('input', dropdownNguoiTao);
                    if (searchInput) {
                        searchInput.value = '';
                        $$('.kiot-ms-item', dropdownNguoiTao).forEach(it => it.style.display = '');
                        searchInput.focus();
                    }
                } else {
                    dropdownNguoiTao.classList.remove('show', 'drop-up');
                    dropdownNguoiTao.style.maxHeight = '';
                    boxNguoiTao.classList.remove('open');
                }
            });

            // Click nút xóa tag
            boxNguoiTao.addEventListener('click', e => {
                const tagRemove = e.target.closest('.tag-remove');
                if (!tagRemove) return;
                e.stopPropagation();
                const pill = tagRemove.closest('.kiot-pill-tag');
                if (!pill) return;
                const id = parseInt(pill.dataset.val);
                F.creatorIds = F.creatorIds.filter(x => x !== id);
                F.page = 1;
                paintFilters();
                loadTable();
            });

            // Click "+N khác" để mở dropdown
            boxNguoiTao.addEventListener('click', e => {
                const more = e.target.closest('.kiot-pill-more');
                if (!more) return;
                e.stopPropagation();
                $$('.kiot-ms-dropdown').forEach(d => {
                    if (d !== dropdownNguoiTao) {
                        d.classList.remove('show', 'drop-up');
                        d.style.maxHeight = '';
                    }
                });
                checkSidebarDropdownDirection(boxNguoiTao, dropdownNguoiTao);
                dropdownNguoiTao.classList.add('show');
                boxNguoiTao.classList.add('open');
                const searchInput = $('input', dropdownNguoiTao);
                if (searchInput) searchInput.focus();
            });

            // Chọn / bỏ chọn item người tạo
            dropdownNguoiTao.addEventListener('click', e => {
                const item = e.target.closest('.kiot-ms-item');
                if (!item) return;
                e.stopPropagation();
                const id = parseInt(item.dataset.val);
                const name = item.dataset.name || item.querySelector('span')?.textContent.trim();
                const idx = F.creatorIds.indexOf(id);

                if (idx >= 0) {
                    F.creatorIds.splice(idx, 1);
                } else {
                    F.creatorIds.push(id);
                    if (name) F.creatorNames[id] = name;
                }

                F.page = 1;
                paintFilters();
                loadTable();
            });

            // Tìm kiếm người tạo trong dropdown
            const searchInput = $('.kiot-ms-search input', dropdownNguoiTao);
            if (searchInput) {
                searchInput.addEventListener('click', e => e.stopPropagation());
                searchInput.addEventListener('input', e => {
                    e.stopPropagation();
                    const term = e.target.value.trim().toLowerCase();
                    $$('.kiot-ms-item', dropdownNguoiTao).forEach(item => {
                        const name = (item.dataset.name || item.textContent || '').toLowerCase();
                        item.style.display = (!term || name.includes(term)) ? '' : 'none';
                    });
                });
            }
        }
    }

    /* ===== SỰ KIỆN TRÊN BẢNG DỮ LIỆU ===== */
    function bindTableEvents() {
        const wrap = $('#tableWrapper');
        if (!wrap) return;

        // Reset bộ lọc khi trống
        const resetLink = $('#resetF', wrap);
        if (resetLink) {
            resetLink.onclick = () => {
                F.q = '';
                F.mode = 'preset';
                F.preset = 'thangnay';
                F.from = null;
                F.to = null;
                F.statuses = ['NHAP', 'DA_DIEU_CHINH'];
                F.creatorIds = [];
                F.page = 1;
                const sInp = $('#keywordSearch') || $('#q');
                if (sInp) sInp.value = '';
                $$('.quick-date-popup, .dual-calendar-popup').forEach(p => p.style.display = 'none');
                paintFilters();
                loadTable();
            };
        }

        // Chọn tất cả dòng
        const chkAll = $('#chkAll', wrap);
        if (chkAll) {
            chkAll.onchange = e => {
                $$('input[data-sel]', wrap).forEach(c => c.checked = e.target.checked);
            };
        }

        // Click dòng -> mở/đóng chi tiết dòng inline hoặc đánh dấu sao
        wrap.onclick = e => {
            const st = e.target.closest('[data-star]');
            if (st) {
                const icon = $('i', st);
                if (icon) {
                    const isStarred = icon.classList.contains('bi-star-fill');
                    icon.classList.toggle('bi-star-fill', !isStarred);
                    icon.classList.toggle('bi-star', isStarred);
                    st.classList.toggle('starred', !isStarred);
                }
                return;
            }

            const row = e.target.closest('tr.tbl-row');
            if (row && !e.target.closest('input') && !e.target.closest('button') && !e.target.closest('a')) {
                const id = row.dataset.id;
                const dtl = $(`#dtl-${id}`, wrap);
                if (dtl) {
                    const isOpen = dtl.style.display !== 'none';
                    $$('tr.dtl', wrap).forEach(d => d.style.display = 'none');
                    $$('tr.tbl-row', wrap).forEach(r => r.classList.remove('open'));
                    if (!isOpen) {
                        dtl.style.display = '';
                        row.classList.add('open');
                        F.openId = id;
                    } else {
                        F.openId = null;
                    }
                }
            }
        };

        // Lọc trong bảng chi tiết dòng (mã hàng & tên hàng)
        wrap.addEventListener('input', e => {
            const inp = e.target;
            if (inp.classList.contains('dtl-search-code') || inp.classList.contains('dtl-search-name')) {
                const dp = inp.closest('.dp');
                if (!dp) return;
                const codeKw = ($('.dtl-search-code', dp)?.value || '').toLowerCase().trim();
                const nameKw = ($('.dtl-search-name', dp)?.value || '').toLowerCase().trim();
                $$('.dtl-line-row', dp).forEach(tr => {
                    const c = tr.dataset.code || '';
                    const n = tr.dataset.name || '';
                    const match = (!codeKw || c.includes(codeKw)) && (!nameKw || n.includes(nameKw));
                    tr.style.display = match ? '' : 'none';
                });
            }
        });

        // Nút Lưu ghi chú trong chi tiết dòng
        $$('.btn-save-note', wrap).forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id);
                const dp = btn.closest('.dp');
                const note = $('.dp-note', dp)?.value || '';

                fetch(noteUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ maPhieuKiemKe: id, ghiChu: note })
                })
                .then(r => r.json())
                .then(res => {
                    if (res.success) {
                        toast(res.message || 'Đã lưu ghi chú.');
                        const noteCell = $(`tr.tbl-row[data-id="${id}"] [data-col="ghi"]`);
                        if (noteCell) noteCell.textContent = note;
                    } else {
                        toast(res.message || 'Lỗi khi lưu ghi chú.');
                    }
                })
                .catch(() => toast('Lỗi kết nối khi lưu ghi chú.'));
            };
        });

        // Nút Hủy phiếu trong chi tiết dòng
        $$('.btn-cancel-doc', wrap).forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id);
                const code = btn.dataset.code || ('PKK' + id);

                if (confirm(`Bạn có chắc chắn muốn hủy phiếu kiểm ${code}?\nPhiếu tạm sau khi hủy sẽ không thể mở lại. Tồn kho không bị ảnh hưởng.`)) {
                    fetch(`${cancelUrl}/${id}`, { method: 'POST' })
                    .then(r => r.json())
                    .then(res => {
                        if (res.success) {
                            toast(res.message || 'Đã hủy phiếu kiểm thành công.');
                            loadTable();
                        } else {
                            toast(res.message || 'Không thể hủy phiếu.');
                        }
                    })
                    .catch(() => toast('Lỗi kết nối máy chủ.'));
                }
            };
        });
    }

    // Phân trang AJAX qua _Pagination.cshtml
    document.addEventListener('click', e => {
        const btn = e.target.closest('.page-ajax');
        if (btn) {
            e.preventDefault();
            const p = parseInt(btn.dataset.page);
            if (p && p > 0 && p !== F.page) {
                F.page = p;
                loadTable();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    });

    /* ===== TOAST TIỆN ÍCH ===== */
    function toast(msg) {
        let t = $('#toast');
        if (!t) {
            t = document.createElement('div');
            t.className = 'toast-box';
            t.id = 'toast';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }

    // Khởi tạo ban đầu
    bindSidebarEvents();
    bindTableEvents();
    paintFilters();
})();
