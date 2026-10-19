/**
 * site.js – Thư viện tiện ích JavaScript dùng chung toàn hệ thống KhoPro
 */

window.KiotToast = (function () {
    'use strict';
    let toastTimer = null;

    function getOrCreateToastElement() {
        let el = document.getElementById('kiotGlobalToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'kiotGlobalToast';
            el.className = 'kiot-toast';
            document.body.appendChild(el);
        }
        return el;
    }

    function show(msg, type, duration) {
        if (!msg) return;
        type = type || 'info';
        duration = duration || 3000;

        const el = getOrCreateToastElement();
        clearTimeout(toastTimer);

        el.className = `kiot-toast show ${type}`;
        let iconHtml = '';
        if (type === 'success') {
            iconHtml = '<i class="bi bi-check-circle-fill text-success fs-6"></i>';
        } else if (type === 'error') {
            iconHtml = '<i class="bi bi-x-circle-fill text-danger fs-6"></i>';
        } else if (type === 'warning') {
            iconHtml = '<i class="bi bi-exclamation-triangle-fill text-warning fs-6"></i>';
        } else {
            iconHtml = '<i class="bi bi-info-circle-fill text-info fs-6"></i>';
        }

        el.innerHTML = `${iconHtml}<span>${msg}</span>`;

        toastTimer = setTimeout(() => {
            el.classList.remove('show');
        }, duration);
    }

    return {
        show: show,
        success: (msg, d) => show(msg, 'success', d),
        error: (msg, d) => show(msg, 'error', d),
        warning: (msg, d) => show(msg, 'warning', d),
        info: (msg, d) => show(msg, 'info', d)
    };
})();

// Bí danh tương thích ngược cho toàn bộ các hàm gọi cũ trong dự án
window.showToast = function (msg, type) {
    window.KiotToast.show(msg, type || 'success');
};
window.toast = function (msg, type) {
    window.KiotToast.show(msg, type || 'info');
};

// ========================================================================
// 2. KiotNumber – Tự động định dạng số hàng nghìn (1,000,000), tự select khi focus
// ========================================================================
window.KiotNumber = (function () {
    'use strict';

    function get(el) {
        if (!el) return 0;
        const val = typeof el === 'string' ? el : (el.value || '');
        const clean = String(val).replace(/[^\d.]/g, '');
        return Number(clean) || 0;
    }

    function format(val) {
        if (val === null || val === undefined || val === '') return '0';
        const num = Math.round(Number(val));
        return isNaN(num) ? '0' : num.toLocaleString('en-US');
    }

    // Lắng nghe sự kiện toàn cục cho mọi ô có class .kiot-num hoặc .hh-num hoặc .money
    document.addEventListener('input', function (e) {
        const el = e.target;
        if (!el || !el.classList) return;
        if (el.classList.contains('money')) {
            const d = el.value.replace(/\D/g, '');
            el.value = d ? Number(d).toLocaleString('en-US') : '';
            return;
        }
        if (!el.classList.contains('kiot-num') && !el.classList.contains('hh-num')) return;
        if (el.dataset.decimal === 'true' || el.id === 'formTrongLuong') {
            el.value = el.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') || '';
            return;
        }
        const d = el.value.replace(/\D/g, '');
        el.value = d ? Number(d).toLocaleString('en-US') : '';
    });

    document.addEventListener('focusin', function (e) {
        const el = e.target;
        if (el && el.classList && (el.classList.contains('kiot-num') || el.classList.contains('hh-num') || el.classList.contains('money'))) {
            el.select();
        }
    });

    document.addEventListener('focusout', function (e) {
        const el = e.target;
        if (el && el.classList && (el.classList.contains('kiot-num') || el.classList.contains('hh-num')) && el.value.trim() === '') {
            const defVal = el.dataset.default || (el.id === 'formTonCaoNhat' ? '999,999,999' : '0');
            el.value = defVal;
        }
    });

    return {
        get: get,
        format: format
    };
})();

// ========================================================================
// 3. KiotCollapsible – Tự động gập mở khối Accordion (.kiot-sec / .hh-sec)
// ========================================================================
document.addEventListener('click', function (e) {
    const header = e.target.closest('.kiot-sec-h, .hh-sec-h');
    if (header) {
        const sec = header.closest('.kiot-sec, .hh-sec');
        if (sec) {
            sec.classList.toggle('open');
        }
    }
});

