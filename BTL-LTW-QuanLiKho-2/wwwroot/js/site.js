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


