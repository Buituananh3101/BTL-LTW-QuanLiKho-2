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

    // Trạng thái bộ lọc (Mặc định Tháng này theo chuẩn Screenshot 1 chuyên nghiệp)
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
        cols: { ma: 1, gt: 1, tg: 1, tgt: 0, kho: 1, nxh: 0, nt: 0, ghi: 1, st: 1 },
        openId: null
    };

    /* ===== CẬP NHẬT GIAO DIỆN BỘ LỌC (DOTS, PRESETS, RADIOS) ===== */
    function paintFilters() {
        const isPreset = F.mode === 'preset';
        const isAll = isPreset && (F.preset === 'ALL' || F.preset === 'TOANTHOIGIAN');

        const rdAll = $('#dateAll'), rdCustom = $('#dateCustom');
        if (rdAll) rdAll.checked = isPreset;
        if (rdCustom) rdCustom.checked = !isPreset;

        const dotDate = $('#dotDate');
        if (dotDate) {
            dotDate.classList.toggle('on', !isAll);
        }

        const dotSt = $('#dotSt');
        if (dotSt) {
            const isDefaultSt = F.statuses.length === 2 && F.statuses.includes('NHAP') && F.statuses.includes('DA_XAC_NHAN');
            dotSt.classList.toggle('on', !isDefaultSt);
        }

        const dotUser = $('#dotUser');
        if (dotUser) {
            dotUser.classList.toggle('on', F.creatorIds.length > 0);
        }

        const dotConfirmer = $('#dotConfirmer');
        if (dotConfirmer) {
            dotConfirmer.classList.toggle('on', F.confirmerIds.length > 0);
        }

        // Active state cho nút trong popupDateQuick
        $$('#popupDateQuick .quick-date-btn, #popupDateQuick .quick-date-pill-all').forEach(btn => {
            btn.classList.toggle('active', F.mode === 'preset' && btn.dataset.val === F.preset);
        });

        // Đồng bộ checkbox trạng thái
        $$('input[data-s]').forEach(chk => {
            chk.checked = F.statuses.includes(chk.dataset.s);
        });

        // Render box tag người tạo & người xuất hủy
        renderCreatorMultiSelect();
        renderConfirmerMultiSelect();
    }

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

        // Cache trước tên từ các mục trong dropdown HTML
        $$('.kiot-ms-item', dropdown).forEach(item => {
            const val = parseInt(item.dataset.val);
            const name = item.dataset.name || $('.kiot-ms-text', item)?.textContent.trim() || item.querySelector('span')?.textContent.trim();
            if (!isNaN(val) && name) namesMap[val] = name;
        });

        // 1. Click vào box để mở / đóng dropdown
        box.addEventListener('click', e => {
            // Nếu bấm vào nút xóa tag (dấu ×)
            const tagRemove = e.target.closest('.tag-remove, .kiot-tag-close');
            if (tagRemove) {
                e.stopPropagation();
                const pill = tagRemove.closest('.kiot-pill-tag') || tagRemove;
                const val = parseInt(pill.dataset.val);
                const idx = selectedIds.indexOf(val);
                if (idx !== -1) {
                    selectedIds.splice(idx, 1);
                    renderFn();
                    paintFilters();
                    F.page = 1;
                    loadTable();
                }
                return;
            }

            e.stopPropagation();

            // Đóng các dropdown khác và calendar popups
            $$('.kiot-ms-dropdown').forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('show', 'drop-up');
                    d.style.maxHeight = '';
                }
            });
            $$('.kiot-multiselect-box').forEach(b => {
                if (b !== box) b.classList.remove('open');
            });
            if (window.jQuery) {
                window.jQuery('.quick-date-popup, .dual-calendar-popup').hide();
            }

            const willShow = !dropdown.classList.contains('show');
            if (willShow) {
                if (typeof KiotFilter.checkSidebarDropdownDirection === 'function') {
                    KiotFilter.checkSidebarDropdownDirection(box, dropdown);
                }
                dropdown.classList.add('show');
                box.classList.add('open');
                const searchInput = $('input', dropdown);
                if (searchInput) {
                    searchInput.value = '';
                    $$('.kiot-ms-item', dropdown).forEach(it => it.style.display = '');
                    searchInput.focus();
                }
            } else {
                dropdown.classList.remove('show', 'drop-up');
                dropdown.style.maxHeight = '';
                box.classList.remove('open');
            }
        });

        // 2. Click chọn / bỏ chọn mục trong dropdown
        dropdown.addEventListener('click', e => {
            const item = e.target.closest('.kiot-ms-item');
            if (!item) return;
            e.stopPropagation();
            const val = parseInt(item.dataset.val);
            if (isNaN(val)) return;

            const name = item.dataset.name || $('.kiot-ms-text', item)?.textContent.trim() || item.querySelector('span')?.textContent.trim();
            const idx = selectedIds.indexOf(val);
            if (idx >= 0) {
                selectedIds.splice(idx, 1);
            } else {
                selectedIds.push(val);
                if (name) namesMap[val] = name;
            }

            renderFn();
            paintFilters();
            F.page = 1;
            loadTable();
        });

        // 3. Tìm kiếm nội bộ trong dropdown
        const searchInput = $('.kiot-ms-search input', dropdown) || $('input[type="text"]', dropdown);
        if (searchInput) {
            searchInput.addEventListener('click', e => e.stopPropagation());
            searchInput.addEventListener('input', e => {
                e.stopPropagation();
                const term = searchInput.value.trim().toLowerCase();
                $$('.kiot-ms-item', dropdown).forEach(item => {
                    const text = (item.dataset.name || $('.kiot-ms-text', item)?.textContent || item.textContent || '').trim().toLowerCase();
                    item.style.display = (!term || text.includes(term)) ? '' : 'none';
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
            if (F.from) {
                const f = typeof F.from === 'string' ? F.from : KiotFilter.formatDateISO(F.from);
                p.set('FromDate', f);
            }
            if (F.to) {
                const t = typeof F.to === 'string' ? F.to : KiotFilter.formatDateISO(F.to);
                p.set('ToDate', t);
            }
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
        const wrap = $('#tableWrapper');
        if (!wrap) return;
        wrap.style.opacity = '0.5';

        try {
            const res = await fetch(`${filterUrl}?${buildFilterQuery()}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (!res.ok) throw new Error('Network response was not ok');
            const html = await res.text();
            wrap.innerHTML = html;

            // Áp dụng lại hiển thị cột & gắn lại sự kiện
            applyColVisibility();
            bindTableEvents();

            if (F.openId) {
                expandXuatHuyRow(F.openId, false);
            }
        } catch (err) {
            console.error('Lỗi khi tải bảng xuất hủy:', err);
            if (window.KiotToast) KiotToast.error('Không thể tải dữ liệu bảng.');
        } finally {
            wrap.style.opacity = '1';
        }
    }

    /* ===== QUẢN LÝ ẨN / HIỆN CỘT BẢNG (COLUMN VISIBILITY) QUA LEGO KIOTFILTER ===== */
    const STORAGE_COLS_KEY = 'kiot_xuathuy_cols_v2';
    const DEFAULT_XH_COLS = {
        ma: 1,
        gt: 1,
        tg: 1,
        tgt: 0,
        kho: 1,
        nxh: 0,
        nt: 0,
        ghi: 1,
        st: 1
    };
    let xhColumnToggler = null;

    function initColumnToggle() {
        if (typeof KiotFilter !== 'undefined' && typeof KiotFilter.initColumnToggle === 'function') {
            xhColumnToggler = KiotFilter.initColumnToggle({
                menuSelector: '#colMenu',
                tableSelector: '#xuatHuyTable',
                storageKey: STORAGE_COLS_KEY,
                defaultCols: DEFAULT_XH_COLS,
                extraColsCount: 2 // 1 cột checkbox + 1 cột sao luôn hiển thị
            });
        }
    }

    function applyColVisibility() {
        if (xhColumnToggler && typeof xhColumnToggler.apply === 'function') {
            xhColumnToggler.apply();
        }
    }

    /* ===== MASTER-DETAIL ACCORDION CHUẨN KIOTFILTER (THEO NHÀ CUNG CẤP) ===== */
    let xhRowDetailHandler = null;

    function initRowDetail() {
        if (typeof KiotFilter !== 'undefined' && typeof KiotFilter.initRowDetail === 'function') {
            xhRowDetailHandler = KiotFilter.initRowDetail({
                tableSelector: '#xuatHuyTable',
                rowSelector: 'tr.product-row',
                detailRowSelector: '#detail-{id}',
                wrapSelector: '.product-detail-panel-wrap',
                excludeClickSelector: 'input, button, a, label, .cell-checkbox, .cell-star, .star-btn, .w-chk, .w-star',
                slideDuration: 150,
                fadeDuration: 120,
                onOpen: function (id) {
                    F.openId = id;
                },
                onClose: function () {
                    F.openId = null;
                }
            });
        }
    }

    function expandXuatHuyRow(id, toggle = true) {
        if (!xhRowDetailHandler) return;
        if (toggle) {
            xhRowDetailHandler.toggle(id);
        } else {
            xhRowDetailHandler.expand(id);
        }
    }

    /* ===== SỰ KIỆN TRÊN BẢNG (CHECKBOX, INNER SEARCH, ACTIONS) ===== */
    function bindTableEvents() {
        const wrap = $('#tableWrapper');
        if (!wrap) return;

        // Reset bộ lọc khi trống
        const resetLink = $('#resetF', wrap);
        if (resetLink) resetLink.onclick = resetAllFilters;

        // Chọn tất cả dòng
        const chkAll = $('#selectAllRows', wrap);
        if (chkAll) {
            chkAll.onchange = e => {
                $$('#xuatHuyTable .row-select', wrap).forEach(c => c.checked = e.target.checked);
            };
        }
        wrap.querySelectorAll('#xuatHuyTable .row-select').forEach(chk => {
            chk.onchange = () => {
                const all = wrap.querySelectorAll('#xuatHuyTable .row-select');
                const checked = wrap.querySelectorAll('#xuatHuyTable .row-select:checked');
                if (chkAll) chkAll.checked = all.length > 0 && all.length === checked.length;
            };
        });

        // Lọc trong bảng chi tiết dòng (mã hàng & tên hàng)
        wrap.oninput = e => {
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
        };

        // Nút Lưu ghi chú trong chi tiết
        $$('.btn-save-note', wrap).forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id);
                const dp = btn.closest('.dp');
                const noteText = $('.dp-note', dp)?.value || '';
                saveNote(id, noteText);
            };
        });

        // Nút Hủy bỏ phiếu xuất hủy trong chi tiết
        $$('.btn-cancel-doc', wrap).forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id);
                const code = btn.dataset.code || ('XH' + id);
                confirmCancelDoc(id, code);
            };
        });

        // Sắp xếp cột
        $$('.sortable-th', wrap).forEach(th => {
            if (th.classList.contains('th-checkbox') || th.classList.contains('th-star')) return;
            th.onclick = () => {
                const col = th.dataset.col;
                if (F.sortBy === col) {
                    if (F.sortDir === 'asc') F.sortDir = 'desc';
                    else if (F.sortDir === 'desc') { F.sortBy = ''; F.sortDir = ''; }
                } else {
                    F.sortBy = col;
                    F.sortDir = 'asc';
                }
                F.page = 1;
                loadTable();
            };
        });

        // Click chuyển trang trong Pagination
        $$('.page-ajax, .kiot-page-link', wrap).forEach(a => {
            a.onclick = e => {
                e.preventDefault();
                const p = parseInt(a.dataset.page);
                if (p > 0) {
                    F.page = p;
                    loadTable();
                }
            };
        });
    }

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
        F.sortBy = '';
        F.sortDir = '';
        F.page = 1;

        const kw = $('#keywordSearch');
        if (kw) kw.value = '';

        const starHeader = $('#starHeaderFilter');
        if (starHeader) {
            starHeader.classList.remove('starred');
            const icon = $('i', starHeader);
            if (icon) icon.className = 'bi bi-star';
        }

        const dateRangeText = $('#textDateRange');
        if (dateRangeText) dateRangeText.textContent = 'Tháng này';

        paintFilters();
        loadTable();
    }

    /* ===== KHỞI TẠO BỘ LẮNG NGHE SỰ KIỆN ===== */
    function init() {
        // 1. Ô tìm kiếm với debounce 350ms
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

        // 2. Khởi tạo Bộ lọc Thời gian dùng KiotFilter.initDateFilter
        if (typeof KiotFilter !== 'undefined' && typeof KiotFilter.initDateFilter === 'function') {
            KiotFilter.initDateFilter('date', function (from, to, text, val) {
                if (val === 'CUSTOM') {
                    F.mode = 'custom';
                    F.preset = 'CUSTOM';
                    F.from = from ? new Date(from) : null;
                    F.to = to ? new Date(to) : null;
                } else {
                    F.mode = 'preset';
                    F.preset = val || 'THANG_NAY';
                    F.from = null;
                    F.to = null;
                }
                F.page = 1;
                paintFilters();
                loadTable();
            });
        }

        // 3. Checkbox trạng thái [data-s]
        $$('input[data-s]').forEach(chk => {
            chk.addEventListener('change', () => {
                const s = chk.dataset.s;
                if (chk.checked) {
                    if (!F.statuses.includes(s)) F.statuses.push(s);
                } else {
                    F.statuses = F.statuses.filter(x => x !== s);
                }
                F.page = 1;
                paintFilters();
                loadTable();
            });
        });

        // 4. Multi-select Người tạo & Người xuất hủy
        setupMultiSelectDropdown('#boxNguoiTao', '#dropdownNguoiTao', F.creatorIds, F.creatorNames, renderCreatorMultiSelect);
        setupMultiSelectDropdown('#boxNguoiXuatHuy', '#dropdownNguoiXuatHuy', F.confirmerIds, F.confirmerNames, renderConfirmerMultiSelect);

        // 5. Đóng popup khi cuộn sidebar hoặc click ngoài hoặc nhấn Escape
        $('.kiot-filter-box')?.addEventListener('scroll', function () {
            if (window.jQuery) window.jQuery('.quick-date-popup, .dual-calendar-popup').hide();
            const openDropdown = $('.kiot-ms-dropdown.show');
            if (openDropdown) {
                const box = openDropdown.parentElement?.querySelector('.kiot-multiselect-box');
                if (box && typeof KiotFilter.checkSidebarDropdownDirection === 'function') {
                    KiotFilter.checkSidebarDropdownDirection(box, openDropdown);
                }
            }
        });

        document.addEventListener('click', function (e) {
            if (!document.contains(e.target)) return;
            if (e.target.closest('.dual-calendar-popup, .quick-date-popup')) return;

            const targetBlock = e.target.closest('.f-block');
            if (!targetBlock) {
                if (window.jQuery) window.jQuery('.quick-date-popup, .dual-calendar-popup').hide();
                $$('.kiot-ms-dropdown').forEach(d => {
                    d.classList.remove('show', 'drop-up');
                    d.style.maxHeight = '';
                });
                $$('.kiot-multiselect-box').forEach(b => b.classList.remove('open'));
            } else {
                if (window.jQuery) {
                    window.jQuery('.dual-calendar-popup, .quick-date-popup').not(window.jQuery(targetBlock).find('.dual-calendar-popup, .quick-date-popup')).hide();
                }
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

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                if (window.jQuery) window.jQuery('.quick-date-popup, .dual-calendar-popup').hide();
                $$('.kiot-ms-dropdown').forEach(d => {
                    d.classList.remove('show', 'drop-up');
                    d.style.maxHeight = '';
                });
                $$('.kiot-multiselect-box').forEach(b => b.classList.remove('open'));
            }
        });

        // 6. LEGO: Tùy chọn hiển thị cột
        initColumnToggle();

        // 6.1. LEGO: Master-Detail row accordion chuẩn Nhà cung cấp
        initRowDetail();

        // 7. Gắn sự kiện bảng ban đầu
        bindTableEvents();

        // 8. Nút tải lại bảng
        const btnReload = $('#btnReloadTable');
        if (btnReload) {
            btnReload.onclick = () => {
                btnReload.classList.add('spinning');
                loadTable();
                setTimeout(() => btnReload.classList.remove('spinning'), 600);
            };
        }

        // 9. Nút F4 thu gọn / mở rộng sidebar
        const btnTg = $('#btnToggleSidebar');
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
        if (btnTg) btnTg.onclick = toggleSidebar;

        // 10. Drawer bộ lọc trên mobile / zoom in
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

        // 11. Phím tắt toàn cục F3, F4
        window.addEventListener('keydown', e => {
            if (e.key === 'F3') {
                e.preventDefault();
                kwInp?.focus();
            } else if (e.key === 'F4') {
                e.preventDefault();
                toggleSidebar();
            }
        });

        // 12. Vẽ bộ lọc ban đầu
        paintFilters();
    }

    init();
})();
