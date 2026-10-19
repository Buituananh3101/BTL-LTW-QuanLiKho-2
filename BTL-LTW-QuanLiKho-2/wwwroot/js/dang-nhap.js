(function () {
  const form = document.getElementById('loginForm');
  const user = document.getElementById('TenDangNhap');
  const pass = document.getElementById('MatKhau');
  const fUser = document.getElementById('fUser');
  const fPass = document.getElementById('fPass');
  const errorBox = document.getElementById('errorBox');
  const toggle = document.getElementById('togglePw');
  const iconHide = document.getElementById('iconHide');
  const iconShow = document.getElementById('iconShow');
  const buttons = document.querySelectorAll('.actions button');

  // Hiện/ẩn mật khẩu
  if (toggle && pass) {
    toggle.addEventListener('click', function () {
      const show = pass.type === 'password';
      pass.type = show ? 'text' : 'password';
      if (iconHide) iconHide.style.display = show ? 'none' : '';
      if (iconShow) iconShow.style.display = show ? '' : 'none';
      toggle.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      pass.focus();
    });
  }

  function showError(msg) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.classList.add('show');
    }
  }

  function clearError() {
    if (errorBox) {
      errorBox.classList.remove('show');
      errorBox.textContent = '';
    }
    if (fUser) fUser.classList.remove('invalid');
    if (fPass) fPass.classList.remove('invalid');
  }

  if (user) user.addEventListener('input', clearError);
  if (pass) {
    pass.addEventListener('input', clearError);
    // Caps Lock cảnh báo nhẹ
    pass.addEventListener('keyup', function (e) {
      if (e.getModifierState && e.getModifierState('CapsLock')) {
        showError('Caps Lock đang bật.');
      } else if (errorBox && errorBox.textContent === 'Caps Lock đang bật.') {
        clearError();
      }
    });
  }

  const forgot = document.getElementById('forgot');
  if (forgot) {
    forgot.addEventListener('click', function (e) {
      e.preventDefault();
      alert('Chức năng quên mật khẩu: Vui lòng liên hệ Quản trị viên hệ thống để được cấp lại mật khẩu.');
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      // Validate phía client trước khi gửi lên server
      if (!user.value.trim()) {
        e.preventDefault();
        fUser.classList.add('invalid');
        showError('Vui lòng nhập tên đăng nhập.');
        user.focus();
        return;
      }
      if (!pass.value) {
        e.preventDefault();
        fPass.classList.add('invalid');
        showError('Vui lòng nhập mật khẩu.');
        pass.focus();
        return;
      }

      // Khóa nút tránh double submit
      buttons.forEach(b => {
        b.disabled = true;
      });
    });
  }
})();
