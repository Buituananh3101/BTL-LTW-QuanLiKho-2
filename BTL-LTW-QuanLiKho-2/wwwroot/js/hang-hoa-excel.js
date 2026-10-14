/* ==========================================================================
   JAVASCRIPT XỬ LÝ NHẬP & XUẤT FILE EXCEL HÀNG HÓA CHUẨN KIOTVIET
   ========================================================================== */

(function () {
  'use strict';

  // Helper hàm đóng/mở overlay
  function show(el) {
    if (el) el.classList.add('show');
  }
  function hide(el) {
    if (el) el.classList.remove('show');
  }

  // Đóng modal khi bấm nút [data-close]
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-close]');
    if (!btn) return;
    const targetId = btn.getAttribute('data-close');
    const target = document.getElementById(targetId);
    if (target) hide(target);
  });

  // Đóng modal khi click ra ngoài nền
  ['hhExportModalOv', 'hhImportModalOv'].forEach(id => {
    const ov = document.getElementById(id);
    if (ov) {
      ov.addEventListener('click', e => {
        if (e.target === ov) hide(ov);
      });
    }
  });

  // Hỗ trợ đóng bằng phím ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      ['hhExportModalOv', 'hhImportModalOv'].forEach(id => {
        const ov = document.getElementById(id);
        if (ov && ov.classList.contains('show')) hide(ov);
      });
    }
  });

  /* ==========================================================================
     1. PHÂN HỆ XUẤT FILE EXCEL (EXPORT)
     ========================================================================== */

  window.openExportModal = function () {
    const ov = document.getElementById('hhExportModalOv');
    if (!ov) return;

    // Đếm số lượng hàng đang được tick chọn trên bảng
    const checkedRows = document.querySelectorAll('.row-select:checked');
    const selectedCount = checkedRows.length;
    const badge = document.getElementById('exportSelectedBadge');
    if (badge) badge.textContent = selectedCount + ' hàng';

    const radioSelected = document.getElementById('exportScopeSelected');
    const radioAll = document.getElementById('exportScopeAll');

    if (selectedCount > 0) {
      if (radioSelected) radioSelected.checked = true;
    } else {
      if (radioAll) radioAll.checked = true;
    }

    updateExportWarning();
    show(ov);
  };

  // Cảnh báo khi người dùng bỏ chọn các cột quan trọng
  function updateExportWarning() {
    const essentialKeys = ['TenHang', 'MaHang', 'LoaiHang', 'Dvt'];
    let isMissingEssential = false;

    essentialKeys.forEach(k => {
      const chk = document.querySelector(`.export-col-chk[value="${k}"]`);
      if (chk && !chk.checked) {
        isMissingEssential = true;
      }
    });

    const warnBox = document.getElementById('exportIncompatibleWarning');
    if (warnBox) {
      warnBox.style.display = isMissingEssential ? 'flex' : 'none';
    }
  }

  // Sự kiện thay đổi checkbox cột
  document.addEventListener('change', e => {
    if (e.target.classList.contains('export-col-chk')) {
      updateExportWarning();
    }
  });

  // Nút "Bộ cột chuẩn để nhập lại"
  document.getElementById('btnSelectImportCompatibleCols')?.addEventListener('click', () => {
    document.querySelectorAll('.export-col-chk').forEach(chk => {
      chk.checked = true;
    });
    updateExportWarning();
  });

  // Nút "Chọn tất cả"
  document.getElementById('btnSelectAllExportCols')?.addEventListener('click', () => {
    document.querySelectorAll('.export-col-chk').forEach(chk => {
      chk.checked = true;
    });
    updateExportWarning();
  });

  // Nút "Bỏ chọn tất cả"
  document.getElementById('btnDeselectAllExportCols')?.addEventListener('click', () => {
    document.querySelectorAll('.export-col-chk').forEach(chk => {
      chk.checked = false;
    });
    updateExportWarning();
  });

  // Nút xác nhận xuất file Excel
  document.getElementById('btnConfirmExecuteExport')?.addEventListener('click', () => {
    const selectedCols = Array.from(document.querySelectorAll('.export-col-chk:checked')).map(c => c.value);
    if (selectedCols.length === 0) {
      alert('Vui lòng chọn ít nhất 1 cột để xuất dữ liệu.');
      return;
    }

    const scope = document.querySelector('input[name="exportScope"]:checked')?.value || 'ALL';
    let selectedIds = '';

    if (scope === 'SELECTED') {
      const checkedBoxes = document.querySelectorAll('.row-select:checked');
      if (checkedBoxes.length === 0) {
        alert('Chưa có hàng hóa nào được chọn trên bảng. Vui lòng tick chọn hàng hóa hoặc chọn phạm vi Tất cả.');
        return;
      }
      selectedIds = Array.from(checkedBoxes).map(c => c.value).join(',');
    }

    // Thu thập tham số bộ lọc hiện tại từ giao diện
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/HangHoa/ExportExcel';
    form.style.display = 'none';

    function addField(name, val) {
      if (val !== undefined && val !== null && val !== '') {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = val;
        form.appendChild(input);
      }
    }

    // Thêm các cột đã chọn
    selectedCols.forEach(col => {
      addField('Columns', col);
    });

    addField('ExportScope', scope);
    addField('SelectedIds', selectedIds);

    // Bộ lọc từ Index.cshtml
    const filters = (typeof window.getCurrentFilterParams === 'function') ? window.getCurrentFilterParams() : {};
    addField('Q', filters.q !== undefined ? filters.q : document.getElementById('keywordSearch')?.value?.trim());
    addField('Nhom', filters.nhom);
    addField('NhaCungCap', filters.nhaCungCap);
    addField('ViTri', filters.viTri);
    addField('LoaiHang', filters.loaiHang);
    addField('TonKhoFilter', filters.tonKho !== undefined ? filters.tonKho : document.getElementById('filterTonKho')?.value);
    addField('DuKienFilter', filters.duKien);
    addField('TgTaoFilter', filters.tgTao);
    addField('TgTaoFrom', filters.tgTaoFrom);
    addField('TgTaoTo', filters.tgTaoTo);
    if (filters.daDanhDau !== undefined) addField('DaDanhDau', filters.daDanhDau);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    hide(document.getElementById('hhExportModalOv'));
    if (typeof window.showToast === 'function') {
      window.showToast('Hệ thống đang xuất file Excel... File sẽ tự động tải xuống.');
    }
  });

  /* ==========================================================================
     2. PHÂN HỆ NHẬP FILE EXCEL (IMPORT)
     ========================================================================== */

  window.openImportModal = function () {
    const ov = document.getElementById('hhImportModalOv');
    if (!ov) return;

    resetImportForm();
    show(ov);
  };

  const dropzone = document.getElementById('importDropzone');
  const fileInput = document.getElementById('importFileInput');
  const emptyView = document.getElementById('dropzoneEmpty');
  const selectedView = document.getElementById('dropzoneFileSelected');
  const fileNameEl = document.getElementById('importFileName');
  const fileSizeEl = document.getElementById('importFileSize');
  const btnRemoveFile = document.getElementById('btnRemoveImportFile');
  const btnExecuteImport = document.getElementById('btnExecuteImport');
  const loadingBox = document.getElementById('importLoadingBox');
  const resultBox = document.getElementById('importResultBox');
  const resultCard = document.getElementById('importResultCard');
  const errorsContainer = document.getElementById('importErrorsContainer');
  const errorsList = document.getElementById('importErrorsList');

  function resetImportForm() {
    if (fileInput) fileInput.value = '';
    if (emptyView) emptyView.style.display = 'block';
    if (selectedView) selectedView.style.display = 'none';
    if (btnExecuteImport) {
      btnExecuteImport.disabled = true;
      btnExecuteImport.innerHTML = '<i class="bi bi-box-arrow-in-down me-1"></i> Thực hiện nhập';
    }
    if (loadingBox) loadingBox.style.display = 'none';
    if (resultBox) resultBox.style.display = 'none';
    if (errorsContainer) errorsContainer.style.display = 'none';
  }

  // Click vào dropzone để mở dialog chọn file
  dropzone?.addEventListener('click', e => {
    if (e.target.closest('#btnRemoveImportFile')) return;
    fileInput?.click();
  });

  // Kéo thả file
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone?.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone?.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone?.addEventListener('drop', e => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  fileInput?.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFileSelected(fileInput.files[0]);
    }
  });

  function handleFileSelected(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'xlsx') {
      alert('Vui lòng chọn file Excel có định dạng .xlsx');
      resetImportForm();
      return;
    }

    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileSizeEl) fileSizeEl.textContent = (file.size / 1024).toFixed(1) + ' KB';
    if (emptyView) emptyView.style.display = 'none';
    if (selectedView) selectedView.style.display = 'flex';
    if (btnExecuteImport) btnExecuteImport.disabled = false;
    if (resultBox) resultBox.style.display = 'none';
  }

  btnRemoveFile?.addEventListener('click', e => {
    e.stopPropagation();
    resetImportForm();
  });

  // Nhấn nút "Thực hiện nhập"
  btnExecuteImport?.addEventListener('click', () => {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      alert('Vui lòng chọn file Excel trước khi thực hiện.');
      return;
    }

    const file = fileInput.files[0];
    const dupMode = document.querySelector('input[name="duplicateMode"]:checked')?.value || 'UPDATE';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('duplicateMode', dupMode);

    btnExecuteImport.disabled = true;
    btnExecuteImport.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Đang nhập dữ liệu...';
    if (loadingBox) loadingBox.style.display = 'block';
    if (resultBox) resultBox.style.display = 'none';
    if (errorsContainer) errorsContainer.style.display = 'none';

    jQuery.ajax({
      url: '/HangHoa/ImportExcel',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function (res) {
        if (loadingBox) loadingBox.style.display = 'none';
        btnExecuteImport.disabled = false;
        btnExecuteImport.innerHTML = '<i class="bi bi-box-arrow-in-down me-1"></i> Thực hiện nhập';

        if (resultBox && resultCard) {
          resultBox.style.display = 'block';
          resultCard.className = 'p-3 border rounded-3 mb-2 bg-success-subtle border-success text-success-emphasis';
          resultCard.innerHTML = `
            <div class="fw-bold mb-2 fs-6">
              <i class="bi bi-check-circle-fill text-success me-1"></i> ${res.message || 'Nhập file Excel thành công!'}
            </div>
            <div class="d-flex flex-wrap gap-3 small text-dark">
              <div>Tổng số dòng: <strong>${res.totalRows || 0}</strong></div>
              <div>Thêm mới: <strong class="text-success">${res.insertedCount || 0}</strong></div>
              <div>Cập nhật: <strong class="text-primary">${res.updatedCount || 0}</strong></div>
              <div>Bỏ qua: <strong class="text-muted">${res.skippedCount || 0}</strong></div>
            </div>
          `;
        }

        if (res.errors && res.errors.length > 0 && errorsContainer && errorsList) {
          errorsContainer.style.display = 'block';
          errorsList.innerHTML = res.errors.map(err => `<div>• ${err}</div>`).join('');
        }

        // Tự động tải lại bảng hàng hóa
        if (typeof window.loadTable === 'function') {
          window.loadTable();
        }
      },
      error: function (xhr) {
        if (loadingBox) loadingBox.style.display = 'none';
        btnExecuteImport.disabled = false;
        btnExecuteImport.innerHTML = '<i class="bi bi-box-arrow-in-down me-1"></i> Thực hiện nhập';

        const res = xhr.responseJSON;
        const msg = res?.message || 'Có lỗi xảy ra khi nhập file Excel.';

        if (resultBox && resultCard) {
          resultBox.style.display = 'block';
          resultCard.className = 'p-3 border rounded-3 mb-2 bg-danger-subtle border-danger text-danger-emphasis';
          resultCard.innerHTML = `
            <div class="fw-bold mb-1 fs-6">
              <i class="bi bi-x-circle-fill text-danger me-1"></i> Nhập dữ liệu thất bại
            </div>
            <div class="small">${msg}</div>
          `;
        }

        if (res?.errors && res.errors.length > 0 && errorsContainer && errorsList) {
          errorsContainer.style.display = 'block';
          errorsList.innerHTML = res.errors.map(err => `<div>• ${err}</div>`).join('');
        }
      }
    });
  });

})();