// ========================================================================
// 4. KiotSplitButton – Tự động mở / đóng menu nút lưu đa năng (.kiot-split / .hh-split)
// ========================================================================
document.addEventListener('click', function (e) {
    const caret = e.target.closest('.kiot-split .caret, .hh-split .caret, #btnCaret');
    if (caret) {
        e.preventDefault();
        e.stopPropagation();
        const parent = caret.closest('.kiot-split, .hh-split') || caret.parentElement;
        const menu = parent ? parent.querySelector('.kiot-menu, .hh-menu, #hhSplitMenu') : null;
        if (menu) {
            menu.classList.toggle('show');
        }
        return;
    }

    if (!e.target.closest('.kiot-split, .hh-split')) {
        document.querySelectorAll('.kiot-split .kiot-menu, .hh-split .hh-menu, #hhSplitMenu').forEach(m => m.classList.remove('show'));
    }
});

// ========================================================================
// 5. KiotPrompt – Modal con dùng chung toàn hệ thống (Tạo mới nhanh / Sửa ✎ / Xóa)
// ========================================================================
window.KiotPrompt = (function () {
    'use strict';
    let currentSaveCallback = null;
    let currentDeleteCallback = null;

    function getOverlay() {
        return document.getElementById('kiotPromptOv');
    }

    function open(options) {
        const ov = getOverlay();
        if (!ov) return;
        const opt = Object.assign({
            title: 'Tạo mới',
            label: 'Tên',
            value: '',
            placeholder: '',
            showDelete: false,
            onSave: null,
            onDelete: null
        }, options);

        currentSaveCallback = opt.onSave;
        currentDeleteCallback = opt.onDelete;

        const titleEl = document.getElementById('kiotPromptTitle');
        const labelEl = document.getElementById('kiotPromptLabel');
        const inputEl = document.getElementById('kiotPromptInput');
        const errEl = document.getElementById('kiotPromptErr');
        const delBtn = document.getElementById('kiotPromptDelete');

        if (titleEl) titleEl.textContent = opt.title;
        if (labelEl) labelEl.textContent = opt.label;
        if (inputEl) {
            inputEl.value = opt.value || '';
            inputEl.placeholder = opt.placeholder || '';
            inputEl.classList.remove('is-invalid');
        }
        if (errEl) errEl.style.display = 'none';
        if (delBtn) delBtn.style.display = opt.showDelete ? 'inline-flex' : 'none';

        ov.classList.add('show');

        setTimeout(() => {
            if (inputEl) {
                inputEl.focus();
                inputEl.select();
            }
        }, 100);
    }

    function close() {
        const ov = getOverlay();
        if (ov) {
            ov.classList.remove('show');
        }
    }

    function handleSave() {
        const inputEl = document.getElementById('kiotPromptInput');
        const errEl = document.getElementById('kiotPromptErr');
        const val = inputEl ? inputEl.value.trim() : '';

        if (!val) {
            if (inputEl) inputEl.classList.add('is-invalid');
            if (errEl) {
                errEl.textContent = 'Vui lòng nhập thông tin.';
                errEl.style.display = 'block';
            }
            return;
        }

        if (currentSaveCallback) {
            const res = currentSaveCallback(val);
            if (res !== false) close();
        } else {
            close();
        }
    }

    function handleDelete() {
        close();
        if (window.KiotConfirm) {
            window.KiotConfirm.show({
                title: 'Xác nhận xóa',
                message: 'Bạn có chắc chắn muốn xóa mục này? Thao tác này không thể hoàn tác.',
                onConfirm: function () {
                    if (currentDeleteCallback) {
                        currentDeleteCallback();
                    }
                }
            });
        } else if (confirm('Bạn có chắc chắn muốn xóa mục này?')) {
            if (currentDeleteCallback) {
                currentDeleteCallback();
            }
        }
    }

    // Sự kiện toàn cục cho modal prompt
    document.addEventListener('click', function (e) {
        if (e.target.closest('#kiotPromptCancel, #kiotPromptClose') || e.target.id === 'kiotPromptOv') {
            close();
        } else if (e.target.closest('#kiotPromptSave')) {
            handleSave();
        } else if (e.target.closest('#kiotPromptDelete')) {
            handleDelete();
        }
    });

    document.addEventListener('keydown', function (e) {
        const ov = getOverlay();
        if (ov && ov.classList.contains('show')) {
            if (e.key === 'Escape') {
                close();
            } else if (e.key === 'Enter' && e.target.id === 'kiotPromptInput') {
                e.preventDefault();
                handleSave();
            }
        }
    });

    return {
        open: open,
        close: close
    };
})();

