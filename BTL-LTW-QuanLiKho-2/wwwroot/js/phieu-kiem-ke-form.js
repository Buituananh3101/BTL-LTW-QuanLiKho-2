/**
 * phieu-kiem-ke-form.js - Quản lý form Lập / Sửa / Chi tiết phiếu kiểm kho
 * Khớp 100% logic, tương tác và phím tắt F3, F9, F10 từ prototype-kiemkho-full.html
 */
(function () {
    'use strict';

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const app = $('#kkFormApp');
    if (!app) return;

    const searchUrl = app.dataset.searchUrl;
    const groupUrl = app.dataset.groupUrl;
    const saveDraftUrl = app.dataset.saveDraftUrl;
    const completeUrl = app.dataset.completeUrl;
    const indexUrl = app.dataset.indexUrl;
    const isReadOnly = app.dataset.isReadonly === 'true';

    // Đọc cấu hình từ thẻ script JSON an toàn
    const cfgEl = $('#stockTakeConfig');
    let cfg = { id: 0, code: '', warehouseId: 1, created: new Date().toISOString(), note: '', isReadOnly: false, groups: [], lines: [] };
    if (cfgEl) {
        try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { console.error('Lỗi parse stockTakeConfig:', e); }
    }

    const fmt = n => (Number(n) || 0).toLocaleString('vi-VN');
    const p2 = n => String(n).padStart(2, '0');
    const dDate = d => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
    const dTime = d => `${p2(d.getHours())}:${p2(d.getMinutes())}`;
    const dFull = d => d ? `${dDate(d)} ${dTime(d)}` : '';
    const sod = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const FM = {
        id: cfg.id || 0,
        code: cfg.code || '',
        warehouseId: cfg.warehouseId || 1,
        created: cfg.created ? new Date(cfg.created) : new Date(),
        note: cfg.note || '',
        tab: 'all',
        dirty: false,
        lines: cfg.lines || [],
        recent: [],
        cols: { dvt: 1, gt: 1 }
    };

    const fsys = l => Number(l.sys) || 0;
    const fcost = l => Number(l.cost) || 0;
    const fdiff = l => l.act == null ? null : (Number(l.act) - fsys(l));

    /* ===== CHỌN NGÀY GIỜ LẬP PHIẾU ===== */
    const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const DT = { y: FM.created.getFullYear(), m: FM.created.getMonth() };

    function calHTML(y, m, sel) {
        const first = new Date(y, m, 1), pad = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), today = sod(new Date()).getTime();
        let h = `<div class="cal"><div class="cal-g">` + DOW.map(x => `<span class="dow">${x}</span>`).join('');
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

    function paintDt() {
        const pop = $('#dtPop');
        if (!pop) return;
        const sel = sod(FM.created).getTime(), times = [];
        for (let h = 0; h < 24; h++) {
            for (const m of [0, 30]) times.push(`${p2(h)}:${p2(m)}`);
        }
        const cur = dTime(FM.created);
        pop.innerHTML = `
            <div style="flex:1">
                <div class="dtnav">
                    <button type="button" class="rp-nav" data-dn="-1"><i class="bi bi-chevron-left"></i></button>
                    <span>Tháng ${DT.m + 1}/${DT.y}</span>
                    <button type="button" class="rp-nav" data-dn="1"><i class="bi bi-chevron-right"></i></button>
                </div>
                ${calHTML(DT.y, DT.m, sel)}
            </div>
            <div class="times">
                ${times.map(t => `<button type="button" data-tm="${t}" class="${t === cur ? 'cur' : ''}">${t}</button>`).join('')}
            </div>`;
        const c = $('.times .cur', pop);
        if (c) c.scrollIntoView({ block: 'center' });
    }

    /* ===== TÍNH TOÁN & VẼ GIAO DIỆN ===== */
    function counts() {
        const c = { all: FM.lines.length, khop: 0, lech: 0, chua: 0 };
        FM.lines.forEach(l => {
            const d = fdiff(l);
            if (d == null) c.chua++;
            else if (d === 0) c.khop++;
            else c.lech++;
        });
        return c;
    }

    function inTab(l) {
        const d = fdiff(l);
        if (FM.tab === 'all') return true;
        if (FM.tab === 'khop') return d === 0;
        if (FM.tab === 'lech') return d != null && d !== 0;
        if (FM.tab === 'chua') return d == null;
        return true;
    }

    function paintTabs() {
        const c = counts();
        $('#tabs').innerHTML = [
            ['all', 'Tất cả'],
            ['khop', 'Khớp'],
            ['lech', 'Lệch'],
            ['chua', 'Chưa kiểm']
        ].map(t => `<button type="button" class="tab ${FM.tab === t[0] ? 'on' : ''}" data-t="${t[0]}">${t[1]} (${c[t[0]]})</button>`).join('');
    }

    function rowHTML(l, i) {
        const d = fdiff(l);
        const c = FM.cols;
        const valDiff = d != null ? d * fcost(l) : null;
        return `
        <tr data-i="${i}">
            <td class="w-del">${isReadOnly ? '' : '<button type="button" class="del" data-del title="Xóa dòng"><i class="bi bi-trash"></i></button>'}</td>
            <td class="w-stt">${FM.lines.length - i}</td>
            <td class="w-code"><span class="code-text" title="${l.code}">${l.code}</span></td>
            <td class="w-name"><span class="name-text" title="${l.name}">${l.name}</span></td>
            ${c.dvt ? `<td class="w-dvt text-center">${l.unit || ''}</td>` : ''}
            <td class="w-sys r">${fmt(fsys(l))}</td>
            <td class="w-act r">
                <input class="qty ${l.act == null ? 'none' : ''}" ${isReadOnly ? 'disabled' : ''} inputmode="numeric" 
                       value="${l.act == null ? '' : l.act}" data-qty aria-label="Thực tế">
            </td>
            <td class="w-diff r diff ${d != null && d < 0 ? 'text-danger' : (d != null && d > 0 ? 'text-success' : '')}">
                ${d == null ? '' : (d > 0 ? '+' : '') + fmt(d)}
            </td>
            ${c.gt ? `<td class="w-gt r gt ${valDiff != null && valDiff < 0 ? 'text-danger' : (valDiff != null && valDiff > 0 ? 'text-success' : '')}">
                ${valDiff == null ? '' : (valDiff > 0 ? '+' : '') + fmt(valDiff)}
            </td>` : ''}
        </tr>`;
    }

    function paintGrid() {
        const c = FM.cols;
        const card = $('#gridCard');
        if (!FM.lines.length) {
            card.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th class="w-del"></th>
                        <th class="w-stt">STT</th>
                        <th class="w-code">Mã hàng</th>
                        <th class="w-name">Tên hàng</th>
                        ${c.dvt ? '<th class="w-dvt">ĐVT</th>' : ''}
                        <th class="w-sys r">Tồn kho</th>
                        <th class="w-act r">Thực tế</th>
                        <th class="w-diff r">SL lệch</th>
                        ${c.gt ? '<th class="w-gt r">Giá trị lệch</th>' : ''}
                    </tr>
                </thead>
            </table>
            <div class="empty d-flex flex-column align-items-center justify-content-center py-5 text-center flex-grow-1">
                <div class="ico mb-3"><i class="bi bi-file-earmark-spreadsheet fs-1 text-primary"></i></div>
                <h5 class="fw-bold text-dark mb-1">Thêm sản phẩm từ ô tìm kiếm hoặc file Excel</h5>
                <div class="text-muted small mb-3">
                    (Tải về file mẫu: <a href="javascript:void(0)" id="tpl" class="text-primary text-decoration-none fw-semibold">Excel file mẫu</a>)
                </div>
                ${isReadOnly ? '' : `<button type="button" class="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold" id="pick" style="border-radius: 6px;">
                    <i class="bi bi-box-arrow-in-down fs-5"></i><span>Chọn file dữ liệu</span>
                </button>`}
                <div class="text-muted smaller mt-3" style="font-size: 12.5px;">
                    hoặc gõ tìm hàng ở ô phía trên, bấm phím tắt <strong>F3</strong> để nhảy vào ô tìm
                </div>
            </div>`;
            return;
        }

        const rows = FM.lines.map((l, i) => inTab(l) ? rowHTML(l, i) : '').join('');
        card.innerHTML = `
        <div style="overflow:auto;flex:1;">
            <table>
                <thead>
                    <tr>
                        <th class="w-del"></th>
                        <th class="w-stt">STT</th>
                        <th class="w-code">Mã hàng</th>
                        <th class="w-name">Tên hàng</th>
                        ${c.dvt ? '<th class="w-dvt">ĐVT</th>' : ''}
                        <th class="w-sys r">Tồn kho</th>
                        <th class="w-act r">Thực tế</th>
                        <th class="w-diff r">SL lệch</th>
                        ${c.gt ? '<th class="w-gt r">Giá trị lệch</th>' : ''}
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>` + (rows ? '' : `<div class="xl-empty"><span class="muted">Không có hàng nào trong mục này.</span></div>`);
    }

    function paintSums() {
        let tang = 0, giam = 0, sl = 0, nT = 0, nG = 0, tongLech = 0;
        FM.lines.forEach(l => {
            const d = fdiff(l);
            if (l.act != null) sl += Number(l.act);
            if (d == null) return;
            tongLech += d;
            if (d > 0) { tang += d; nT++; }
            if (d < 0) { giam += Math.abs(d); nG++; }
        });

        $('#sums').innerHTML = FM.tab === 'lech'
            ? `<div class="pr"><span class="l">Tổng lệch tăng <span class="cntbox">${nT}</span></span><span class="v text-success">+${fmt(tang)}</span></div>
               <div class="pr"><span class="l">Tổng lệch giảm <span class="cntbox">${nG}</span></span><span class="v neg">-${fmt(giam)}</span></div>
               <div class="pr"><span class="l">Tổng chênh lệch <span class="cntbox">${nT + nG}</span></span><span class="v ${tongLech < 0 ? 'neg' : ''}">${(tongLech > 0 ? '+' : '') + fmt(tongLech)}</span></div>`
            : `<div class="pr"><span class="l">Tổng SL thực tế</span><span class="v left fw-bold">${fmt(sl)}</span></div>`;
    }

    function paintRecent() {
        $('#recent').innerHTML = FM.recent.map(r => `
            <li>
                <i class="bi bi-${r.t === 'edit' ? 'pencil' : 'copy'} text-primary me-2"></i>
                <span>${r.name} (${r.qty})</span>
            </li>`).join('') || '<li class="muted">Chưa có thao tác</li>';
    }

    function log(t, l) {
        FM.recent.unshift({ t, name: l.name, qty: l.act != null ? l.act : '—' });
        FM.recent = FM.recent.slice(0, 30);
        paintRecent();
    }

    function refreshAll() {
        paintTabs();
        paintGrid();
        paintSums();
    }

    /* ===== THÊM HÀNG HÓA VÀO BẢNG ===== */
    function addProduct(p) {
        FM.dirty = true;
        const ex = FM.lines.find(l => l.pid === p.maHang || l.code.toLowerCase() === p.maHangNoiBo.toLowerCase());
        if (ex) {
            ex.act = (ex.act == null ? 0 : ex.act) + 1;
            log('edit', ex);
            toast(`${p.tenHang}: Thực tế = ${ex.act}`);
        } else {
            const l = {
                pid: p.maHang,
                code: p.maHangNoiBo,
                name: p.tenHang,
                unit: p.tenDvt,
                group: p.tenNhom,
                sys: p.tonKho,
                act: 1,
                cost: p.gia
            };
            FM.lines.unshift(l);
            log('add', l);
            toast(`Đã thêm ${p.tenHang}`);
        }
        refreshAll();
    }

    /* ===== AUTOCOMPLETE TÌM KIẾM HÀNG HÓA (F3) ===== */
    let sgList = [], sgIdx = 0, searchTimer = null;
    function paintSuggest() {
        const box = $('#suggest');
        if (!box) return;
        if (!sgList.length) {
            box.classList.remove('show');
            return;
        }
        box.innerHTML = sgList.map((p, i) => `
            <div class="sg ${i === sgIdx ? 'act' : ''}" data-i="${i}">
                <div class="th">${(p.tenHang.trim()[0] || 'H').toUpperCase()}</div>
                <div class="nm">
                    <b>${p.tenHang}</b>
                    <small>${p.maHangNoiBo}</small>
                </div>
                <div class="nums">
                    Giá: <b>${fmt(p.gia)}</b><br>
                    Tồn: <b>${fmt(p.tonKho)}</b>
                </div>
            </div>`).join('');
        box.dataset.owner = '#fSearch';
        box.classList.add('show');
    }

    function queryProducts(kw) {
        if (!kw.trim()) {
            sgList = [];
            paintSuggest();
            return;
        }
        fetch(`${searchUrl}?q=${encodeURIComponent(kw.trim())}&warehouseId=${FM.warehouseId}`)
            .then(r => r.json())
            .then(data => {
                sgList = data || [];
                sgIdx = 0;
                paintSuggest();
            })
            .catch(() => { sgList = []; paintSuggest(); });
    }

    /* ===== POPUP ĐIỀU HƯỚNG & CÔNG CỤ ===== */
    document.addEventListener('mousedown', e => {
        $$('.pop.show').forEach(p => {
            if (!p.contains(e.target) && !(p.dataset.owner && $(p.dataset.owner)?.contains(e.target))) {
                p.classList.remove('show');
            }
        });
    });

    function togglePop(p, owner) {
        const was = p.classList.contains('show');
        $$('.pop.show').forEach(x => x.classList.remove('show'));
        if (!was) {
            p.dataset.owner = owner || '';
            p.classList.add('show');
        }
    }

    /* ===== XỬ LÝ SỰ KIỆN FORM ===== */
    function bindFormEvents() {
        const S = $('#fSearch');
        if (S) {
            S.addEventListener('input', () => {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => queryProducts(S.value), 250);
            });
            S.addEventListener('keydown', e => {
                if (e.key === 'ArrowDown' && sgList.length) {
                    e.preventDefault();
                    sgIdx = (sgIdx + 1) % sgList.length;
                    paintSuggest();
                } else if (e.key === 'ArrowUp' && sgList.length) {
                    e.preventDefault();
                    sgIdx = (sgIdx - 1 + sgList.length) % sgList.length;
                    paintSuggest();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const p = sgList[sgIdx];
                    if (p) {
                        addProduct(p);
                        S.value = '';
                        sgList = [];
                        paintSuggest();
                    }
                } else if (e.key === 'Escape') {
                    sgList = [];
                    paintSuggest();
                }
            });

            $('#suggest').addEventListener('mousedown', e => {
                const s = e.target.closest('.sg');
                if (!s) return;
                e.preventDefault();
                addProduct(sgList[parseInt(s.dataset.i)]);
                S.value = '';
                sgList = [];
                paintSuggest();
                S.focus();
            });

            S.focus();
        }

        function togglePanel() {
            const p = $('#panel');
            const wrap = $('#formWrap') || $('.form-wrap');
            if (!p) return;
            p.classList.toggle('collapsed');
            const isCollapsed = p.classList.contains('collapsed');
            wrap?.classList.toggle('panel-collapsed', isCollapsed);
            const tg = $('#pTg');
            if (tg) {
                tg.title = isCollapsed ? 'Mở rộng thông tin (F4)' : 'Thu gọn thông tin (F4)';
                tg.innerHTML = `<i class="bi bi-${isCollapsed ? 'chevron-left' : 'chevron-right'}" id="pTgIcon"></i>`;
            }
        }

        // Phím tắt toàn cục: F3 tìm kiếm, F4 đóng/mở panel, F9 lưu tạm, F10 cân bằng kho
        document.onkeydown = e => {
            if (e.key === 'F3' && S) {
                e.preventDefault();
                S.focus();
                S.select();
            } else if (e.key === 'F4') {
                e.preventDefault();
                togglePanel();
            } else if (e.key === 'F9' && !isReadOnly) {
                e.preventDefault();
                $('#bSave')?.click();
            } else if (e.key === 'F10' && !isReadOnly) {
                e.preventDefault();
                $('#bDone')?.click();
            }
        };

        // Nút Thêm nhanh hàng hóa mới (+)
        $('#btnQuick')?.addEventListener('click', () => {
            toast('Chức năng thêm nhanh hàng hóa được điều hướng qua Quản lý Hàng hóa.');
        });

        // Nút Chọn hàng theo nhóm (Lưới)
        $('#btnGrp')?.addEventListener('click', () => {
            const grps = cfg.groups || [];
            if (!grps.length) {
                toast('Không có nhóm hàng nào để chọn.');
                return;
            }
            modal(
                'Chọn hàng theo nhóm',
                `<p class="muted" style="margin:0 0 8px">Hàng được thêm ở trạng thái <b>Chưa kiểm</b>, bạn nhập số Thực tế sau.</p>
                <div class="grp-list">
                    ${grps.map(g => `<label><input type="checkbox" data-grp-id="${g.id}"> ${g.name}</label>`).join('')}
                    <label style="margin-top:6px;border-top:1px solid #eee;padding-top:6px"><input type="checkbox" id="onlyStock" checked> Chỉ lấy hàng còn tồn kho</label>
                </div>`,
                [
                    { label: 'Bỏ qua', cls: 'btn' },
                    {
                        label: 'Thêm vào phiếu',
                        cls: 'btn solid',
                        fn: () => {
                            const checkedGrps = $$('[data-grp-id]:checked').map(c => parseInt(c.dataset.grpId));
                            const onlyStock = $('#onlyStock')?.checked;
                            if (!checkedGrps.length) {
                                toast('Vui lòng chọn ít nhất một nhóm hàng.');
                                return;
                            }

                            let addedCount = 0;
                            const promises = checkedGrps.map(gid =>
                                fetch(`${groupUrl}?groupId=${gid}&warehouseId=${FM.warehouseId}`).then(r => r.json())
                            );

                            Promise.all(promises).then(results => {
                                results.flat().forEach(p => {
                                    if (onlyStock && p.tonKho <= 0) return;
                                    const ex = FM.lines.find(l => l.pid === p.maHang);
                                    if (!ex) {
                                        FM.lines.unshift({
                                            pid: p.maHang,
                                            code: p.maHangNoiBo,
                                            name: p.tenHang,
                                            unit: p.tenDvt,
                                            group: p.tenNhom,
                                            sys: p.tonKho,
                                            act: null,
                                            cost: p.gia
                                        });
                                        addedCount++;
                                    }
                                });
                                if (addedCount > 0) {
                                    FM.dirty = true;
                                    FM.tab = 'chua';
                                    refreshAll();
                                    toast(`Đã thêm ${addedCount} hàng vào mục Chưa kiểm.`);
                                } else {
                                    toast('Các hàng thuộc nhóm này đã có trong phiếu.');
                                }
                            });
                        }
                    }
                ]
            );
        });

        // Ẩn / hiện cột
        $('#tEye')?.addEventListener('click', () => togglePop($('#fCols'), '#tEye'));
        $('#fCols')?.addEventListener('change', e => {
            const fc = e.target.dataset.fc;
            if (fc) {
                FM.cols[fc] = e.target.checked ? 1 : 0;
                paintGrid();
            }
        });

        // Nút Lưu ý
        $('#tNote')?.addEventListener('click', () => togglePop($('#notes'), '#tNote'));

        // Thu gọn / mở rộng panel phải
        $('#pTg')?.addEventListener('click', togglePanel);

        // Chọn ngày giờ kiểm kho
        const dI = $('#fDate');
        const dtPop = $('#dtPop');
        if (dI && dtPop && !isReadOnly) {
            const showDatePicker = () => {
                DT.y = FM.created.getFullYear();
                DT.m = FM.created.getMonth();
                paintDt();
                togglePop(dtPop, '#fDate');
            };
            dI.addEventListener('focus', showDatePicker);
            dI.addEventListener('click', showDatePicker);
            dI.addEventListener('change', () => {
                const m = dI.value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
                if (m) {
                    const d = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
                    if (!isNaN(d)) {
                        FM.created = d;
                        FM.dirty = true;
                    }
                }
                dI.value = dFull(FM.created);
            });
            dtPop.addEventListener('click', e => {
                const n = e.target.closest('[data-dn]');
                const d = e.target.closest('button.d');
                const t = e.target.closest('[data-tm]');
                if (n) {
                    const x = new Date(DT.y, DT.m + parseInt(n.dataset.dn), 1);
                    DT.y = x.getFullYear();
                    DT.m = x.getMonth();
                    paintDt();
                }
                if (d) {
                    const x = new Date(parseInt(d.dataset.t));
                    FM.created = new Date(x.getFullYear(), x.getMonth(), x.getDate(), FM.created.getHours(), FM.created.getMinutes());
                    FM.dirty = true;
                    dI.value = dFull(FM.created);
                    paintDt();
                }
                if (t) {
                    const [h, m] = t.dataset.tm.split(':');
                    FM.created = new Date(FM.created.getFullYear(), FM.created.getMonth(), FM.created.getDate(), parseInt(h), parseInt(m));
                    FM.dirty = true;
                    dI.value = dFull(FM.created);
                    paintDt();
                    dtPop.classList.remove('show');
                }
            });
        }

        // 4 Tabs click
        $('#tabs')?.addEventListener('click', e => {
            const t = e.target.closest('[data-t]');
            if (t) {
                FM.tab = t.dataset.t;
                refreshAll();
            }
        });

        // Ghi chú
        $('#fNote')?.addEventListener('input', e => {
            FM.note = e.target.value;
            FM.dirty = true;
        });

        // Bảng hàng hóa click
        const card = $('#gridCard');
        card.addEventListener('click', e => {
            if (e.target.closest('#pick')) $('#fileIn')?.click();
            if (e.target.id === 'tpl') downloadSample();
            const del = e.target.closest('[data-del]');
            if (del && !isReadOnly) {
                const i = parseInt(del.closest('tr').dataset.i);
                FM.lines.splice(i, 1);
                FM.dirty = true;
                refreshAll();
            }
        });

        // Input số lượng thực tế (.qty) realtime
        card.addEventListener('input', e => {
            if (!e.target.matches('[data-qty]') || isReadOnly) return;
            const tr = e.target.closest('tr');
            const l = FM.lines[parseInt(tr.dataset.i)];
            const raw = e.target.value.replace(/\D/g, '');
            e.target.value = raw;
            l.act = raw === '' ? null : Math.min(parseInt(raw), 999999999);
            FM.dirty = true;
            e.target.classList.toggle('none', l.act == null);

            // Cập nhật chênh lệch ngay trên dòng DOM mà không vẽ lại bảng
            const d = fdiff(l);
            const valDiff = d != null ? d * fcost(l) : null;
            const df = $('.diff', tr);
            const gt = $('.gt', tr);
            if (df) {
                df.textContent = d == null ? '' : (d > 0 ? '+' : '') + fmt(d);
                df.classList.toggle('neg', d != null && d < 0);
            }
            if (gt) {
                gt.textContent = valDiff == null ? '' : (valDiff > 0 ? '+' : '') + fmt(valDiff);
                gt.classList.toggle('neg', valDiff != null && valDiff < 0);
            }
            paintTabs();
            paintSums();
        });

        card.addEventListener('change', e => {
            if (!e.target.matches('[data-qty]') || isReadOnly) return;
            const tr = e.target.closest('tr');
            const l = FM.lines[parseInt(tr.dataset.i)];
            log('edit', l);
        });

        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' && e.target.matches('[data-qty]')) {
                e.preventDefault();
                e.target.blur();
                S?.focus();
            }
        });

        // Nút Lưu tạm (F9)
        $('#bSave')?.addEventListener('click', () => saveDraft());

        // Nút Hoàn thành - Cân bằng kho (F10)
        $('#bDone')?.addEventListener('click', () => completeTake());

        // Nhập file Excel / CSV
        $('#tImport')?.addEventListener('click', () => $('#fileIn')?.click());
        $('#fileIn')?.addEventListener('change', e => {
            const f = e.target.files[0];
            e.target.value = '';
            if (!f) return;
            const rd = new FileReader();
            if (/\.csv$/i.test(f.name)) {
                rd.onload = () => importRows(String(rd.result).replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean).map(s => s.split(/[,;\t]/)));
                rd.readAsText(f);
            } else if (typeof XLSX !== 'undefined') {
                rd.onload = () => {
                    const wb = XLSX.read(new Uint8Array(rd.result), { type: 'array' });
                    importRows(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }));
                };
                rd.readAsArrayBuffer(f);
            } else {
                toast('Trình duyệt chưa nạp SheetJS. Vui lòng lưu file sang định dạng CSV để nhập.');
            }
        });
    }

    function importRows(rows) {
        let ok = 0;
        rows.forEach((r, i) => {
            const code = String(r[0] ?? '').trim();
            const q = r[1];
            if (!code || (i === 0 && isNaN(Number(q)))) return;
            const ex = FM.lines.find(l => l.code.toLowerCase() === code.toLowerCase());
            if (ex && q !== '' && !isNaN(Number(q))) {
                ex.act = Math.max(0, parseInt(q));
                ok++;
            }
        });
        if (ok > 0) {
            FM.dirty = true;
            refreshAll();
            toast(`Đã cập nhật số thực tế cho ${ok} mặt hàng từ file.`);
        } else {
            toast('Không khớp được mặt hàng nào trong bảng kiểm hiện tại.');
        }
    }

    function downloadSample() {
        const csv = "\uFEFFMã hàng,Thực tế\nSP000001,10\nSP000002,25\n";
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = 'Mau_Kiem_Kho.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    /* ===== LƯU TẠM & CÂN BẰNG KHO ===== */
    function saveDraft() {
        if (!FM.lines.length) {
            toast('Vui lòng thêm ít nhất một mặt hàng vào phiếu kiểm.');
            return;
        }

        const payload = {
            maPhieuKiemKe: FM.id,
            maKho: FM.warehouseId,
            thoiDiemChot: FM.created,
            ghiChu: FM.note,
            lines: FM.lines.map(l => ({
                maHang: l.pid,
                soLuongTheoSo: fsys(l),
                soLuongThucTe: l.act,
                donGia: fcost(l)
            }))
        };

        fetch(saveDraftUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(r => r.json())
        .then(res => {
            if (res.success) {
                FM.dirty = false;
                toast(res.message || 'Đã lưu tạm thành công!');
                setTimeout(() => window.location.href = indexUrl, 800);
            } else {
                toast(res.message || 'Lỗi khi lưu phiếu.');
            }
        })
        .catch(() => toast('Lỗi kết nối máy chủ khi lưu tạm.'));
    }

    function completeTake() {
        const counted = FM.lines.filter(l => l.act != null);
        const skipped = FM.lines.length - counted.length;
        if (!counted.length) {
            toast('Chưa có hàng nào được nhập Thực tế. Vui lòng nhập số thực tế cho ít nhất một mặt hàng.');
            return;
        }

        const lech = counted.filter(l => fdiff(l) !== 0).length;

        modal(
            'Hoàn thành kiểm kho',
            `Cân bằng kho cho <b>${counted.length}</b> hàng (<b>${lech}</b> hàng có chênh lệch).` +
            (skipped > 0 ? `<br><span class="muted">${skipped} hàng <b>Chưa kiểm</b> sẽ được bỏ qua, tồn giữ nguyên.</span>` : '') +
            `<br><br><span class="text-danger fw-bold">Lưu ý:</span> Sau khi cân bằng kho, phiếu <b>khóa vĩnh viễn, không thể sửa hoặc hủy</b>.`,
            [
                { label: 'Bỏ qua', cls: 'btn' },
                {
                    label: 'Đồng ý cân bằng',
                    cls: 'btn green',
                    fn: () => {
                        const payload = {
                            maPhieuKiemKe: FM.id,
                            maKho: FM.warehouseId,
                            thoiDiemChot: FM.created,
                            ghiChu: FM.note,
                            lines: FM.lines.map(l => ({
                                maHang: l.pid,
                                soLuongTheoSo: fsys(l),
                                soLuongThucTe: l.act,
                                donGia: fcost(l)
                            }))
                        };

                        fetch(completeUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        })
                        .then(r => r.json())
                        .then(res => {
                            if (res.success) {
                                FM.dirty = false;
                                toast(res.message || 'Cân bằng kho thành công!');
                                setTimeout(() => window.location.href = indexUrl, 1000);
                            } else {
                                toast(res.message || 'Không thể cân bằng kho.');
                            }
                        })
                        .catch(() => toast('Lỗi kết nối máy chủ khi cân bằng kho.'));
                    }
                }
            ]
        );
    }

    /* ===== MODAL & TOAST TIỆN ÍCH ===== */
    function modal(title, bodyHTML, buttons) {
        $('#mTitle').textContent = title;
        $('#mBody').innerHTML = bodyHTML;
        const mf = $('#mFoot');
        mf.innerHTML = '';
        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = b.cls || 'btn';
            btn.textContent = b.label;
            btn.onclick = () => {
                $('#ov').classList.remove('show');
                if (b.fn) b.fn();
            };
            mf.appendChild(btn);
        });
        $('#ov').classList.add('show');
    }

    $('#ov').onclick = e => {
        if (e.target === $('#ov')) $('#ov').classList.remove('show');
    };

    function toast(msg) {
        const t = $('#toast');
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }

    // Khởi tạo ban đầu
    bindFormEvents();
    refreshAll();
})();
