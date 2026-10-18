/**
 * phieu-kiem-ke-index.js - Quản lý tương tác màn hình danh sách phiếu kiểm kho
 * Chuẩn hóa 100% theo khuôn mẫu LEGO KiotViet của module Danh sách hàng hóa
 */
(function () {
    'use strict';

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const $jq = window.jQuery;
    const app = $('#kiotContainer') || $('#kkIndexApp');
    if (!app) return;

    const filterUrl = app.dataset.filterUrl;
    const noteUrl = app.dataset.noteUrl;
    const cancelUrl = app.dataset.cancelUrl;
    const exportUrl = app.dataset.exportUrl;
    const toggleStarUrl = app.dataset.toggleStarUrl || '/PhieuKiemKe/ToggleFavorite';
    let isStarredFilterActive = app.dataset.isStarred === 'true';
    let currentWhId = parseInt(app.dataset.warehouseId) || 0;

    // Trạng thái bộ lọc (Mặc định ALL - Toàn thời gian chuẩn Hàng hóa)
    const F = {
        q: '',
        mode: 'preset',
        preset: 'ALL',
        from: null,
        to: null,
        statuses: ['NHAP', 'DA_DIEU_CHINH'],
        creatorIds: [],
        creatorNames: {},
        daDanhDau: isStarredFilterActive,
        sortBy: app.dataset.sortBy || '',
        sortDir: app.dataset.sortDir || '',
        page: 1,
        size: 15,
        cols: { ma: 1, tg: 1, tt: 1, cl: 1, tang: 1, giam: 1, cb: 1, slt: 1, ghi: 1, st: 1, kho: 1 },
        collapsed: false,
        openId: null
    };

    const formatDateVN = KiotFilter.formatDateVN;
    const formatDateISO = KiotFilter.formatDateISO;


    /* ===== TIỆN ÍCH DÙNG CHUNG TỪ KIOTFILTER ===== */
    const escapeHtml = KiotFilter.escapeHtml;
    const checkSidebarDropdownDirection = KiotFilter.checkSidebarDropdownDirection;

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

        const selectedItems = selectedIds.map(id => ({
            val: id,
            name: F.creatorNames[id] || ('NV ' + id)
        }));
        KiotFilter.renderTagPills(box, selectedItems, 'Chọn người tạo', 3);
    }

    /* ===== CẬP NHẬT GIAO DIỆN BỘ LỌC ===== */
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
            const isDefaultSt = F.statuses.length === 2 && F.statuses.includes('NHAP') && F.statuses.includes('DA_DIEU_CHINH');
            dotSt.classList.toggle('on', !isDefaultSt);
        }

        const dotUser = $('#dotUser');
        if (dotUser) {
            dotUser.classList.toggle('on', F.creatorIds.length > 0);
        }

        // Active state cho nút trong popupDateQuick
        $$('#popupDateQuick .quick-date-btn, #popupDateQuick .quick-date-pill-all').forEach(btn => {
            btn.classList.toggle('active', F.mode === 'preset' && btn.dataset.val === F.preset);
        });

        // Render box người tạo chuẩn KiotViet
        renderCreatorMultiSelect();
    }

    /* ===== NẠP BẢNG DỮ LIỆU BẰNG AJAX ===== */
    let searchTimer = null;
    function loadTable() {
        const params = new URLSearchParams();

        if (F.q.trim()) params.append('Q', F.q.trim());
        if (F.mode === 'preset') {
            params.append('DateFilterType', F.preset || 'ALL');
        } else {
            params.append('DateFilterType', 'CUSTOM');
            if (F.from) params.append('FromDate', formatDateISO(F.from));
            if (F.to) params.append('ToDate', formatDateISO(F.to));
        }

        F.statuses.forEach(s => params.append('Statuses', s));
        F.creatorIds.forEach(id => params.append('CreatorIds', id));

        if (F.daDanhDau) {
            params.append('DaDanhDau', 'true');
        }

        if (F.sortBy) {
            params.append('SortBy', F.sortBy);
            params.append('SortDir', F.sortDir || 'asc');
        }

        params.append('Page', F.page);
        params.append('PageSize', F.size);

        const wrap = $('#tableWrapper');
        if (wrap) wrap.style.opacity = '0.6';

        fetch(`${filterUrl}?${params.toString()}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(res => res.text())
        .then(html => {
            if (wrap) {
                wrap.innerHTML = html;
                wrap.style.opacity = '1';
            }
            applyColumnVisibility();
            bindTableEvents();
            if (F.openId && kiemKhoRowDetail) {
                kiemKhoRowDetail.expand(F.openId);
            }
        })
        .catch(err => {
            if (wrap) wrap.style.opacity = '1';
            console.error('Lỗi khi tải bảng kiểm kho:', err);
            toast('Không thể tải dữ liệu bảng kiểm kho.');
        });
    }

    let kiemKhoColumnToggler = null;

    function initColumnToggle() {
        kiemKhoColumnToggler = KiotFilter.initColumnToggle({
            menuSelector: '#colMenu',
            tableSelector: '#stockTakeTable',
            storageKey: 'kiemkho_cols',
            defaultCols: { ma: 1, tg: 1, tt: 1, cl: 1, tang: 1, giam: 1, cb: 1, slt: 1, ghi: 1, st: 1, kho: 1 },
            extraColsCount: 2 // 1 chk + 1 star
        });
    }

    function applyColumnVisibility() {
        if (kiemKhoColumnToggler && typeof kiemKhoColumnToggler.apply === 'function') {
            kiemKhoColumnToggler.apply();
        }
    }

    let kiemKhoRowDetail = null;

    function initRowDetail() {
        kiemKhoRowDetail = KiotFilter.initRowDetail({
            tableSelector: '#stockTakeTable',
            rowSelector: 'tr.product-row, tr.tbl-row',
            detailRowSelector: '#dtl-{id}',
            wrapSelector: '.product-detail-panel-wrap, .kiot-detail-panel-wrap',
            tabBtnSelector: '.dp-tab',
            tabPaneSelector: '.dp-pane',
            excludeClickSelector: 'input, button, a, label, .w-chk, .w-star, .cell-star, .star-btn, .cell-checkbox, .row-select',
            onOpen: function (id) {
                F.openId = id;
            },
            onClose: function () {
                F.openId = null;
            }
        });
    }

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
                    toast(res.message || 'Đã hủy phiếu kiểm thành công.');
                    loadTable();
                } else {
                    toast(res.message || 'Không thể hủy phiếu.');
                }
            })
            .catch(() => toast('Lỗi kết nối máy chủ.'));
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
        KiotFilter.initEntityActions({
            containerSelector: '#tableWrapper',
            deleteSelector: '.btn-cancel-doc',
            onDelete: function (id, name, btn) {
                handleCancelStockTake(id, btn);
            }
        });
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
            const p = new URLSearchParams();
            p.append('type', type);
            if (F.q.trim()) p.append('Q', F.q.trim());
            if (F.mode === 'preset') {
                p.append('DateFilterType', F.preset || 'ALL');
            } else {
                p.append('DateFilterType', 'CUSTOM');
                if (F.from) p.append('FromDate', formatDateISO(F.from));
                if (F.to) p.append('ToDate', formatDateISO(F.to));
            }
            F.statuses.forEach(s => p.append('Statuses', s));
            F.creatorIds.forEach(id => p.append('CreatorIds', id));
            if (F.daDanhDau) p.append('DaDanhDau', 'true');
            if (F.sortBy) {
                p.append('SortBy', F.sortBy);
                p.append('SortDir', F.sortDir || 'asc');
            }
            window.location.href = `${exportUrl}?${p.toString()}`;
            toast('Đang xuất file dữ liệu...');
        }

        // Khởi tạo Bộ lọc Thời gian dùng KiotFilter.initDateFilter
        KiotFilter.initDateFilter('date', function (from, to, text, val) {
            if (val === 'CUSTOM') {
                F.mode = 'custom';
                F.preset = 'CUSTOM';
                F.from = from ? new Date(from) : null;
                F.to = to ? new Date(to) : null;
            } else {
                F.mode = 'preset';
                F.preset = val || 'ALL';
                F.from = null;
                F.to = null;
            }
            F.page = 1;
            paintFilters();
            loadTable();
        });


        // 6. Đóng popup khi cuộn sidebar hoặc click ngoài hoặc phím ESC
        $jq('.kiot-filter-box').on('scroll', function () {
            $jq('.quick-date-popup, .dual-calendar-popup').hide();
            const openDropdown = $('.kiot-ms-dropdown.show');
            if (openDropdown) {
                const box = openDropdown.parentElement?.querySelector('.kiot-multiselect-box');
                if (box) checkSidebarDropdownDirection(box, openDropdown);
            }
        });

        $jq(document).on('click', function (e) {
            if (!document.contains(e.target)) return;
            if ($jq(e.target).closest('.dual-calendar-popup, .quick-date-popup').length) return;

            const $targetBlock = $jq(e.target).closest('.f-block');
            if (!$targetBlock.length) {
                $jq('.quick-date-popup, .dual-calendar-popup').hide();
                $jq('.kiot-ms-dropdown').removeClass('show drop-up').css('max-height', '');
                $jq('.kiot-multiselect-box').removeClass('open');
            } else {
                $jq('.dual-calendar-popup').not($targetBlock.find('.dual-calendar-popup')).hide();
                $jq('.quick-date-popup').not($targetBlock.find('.quick-date-popup')).hide();
                $jq('.kiot-ms-dropdown').not($targetBlock.find('.kiot-ms-dropdown')).removeClass('show drop-up').css('max-height', '');
                $jq('.kiot-multiselect-box').not($targetBlock.find('.kiot-multiselect-box')).removeClass('open');
            }
        });

        $jq(document).on('keydown', function (e) {
            if (e.key === 'Escape') {
                $jq('.quick-date-popup, .dual-calendar-popup').hide();
                $jq('.kiot-ms-dropdown').removeClass('show drop-up').css('max-height', '');
                $jq('.kiot-multiselect-box').removeClass('open');
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
                F.preset = 'ALL';
                F.from = null;
                F.to = null;
                F.statuses = ['NHAP', 'DA_DIEU_CHINH'];
                F.creatorIds = [];
                F.daDanhDau = false;
                F.sortBy = '';
                F.sortDir = '';
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
                    toast(res.message || 'Đã lưu ghi chú.');
                    const noteCell = $(`tr.tbl-row[data-id="${id}"] [data-col="ghi"]`);
                    if (noteCell) noteCell.textContent = note;
                } else {
                    toast(res.message || 'Lỗi khi lưu ghi chú.');
                }
            })
            .catch(() => toast('Lỗi kết nối khi lưu ghi chú.'));
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
    function toast(msg, type) {
        if (window.KiotToast) {
            window.KiotToast.show(msg, type || 'info');
        } else {
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
    }

    /* ===== TÍNH NĂNG ĐÁNH DẤU SAO (CHUẨN HÀNG HÓA) ===== */
    window.toggleFavoriteStockTake = function (e, id, el) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const cell = el || (e ? e.target.closest('.cell-star, .star-btn') : null);
        const btn = cell ? (cell.classList.contains('star-btn') ? cell : cell.querySelector('.star-btn')) : null;
        if (!btn || !id) return;

        fetch(`${toggleStarUrl}?id=${id}`, {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(r => r.json())
        .then(res => {
            if (res && res.success) {
                if (res.isFavorite) {
                    btn.classList.add('starred');
                    btn.setAttribute('title', 'Bỏ đánh dấu sao');
                    btn.innerHTML = '<i class="bi bi-star-fill"></i>';
                } else {
                    btn.classList.remove('starred');
                    btn.setAttribute('title', 'Đánh dấu sao');
                    btn.innerHTML = '<i class="bi bi-star"></i>';

                    if (F.daDanhDau) {
                        const tr = btn.closest('tr');
                        const dtl = document.getElementById(`dtl-${id}`);
                        if (dtl) dtl.remove();
                        if (tr) {
                            tr.remove();
                            if ($$('#stockTakeTable tbody tr.tbl-row').length === 0) {
                                loadTable();
                            }
                        }
                    }
                }
            }
        })
        .catch(err => {
            console.error('Lỗi khi cập nhật đánh dấu sao:', err);
            toast('Có lỗi khi cập nhật đánh dấu sao.');
        });
    };

    window.toggleStarHeaderFilter = function (e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        F.daDanhDau = !F.daDanhDau;
        F.page = 1;
        loadTable();
    };

    document.addEventListener('click', e => {
        const headerStar = e.target.closest('#starHeaderFilter');
        if (headerStar) {
            window.toggleStarHeaderFilter(e);
            return;
        }
        const starBtn = e.target.closest('.star-btn:not(#starHeaderFilter)');
        if (starBtn && starBtn.dataset.id) {
            window.toggleFavoriteStockTake(e, starBtn.dataset.id, starBtn);
            return;
        }
    });

    // Sắp xếp cột 3 trạng thái (ASC -> DESC -> Bỏ sắp xếp) chuẩn Danh sách hàng hóa
    $jq(document).on('click', '#stockTakeTable thead th.sortable-th', function (e) {
        e.preventDefault();
        const col = $jq(this).data('col');
        if (!col) return;

        if (F.sortBy === col) {
            if (F.sortDir === 'asc') {
                F.sortDir = 'desc';
            } else if (F.sortDir === 'desc') {
                F.sortBy = '';
                F.sortDir = '';
            } else {
                F.sortDir = 'asc';
            }
        } else {
            F.sortBy = col;
            F.sortDir = 'asc';
        }

        F.page = 1;
        loadTable();
    });

    // Khởi tạo ban đầu
    bindSidebarEvents();
    bindTableEvents();
    initColumnToggle();
    initRowDetail();
    initEntityActions();
    paintFilters();
})();
