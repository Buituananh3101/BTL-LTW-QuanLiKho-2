/**
 * xuat-huy-index.js - Quản lý tương tác màn hình danh sách xuất hủy
 * Tái sử dụng trọn vẹn khối Lego KiotFilter & KiotConfirm
 */
(function () {
    'use strict';

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const app = $('#kiotContainer');
    if (!app) return;

    const filterUrl = app.dataset.filterUrl || '/XuatHuy/Filter';
    const noteUrl = app.dataset.noteUrl || '/XuatHuy/UpdateNote';
    const cancelUrl = app.dataset.cancelUrl || '/XuatHuy/Cancel';
    const exportUrl = app.dataset.exportUrl || '/XuatHuy/Export';
    const toggleStarUrl = app.dataset.toggleStarUrl || '/XuatHuy/ToggleFavorite';
    let isStarredFilterActive = app.dataset.isStarred === 'true';
    let currentWhId = parseInt(app.dataset.warehouseId) || 0;

    // Trạng thái bộ lọc (Mặc định Tháng này theo chuẩn Screenshot 1 KiotViet)
    const F = {
        q: '',
        mode: 'preset',
        preset: 'THANG_NAY',
        from: null,
        to: null,
        statuses: ['NHAP', 'DA_XAC_NHAN'],
        creatorIds: [],
        creatorNames: {},
        confirmerIds: [],
        confirmerNames: {},
        daDanhDau: isStarredFilterActive,
        sortBy: app.dataset.sortBy || '',
        sortDir: app.dataset.sortDir || '',
        page: 1,
        size: 15,
        cols: { ma: 1, tg: 1, kho: 1, gt: 1, ghi: 1, st: 1 },
        collapsed: false,
        openId: null
    };

    /* ===== MULTISELECT CHO NGƯỜI TẠO VÀ NGƯỜI XUẤT HỦY ===== */
    function renderMultiSelect(boxId, dropdownId, selectedIds, namesMap, dotId, placeholder) {
        const box = $(boxId);
        const dropdown = $(dropdownId);
        if (!box || !dropdown) return;

        const dot = $(dotId);
        if (dot) dot.style.display = selectedIds.length > 0 ? 'inline-block' : 'none';

        $$('.kiot-ms-item', dropdown).forEach(item => {
            const val = parseInt(item.dataset.val);
            const isSel = selectedIds.includes(val);
            item.classList.toggle('selected', isSel);
            const chk = $('input[type="checkbox"]', item);
            if (chk) chk.checked = isSel;
        });

        const selectedItems = selectedIds.map(id => ({
            val: id,
            name: namesMap[id] || ('NV ' + id)
        }));
        KiotFilter.renderTagPills(box, selectedItems, placeholder, 3);
    }

    function renderCreatorMultiSelect() {
        renderMultiSelect('#boxNguoiTao', '#dropdownNguoiTao', F.creatorIds, F.creatorNames, '#dotUser', 'Chọn người tạo');
    }

    function renderConfirmerMultiSelect() {
        renderMultiSelect('#boxNguoiXuatHuy', '#dropdownNguoiXuatHuy', F.confirmerIds, F.confirmerNames, '#dotConfirmer', 'Chọn người xuất hủy');
    }

    function setupMultiSelectDropdown(boxId, dropdownId, selectedIds, namesMap, renderFn) {
        const box = $(boxId);
        const dropdown = $(dropdownId);
        if (!box || !dropdown) return;

        $$('.kiot-ms-item', dropdown).forEach(item => {
            const val = parseInt(item.dataset.val);
            const nameEl = $('.kiot-ms-item-name', item);
            if (nameEl) namesMap[val] = nameEl.textContent.trim();
        });

        box.addEventListener('click', e => {
            const tagClose = e.target.closest('.kiot-tag-close');
            if (tagClose) {
                e.stopPropagation();
                const valToRemove = parseInt(tagClose.dataset.val);
                const idx = selectedIds.indexOf(valToRemove);
                if (idx !== -1) {
                    selectedIds.splice(idx, 1);
                    renderFn();
                    loadTable();
                }
                return;
            }
            KiotFilter.toggleSidebarDropdown(box, dropdown);
        });

        dropdown.addEventListener('click', e => {
            const item = e.target.closest('.kiot-ms-item');
            if (!item) return;
            const val = parseInt(item.dataset.val);
            if (isNaN(val)) return;

            const idx = selectedIds.indexOf(val);
            if (idx === -1) selectedIds.push(val);
            else selectedIds.splice(idx, 1);

            renderFn();
            loadTable();
        });

        const searchInp = $('.kiot-ms-search-input', dropdown);
        if (searchInp) {
            searchInp.addEventListener('input', () => {
                const term = searchInp.value.trim().toLowerCase();
                $$('.kiot-ms-item', dropdown).forEach(item => {
                    const text = item.textContent.trim().toLowerCase();
                    item.style.display = text.includes(term) ? '' : 'none';
                });
            });
        }
    }

    /* ===== LOAD BẢNG AJAX ===== */
    function buildFilterQuery() {
        const p = new URLSearchParams();
        if (F.q) p.set('Q', F.q);
        p.set('DateFilterType', F.mode === 'preset' ? F.preset : 'CUSTOM');
        if (F.mode === 'custom') {
            if (F.from) p.set('FromDate', F.from);
            if (F.to) p.set('ToDate', F.to);
        }
        F.statuses.forEach(s => p.append('Statuses', s));
        F.creatorIds.forEach(id => p.append('CreatorIds', id));
        F.confirmerIds.forEach(id => p.append('ConfirmerIds', id));
        if (currentWhId > 0) p.set('WarehouseId', currentWhId);
        if (F.daDanhDau) p.set('DaDanhDau', 'true');
        if (F.sortBy) p.set('SortBy', F.sortBy);
        if (F.sortDir) p.set('SortDir', F.sortDir);
        p.set('Page', F.page);
        p.set('PageSize', F.size);
        return p.toString();
    }

    async function loadTable() {
        const wrap = $('#tableContainer');
        if (!wrap) return;
        wrap.style.opacity = '0.5';

        try {
            const res = await fetch(`${filterUrl}?${buildFilterQuery()}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (!res.ok) throw new Error('Network response was not ok');
            const html = await res.text();
            wrap.innerHTML = html;

            // Áp dụng lại hiển thị cột
            applyColVisibility();

            // Nếu đang mở hàng chi tiết nào đó, mở lại nếu còn tồn tại
            if (F.openId) {
                const dtl = $(`#dtl-${F.openId}`);
                if (dtl) dtl.style.display = 'table-row';
            }
        } catch (err) {
            console.error('Lỗi khi tải bảng xuất hủy:', err);
            if (window.KiotToast) KiotToast.error('Không thể tải dữ liệu bảng.');
        } finally {
            wrap.style.opacity = '1';
        }
    }

    function applyColVisibility() {
        const table = $('#xuatHuyTable');
        if (!table) return;
        Object.keys(F.cols).forEach(colKey => {
            const show = F.cols[colKey] === 1;
            $$(`[data-col="${colKey}"]`, table).forEach(el => {
                el.style.display = show ? '' : 'none';
            });
        });
    }

    /* ===== SỰ KIỆN TRÊN BẢNG (EXPAND ROW, STAR, INNER SEARCH) ===== */
    document.addEventListener('click', e => {
        // 1. Click dòng bảng để mở / đóng chi tiết (Accordion)
        const row = e.target.closest('.tbl-row');
        if (row && !e.target.closest('.w-chk') && !e.target.closest('.w-star') && !e.target.closest('a') && !e.target.closest('button')) {
            const id = row.dataset.id;
            const dtl = $(`#dtl-${id}`);
            if (dtl) {
                const isOpening = dtl.style.display === 'none';
                // Đóng tất cả dòng dtl khác
                $$('tr.dtl').forEach(tr => { tr.style.display = 'none'; });
                $$('.tbl-row').forEach(r => r.classList.remove('selected-row'));

                if (isOpening) {
                    dtl.style.display = 'table-row';
                    row.classList.add('selected-row');
                    F.openId = id;
                } else {
                    dtl.style.display = 'none';
                    F.openId = null;
                }
            }
            return;
        }

        // 2. Nút Lưu ghi chú trong chi tiết
        const btnSaveNote = e.target.closest('.btn-save-note');
        if (btnSaveNote) {
            const id = parseInt(btnSaveNote.dataset.id);
            const dtl = $(`#dtl-${id}`);
            const noteText = dtl ? $('.dp-note', dtl).value : '';
            saveNote(id, noteText);
            return;
        }

        // 3. Nút Hủy bỏ phiếu xuất hủy trong chi tiết
        const btnCancel = e.target.closest('.btn-cancel-doc');
        if (btnCancel) {
            const id = parseInt(btnCancel.dataset.id);
            const code = btnCancel.dataset.code;
            confirmCancelDoc(id, code);
            return;
        }

        // 4. Nút In chứng từ
        const btnPrint = e.target.closest('.btn-print-doc');
        if (btnPrint) {
            const id = btnPrint.dataset.id;
            printDoc(id);
            return;
        }

        // 5. Nút reset bộ lọc
        if (e.target.closest('#resetF')) {
            resetAllFilters();
            return;
        }

        // 6. Sắp xếp cột
        const sortTh = e.target.closest('.sortable-th');
        if (sortTh && !e.target.closest('.th-checkbox') && !e.target.closest('.th-star')) {
            const col = sortTh.dataset.col;
            if (F.sortBy === col) {
                if (F.sortDir === 'asc') F.sortDir = 'desc';
                else if (F.sortDir === 'desc') { F.sortBy = ''; F.sortDir = ''; }
            } else {
                F.sortBy = col;
                F.sortDir = 'asc';
            }
            F.page = 1;
            loadTable();
            return;
        }

        // 7. Click chuyển trang trong Pagination
        const pageLink = e.target.closest('.kiot-page-link');
        if (pageLink && !pageLink.closest('.disabled') && !pageLink.closest('.active')) {
            e.preventDefault();
            const p = parseInt(pageLink.dataset.page);
            if (p > 0) {
                F.page = p;
                loadTable();
            }
            return;
        }
    });

    /* ===== TÌM KIẾM TRONG CHI TIẾT (INNER SEARCH) ===== */
    document.addEventListener('input', e => {
        const searchCode = e.target.closest('.dtl-search-code');
        const searchName = e.target.closest('.dtl-search-name');
        if (searchCode || searchName) {
            const tbody = e.target.closest('.dtl-tbl');
            if (!tbody) return;
            const codeVal = ($('.dtl-search-code', tbody)?.value || '').trim().toLowerCase();
            const nameVal = ($('.dtl-search-name', tbody)?.value || '').trim().toLowerCase();

            $$('.dtl-line-row', tbody).forEach(tr => {
                const c = tr.dataset.code || '';
                const n = tr.dataset.name || '';
                const matchCode = !codeVal || c.includes(codeVal);
                const matchName = !nameVal || n.includes(nameVal);
                tr.style.display = (matchCode && matchName) ? '' : 'none';
            });
        }
    });

    /* ===== ĐÁNH DẤU SAO FAVORITE ===== */
    window.toggleFavoriteXuatHuy = async function (e, id, el) {
        e.stopPropagation();
        try {
            const res = await fetch(`${toggleStarUrl}?id=${id}`, {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await res.json();
            if (data.success) {
                const btn = $('.star-btn', el) || el;
                btn.classList.toggle('starred', data.isFavorite);
                const icon = $('i', btn);
                if (icon) {
                    icon.className = data.isFavorite ? 'bi bi-star-fill' : 'bi bi-star';
                }
                if (window.KiotToast) {
                    KiotToast.success(data.isFavorite ? 'Đã đánh dấu sao phiếu xuất hủy.' : 'Đã bỏ đánh dấu sao.');
                }
            }
        } catch (err) {
            console.error('Lỗi toggle sao:', err);
        }
    };

    window.toggleStarHeaderFilter = function (e) {
        e.stopPropagation();
        F.daDanhDau = !F.daDanhDau;
        const btn = $('#starHeaderFilter');
        if (btn) {
            btn.classList.toggle('starred', F.daDanhDau);
            const icon = $('i', btn);
            if (icon) icon.className = F.daDanhDau ? 'bi bi-star-fill' : 'bi bi-star';
        }
        F.page = 1;
        loadTable();
    };

    /* ===== LƯU GHI CHÚ ===== */
    async function saveNote(id, note) {
        try {
            const res = await fetch(noteUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ maPhieuXuat: id, ghiChu: note })
            });
            const data = await res.json();
            if (data.success) {
                if (window.KiotToast) KiotToast.success('Đã lưu ghi chú thành công!');
                const row = $(`.tbl-row[data-id="${id}"]`);
                if (row) {
                    const noteTd = $('[data-col="ghi"]', row);
                    if (noteTd) {
                        noteTd.textContent = note;
                        noteTd.title = note;
                    }
                }
            } else {
                if (window.KiotToast) KiotToast.error(data.message || 'Không thể lưu ghi chú.');
            }
        } catch (err) {
            console.error(err);
            if (window.KiotToast) KiotToast.error('Lỗi khi gửi yêu cầu lưu ghi chú.');
        }
    }

    /* ===== HỦY BỎ CHỨNG TỪ ===== */
    function confirmCancelDoc(id, code) {
        const ov = $('#kiotConfirmOv');
        if (!ov) return;
        const msg = $('#kiotConfirmMsg');
        if (msg) msg.textContent = `Bạn có chắc chắn muốn hủy phiếu xuất hủy "${code}" không? Thao tác này sẽ hoàn lại số lượng tồn kho (nếu phiếu đã hoàn thành).`;

        const okBtn = $('#kiotConfirmOkBtn');
        const cancelBtn = $('#kiotConfirmCancelBtn');
        const closeBtn = $('#kiotConfirmCloseBtn');

        const close = () => ov.classList.remove('show');
        cancelBtn.onclick = close;
        closeBtn.onclick = close;

        okBtn.onclick = async () => {
            close();
            try {
                const res = await fetch(`${cancelUrl}/${id}`, {
                    method: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await res.json();
                if (data.success) {
                    if (window.KiotToast) KiotToast.success(data.message || 'Đã hủy phiếu xuất hủy.');
                    loadTable();
                } else {
                    if (window.KiotToast) KiotToast.error(data.message || 'Không thể hủy phiếu.');
                }
            } catch (err) {
                console.error(err);
                if (window.KiotToast) KiotToast.error('Lỗi khi hủy phiếu.');
            }
        };

        ov.classList.add('show');
    }

    /* ===== IN PHIẾU XUẤT HỦY ===== */
    function printDoc(id) {
        const dtl = $(`#dtl-${id}`);
        if (!dtl) return;
        const printContent = $('.dp', dtl).cloneNode(true);
        // Bỏ bớt ô tìm kiếm và thanh nút khi in
        $('.fin', printContent)?.remove();
        $('.dp-actions', printContent)?.remove();

        const w = window.open('', '_blank');
        w.document.write(`
            <html>
                <head>
                    <title>In phiếu xuất hủy</title>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 13px; }
                        th { background: #f8fafc; }
                    </style>
                </head>
                <body>
                    <h3 class="text-center mb-4">PHIẾU XUẤT HỦY</h3>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); w.close(); }, 350);
    }

    /* ===== XUẤT EXCEL ===== */
    const btnExpList = $('#btnExpList');
    if (btnExpList) {
        btnExpList.addEventListener('click', () => {
            window.location.href = `${exportUrl}?type=list&${buildFilterQuery()}`;
        });
    }

    const btnExpDetail = $('#btnExpDetail');
    if (btnExpDetail) {
        btnExpDetail.addEventListener('click', () => {
            window.location.href = `${exportUrl}?type=detail&${buildFilterQuery()}`;
        });
    }

    /* ===== RESET BỘ LỌC ===== */
    function resetAllFilters() {
        F.q = '';
        F.preset = 'THANG_NAY';
        F.mode = 'preset';
        F.from = null;
        F.to = null;
        F.statuses = ['NHAP', 'DA_XAC_NHAN'];
        F.creatorIds = [];
        F.confirmerIds = [];
        F.daDanhDau = false;
        F.page = 1;

        const kw = $('#keywordSearch');
        if (kw) kw.value = '';

        // Reset status checkboxes
        $$('input[name="stChk"]').forEach(chk => {
            chk.checked = F.statuses.includes(chk.value);
        });

        renderCreatorMultiSelect();
        renderConfirmerMultiSelect();
        loadTable();
    }

    /* ===== KHỞI TẠO BỘ LẮNG NGHE SỰ KIỆN ===== */
    function init() {
        // 1. Ô tìm kiếm với debounce
        const kwInp = $('#keywordSearch');
        if (kwInp) {
            let timer;
            kwInp.addEventListener('input', () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    F.q = kwInp.value.trim();
                    F.page = 1;
                    loadTable();
                }, 350);
            });
        }

        // 2. Trạng thái checkbox
        $$('input[name="stChk"]').forEach(chk => {
            chk.addEventListener('change', () => {
                F.statuses = $$('input[name="stChk"]:checked').map(c => c.value);
                F.page = 1;
                loadTable();
            });
        });

        // 3. Multi-select Người tạo & Người xuất hủy
        setupMultiSelectDropdown('#boxNguoiTao', '#dropdownNguoiTao', F.creatorIds, F.creatorNames, renderCreatorMultiSelect);
        setupMultiSelectDropdown('#boxNguoiXuatHuy', '#dropdownNguoiXuatHuy', F.confirmerIds, F.confirmerNames, renderConfirmerMultiSelect);

        // 4. LEGO: Tùy chọn hiển thị cột
        KiotFilter.initColumnToggle('#btnColsDropdown', '#colMenu', '#xuatHuyTable');

        // 5. Nút tải lại bảng
        const btnReload = $('#btnReloadTable');
        if (btnReload) btnReload.addEventListener('click', loadTable);

        // 6. Nút F4 thu gọn / mở rộng sidebar
        const btnTg = $('#btnToggleSidebar');
        const sideCol = $('#sidebarFilterCol');
        if (btnTg && sideCol) {
            btnTg.addEventListener('click', () => {
                F.collapsed = !F.collapsed;
                sideCol.classList.toggle('collapsed', F.collapsed);
                const ic = $('#sidebarToggleIcon');
                if (ic) ic.className = F.collapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left';
            });
        }

        // 7. Phím tắt toàn cục F3, F4
        window.addEventListener('keydown', e => {
            if (e.key === 'F3') {
                e.preventDefault();
                kwInp?.focus();
            } else if (e.key === 'F4') {
                e.preventDefault();
                btnTg?.click();
            }
        });

        // 8. Đăng ký bộ lắng nghe Date Filter nếu có
        window.addEventListener('kiot:date-changed', e => {
            if (e.detail) {
                F.mode = e.detail.mode;
                F.preset = e.detail.preset;
                F.from = e.detail.from;
                F.to = e.detail.to;
                F.page = 1;
                loadTable();
            }
        });
    }

    init();
})();
