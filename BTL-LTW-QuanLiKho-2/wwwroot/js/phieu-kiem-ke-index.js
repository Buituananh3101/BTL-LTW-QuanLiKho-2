/**
 * phieu-kiem-ke-index.js - Quản lý tương tác màn hình danh sách phiếu kiểm kho
 * Tái cấu trúc chuẩn hóa qua KiotFilter.createListPage (Lego Engine)
 */
(function () {
    'use strict';

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const $jq = window.jQuery;
    const app = $('#kiotContainer') || $('#kkIndexApp');
    if (!app) return;

    const noteUrl = app.dataset.noteUrl || '/PhieuKiemKe/UpdateNote';
    const cancelUrl = app.dataset.cancelUrl || '/PhieuKiemKe/Cancel';
    const exportUrl = app.dataset.exportUrl || '/PhieuKiemKe/Export';

    // Khởi tạo trang qua KiotFilter.createListPage
    const listPage = (window.KiotFilter && typeof KiotFilter.createListPage === 'function')
        ? KiotFilter.createListPage({
            containerSelector: '#kiotContainer, #kkIndexApp',
            tableSelector: '#stockTakeTable',
            tableWrapperSelector: '#tableWrapper',
            searchInputSelector: '#keywordSearch, #q',
            storageKeyCols: 'kiemkho_cols',
            defaultCols: { ma: 1, tg: 1, tt: 1, cl: 1, tang: 1, giam: 1, cb: 1, slt: 1, ghi: 1, st: 1, kho: 1 },
            extraColsCount: 2,
            initialState: {
                preset: 'ALL',
                statuses: ['NHAP', 'DA_DIEU_CHINH'],
                creatorIds: [],
                creatorNames: {}
            },
            dateFilterId: 'date',
            rowDetailOptions: {
                tableSelector: '#stockTakeTable',
                rowSelector: 'tr.product-row, tr.tbl-row',
                detailRowSelector: '#dtl-{id}',
                wrapSelector: '.product-detail-panel-wrap, .kiot-detail-panel-wrap',
                tabBtnSelector: '.dp-tab',
                tabPaneSelector: '.dp-pane'
            },
            buildParams: function (params, state) {
                if (Array.isArray(state.creatorIds)) {
                    state.creatorIds.forEach(id => params.append('CreatorIds', id));
                }
            },
            onPaintFilters: function (state) {
                paintFilters(state);
            },
            onTableLoaded: function ($wrap, state) {
                initEntityActions();
                bindTableEvents();
            }
        })
        : null;

    const F = listPage ? listPage.state : {};
    const loadTable = listPage ? listPage.loadTable : function () {};

    /* ===== CẬP NHẬT GIAO DIỆN BỘ LỌC ===== */
    function paintFilters(state) {
        const curF = state || F;
        const isPreset = curF.mode === 'preset';
        const isAll = isPreset && (curF.preset === 'ALL' || curF.preset === 'TOANTHOIGIAN');

        const rdAll = $('#dateAll'), rdCustom = $('#dateCustom');
        if (rdAll) rdAll.checked = isPreset;
        if (rdCustom) rdCustom.checked = !isPreset;

        const dotDate = $('#dotDate');
        if (dotDate) dotDate.classList.toggle('on', !isAll);

        const dotSt = $('#dotSt');
        if (dotSt) {
            const isDefaultSt = curF.statuses.length === 2 && curF.statuses.includes('NHAP') && curF.statuses.includes('DA_DIEU_CHINH');
            dotSt.classList.toggle('on', !isDefaultSt);
        }

        const dotUser = $('#dotUser');
        if (dotUser) dotUser.classList.toggle('on', (curF.creatorIds || []).length > 0);

        $$('#popupDateQuick .quick-date-btn, #popupDateQuick .quick-date-pill-all').forEach(btn => {
            btn.classList.toggle('active', curF.mode === 'preset' && btn.dataset.val === curF.preset);
        });

        renderCreatorMultiSelect();
    }

    /* ===== MULTISELECT NGƯỜI TẠO ===== */
    function renderCreatorMultiSelect() {
        const box = $('#boxNguoiTao');
        const dropdown = $('#dropdownNguoiTao');
        if (!box || !dropdown) return;

        const selectedIds = F.creatorIds || [];
        const dot = $('#dotUser');
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
            name: F.creatorNames[id] || ('NV ' + id)
        }));
        if (window.KiotFilter && typeof KiotFilter.renderTagPills === 'function') {
            KiotFilter.renderTagPills(box, selectedItems, 'Chọn người tạo', 3);
        }
    }

    /* ===== HỦY PHIẾU KIỂM KHO ===== */
    function handleCancelStockTake(id, btn) {
        id = parseInt(id);
        const code = btn.dataset.code || ('PKK' + id);
        const status = btn.dataset.status || '';

        if (status === 'DA_DIEU_CHINH') {
            if (window.KiotConfirm) {
                window.KiotConfirm.alert(`Phiếu kiểm <strong>${code}</strong> đã cân bằng kho, không được phép hủy theo quy định.`, 'Cảnh báo');
            } else {
                alert(`Phiếu kiểm ${code} đã cân bằng kho, không được phép hủy theo quy định.`);
            }
            return;
        }
        if (status === 'HUY') {
            if (window.KiotConfirm) {
                window.KiotConfirm.alert(`Phiếu kiểm <strong>${code}</strong> đã được hủy trước đó.`, 'Thông báo');
            } else {
                alert(`Phiếu kiểm ${code} đã được hủy trước đó.`);
            }
            return;
        }

        const doCancel = () => {
            fetch(`${cancelUrl}/${id}`, { method: 'POST' })
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    if (window.KiotToast) KiotToast.success(res.message || 'Đã hủy phiếu kiểm thành công.');
                    loadTable();
                } else {
                    if (window.KiotToast) KiotToast.error(res.message || 'Không thể hủy phiếu.');
                }
            })
            .catch(() => {
                if (window.KiotToast) KiotToast.error('Lỗi kết nối máy chủ.');
            });
        };

        if (window.KiotConfirm) {
            window.KiotConfirm.show({
                title: 'Hủy phiếu kiểm kho',
                message: `Bạn có chắc chắn muốn hủy phiếu kiểm <strong style="color: #111827;">${code}</strong>? Thao tác này không thể hoàn tác.<br><span class="text-muted small">Phiếu tạm sau khi hủy sẽ không thể mở lại. Tồn kho không bị ảnh hưởng.</span>`,
                confirmText: 'Đồng ý hủy',
                onConfirm: doCancel
            });
        } else if (confirm(`Bạn có chắc chắn muốn hủy phiếu kiểm ${code}?\nPhiếu tạm sau khi hủy sẽ không thể mở lại. Tồn kho không bị ảnh hưởng.`)) {
            doCancel();
        }
    }

    function initEntityActions() {
        if (window.KiotFilter && typeof KiotFilter.initEntityActions === 'function') {
            KiotFilter.initEntityActions({
                containerSelector: '#tableWrapper',
                deleteSelector: '.btn-cancel-doc',
                onDelete: function (id, name, btn) {
                    handleCancelStockTake(id, btn);
                }
            });
        }
    }

    /* ===== SỰ KIỆN SIDEBAR ĐẶC THÙ ===== */
    function bindSidebarEvents() {
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
            const p = new URLSearchParams();
            p.append('type', type);
            if (F.q && F.q.trim()) p.append('Q', F.q.trim());
            if (F.mode === 'preset') {
                p.append('DateFilterType', F.preset || 'ALL');
            } else {
                p.append('DateFilterType', 'CUSTOM');
                if (F.fromDate) p.append('FromDate', typeof F.fromDate === 'string' ? F.fromDate : KiotFilter.formatDateISO(F.fromDate));
                if (F.toDate) p.append('ToDate', typeof F.toDate === 'string' ? F.toDate : KiotFilter.formatDateISO(F.toDate));
            }
            (F.statuses || []).forEach(s => p.append('Statuses', s));
            (F.creatorIds || []).forEach(id => p.append('CreatorIds', id));
            if (F.starred) p.append('DaDanhDau', 'true');
            if (F.sortBy) {
                p.append('SortBy', F.sortBy);
                p.append('SortDir', F.sortDir || 'asc');
            }
            window.location.href = `${exportUrl}?${p.toString()}`;
            if (window.KiotToast) KiotToast.info('Đang xuất file dữ liệu...');
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
                listPage ? listPage.reload(true) : loadTable();
            };
        });

        // Multi-select Người tạo
        const boxNguoiTao = $('#boxNguoiTao');
        const dropdownNguoiTao = $('#dropdownNguoiTao');

        if (boxNguoiTao && dropdownNguoiTao) {
            $$('.kiot-ms-item', dropdownNguoiTao).forEach(item => {
                const val = parseInt(item.dataset.val);
                const name = item.dataset.name || item.querySelector('span')?.textContent.trim();
                if (val && name) F.creatorNames[val] = name;
            });

            boxNguoiTao.addEventListener('click', e => {
                if (e.target.closest('.tag-remove')) return;
                e.stopPropagation();

                $$('.kiot-ms-dropdown').forEach(d => {
                    if (d !== dropdownNguoiTao) d.classList.remove('show', 'drop-up');
                });
                $$('.quick-date-popup, .dual-calendar-popup').forEach(p => p.style.display = 'none');

                const willShow = !dropdownNguoiTao.classList.contains('show');
                if (willShow) {
                    if (window.KiotFilter && typeof KiotFilter.checkSidebarDropdownDirection === 'function') {
                        KiotFilter.checkSidebarDropdownDirection(boxNguoiTao, dropdownNguoiTao);
                    }
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
                    boxNguoiTao.classList.remove('open');
                }
            });

            // Xóa tag
            boxNguoiTao.addEventListener('click', e => {
                const tagRemove = e.target.closest('.tag-remove');
                if (!tagRemove) return;
                e.stopPropagation();
                const pill = tagRemove.closest('.kiot-pill-tag');
                if (!pill) return;
                const id = parseInt(pill.dataset.val);
                F.creatorIds = (F.creatorIds || []).filter(x => x !== id);
                listPage ? listPage.reload(true) : loadTable();
            });

            // Chọn/bỏ chọn item người tạo
            dropdownNguoiTao.addEventListener('click', e => {
                const item = e.target.closest('.kiot-ms-item');
                if (!item) return;
                e.stopPropagation();
                const id = parseInt(item.dataset.val);
                const name = item.dataset.name || item.querySelector('span')?.textContent.trim();
                const idx = (F.creatorIds || []).indexOf(id);

                if (idx >= 0) {
                    F.creatorIds.splice(idx, 1);
                } else {
                    F.creatorIds.push(id);
                    if (name) F.creatorNames[id] = name;
                }

                listPage ? listPage.reload(true) : loadTable();
            });

            // Tìm kiếm người tạo
            const searchInput = $('.kiot-ms-search input', dropdownNguoiTao);
            if (searchInput) {
                searchInput.addEventListener('input', e => {
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
                F.preset = 'ALL';
                F.fromDate = null;
                F.toDate = null;
                F.statuses = ['NHAP', 'DA_DIEU_CHINH'];
                F.creatorIds = [];
                F.starred = false;
                F.sortBy = '';
                F.sortDir = '';
                const sInp = $('#keywordSearch') || $('#q');
                if (sInp) sInp.value = '';
                listPage ? listPage.reload(true) : loadTable();
            };
        }

        // Chọn tất cả dòng
        const chkAll = $('#chkAll', wrap);
        if (chkAll) {
            chkAll.onchange = e => {
                $$('input[data-sel]', wrap).forEach(c => c.checked = e.target.checked);
            };
        }

        // Lọc trong bảng chi tiết dòng (mã hàng & tên hàng)
        $jq('#tableWrapper').off('input.dtlSearch', '.dtl-search-code, .dtl-search-name').on('input.dtlSearch', '.dtl-search-code, .dtl-search-name', function () {
            const inp = this;
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
        });

        // Nút Lưu ghi chú trong chi tiết dòng
        $jq('#tableWrapper').off('click.saveNote', '.btn-save-note').on('click.saveNote', '.btn-save-note', function () {
            const btn = this;
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
                    if (window.KiotToast) KiotToast.success(res.message || 'Đã lưu ghi chú.');
                    const noteCell = $(`tr.tbl-row[data-id="${id}"] [data-col="ghi"]`);
                    if (noteCell) noteCell.textContent = note;
                } else {
                    if (window.KiotToast) KiotToast.error(res.message || 'Lỗi khi lưu ghi chú.');
                }
            })
            .catch(() => {
                if (window.KiotToast) KiotToast.error('Lỗi kết nối khi lưu ghi chú.');
            });
        });
    }

    // Khởi tạo ban đầu
    bindSidebarEvents();
    bindTableEvents();
    initEntityActions();
    listPage?.paintFilters();
})();
