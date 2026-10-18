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
            iconHtml = '<i class="bi bi-info-circle-fill text-primary fs-6"></i>';
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
window.showToast = function (msg) {
    window.KiotToast.show(msg, 'success');
};
window.toast = function (msg, type) {
    window.KiotToast.show(msg, type || 'info');
};
