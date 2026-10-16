/**
 * xuat-huy-form.js - Quản lý form Lập / Sửa / Chi tiết phiếu xuất hủy
 * Chuẩn hóa 100% theo kiến trúc, tương tác và giao diện phieu-kiem-ke-form.js
 */
(function () {
    'use strict';

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const app = $('#xhFormApp');
    if (!app) return;

    const searchUrl = app.dataset.searchUrl || '/XuatHuy/SearchProducts';
    const saveDraftUrl = app.dataset.saveDraftUrl || '/XuatHuy/SaveDraft';
    const completeUrl = app.dataset.completeUrl || '/XuatHuy/Complete';
    const indexUrl = app.dataset.indexUrl || '/XuatHuy/Index';
    const importUrl = app.dataset.importUrl || '/XuatHuy/ImportExcel';
    const templateUrl = app.dataset.templateUrl || '/XuatHuy/DownloadTemplate';
    const isReadOnly = app.dataset.isReadonly === 'true';

    // Đọc cấu hình từ thẻ script JSON an toàn
    const cfgEl = $('#xuatHuyConfig');
    let cfg = { id: 0, code: '', warehouseId: 1, created: new Date().toISOString(), note: '', isReadOnly: false, lines: [] };
    if (cfgEl && cfgEl.textContent && cfgEl.textContent.trim()) {
        try {
            cfg = JSON.parse(cfgEl.textContent.trim());
        } catch (e) {
            console.error('Lỗi parse xuatHuyConfig:', e);
        }
    }

    const fmt = n => (Number(n) || 0).toLocaleString('vi-VN');
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const p2 = n => String(n).padStart(2, '0');
    const dDate = d => `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
    const dTime = d => `${p2(d.getHours())}:${p2(d.getMinutes())}`;
    const sod = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const FM = {
        id: cfg.id || 0,
        code: ($('#fCode') && $('#fCode').value.trim()) ? $('#fCode').value.trim() : (cfg.code || ''),
        warehouseId: cfg.warehouseId || parseInt(app.dataset.warehouseId) || 1,
        created: cfg.created ? new Date(cfg.created) : new Date(),
        note: cfg.note || ($('#fNote') ? $('#fNote').value : ''),
        dirty: false,
        lines: Array.isArray(cfg.lines) ? cfg.lines.map(l => ({
            pid: l.pid,
            code: l.code || '',
            name: l.name || '',
            unit: l.unit || '',
            qty: Number(l.qty) || 1,
            cost: Number(l.cost) || 0,
            ton: Number(l.ton) || 0
        })) : [],
        recent: []
    };

    /* ===== CHỌN NGÀY GIỜ LẬP PHIẾU (POPUP LỊCH 2 THÁNG) ===== */
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

    const fDate = $('#fDate');
    const dtPop = $('#dtPop');
    if (fDate && dtPop && !isReadOnly) {
        fDate.addEventListener('click', e => {
            e.stopPropagation();
            const isOpen = dtPop.classList.contains('show');
            if (!isOpen) {
                paintDt();
                dtPop.classList.add('show');
            } else {
                dtPop.classList.remove('show');
            }
        });

        dtPop.addEventListener('click', e => {
            e.stopPropagation();
            const nav = e.target.closest('.rp-nav');
            if (nav) {
                const dn = parseInt(nav.dataset.dn);
                DT.m += dn;
                if (DT.m < 0) { DT.m = 11; DT.y--; }
                if (DT.m > 11) { DT.m = 0; DT.y++; }
                paintDt();
                return;
            }
            const dayBtn = e.target.closest('button.d');
            if (dayBtn) {
                const t = parseInt(dayBtn.dataset.t);
                const d = new Date(t);
                FM.created.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                fDate.value = `${dDate(FM.created)} ${dTime(FM.created)}`;
                paintDt();
                return;
            }
            const timeBtn = e.target.closest('button[data-tm]');
            if (timeBtn) {
                const [h, m] = timeBtn.dataset.tm.split(':').map(Number);
                FM.created.setHours(h, m, 0, 0);
                fDate.value = `${dDate(FM.created)} ${dTime(FM.created)}`;
                dtPop.classList.remove('show');
            }
        });

        document.addEventListener('click', () => {
            dtPop.classList.remove('show');
        });
    }

    /* ===== BẢNG LƯỚI HÀNG HÓA VÀ TỔNG HỢP ===== */
    function rowHTML(l, i) {
        const lineTotal = (Number(l.qty) || 0) * (Number(l.cost) || 0);
        return `
        <tr data-i="${i}" data-id="${l.pid}">
            <td class="w-del">${isReadOnly ? '' : '<button type="button" class="del" data-del title="Xóa dòng"><i class="bi bi-trash"></i></button>'}</td>
            <td class="w-stt">${FM.lines.length - i}</td>
            <td class="w-code"><span class="code-text" title="${esc(l.code)}">${esc(l.code)}</span></td>
            <td class="w-name"><span class="name-text" title="${esc(l.name)}">${esc(l.name)}</span></td>
            <td class="w-dvt text-center">${esc(l.unit || '')}</td>
            <td class="w-sys r">${fmt(l.ton)}</td>
            <td class="w-act r">
                ${isReadOnly ? `<span class="fw-semibold">${fmt(l.qty)}</span>` : `
                    <input class="qty" inputmode="numeric" value="${l.qty}" data-qty aria-label="Số lượng hủy">
                `}
            </td>
            <td class="w-cost r">
                ${isReadOnly ? `<span>${fmt(l.cost)}</span>` : `
                    <input class="cost" inputmode="numeric" value="${l.cost}" data-cost aria-label="Giá vốn">
                `}
            </td>
            <td class="w-gt r neg fw-bold">
                ${fmt(lineTotal)} đ
            </td>
        </tr>`;
    }

    function paintGrid() {
        const card = $('#gridCard');
        if (!card) return;

        if (!FM.lines.length) {
            card.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th class="w-del"></th>
                        <th class="w-stt">STT</th>
                        <th class="w-code">Mã hàng</th>
                        <th class="w-name">Tên hàng</th>
                        <th class="w-dvt text-center">ĐVT</th>
                        <th class="w-sys r">Tồn kho</th>
                        <th class="w-act r">SL hủy</th>
                        <th class="w-cost r">Giá vốn</th>
                        <th class="w-gt r">Giá trị hủy</th>
                    </tr>
                </thead>
            </table>
            <div class="empty d-flex flex-column align-items-center justify-content-center py-5 text-center flex-grow-1">
                <div class="ico mb-3"><i class="bi bi-file-earmark-spreadsheet fs-1 text-primary"></i></div>
                <h5 class="fw-bold text-dark mb-1">Thêm sản phẩm từ ô tìm kiếm hoặc file Excel</h5>
                <div class="text-muted small mb-3">
                    (Tải về file mẫu: <a href="${templateUrl}" id="tpl" class="text-primary text-decoration-none fw-semibold">Excel file mẫu</a>)
                </div>
                ${isReadOnly ? '' : `
                    <label class="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold mb-0" id="pick" style="border-radius: 6px; cursor: pointer;">
                        <i class="bi bi-box-arrow-in-down fs-5"></i><span>Chọn file dữ liệu</span>
                    </label>
                `}
                <div class="text-muted smaller mt-3" style="font-size: 12.5px;">
                    hoặc gõ tìm hàng ở ô phía trên, bấm phím tắt <strong>F3</strong> để nhảy vào ô tìm
                </div>
            </div>`;
            return;
        }

        const rows = FM.lines.map((l, i) => rowHTML(l, i)).join('');
        card.innerHTML = `
        <div style="overflow:auto;flex:1;">
            <table>
                <thead>
                    <tr>
                        <th class="w-del"></th>
                        <th class="w-stt">STT</th>
                        <th class="w-code">Mã hàng</th>
                        <th class="w-name">Tên hàng</th>
                        <th class="w-dvt text-center">ĐVT</th>
                        <th class="w-sys r">Tồn kho</th>
                        <th class="w-act r">SL hủy</th>
                        <th class="w-cost r">Giá vốn</th>
                        <th class="w-gt r">Giá trị hủy</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
    }

    function paintSums() {
        const sumsEl = $('#sums');
        if (!sumsEl) return;

        let totalQty = 0, totalAmount = 0;
        FM.lines.forEach(l => {
            const q = Number(l.qty) || 0;
            const c = Number(l.cost) || 0;
            totalQty += q;
            totalAmount += q * c;
        });

        sumsEl.innerHTML = `
            <div class="pr">
                <span class="l">Số lượng mặt hàng</span>
                <span class="v fw-bold"><span class="cntbox">${FM.lines.length}</span></span>
            </div>
            <div class="pr">
                <span class="l">Tổng số lượng hủy</span>
                <span class="v left fw-bold">${fmt(totalQty)}</span>
            </div>
            <div class="pr">
                <span class="l">Tổng giá trị hủy</span>
                <span class="v neg fw-bold" style="font-size: 15px;">${fmt(totalAmount)} đ</span>
            </div>
        `;
    }

    function paintRecent() {
        const rec = $('#recent');
        if (!rec) return;
        rec.innerHTML = FM.recent.map(r => `
            <li>
                <i class="bi bi-${r.t === 'del' ? 'trash text-danger' : (r.t === 'edit' ? 'pencil text-warning' : 'plus-circle text-primary')} me-2"></i>
                <span>${esc(r.name)} (${r.qty})</span>
            </li>`).join('') || '<li class="muted">Chưa có thao tác</li>';
    }

    function log(t, l) {
        FM.recent.unshift({ t, name: l.name, qty: l.qty != null ? l.qty : '—' });
        FM.recent = FM.recent.slice(0, 30);
        paintRecent();
    }

    function refreshAll() {
        paintGrid();
        paintSums();
    }

    /* ===== SỰ KIỆN NHẬP SỐ LƯỢNG / GIÁ VỐN / XÓA DÒNG ===== */
    const gridCard = $('#gridCard');
    if (gridCard && !isReadOnly) {
        gridCard.addEventListener('input', e => {
            const tr = e.target.closest('tr[data-i]');
            if (!tr) return;
            const i = parseInt(tr.dataset.i);
            const l = FM.lines[i];
            if (!l) return;

            if (e.target.matches('.qty')) {
                FM.dirty = true;
                const v = parseFloat(e.target.value);
                l.qty = isNaN(v) || v <= 0 ? 1 : v;
                log('edit', l);

                // Cập nhật lại giá trị dòng và tổng
                const gtCell = $('.w-gt', tr);
                if (gtCell) gtCell.textContent = `${fmt(l.qty * l.cost)} đ`;
                paintSums();
            } else if (e.target.matches('.cost')) {
                FM.dirty = true;
                const v = parseFloat(e.target.value);
                l.cost = isNaN(v) || v < 0 ? 0 : v;
                log('edit', l);

                const gtCell = $('.w-gt', tr);
                if (gtCell) gtCell.textContent = `${fmt(l.qty * l.cost)} đ`;
                paintSums();
            }
        });

        gridCard.addEventListener('click', e => {
            if (e.target.closest('[data-del]')) {
                const tr = e.target.closest('tr[data-i]');
                if (!tr) return;
                const i = parseInt(tr.dataset.i);
                const l = FM.lines[i];
                if (l) {
                    FM.dirty = true;
                    log('del', l);
                    FM.lines.splice(i, 1);
                    refreshAll();
                    toast(`Đã xóa ${l.name}`);
                }
            } else if (e.target.closest('#pick')) {
                $('#fileIn')?.click();
            }
        });
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
                    <b>${esc(p.tenHang)}</b>
                    <small>${esc(p.maHangNoiBo)}</small>
                </div>
                <div class="nums">
                    Giá vốn: <b>${fmt(p.giaVon)}</b><br>
                    Tồn: <b>${fmt(p.tonKho)}</b>
                </div>
            </div>`).join('');
        box.dataset.owner = '#fSearch';
        box.classList.add('show');
    }

    const fSearch = $('#fSearch');
    const suggest = $('#suggest');
    if (fSearch && suggest && !isReadOnly) {
        fSearch.addEventListener('input', () => {
            clearTimeout(searchTimer);
            const q = fSearch.value.trim();
            if (!q) {
                sgList = [];
                paintSuggest();
                return;
            }
            searchTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`${searchUrl}?q=${encodeURIComponent(q)}&warehouseId=${FM.warehouseId}`);
                    if (!res.ok) return;
                    sgList = await res.json();
                    sgIdx = 0;
                    paintSuggest();
                } catch (err) {
                    console.error(err);
                }
            }, 250);
        });

        fSearch.addEventListener('keydown', e => {
            if (!suggest.classList.contains('show')) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                sgIdx = (sgIdx + 1) % sgList.length;
                paintSuggest();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                sgIdx = (sgIdx - 1 + sgList.length) % sgList.length;
                paintSuggest();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (sgList[sgIdx]) addProduct(sgList[sgIdx]);
            } else if (e.key === 'Escape') {
                suggest.classList.remove('show');
            }
        });

        suggest.addEventListener('click', e => {
            const item = e.target.closest('.sg');
            if (item) {
                const i = parseInt(item.dataset.i);
                if (sgList[i]) addProduct(sgList[i]);
            }
        });

        document.addEventListener('click', e => {
            if (!e.target.closest('.searchbox')) {
                suggest.classList.remove('show');
            }
        });
    }

    function addProduct(p) {
        FM.dirty = true;
        const ex = FM.lines.find(l => l.pid === p.maHang || l.code.toLowerCase() === p.maHangNoiBo.toLowerCase());
        if (ex) {
            ex.qty = (Number(ex.qty) || 0) + 1;
            log('edit', ex);
            toast(`${p.tenHang}: SL hủy = ${ex.qty}`);
        } else {
            const l = {
                pid: p.maHang,
                code: p.maHangNoiBo,
                name: p.tenHang,
                unit: p.tenDvt,
                qty: 1,
                cost: p.giaVon || 0,
                ton: p.tonKho || 0
            };
            FM.lines.unshift(l);
            log('add', l);
            toast(`Đã thêm ${p.tenHang}`);
        }
        refreshAll();
        if (suggest) suggest.classList.remove('show');
        if (fSearch) {
            fSearch.value = '';
            fSearch.focus();
        }
    }

    /* ===== NHẬP EXCEL ===== */
    const fileIn = $('#fileIn');
    if (fileIn && !isReadOnly) {
        fileIn.addEventListener('change', async () => {
            const file = fileIn.files[0];
            if (!file) return;

            const fd = new FormData();
            fd.append('file', file);
            fd.append('warehouseId', FM.warehouseId);

            try {
                toast('Đang đọc file Excel...');
                const res = await fetch(importUrl, { method: 'POST', body: fd });
                const data = await res.json();
                if (data.success && data.items) {
                    data.items.forEach(it => {
                        const ex = FM.lines.find(l => l.pid === it.maHang);
                        if (ex) {
                            ex.qty = it.soLuongXuat;
                            ex.cost = it.donGiaXuat;
                        } else {
                            FM.lines.unshift({
                                pid: it.maHang,
                                code: it.maHangNoiBo,
                                name: it.tenHang,
                                unit: it.tenDvt,
                                qty: it.soLuongXuat,
                                cost: it.donGiaXuat,
                                ton: it.tonKho
                            });
                        }
                    });
                    FM.dirty = true;
                    refreshAll();
                    toast(`Đã nhập thành công ${data.items.length} mặt hàng từ Excel!`);
                } else {
                    toast(data.message || 'Lỗi khi nhập Excel.');
                }
            } catch (err) {
                console.error(err);
                toast('Không thể tải lên file Excel.');
            } finally {
                fileIn.value = '';
            }
        });
    }

    const tImport = $('#tImport');
    if (tImport && fileIn) {
        tImport.addEventListener('click', () => fileIn.click());
    }

    /* ===== THU GỌN / MỞ RỘNG PANEL PHẢI (F4) ===== */
    const pTg = $('#pTg');
    const panel = $('#panel');
    function togglePanel() {
        if (!panel || !pTg) return;
        panel.classList.toggle('collapsed');
        const isCollapsed = panel.classList.contains('collapsed');
        pTg.classList.toggle('collapsed', isCollapsed);
        const icon = $('#pTgIcon');
        if (icon) {
            icon.className = isCollapsed ? 'bi bi-chevron-left' : 'bi bi-chevron-right';
        }
    }
    if (pTg) pTg.onclick = togglePanel;

    /* ===== LƯU TẠM (F9) & HOÀN THÀNH (F10) ===== */
    function buildPayload() {
        return {
            maPhieuXuat: FM.id,
            maPhieu: ($('#fCode') ? $('#fCode').value.trim() : '') || null,
            maKho: FM.warehouseId,
            maNvxacNhan: $('#fNhanVien') ? parseInt($('#fNhanVien').value) : null,
            ngayLap: FM.created,
            ghiChu: $('#fNote') ? $('#fNote').value.trim() : '',
            lines: FM.lines.map(l => ({
                maHang: l.pid,
                soLuongXuat: l.qty,
                donGiaXuat: l.cost
            }))
        };
    }

    async function submitDraft() {
        if (!FM.lines.length) {
            toast('Vui lòng thêm ít nhất một mặt hàng để xuất hủy.');
            return;
        }

        const btn = $('#bSave');
        if (btn) btn.disabled = true;

        try {
            const res = await fetch(saveDraftUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify(buildPayload())
            });
            const data = await res.json();
            if (data.success) {
                toast(data.message || 'Đã lưu bản tạm phiếu xuất hủy!');
                setTimeout(() => {
                    window.location.href = indexUrl;
                }, 500);
            } else {
                toast(data.message || 'Lỗi khi lưu bản tạm.');
                if (btn) btn.disabled = false;
            }
        } catch (err) {
            console.error(err);
            toast('Không thể kết nối máy chủ.');
            if (btn) btn.disabled = false;
        }
    }

    function submitComplete() {
        if (!FM.lines.length) {
            toast('Vui lòng thêm ít nhất một mặt hàng để xuất hủy.');
            return;
        }

        openModal({
            title: 'Hoàn thành phiếu xuất hủy',
            icon: 'check2-circle text-success',
            body: `<p class="mb-0">Bạn có chắc chắn muốn hoàn thành phiếu xuất hủy này không?<br><strong>Số lượng tồn kho sổ sách sẽ được tự động trừ tương ứng.</strong></p>`,
            okText: 'Đồng ý hoàn thành',
            okClass: 'btn btn-success',
            onOk: async () => {
                closeModal();
                const btn = $('#bDone');
                if (btn) btn.disabled = true;

                try {
                    const res = await fetch(completeUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                        body: JSON.stringify(buildPayload())
                    });
                    const data = await res.json();
                    if (data.success) {
                        toast(data.message || 'Phiếu xuất hủy đã hoàn thành!');
                        setTimeout(() => {
                            window.location.href = indexUrl;
                        }, 500);
                    } else {
                        toast(data.message || 'Lỗi khi hoàn thành phiếu.');
                        if (btn) btn.disabled = false;
                    }
                } catch (err) {
                    console.error(err);
                    toast('Lỗi khi gửi yêu cầu hoàn thành.');
                    if (btn) btn.disabled = false;
                }
            }
        });
    }

    const bSave = $('#bSave');
    if (bSave) bSave.onclick = submitDraft;

    const bDone = $('#bDone');
    if (bDone) bDone.onclick = submitComplete;

    /* ===== MODAL CHUẨN KIOTVIET (#ov) ===== */
    const ov = $('#ov');
    function openModal({ title, icon, body, okText = 'Đồng ý', okClass = 'btn btn-primary', onOk }) {
        if (!ov) return;
        $('#mTitleText').textContent = title || 'Xác nhận';
        const ic = $('#mIcon');
        if (ic) {
            ic.className = `bi bi-${icon || 'info-circle'}`;
            ic.style.display = icon ? 'inline-block' : 'none';
        }
        $('#mBody').innerHTML = body || '';
        $('#mFoot').innerHTML = `
            <button type="button" class="btn btn-secondary" id="mCancel">Bỏ qua</button>
            <button type="button" class="${okClass}" id="mOk">${okText}</button>
        `;
        $('#mCancel').onclick = closeModal;
        $('#mOk').onclick = onOk;
        ov.classList.add('show');
    }

    function closeModal() {
        if (ov) ov.classList.remove('show');
    }

    const mClose = $('#mClose');
    if (mClose) mClose.onclick = closeModal;

    /* ===== TOAST THÔNG BÁO DÙNG CHUNG ===== */
    let toastTimer;
    function toast(msg, type) {
        if (window.KiotToast) {
            window.KiotToast.show(msg, type || 'info');
            return;
        }
        const t = $('#toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
    }

    /* ===== TOOLTIP & GHI CHÚ POPUP ===== */
    const tNote = $('#tNote'), notes = $('#notes');
    if (tNote && notes) {
        tNote.onclick = e => {
            e.stopPropagation();
            notes.classList.toggle('show');
        };
        document.addEventListener('click', e => {
            if (!e.target.closest('#tNote') && !e.target.closest('#notes')) {
                notes.classList.remove('show');
            }
        });
    }

    /* ===== PHÍM TẮT F3, F4, F9, F10 ===== */
    window.addEventListener('keydown', e => {
        if (e.key === 'F3') {
            e.preventDefault();
            fSearch?.focus();
        } else if (e.key === 'F4') {
            e.preventDefault();
            togglePanel();
        } else if (e.key === 'F9') {
            e.preventDefault();
            if (!isReadOnly && bSave) submitDraft();
        } else if (e.key === 'F10') {
            e.preventDefault();
            if (!isReadOnly && bDone) submitComplete();
        }
    });

    // Khởi tạo ban đầu
    refreshAll();
    paintRecent();
})();
