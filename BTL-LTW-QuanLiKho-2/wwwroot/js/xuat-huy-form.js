/**
 * xuat-huy-form.js - Quản lý form Lập / Sửa phiếu xuất hủy
 * Khớp 100% giao diện và tương tác KiotViet Screenshot 2 (F3, F4, F9, F10)
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
        lines: Array.isArray(cfg.lines) ? cfg.lines.map(l => ({
            maHang: l.maHang,
            code: l.code || '',
            name: l.name || '',
            dvt: l.dvt || '',
            qty: Number(l.qty) || 1,
            cost: Number(l.cost) || 0,
            ton: Number(l.ton) || 0
        })) : []
    };

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

    /* ===== VẼ BẢNG HÀNG HÓA VÀ TỔNG HỢP ===== */
    function renderTable() {
        const emptyBox = $('#emptyBox');
        const tableWrap = $('#tableWrap');
        const tbody = $('#gridBody');
        const badgeCount = $('#badgeCount');
        const totalAmount = $('#totalAmount');

        const hasLines = FM.lines.length > 0;
        if (emptyBox) emptyBox.classList.toggle('d-none', hasLines);
        if (tableWrap) tableWrap.classList.toggle('d-none', !hasLines);

        let sumAmount = 0;
        let html = '';

        FM.lines.forEach((l, idx) => {
            const lineAmount = l.qty * l.cost;
            sumAmount += lineAmount;

            html += `
                <tr data-id="${l.maHang}">
                    <td class="text-center text-muted">${idx + 1}</td>
                    <td><span class="fw-semibold text-primary">${esc(l.code)}</span></td>
                    <td>
                        <div class="fw-medium text-dark">${esc(l.name)}</div>
                        <div class="small text-muted">Tồn: ${fmt(l.ton)}</div>
                    </td>
                    <td class="text-center">${esc(l.dvt)}</td>
                    <td class="text-end">
                        ${isReadOnly ? `<span class="fw-semibold">${fmt(l.qty)}</span>` : `
                            <input type="number" class="xh-qty-input" min="1" step="1" value="${l.qty}" data-id="${l.maHang}" title="Số lượng xuất hủy">
                        `}
                    </td>
                    <td class="text-end">
                        ${isReadOnly ? `<span>${fmt(l.cost)}</span>` : `
                            <input type="number" class="xh-cost-input" min="0" step="1000" value="${l.cost}" data-id="${l.maHang}" title="Giá vốn">
                        `}
                    </td>
                    <td class="text-end fw-bold text-danger">${fmt(lineAmount)} đ</td>
                    ${!isReadOnly ? `
                        <td class="text-center">
                            <button type="button" class="btn-del-line" data-id="${l.maHang}" title="Xóa mặt hàng này">
                                <i class="bi bi-trash fs-6"></i>
                            </button>
                        </td>
                    ` : ''}
                </tr>
            `;
        });

        if (tbody) tbody.innerHTML = html;
        if (badgeCount) badgeCount.textContent = `[${FM.lines.length}]`;
        if (totalAmount) totalAmount.textContent = `${fmt(sumAmount)} đ`;
    }

    /* ===== TƯƠNG TÁC SỬA SỐ LƯỢNG / GIÁ VỐN / XÓA DÒNG ===== */
    const gridBody = $('#gridBody');
    if (gridBody && !isReadOnly) {
        gridBody.addEventListener('input', e => {
            const qtyInp = e.target.closest('.xh-qty-input');
            if (qtyInp) {
                const id = parseInt(qtyInp.dataset.id);
                const item = FM.lines.find(x => x.maHang === id);
                if (item) {
                    const val = parseFloat(qtyInp.value);
                    item.qty = isNaN(val) || val <= 0 ? 1 : val;
                    // Cập nhật lại số tiền dòng và tổng tiền mà không giật focus
                    const row = qtyInp.closest('tr');
                    if (row) {
                        const amountCell = $('td:nth-last-child(2)', row);
                        if (amountCell) amountCell.textContent = `${fmt(item.qty * item.cost)} đ`;
                    }
                    updateTotals();
                }
                return;
            }

            const costInp = e.target.closest('.xh-cost-input');
            if (costInp) {
                const id = parseInt(costInp.dataset.id);
                const item = FM.lines.find(x => x.maHang === id);
                if (item) {
                    const val = parseFloat(costInp.value);
                    item.cost = isNaN(val) || val < 0 ? 0 : val;
                    const row = costInp.closest('tr');
                    if (row) {
                        const amountCell = $('td:nth-last-child(2)', row);
                        if (amountCell) amountCell.textContent = `${fmt(item.qty * item.cost)} đ`;
                    }
                    updateTotals();
                }
                return;
            }
        });

        gridBody.addEventListener('click', e => {
            const btnDel = e.target.closest('.btn-del-line');
            if (btnDel) {
                const id = parseInt(btnDel.dataset.id);
                FM.lines = FM.lines.filter(x => x.maHang !== id);
                renderTable();
            }
        });
    }

    function updateTotals() {
        const badgeCount = $('#badgeCount');
        const totalAmount = $('#totalAmount');
        const sum = FM.lines.reduce((acc, cur) => acc + (cur.qty * cur.cost), 0);
        if (badgeCount) badgeCount.textContent = `[${FM.lines.length}]`;
        if (totalAmount) totalAmount.textContent = `${fmt(sum)} đ`;
    }

    /* ===== TÌM KIẾM SẢN PHẨM (F3) AUTOCOMPLETE ===== */
    const fSearch = $('#fSearch');
    const suggest = $('#suggest');
    if (fSearch && suggest && !isReadOnly) {
        let searchTimer;
        fSearch.addEventListener('input', () => {
            clearTimeout(searchTimer);
            const term = fSearch.value.trim();
            if (!term) {
                suggest.classList.remove('show');
                return;
            }
            searchTimer = setTimeout(() => doProductSearch(term), 250);
        });

        fSearch.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                suggest.classList.remove('show');
            }
        });

        document.addEventListener('click', e => {
            if (!e.target.closest('.searchbox')) {
                suggest.classList.remove('show');
            }
        });
    }

    async function doProductSearch(term) {
        try {
            const res = await fetch(`${searchUrl}?q=${encodeURIComponent(term)}&warehouseId=${FM.warehouseId}`);
            if (!res.ok) return;
            const items = await res.json();
            if (!items || !items.length) {
                suggest.innerHTML = '<div class="p-3 text-muted text-center small">Không tìm thấy sản phẩm phù hợp.</div>';
                suggest.classList.add('show');
                return;
            }

            let html = '';
            items.forEach(it => {
                html += `
                    <div class="sg-item p-2 d-flex justify-content-between align-items-center border-bottom" data-item='${JSON.stringify(it)}' style="cursor: pointer;">
                        <div>
                            <div class="fw-semibold text-dark">${esc(it.tenHang)}</div>
                            <div class="small text-muted">
                                <span class="badge bg-light text-dark border me-1">${esc(it.maHangNoiBo)}</span>
                                ĐVT: ${esc(it.tenDvt)}
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="fw-semibold text-danger">${fmt(it.giaVon)} đ</div>
                            <div class="small text-muted">Tồn: ${fmt(it.tonKho)}</div>
                        </div>
                    </div>
                `;
            });
            suggest.innerHTML = html;
            suggest.classList.add('show');

            $$('.sg-item', suggest).forEach(el => {
                el.addEventListener('click', () => {
                    const it = JSON.parse(el.dataset.item);
                    addProductToLines(it);
                    suggest.classList.remove('show');
                    fSearch.value = '';
                    fSearch.focus();
                });
            });
        } catch (err) {
            console.error('Lỗi tìm kiếm sản phẩm:', err);
        }
    }

    function addProductToLines(it) {
        const exist = FM.lines.find(x => x.maHang === it.maHang);
        if (exist) {
            exist.qty += 1;
            if (window.KiotToast) KiotToast.info(`Tăng số lượng xuất hủy của "${it.tenHang}" lên ${exist.qty}`);
        } else {
            FM.lines.push({
                maHang: it.maHang,
                code: it.maHangNoiBo,
                name: it.tenHang,
                dvt: it.tenDvt,
                qty: 1,
                cost: it.giaVon || 0,
                ton: it.tonKho || 0
            });
            if (window.KiotToast) KiotToast.success(`Đã thêm "${it.tenHang}" vào danh sách.`);
        }
        renderTable();
    }

    /* ===== NHẬP EXCEL ===== */
    function handleExcelUpload(fileInput) {
        if (!fileInput) return;
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;

            const fd = new FormData();
            fd.append('file', file);
            fd.append('warehouseId', FM.warehouseId);

            try {
                if (window.KiotToast) KiotToast.info('Đang đọc dữ liệu từ file Excel...');
                const res = await fetch(importUrl, {
                    method: 'POST',
                    body: fd
                });
                const data = await res.json();
                if (data.success && data.items) {
                    let addedCount = 0;
                    data.items.forEach(it => {
                        const exist = FM.lines.find(x => x.maHang === it.maHang);
                        if (exist) {
                            exist.qty += it.soLuongXuat;
                            exist.cost = it.donGiaXuat;
                        } else {
                            FM.lines.push({
                                maHang: it.maHang,
                                code: it.maHangNoiBo,
                                name: it.tenHang,
                                dvt: it.tenDvt,
                                qty: it.soLuongXuat,
                                cost: it.donGiaXuat,
                                ton: it.tonKho
                            });
                            addedCount++;
                        }
                    });
                    renderTable();
                    if (window.KiotToast) KiotToast.success(`Đã nhập thành công ${data.items.length} dòng sản phẩm từ Excel!`);
                } else {
                    if (window.KiotToast) KiotToast.error(data.message || 'Lỗi khi nhập file Excel.');
                }
            } catch (err) {
                console.error(err);
                if (window.KiotToast) KiotToast.error('Không thể tải lên file Excel.');
            } finally {
                fileInput.value = '';
            }
        });
    }

    handleExcelUpload($('#excelBodyFileInput'));
    handleExcelUpload($('#excelHeaderFileInput'));

    /* ===== NÚT THU GỌN / MỞ RỘNG PANEL PHẢI (F4) ===== */
    const pTg = $('#pTg');
    const panel = $('#panel');
    if (pTg && panel) {
        pTg.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
            const isColl = panel.classList.contains('collapsed');
            pTg.classList.toggle('collapsed', isColl);
            const ic = $('#pTgIcon');
            if (ic) ic.className = isColl ? 'bi bi-chevron-left' : 'bi bi-chevron-right';
        });
    }

    /* ===== THAO TÁC LƯU TẠM (F9) & HOÀN THÀNH (F10) ===== */
    function buildPayload() {
        return {
            maPhieuXuat: FM.id,
            maPhieu: ($('#fCode') ? $('#fCode').value.trim() : '') || null,
            maKho: FM.warehouseId,
            maNvxacNhan: $('#fNhanVien') ? parseInt($('#fNhanVien').value) : null,
            ngayLap: FM.created,
            ghiChu: $('#fNote') ? $('#fNote').value.trim() : '',
            lines: FM.lines.map(l => ({
                maHang: l.maHang,
                soLuongXuat: l.qty,
                donGiaXuat: l.cost
            }))
        };
    }

    async function submitSaveDraft() {
        if (!FM.lines.length) {
            if (window.KiotToast) KiotToast.warning('Vui lòng thêm ít nhất một mặt hàng để xuất hủy.');
            return;
        }

        const btn = $('#btnSaveDraft');
        if (btn) btn.disabled = true;

        try {
            const res = await fetch(saveDraftUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify(buildPayload())
            });
            const data = await res.json();
            if (data.success) {
                if (window.KiotToast) KiotToast.success(data.message || 'Đã lưu bản tạm phiếu xuất hủy!');
                setTimeout(() => {
                    window.location.href = indexUrl;
                }, 600);
            } else {
                if (window.KiotToast) KiotToast.error(data.message || 'Không thể lưu bản tạm.');
                if (btn) btn.disabled = false;
            }
        } catch (err) {
            console.error(err);
            if (window.KiotToast) KiotToast.error('Lỗi khi gửi yêu cầu lưu bản tạm.');
            if (btn) btn.disabled = false;
        }
    }

    async function submitComplete() {
        if (!FM.lines.length) {
            if (window.KiotToast) KiotToast.warning('Vui lòng thêm ít nhất một mặt hàng để xuất hủy.');
            return;
        }

        const ov = $('#kiotConfirmOv');
        if (!ov) return;
        const msg = $('#kiotConfirmMsg');
        if (msg) msg.textContent = 'Bạn có chắc chắn muốn hoàn thành phiếu xuất hủy này? Số lượng tồn kho sổ sách sẽ được tự động trừ tương ứng.';

        const okBtn = $('#kiotConfirmOkBtn');
        const cancelBtn = $('#kiotConfirmCancelBtn');
        const closeBtn = $('#kiotConfirmCloseBtn');

        const close = () => ov.classList.remove('show');
        cancelBtn.onclick = close;
        closeBtn.onclick = close;

        okBtn.onclick = async () => {
            close();
            const btn = $('#btnComplete');
            if (btn) btn.disabled = true;

            try {
                const res = await fetch(completeUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify(buildPayload())
                });
                const data = await res.json();
                if (data.success) {
                    if (window.KiotToast) KiotToast.success(data.message || 'Phiếu xuất hủy đã hoàn thành!');
                    setTimeout(() => {
                        window.location.href = indexUrl;
                    }, 600);
                } else {
                    if (window.KiotToast) KiotToast.error(data.message || 'Không thể hoàn thành phiếu.');
                    if (btn) btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                if (window.KiotToast) KiotToast.error('Lỗi khi gửi yêu cầu hoàn thành.');
                if (btn) btn.disabled = false;
            }
        };

        ov.classList.add('show');
    }

    const btnDraft = $('#btnSaveDraft');
    if (btnDraft) btnDraft.addEventListener('click', submitSaveDraft);

    const btnComp = $('#btnComplete');
    if (btnComp) btnComp.addEventListener('click', submitComplete);

    /* ===== PHÍM TẮT F3, F4, F9, F10 ===== */
    window.addEventListener('keydown', e => {
        if (e.key === 'F3') {
            e.preventDefault();
            fSearch?.focus();
        } else if (e.key === 'F4') {
            e.preventDefault();
            pTg?.click();
        } else if (e.key === 'F9') {
            e.preventDefault();
            if (!isReadOnly && btnDraft) submitSaveDraft();
        } else if (e.key === 'F10') {
            e.preventDefault();
            if (!isReadOnly && btnComp) submitComplete();
        }
    });

    // Khởi tạo ban đầu
    renderTable();
})();
