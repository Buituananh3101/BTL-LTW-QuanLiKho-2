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
        ['Theo năm', [['namnay', 'Năm nay'], ['namtruoc', 'Năm trước']]]
    ];

    const p2 = n => String(n).padStart(2, '0');
    const dDate = d => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
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
            default: return [new Date(y, m, 1), eod(new Date(y, m + 1, 0))];
        }
    }

    function presetLabel(k) {
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

    /* ===== POPUP QUẢN LÝ (Đóng khi click ngoài) ===== */
    document.addEventListener('mousedown', e => {
        $$('.pop.show').forEach(p => {
            if (!p.contains(e.target) && !(p.dataset.owner && $(p.dataset.owner)?.contains(e.target))) {
                p.classList.remove('show');
            }
        });
    });

    function togglePop(p, owner) {
        if (!p) return;
        const was = p.classList.contains('show');
        $$('.pop.show').forEach(x => x.classList.remove('show'));
        if (!was) {
            p.dataset.owner = owner || '';
            p.classList.add('show');
        }
    }

    /* ===== LỊCH TÙY CHỈNH 2 THÁNG ===== */
    const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    function calHTML(y, m, o) {
        const first = new Date(y, m, 1), pad = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), today = sod(new Date()).getTime();
        let h = `<div class="cal"><div class="cal-h">Tháng ${m + 1} ${y}</div><div class="cal-g">` + DOW.map(x => `<span class="dow">${x}</span>`).join('');
        for (let i = 0; i < pad; i++) h += '<span></span>';
        for (let d = 1; d <= days; d++) {
            const t = new Date(y, m, d).getTime();
            let c = 'd';
            if (t === today) c += ' today';
            if (o.from && o.to && t >= o.from && t <= o.to) c += ' in';
            if (t === o.from || t === o.to || t === o.sel) c += ' sel';
            h += `<button type="button" class="${c}" data-t="${t}">${d}</button>`;
        }
        return h + '</div></div>';
    }

    const RP = { y: 0, m: 0, from: null, to: null, step: 0 };
    function openRange() {
        const [a, b] = getActiveRange();
        RP.from = sod(a).getTime();
        RP.to = sod(b).getTime();
        RP.y = a.getFullYear();
        RP.m = a.getMonth();
        RP.step = 0;
        paintRange();
        const qEl = $('#quick');
        if (qEl) qEl.classList.remove('show');
        const p = $('#rangePop');
        if (p) {
            p.dataset.owner = '#customBox';
            p.classList.add('show');
        }
    }

    function paintRange() {
        const nm = new Date(RP.y, RP.m + 1, 1);
        const rp = $('#rangePop');
        if (!rp) return;
        rp.innerHTML = `
            <div class="rp-head">Từ ngày <b>${RP.from ? dDate(new Date(RP.from)) : '--'}</b> – Đến ngày <b>${RP.to ? dDate(new Date(RP.to)) : '--'}</b></div>
            <div class="rp-months">
                <button type="button" class="rp-nav" data-n="-1" aria-label="Tháng trước">
                    <i class="bi bi-chevron-left"></i>
                </button>
                ${calHTML(RP.y, RP.m, RP)}
                ${calHTML(nm.getFullYear(), nm.getMonth(), RP)}
                <button type="button" class="rp-nav" data-n="1" aria-label="Tháng sau">
                    <i class="bi bi-chevron-right"></i>
                </button>
            </div>
            <div class="rp-foot">
                <button type="button" class="btn btn-sm btn-outline-secondary" data-r="today">Hôm nay</button>
                <button type="button" class="btn btn-sm btn-secondary" data-r="cancel">Bỏ qua</button>
                <button type="button" class="btn btn-sm btn-primary" data-r="ok">Áp dụng</button>
            </div>`;
    }

    document.addEventListener('click', e => {
        const rp = e.target.closest('#rangePop');
        if (!rp) return;
        const n = e.target.closest('[data-n]'), d = e.target.closest('.d'), r = e.target.closest('[data-r]');
        if (n) {
            const x = new Date(RP.y, RP.m + parseInt(n.dataset.n), 1);
            RP.y = x.getFullYear();
            RP.m = x.getMonth();
            paintRange();
        } else if (d) {
            const t = parseInt(d.dataset.t);
            if (RP.step === 0) {
                RP.from = t;
                RP.to = t;
                RP.step = 1;
            } else {
                RP.to = t;
                if (RP.to < RP.from) [RP.from, RP.to] = [RP.to, RP.from];
                RP.step = 0;
            }
            paintRange();
        } else if (r) {
            if (r.dataset.r === 'today') {
                const now = new Date();
                RP.from = RP.to = sod(now).getTime();
                RP.y = now.getFullYear();
                RP.m = now.getMonth();
                RP.step = 0;
                paintRange();
            } else if (r.dataset.r === 'cancel') {
                $('#rangePop').classList.remove('show');
            } else if (r.dataset.r === 'ok') {
                F.mode = 'custom';
                F.from = new Date(RP.from);
                F.to = new Date(RP.to);
                F.page = 1;
                $('#rangePop').classList.remove('show');
                paintFilters();
                loadTable();
            }
        }
    });

    /* ===== CẬP NHẬT GIAO DIỆN BỘ LỌC ===== */
    const isoDateOnly = d => {
        const dt = new Date(d);
        return `${dt.getFullYear()}-${p2(dt.getMonth() + 1)}-${p2(dt.getDate())}`;
    };

    function paintFilters() {
        const rdP = $('#rdPreset'), rdC = $('#rdCustom');
        if (rdP) rdP.checked = F.mode === 'preset';
        if (rdC) rdC.checked = F.mode === 'custom';

        const pTxt = $('#presetTxt'), cTxt = $('#customTxt');
        if (pTxt) pTxt.textContent = F.mode === 'preset' ? presetLabel(F.preset) : 'Tháng này';
        const [a, b] = getActiveRange();
        if (cTxt) cTxt.textContent = F.mode === 'custom' ? `${dDate(a)} - ${dDate(b)}` : 'Tùy chỉnh';

        // Ẩn/hiện khối ngày tùy chỉnh inline trong sidebar
        const cWrap = $('#customDateWrap');
        if (cWrap) {
            cWrap.style.display = F.mode === 'custom' ? 'block' : 'none';
        }
        if (F.mode === 'custom') {
            const fromInp = $('#inpFromDate'), toInp = $('#inpToDate');
            if (fromInp && !fromInp.value) fromInp.value = isoDateOnly(a);
            if (toInp && !toInp.value) toInp.value = isoDateOnly(b);
        }

        $('#dotDate')?.classList.toggle('on', !(F.mode === 'preset' && F.preset === 'thangnay'));
        $('#dotSt')?.classList.toggle('on', !(F.statuses.length === 2 && F.statuses.includes('NHAP') && F.statuses.includes('DA_DIEU_CHINH')));
        $('#dotUser')?.classList.toggle('on', F.creatorIds.length > 0);

        // Render chips người tạo
        const msChips = $('#msChips');
        if (msChips) {
            msChips.innerHTML = F.creatorIds.map(id => `
                <span class="chip">${F.creatorNames[id] || 'NV ' + id}
                    <button type="button" data-rm-id="${id}" aria-label="Bỏ chọn">×</button>
                </span>`).join('');
        }

        // Cập nhật trạng thái active trong msList
        $$('#msList button').forEach(b => {
            const id = parseInt(b.dataset.uId);
            const on = F.creatorIds.includes(id);
            b.classList.toggle('on', on);
            const ic = $('i', b);
            if (ic) ic.classList.toggle('d-none', !on);
        });
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

        // Preset menu
        const presetBox = $('#presetBox');
        if (presetBox) {
            presetBox.onclick = () => {
                $$('#quick button').forEach(b => b.classList.toggle('cur', F.mode === 'preset' && b.dataset.p === F.preset));
                togglePop($('#quick'), '#presetBox');
            };
        }
        const quickEl = $('#quick');
        if (quickEl) {
            quickEl.onclick = e => {
                const b = e.target.closest('[data-p]');
                if (!b) return;
                F.mode = 'preset';
                F.preset = b.dataset.p;
                F.page = 1;
                quickEl.classList.remove('show');
                const cWrap = $('#customDateWrap');
                if (cWrap) cWrap.style.display = 'none';
                paintFilters();
                loadTable();
            };
        }

        const rdP = $('#rdPreset');
        if (rdP) {
            rdP.onchange = () => {
                F.mode = 'preset';
                const cWrap = $('#customDateWrap');
                if (cWrap) cWrap.style.display = 'none';
                F.page = 1;
                paintFilters();
                loadTable();
            };
        }

        function switchToCustom() {
            F.mode = 'custom';
            $('#quick')?.classList.remove('show');
            const cWrap = $('#customDateWrap');
            if (cWrap) cWrap.style.display = 'block';
            const [a, b] = getActiveRange();
            const fromInp = $('#inpFromDate'), toInp = $('#inpToDate');
            if (fromInp && !fromInp.value) fromInp.value = isoDateOnly(a);
            if (toInp && !toInp.value) toInp.value = isoDateOnly(b);
            paintFilters();
            $('#inpFromDate')?.focus();
        }

        const rdC = $('#rdCustom'), cBox = $('#customBox');
        if (rdC) rdC.onchange = switchToCustom;
        if (cBox) cBox.onclick = switchToCustom;

        const btnApplyCustom = $('#btnApplyCustomDate');
        if (btnApplyCustom) {
            btnApplyCustom.onclick = () => {
                const fromVal = $('#inpFromDate')?.value;
                const toVal = $('#inpToDate')?.value;
                if (!fromVal || !toVal) {
                    toast('Vui lòng chọn đầy đủ Từ ngày và Đến ngày');
                    return;
                }
                const dFrom = new Date(fromVal);
                const dTo = new Date(toVal);
                if (dFrom > dTo) {
                    toast('Từ ngày không được lớn hơn Đến ngày');
                    return;
                }
                F.mode = 'custom';
                F.from = dFrom;
                F.to = dTo;
                F.page = 1;
                paintFilters();
                loadTable();
            };
        }

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

        // Multi-select Người tạo
        const ms = $('#ms');
        if (ms) {
            ms.onclick = e => {
                const rm = e.target.closest('[data-rm-id]');
                if (rm) {
                    const id = parseInt(rm.dataset.rmId);
                    F.creatorIds = F.creatorIds.filter(x => x !== id);
                    F.page = 1;
                    paintFilters();
                    loadTable();
                    return;
                }
                $('#msIn')?.focus();
                ms.classList.add('focus');
                const list = $('#msList');
                if (list) {
                    list.dataset.owner = '#ms';
                    list.classList.add('show');
                }
            };
        }

        const msIn = $('#msIn');
        if (msIn) {
            msIn.oninput = e => {
                const kw = e.target.value.toLowerCase().trim();
                $$('#msList button').forEach(b => {
                    const name = (b.dataset.uName || '').toLowerCase();
                    b.style.display = name.includes(kw) ? '' : 'none';
                });
            };
            msIn.onblur = () => ms?.classList.remove('focus');
            msIn.onkeydown = e => {
                if (e.key === 'Backspace' && !e.target.value && F.creatorIds.length) {
                    F.creatorIds.pop();
                    paintFilters();
                    loadTable();
                }
            };
        }

        const msList = $('#msList');
        if (msList) {
            msList.onclick = e => {
                const b = e.target.closest('[data-u-id]');
                if (!b) return;
                const id = parseInt(b.dataset.uId);
                const name = b.dataset.uName;
                if (F.creatorIds.includes(id)) {
                    F.creatorIds = F.creatorIds.filter(x => x !== id);
                } else {
                    F.creatorIds.push(id);
                    F.creatorNames[id] = name;
                }
                F.page = 1;
                paintFilters();
                loadTable();
                msList.classList.add('show');
            };
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
                const cWrap = $('#customDateWrap');
                if (cWrap) cWrap.style.display = 'none';
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