// ========================================================================
// 6. KiotConfirm – Modal xác nhận xóa / thông báo dùng chung (Chuẩn KiotViet, CENTER)
// ========================================================================
window.KiotConfirm = (function () {
    'use strict';
    let okCallback = null;

    function getOverlay() {
        return document.getElementById('kiotConfirmOv');
    }

    function show(options) {
        const ov = getOverlay();
        if (!ov) {
            if (options.onConfirm && confirm(options.message || 'Xác nhận?')) {
                options.onConfirm();
            }
            return;
        }

        const opt = Object.assign({
            title: 'Xóa hàng hóa',
            icon: 'bi-trash',
            iconColor: '#dc2626',
            message: 'Bạn có chắc chắn muốn xóa?',
            confirmText: 'Đồng ý xóa',
            confirmClass: 'btn btn-danger',
            cancelText: 'Bỏ qua',
            isAlert: false,
            onConfirm: null
        }, options);

        okCallback = opt.onConfirm;

        const titleEl = document.getElementById('kiotConfirmTitleText');
        const iconEl = document.getElementById('kiotConfirmIcon');
        const titleWrap = document.getElementById('kiotConfirmTitle');
        const bodyEl = document.getElementById('kiotConfirmMsg');
        const cancelBtn = document.getElementById('kiotConfirmCancel');
        const okBtn = document.getElementById('kiotConfirmOk');

        if (titleEl) titleEl.textContent = opt.title;
        if (iconEl) {
            iconEl.className = 'bi ' + (opt.icon || 'bi-trash');
            iconEl.style.color = opt.iconColor || '#dc2626';
        }
        if (titleWrap) {
            titleWrap.style.color = opt.iconColor || '#dc2626';
        }
        if (bodyEl) {
            if (typeof opt.message === 'string') {
                bodyEl.innerHTML = opt.message;
            }
        }
        if (cancelBtn) {
            cancelBtn.textContent = opt.cancelText || 'Bỏ qua';
            cancelBtn.style.display = opt.isAlert ? 'none' : 'inline-flex';
        }
        if (okBtn) {
            okBtn.textContent = opt.isAlert ? 'Đã hiểu' : (opt.confirmText || 'Đồng ý xóa');
            okBtn.className = opt.confirmClass || 'btn btn-danger';
        }

        ov.classList.add('show');
    }

    function close() {
        const ov = getOverlay();
        if (ov) ov.classList.remove('show');
        okCallback = null;
    }

    document.addEventListener('click', function (e) {
        if (e.target.closest('#kiotConfirmCancel, #kiotConfirmClose') || e.target.id === 'kiotConfirmOv') {
            close();
        } else if (e.target.closest('#kiotConfirmOk')) {
            const cb = okCallback;
            close();
            if (cb) cb();
        }
    });

    document.addEventListener('keydown', function (e) {
        const ov = getOverlay();
        if (ov && ov.classList.contains('show')) {
            if (e.key === 'Escape') {
                close();
            }
        }
    });

    return {
        show: show,
        close: close,
        alert: function (message, title = 'Thông báo') {
            show({
                title: title,
                icon: 'bi-info-circle',
                iconColor: '#2563eb',
                message: message,
                confirmText: 'Đã hiểu',
                confirmClass: 'btn btn-primary',
                isAlert: true
            });
        }
    };
})();

// ========================================================================
// 7. KiotHelp – Hộp thoại Hướng dẫn sử dụng toàn hệ thống (Chuẩn KiotViet)
// ========================================================================
window.KiotHelp = (function () {
    'use strict';

    const HELP_MAP = {
        HangHoa: {
            title: 'Quản lý Hàng hóa',
            badge: 'Hàng hóa',
            subtitle: 'Danh mục sản phẩm, giá bán, giá vốn và tồn kho đa chi nhánh',
            shortcuts: [
                { key: 'F3', desc: 'Đặt con trỏ vào ô tìm kiếm hàng hóa' },
                { key: 'F4', desc: 'Thu gọn / Mở rộng thanh lọc bên trái' },
                { key: 'F1', desc: 'Mở cửa sổ trợ giúp này' },
                { key: 'Esc', desc: 'Đóng chi tiết sản phẩm / đóng trợ giúp' }
            ],
            steps: [
                { title: '1. Thêm mới hàng hóa', desc: 'Nhấn nút "+ Tạo mới" để thêm sản phẩm; điền mã hàng, tên hàng, nhóm hàng, đơn vị tính, giá bán và giá vốn.' },
                { title: '2. Tìm kiếm & Lọc nâng cao', desc: 'Gõ từ khóa vào ô F3 để tìm nhanh, hoặc dùng bộ lọc bên trái để lọc theo Nhóm hàng, Tồn kho, Nhà cung cấp, Thời gian.' },
                { title: '3. Xem chi tiết & Thẻ kho', desc: 'Bấm vào bất kỳ dòng hàng hóa để mở drawer chi tiết, xem lịch sử biến động Thẻ kho và số lượng tồn ở từng kho.' },
                { title: '4. Nhập / Xuất Excel', desc: 'Sử dụng nút "Nhập file" để nạp danh sách sản phẩm hàng loạt từ Excel hoặc nút "Xuất file" để tải dữ liệu.' }
            ],
            tip: '<i class="bi bi-lightbulb-fill text-warning me-1"></i><strong>Mẹo:</strong> Bấm trực tiếp vào dòng sản phẩm để tra cứu nhanh lịch sử biến động Thẻ kho và tồn kho từng chi nhánh.'
        },
        NhapHang: {
            title: 'Quản lý Nhập hàng',
            badge: 'Nhập hàng',
            subtitle: 'Nhập hàng từ nhà cung cấp và tăng tồn kho sổ sách',
            shortcuts: [
                { key: 'F3', desc: 'Tìm kiếm hàng hóa / Quét mã barcode' },
                { key: 'F4', desc: 'Thu gọn / Mở rộng sidebar bộ lọc' },
                { key: 'F9', desc: 'Tạo nhanh phiếu nhập hàng mới' },
                { key: 'Esc', desc: 'Đóng popup / Đóng trợ giúp' }
            ],
            steps: [
                { title: '1. Lập phiếu nhập', desc: 'Bấm nút "+ Nhập hàng" (F9), chọn Nhà cung cấp và chi nhánh kho tiếp nhận hàng.' },
                { title: '2. Thêm mặt hàng & Đơn giá', desc: 'Nhấn F3 quét mã vạch hoặc gõ tên sản phẩm, nhập số lượng thực tế, đơn giá nhập và chiết khấu.' },
                { title: '3. Hoàn thành phiếu nhập', desc: 'Bấm "Hoàn thành" để hệ thống tự động tăng tồn kho sổ sách và ghi nhận công nợ với nhà cung cấp.' },
                { title: '4. Kiểm tra chứng từ', desc: 'Bấm vào dòng phiếu nhập để xem danh sách hàng đã nhập, in phiếu nhập kho hoặc xuất file.' }
            ],
            tip: '<i class="bi bi-lightbulb-fill text-warning me-1"></i><strong>Lưu ý:</strong> Phiếu nhập ở trạng thái "Phiếu tạm" có thể sửa/hủy; phiếu đã "Hoàn thành" sẽ khóa để bảo vệ toàn vẹn dữ liệu kho.'
        },
        TraHangNhap: {
            title: 'Trả hàng cho Nhà cung cấp',
            badge: 'Trả hàng nhập',
            subtitle: 'Xuất trả hàng và giảm công nợ nhà cung cấp',
            shortcuts: [
                { key: 'F3', desc: 'Tìm hàng hóa cần xuất trả' },
                { key: 'F4', desc: 'Thu gọn / Mở rộng sidebar bộ lọc' },
                { key: 'Esc', desc: 'Đóng popup / Đóng trợ giúp' }
            ],
            steps: [
                { title: '1. Tạo phiếu trả hàng', desc: 'Bấm nút "+ Trả hàng nhập", chọn Nhà cung cấp nhận lại hàng và kho xuất hàng.' },
                { title: '2. Chọn mặt hàng xuất trả', desc: 'Gõ F3 tìm kiếm hàng hóa, nhập số lượng và giá trị xuất trả nhà cung cấp.' },
                { title: '3. Xác nhận hoàn thành', desc: 'Bấm "Hoàn thành" để trừ tồn kho ngay lập tức và giảm trừ công nợ phải trả cho nhà cung cấp.' }
            ],
            tip: '<i class="bi bi-lightbulb-fill text-warning me-1"></i><strong>Mẹo:</strong> Bạn có thể mở chi tiết phiếu nhập gốc để tạo nhanh phiếu trả hàng nhập mà không cần nhập lại từng dòng.'
        },
        XuatHuy: {
            title: 'Quản lý Xuất hủy hàng hóa',
            badge: 'Xuất hủy',
            subtitle: 'Ghi nhận hao hụt, hư hỏng, hết hạn và giảm trừ tồn kho',
            shortcuts: [
                { key: 'F3', desc: 'Tìm hàng hóa cần hủy' },
                { key: 'F4', desc: 'Thu gọn / Mở rộng sidebar bộ lọc' },
                { key: 'Esc', desc: 'Đóng popup / Đóng trợ giúp' }
            ],
            steps: [
                { title: '1. Lập phiếu xuất hủy', desc: 'Bấm nút "+ Xuất hủy", chọn chi nhánh kho có hàng hóa bị hư hỏng, lỗi hoặc hết hạn.' },
                { title: '2. Nhập danh sách mặt hàng', desc: 'Tìm kiếm sản phẩm, nhập số lượng hủy và lý do xuất hủy (hết hạn, rách bao bì, bể vỡ...).' },
                { title: '3. Hoàn tất & Trừ tồn', desc: 'Bấm "Hoàn thành" để trừ tồn kho và ghi nhận giá trị hao hụt vào sổ sách.' }
            ],
            tip: '<i class="bi bi-lightbulb-fill text-warning me-1"></i><strong>Quy tắc:</strong> Phiếu xuất hủy đã hoàn thành không thể chỉnh sửa để bảo đảm tính chính xác của sổ sách kế toán kho.'
        },
        ChuyenKho: {
            title: 'Điều chuyển kho nội bộ',
            badge: 'Chuyển kho',
            subtitle: 'Điều chuyển hàng hóa giữa các chi nhánh kho trong hệ thống',
            shortcuts: [
                { key: 'F3', desc: 'Tìm mặt hàng cần điều chuyển' },
                { key: 'F4', desc: 'Thu gọn / Mở rộng sidebar bộ lọc' },
                { key: 'Esc', desc: 'Đóng popup / Đóng trợ giúp' }
            ],
            steps: [
                { title: '1. Tạo phiếu chuyển', desc: 'Bấm "+ Chuyển hàng", chọn Kho xuất (kho nguồn) và Kho nhận (kho đích).' },
                { title: '2. Chọn mặt hàng & Số lượng', desc: 'Tìm các mặt hàng cần điều phối, nhập số lượng chuyển kho.' },
                { title: '3. Xuất kho (Đang chuyển)', desc: 'Bấm xuất kho: Hàng hóa được trừ ở kho xuất và chuyển sang trạng thái "Đang chuyển".' },
                { title: '4. Kho nhận kiểm đếm', desc: 'Thủ kho tại kho đích kiểm tra số lượng và bấm "Nhận hàng" để chính thức nhập hàng vào kho đích.' }
            ],
            tip: '<i class="bi bi-lightbulb-fill text-warning me-1"></i><strong>Quy trình 2 bước:</strong> Giúp tránh thất thoát hàng hóa trong quá trình vận chuyển giữa các chi nhánh.'
        },
        PhieuKiemKe: {
            title: 'Kiểm kê kho hàng',
            badge: 'Kiểm kho',
            subtitle: 'Đối soát tồn thực tế và cân bằng sổ sách tồn kho',
            shortcuts: [
                { key: 'F3', desc: 'Tìm kiếm mặt hàng kiểm kê' },
                { key: 'F9', desc: 'Lưu tạm phiếu kiểm kho' },
                { key: 'F10', desc: 'Cân bằng kho (khóa sổ)' },
                { key: 'Esc', desc: 'Đóng popup / Đóng trợ giúp' }
            ],
            steps: [
                { title: '1. Tạo phiếu kiểm', desc: 'Bấm "+ Kiểm kho", chọn chi nhánh kho cần tiến hành kiểm kê thực tế.' },
                { title: '2. Đếm & Nhập số lượng', desc: 'Dùng máy quét hoặc F3 nhập số lượng thực tế kiểm đếm được. Hệ thống tự động tính số lượng chênh lệch.' },
                { title: '3. Phân loại kiểm kê', desc: 'Dùng 4 tab "Tất cả", "Khớp", "Lệch", "Chưa kiểm" để rà soát mặt hàng bị thừa/thiếu.' },
                { title: '4. Cân bằng kho (F10)', desc: 'Bấm "Cân bằng kho": Hệ thống tự động sinh phiếu điều chỉnh kho và chốt số lượng thực tế làm tồn kho mới.' }
            ],
            tip: '<i class="bi bi-lightbulb-fill text-warning me-1"></i><strong>Khóa vĩnh viễn:</strong> Phiếu kiểm kho sau khi đã Cân bằng kho (F10) sẽ bị khóa vĩnh viễn và không thể hủy để bảo đảm an toàn dữ liệu.'
        },
        TheKho: {
            title: 'Báo cáo Thẻ kho',
            badge: 'Thẻ kho',
            subtitle: 'Theo dõi chi tiết lịch sử xuất - nhập - tồn từng mặt hàng',
            shortcuts: [
                { key: 'F3', desc: 'Tìm chọn mặt hàng theo dõi' },
                { key: 'F4', desc: 'Thu gọn / Mở rộng sidebar bộ lọc' },
                { key: 'Esc', desc: 'Đóng popup / Đóng trợ giúp' }
            ],
            steps: [
                { title: '1. Chọn mặt hàng', desc: 'Gõ mã hoặc tên hàng vào ô F3 ở sidebar trái, bấm Enter để chọn mặt hàng cần xem Thẻ kho.' },
                { title: '2. Lọc dải thời gian', desc: 'Chọn khoảng thời gian (Hôm nay, 7 ngày qua, Tháng này...) hoặc chọn khoảng ngày tùy ý.' },
                { title: '3. Đọc dữ liệu biến động', desc: 'Xem Tồn đầu kỳ, từng giao dịch Nhập (+), Xuất (-), đơn giá, đối tác và Tồn lũy kế.' },
                { title: '4. Xuất file & In', desc: 'Bấm nút "Xuất file" để tải file Excel ClosedXML hoặc nút "In" để in chứng từ theo dõi.' }
            ],
            tip: '<i class="bi bi-lightbulb-fill text-warning me-1"></i><strong>Số liệu động:</strong> Tồn đầu kỳ và Tồn lũy kế được tính toán trực tiếp từ toàn bộ các phiếu đã hoàn thành, bảo đảm chính xác 100%.'
        },
        NguoiDung: {
            title: 'Quản lý Người dùng & Phân quyền',
            badge: 'Người dùng',
            subtitle: 'Quản lý tài khoản nhân sự, vai trò và phân quyền chi nhánh kho',
            shortcuts: [
                { key: 'F3', desc: 'Tìm theo tên đăng nhập, họ tên, điện thoại' },
                { key: 'F4', desc: 'Thu gọn / Mở rộng sidebar bộ lọc' },
                { key: 'Esc', desc: 'Đóng popup / Đóng trợ giúp' }
            ],
            steps: [
                { title: '1. Thêm người dùng', desc: 'Bấm "+ Người dùng", điền Tên đăng nhập, Mật khẩu, Họ tên, chọn Vai trò (Quản lý, Bán hàng, Nhân viên kho).' },
                { title: '2. Phân quyền chi nhánh kho', desc: 'Chọn các kho nhân sự được phép quản lý (Tài khoản vai trò Quản lý mặc định có quyền trên mọi kho).' },
                { title: '3. Đổi mật khẩu & Khóa', desc: 'Nhấn nút ✎ để sửa thông tin, nút chìa khóa 🔑 để đổi mật khẩu, hoặc nút ổ khóa 🔒 để tạm khóa tài khoản.' }
            ],
            tip: '<i class="bi bi-lightbulb-fill text-warning me-1"></i><strong>Bảo mật:</strong> Hệ thống tự động ngăn người dùng tự khóa tài khoản của chính mình để tránh mất quyền truy cập quản trị.'
        },
        Kho: {
            title: 'Quản lý Chi nhánh Kho',
            badge: 'Chi nhánh kho',
            subtitle: 'Quản lý danh mục kho hàng và phân công nhân sự',
            shortcuts: [
                { key: 'F3', desc: 'Tìm kiếm tên kho, địa chỉ' },
                { key: 'F4', desc: 'Thu gọn / Mở rộng sidebar bộ lọc' },
                { key: 'Esc', desc: 'Đóng popup / Đóng trợ giúp' }
            ],
            steps: [
                { title: '1. Thêm kho mới', desc: 'Bấm "+ Thêm kho", nhập Tên kho, Địa chỉ, Ghi chú và chọn nhân viên phụ trách.' },
                { title: '2. Chuyển đổi kho làm việc', desc: 'Bấm vào menu chọn kho ở góc trên bên trái header để chuyển đổi chi nhánh đang thao tác.' },
                { title: '3. Đổi trạng thái kho', desc: 'Có thể tạm Ngừng hoạt động hoặc Kích hoạt lại kho qua modal xác nhận KiotConfirm.' }
            ],
            tip: '<i class="bi bi-lightbulb-fill text-warning me-1"></i><strong>Quy tắc an toàn:</strong> Hệ thống luôn bảo vệ ít nhất 1 chi nhánh kho đang hoạt động, không cho phép ngừng hoạt động toàn bộ kho.'
        },
        NhaCungCap: {
            title: 'Quản lý Nhà cung cấp',
            badge: 'Nhà cung cấp',
            subtitle: 'Danh bạ đối tác cung ứng, công nợ và lịch sử nhập hàng',
            shortcuts: [
                { key: 'F3', desc: 'Tìm theo tên, mã NCC, số điện thoại' },
                { key: 'F4', desc: 'Thu gọn / Mở rộng sidebar bộ lọc' },
                { key: 'Esc', desc: 'Đóng popup / Đóng trợ giúp' }
            ],
            steps: [
                { title: '1. Thêm nhà cung cấp', desc: 'Bấm "+ Nhà cung cấp", nhập thông tin tên đối tác, số điện thoại, email, địa chỉ.' },
                { title: '2. Theo dõi công nợ', desc: 'Xem tổng tiền đã nhập hàng, số tiền đã trả và công nợ hiện tại với từng nhà cung cấp.' },
                { title: '3. Lịch sử giao dịch', desc: 'Click vào dòng nhà cung cấp để xem toàn bộ danh sách phiếu nhập hàng và phiếu trả hàng liên quan.' }
            ],
            tip: '<i class="bi bi-lightbulb-fill text-warning me-1"></i><strong>Mẹo:</strong> Bạn có thể bấm nút sửa nhanh ✎ ngay trong danh sách để cập nhật số điện thoại hoặc địa chỉ nhà cung cấp.'
        },
        TonKho: {
            title: 'Báo cáo Tồn kho',
            badge: 'Tồn kho',
            subtitle: 'Báo cáo tổng hợp số lượng và giá trị hàng hóa tồn theo chi nhánh',
            shortcuts: [
                { key: 'F3', desc: 'Tìm theo mã, tên hàng, vị trí' },
                { key: 'F4', desc: 'Thu gọn / Mở rộng sidebar bộ lọc' },
                { key: 'Esc', desc: 'Đóng popup / Đóng trợ giúp' }
            ],
            steps: [
                { title: '1. Chọn chi nhánh kho', desc: 'Tích chọn 1 hoặc nhiều kho ở thanh bộ lọc trái để xem tồn từng kho hoặc toàn chuỗi.' },
                { title: '2. Lọc tình trạng tồn', desc: 'Dễ dàng lọc các mặt hàng "Dưới định mức tồn", "Vượt định mức tồn" hoặc "Hết hàng".' },
                { title: '3. Xuất file & In', desc: 'Bấm nút "Xuất file" để tải file Excel báo cáo tồn kho hoặc nút "In" để in bảng tồn.' }
            ],
            tip: '<i class="bi bi-lightbulb-fill text-warning me-1"></i><strong>Tồn sổ sách thực tế:</strong> Dữ liệu tồn kho được cập nhật tự động từ view vw_TonKhoHienTai theo thời gian thực mỗi khi có giao dịch kho hoàn thành.'
        }
    };

    function getOverlay() {
        return document.getElementById('kiotHelpOv');
    }

    function detectScreenKey() {
        const p = (window.location.pathname || '').toLowerCase();
        if (p.includes('/hanghoa')) return 'HangHoa';
        if (p.includes('/nhaphang')) return 'NhapHang';
        if (p.includes('/trahangnhap')) return 'TraHangNhap';
        if (p.includes('/xuathuy')) return 'XuatHuy';
        if (p.includes('/chuyenkho')) return 'ChuyenKho';
        if (p.includes('/phieukiemke')) return 'PhieuKiemKe';
        if (p.includes('/baocao/thekho') || p.includes('/thekho')) return 'TheKho';
        if (p.includes('/baocao/tonkho') || p.includes('/tonkho')) return 'TonKho';
        if (p.includes('/nguoidung')) return 'NguoiDung';
        if (p.includes('/kho')) return 'Kho';
        if (p.includes('/nhacungcap')) return 'NhaCungCap';
        return 'HangHoa';
    }

    function show(key) {
        const screenKey = key || detectScreenKey();
        const info = HELP_MAP[screenKey] || HELP_MAP.HangHoa;
        const ov = getOverlay();
        if (!ov) return;

        const titleEl = document.getElementById('kiotHelpTitle');
        const badgeEl = document.getElementById('kiotHelpScreenBadge');
        const subtitleEl = document.getElementById('kiotHelpSubtitle');
        const shortcutsEl = document.getElementById('kiotHelpShortcuts');
        const stepsEl = document.getElementById('kiotHelpSteps');
        const tipsEl = document.getElementById('kiotHelpTips');

        if (titleEl) titleEl.textContent = info.title;
        if (badgeEl) badgeEl.textContent = info.badge || 'Trợ giúp';
        if (subtitleEl) subtitleEl.textContent = info.subtitle || '';

        if (shortcutsEl) {
            shortcutsEl.innerHTML = (info.shortcuts || []).map(function (s) {
                return '<div class="kiot-shortcut-item"><kbd class="kiot-kbd">' + s.key + '</kbd><span>' + s.desc + '</span></div>';
            }).join('');
        }

        if (stepsEl) {
            stepsEl.innerHTML = (info.steps || []).map(function (s, idx) {
                return '<div class="kiot-help-step-item"><div class="kiot-help-step-num">' + (idx + 1) + '</div><div class="kiot-help-step-content"><div class="kiot-help-step-title">' + s.title + '</div><div class="kiot-help-step-desc">' + s.desc + '</div></div></div>';
            }).join('');
        }

        if (tipsEl) {
            tipsEl.innerHTML = info.tip || '';
        }

        ov.classList.add('show');
    }

    function close() {
        const ov = getOverlay();
        if (ov) ov.classList.remove('show');
    }

    document.addEventListener('click', function (e) {
        if (e.target.closest('#kiotHelpClose, #kiotHelpOk') || e.target.id === 'kiotHelpOv') {
            close();
        } else if (e.target.closest('#btnHelp, .btn-help, #btnHeaderHelp, a[title="Hỗ trợ"]')) {
            e.preventDefault();
            show();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'F1') {
            e.preventDefault();
            show();
        } else if (e.key === 'Escape') {
            const ov = getOverlay();
            if (ov && ov.classList.contains('show')) {
                close();
            }
        }
    });

    return {
        show: show,
        close: close
    };
})();



