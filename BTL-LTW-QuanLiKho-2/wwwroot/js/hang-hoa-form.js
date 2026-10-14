/* ==========================================================================
   JAVASCRIPT QUẢN LÝ FORM TẠO & CẬP NHẬT HÀNG HÓA CHUẨN KIOTVIET
   Hỗ trợ 5 ảnh CSDL, định mức Min/Max, vị trí, trọng lượng, thuộc tính động, tab mô tả
   ========================================================================== */

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ICON = id => `<svg style="width:16px;height:16px;vertical-align:middle;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><use href="#${id}"/></svg>`;
  const ci = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

  // Dữ liệu mẫu thuộc tính gợi ý
  const knownAttributes = {
    'Màu sắc': ['Đỏ', 'Xanh', 'Vàng', 'Trắng', 'Đen', 'Xám'],
    'Dung tích': ['330ml', '500ml', '1L', '1.5L', '5L'],
    'Hương vị': ['Cam', 'Dâu', 'Chanh', 'Nho', 'Tự nhiên'],
    'Kích cỡ': ['S', 'M', 'L', 'XL', 'XXL'],
    'Chất liệu': ['Cotton', 'Nhựa PP', 'Inox 304', 'Thủy tinh', 'Gỗ'],
    'Xuất xứ': ['Việt Nam', 'Thái Lan', 'Hàn Quốc', 'Nhật Bản']
  };

  /* ---------- Tiện ích hiển thị / đóng Modal & Toast ---------- */
  const show = el => {
    if (!el) return;
    el.classList.add('show');
    document.body.classList.add('noscroll');
  };
  const hide = el => {
    if (!el) return;
    el.classList.remove('show');
    if (!$('.hh-ov.show')) document.body.classList.remove('noscroll');
  };

  let toastTimer;
  function showToast(msg) {
    const t = $('#hhToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  // Đóng overlay bằng data-close
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-close]');
    if (c) {
      const target = $('#' + c.dataset.close);
      if (target) hide(target);
    }
  });

  // Đóng modal bằng phím Escape
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const top = ['hhPickOv', 'hhPromptOv', 'hangHoaModalOv'].map(id => $('#' + id)).find(o => o && o.classList.contains('show'));
    if (top) hide(top);
  });

  /* ---------- Ô số có dấu phẩy phân cách ---------- */
  const getNum = el => {
    if (!el) return 0;
    const clean = String(el.value || '').replace(/[^\d.]/g, '');
    return Number(clean) || 0;
  };
  const formatNum = val => {
    if (val === null || val === undefined || val === '') return '0';
    const num = Math.round(Number(val));
    return isNaN(num) ? '0' : num.toLocaleString('en-US');
  };

  document.addEventListener('input', e => {
    const el = e.target;
    if (!el || !el.classList || !el.classList.contains('hh-num')) return;
    if (el.id === 'formTrongLuong') {
      el.value = el.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') || '';
      return;
    }
    const d = el.value.replace(/\D/g, '');
    el.value = d ? Number(d).toLocaleString('en-US') : '';
  });
  document.addEventListener('focusin', e => {
    if (e.target && e.target.classList && e.target.classList.contains('hh-num')) {
      e.target.select();
    }
  });
  document.addEventListener('focusout', e => {
    const el = e.target;
    if (el && el.classList && el.classList.contains('hh-num') && el.value.trim() === '') {
      el.value = (el.id === 'formTonCaoNhat') ? '999,999,999' : '0';
    }
  });

  /* ---------- Tabs & Khối gập ---------- */
  $$('.hh-tab').forEach(t => {
    t.onclick = () => {
      $$('.hh-tab').forEach(x => x.classList.toggle('on', x === t));
      $$('.hh-pane').forEach(p => p.classList.toggle('on', p.id === 'hh-pane-' + t.dataset.tab));
      const body = $('#hhModalBody');
      if (body) body.scrollTop = 0;
    };
  });

  $$('.hh-sec-h').forEach(h => {
    h.onclick = () => h.parentElement.classList.toggle('open');
  });

  // Tab mô tả: các nút định dạng
  $$('.hh-rte-bar button').forEach(b => {
    b.onmousedown = e => {
      e.preventDefault();
      document.execCommand(b.dataset.cmd);
    };
  });

  /* ---------- Quản lý tối đa 5 ảnh sản phẩm ---------- */
  let imgs = []; // Mảng chứa: { base64: 'data:image/...', url: '...' }
  let mainIdx = 0;
  const MAX_IMG = 5;

  function renderImgs() {
    const mainBox = $('#hhImgMain');
    const thumbsBox = $('#hhThumbs');
    if (!mainBox || !thumbsBox) return;

    if (imgs[mainIdx]) {
      mainBox.innerHTML = `<img src="${imgs[mainIdx].url}" alt="Ảnh chính hàng hóa">`;
    } else {
      mainBox.innerHTML = `<svg class="hh-ic" style="width:44px;height:44px;"><use href="#i-img"/></svg><span>Chưa có ảnh</span>`;
    }

    let h = imgs.map((im, i) => `
      <div class="hh-th ${i === mainIdx ? 'on' : ''}" data-i="${i}" role="button" tabindex="0" title="Ảnh ${i + 1}${i === mainIdx ? ' (Ảnh chính)' : ''}">
        <img src="${im.url}" alt="">
        <button type="button" class="hh-th-x" data-x="${i}" aria-label="Xóa ảnh ${i + 1}">×</button>
      </div>
    `).join('');

    let used = imgs.length;
    if (used < MAX_IMG) {
      h += `<button type="button" class="hh-th add" id="btnAddImgThumb" title="Thêm ảnh (${used}/${MAX_IMG})">${ICON('i-plus')}</button>`;
      used++;
    }
    for (let i = used; i < 4; i++) {
      h += `<button type="button" class="hh-th add" tabindex="-1" aria-hidden="true" style="color:#d1d5db;cursor:default;">${ICON('i-img')}</button>`;
    }

    thumbsBox.innerHTML = h;
  }

  // Click vào vùng ảnh chính: nếu chưa có ảnh thì mở chọn file
  $('#hhImgMain').onclick = () => {
    if (!imgs.length) $('#hhImgFile').click();
  };

  // Click trên thumbnail: chọn ảnh chính hoặc xóa ảnh hoặc thêm ảnh mới
  $('#hhThumbs').addEventListener('click', e => {
    const x = e.target.closest('[data-x]');
    if (x) {
      e.stopPropagation();
      const idx = +x.dataset.x;
      imgs.splice(idx, 1);
      mainIdx = Math.min(mainIdx, Math.max(imgs.length - 1, 0));
      renderImgs();
      return;
    }
    const t = e.target.closest('.hh-th');
    if (!t) return;
    if (t.classList.contains('add') && t.id === 'btnAddImgThumb') {
      $('#hhImgFile').click();
    } else if (t.dataset.i !== undefined) {
      mainIdx = +t.dataset.i;
      renderImgs();
    }
  });

  // Chọn ảnh từ máy tính (hỗ trợ chọn nhiều file)
  $('#hhImgFile').addEventListener('change', e => {
    const files = [...e.target.files];
    if (!files.length) return;

    files.forEach(f => {
      if (imgs.length >= MAX_IMG) {
        showToast('Chỉ được chọn tối đa ' + MAX_IMG + ' ảnh cho một hàng hóa.');
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        showToast('Ảnh "' + f.name + '" vượt quá dung lượng 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = evt => {
        const b64 = evt.target.result;
        imgs.push({ base64: b64, url: b64 });
        renderImgs();
      };
      reader.readAsDataURL(f);
    });

    e.target.value = '';
  });

  /* ---------- Modal Nhập Tên Nhanh (Nhóm / ĐVT / Vị trí / Thuộc tính) ---------- */
  let promptCb = null;
  let promptLabel = '';

  function openPrompt(title, label, defaultVal, cb) {
    $('#pTitle').textContent = title;
    $('#pLabel').textContent = label;
    promptLabel = label;
    $('#pInput').value = defaultVal || '';
    $('#pField').classList.remove('invalid');
    promptCb = cb;
    show($('#hhPromptOv'));
    setTimeout(() => $('#pInput').focus(), 40);
  }

  function handlePromptSave() {
    const v = $('#pInput').value.trim();
    const f = $('#pField');
    const er = $('#pErr');
    if (!v) {
      er.textContent = 'Vui lòng nhập ' + promptLabel.toLowerCase() + '.';
      f.classList.add('invalid');
      return;
    }
    hide($('#hhPromptOv'));
    if (promptCb) promptCb(v);
  }

  $('#pSave').onclick = handlePromptSave;
  $('#pInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePromptSave();
    }
  });
  $('#pInput').addEventListener('input', () => $('#pField').classList.remove('invalid'));

  // Nút Tạo mới Nhóm hàng
  $('#btnNewNhom').onclick = () => {
    openPrompt('Tạo mới nhóm hàng', 'Tên nhóm hàng', '', val => {
      jQuery.ajax({
        url: '/HangHoa/CreateGroupQuick',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ tenNhom: val }),
        success: function (res) {
          const sel = $('#formMaNhom');
          const opt = document.createElement('option');
          opt.value = res.maNhom;
          opt.textContent = res.tenNhom;
          sel.appendChild(opt);
          sel.value = res.maNhom;
          $('#hhFldNhom').classList.remove('invalid');
          showToast('Đã tạo nhóm hàng: ' + res.tenNhom);
        },
        error: function (xhr) {
          showToast('Lỗi: ' + (xhr.responseJSON?.message || 'Không thể tạo nhóm.'));
        }
      });
    });
  };

  // Nút Tạo mới Đơn vị tính (thay thế Thương hiệu)
  $('#btnNewDvt').onclick = () => {
    openPrompt('Tạo mới đơn vị tính', 'Tên đơn vị tính', '', val => {
      jQuery.ajax({
        url: '/HangHoa/CreateDvtQuick',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ tenDvt: val }),
        success: function (res) {
          const sel = $('#formMaDvt');
          let opt = [...sel.options].find(o => String(o.value) === String(res.maDvt));
          if (!opt) {
            opt = document.createElement('option');
            opt.value = res.maDvt;
            opt.textContent = res.tenDvt;
            sel.appendChild(opt);
          }
          sel.value = res.maDvt;
          $('#hhFldDvt').classList.remove('invalid');
          showToast('Đã thêm đơn vị tính: ' + res.tenDvt);
        },
        error: function (xhr) {
          showToast('Lỗi: ' + (xhr.responseJSON?.message || 'Không thể tạo ĐVT.'));
        }
      });
    });
  };

  // Nút Tạo mới Vị trí
  $('#btnNewViTri').onclick = () => {
    openPrompt('Tạo mới vị trí kho', 'Vị trí kho', '', val => {
      const list = $('#listViTriSuggestions');
      if (list && ![...list.options].some(o => ci(o.value, val))) {
        const opt = document.createElement('option');
        opt.value = val;
        list.appendChild(opt);
      }
      $('#formViTri').value = val;
      showToast('Đã chọn vị trí: ' + val);
    });
  };

  /* ---------- Thuộc tính động ---------- */
  const attrRows = $('#hhAttrRows');
  const getRowName = r => r.dataset.cur || '';

  function renderTags(r) {
    const tagsContainer = r.querySelector('.hh-tags');
    if (!tagsContainer) return;
    tagsContainer.innerHTML = r._vals.map((v, i) => `
      <span class="hh-tag">
        ${esc(v)}
        <button type="button" data-i="${i}" aria-label="Xóa ${esc(v)}">×</button>
      </span>
    `).join('');
  }

  function setRowEnabled(r, on) {
    const wrap = r.querySelector('.hh-tagwrap');
    const input = r.querySelector('.hh-a-in');
    const quickBtn = r.querySelector('.hh-quick');
    if (wrap) wrap.classList.toggle('disabled', !on);
    if (input) input.disabled = !on;
    if (quickBtn) quickBtn.disabled = !on;
  }

  function refreshAttrDropdowns() {
    const rows = $$('.hh-attr-row', attrRows);
    rows.forEach(r => {
      const cur = getRowName(r);
      const used = rows.filter(x => x !== r).map(getRowName);
      const opts = Object.keys(knownAttributes).filter(n => !used.includes(n));
      const sel = r.querySelector('.hh-a-name');
      if (!sel) return;

      sel.innerHTML = '<option value="">Chọn thuộc tính</option>' +
        opts.map(n => `<option ${n === cur ? 'selected' : ''}>${esc(n)}</option>`).join('') +
        (cur && !opts.includes(cur) ? `<option value="${esc(cur)}" selected>${esc(cur)}</option>` : '') +
        '<option value="__new">+ Tạo thuộc tính mới</option>';
      sel.value = cur;
    });
  }

  function setRowAttr(r, name) {
    if (getRowName(r) !== name) {
      r._vals = [];
      renderTags(r);
    }
    r.dataset.cur = name;
    setRowEnabled(r, !!name);
    refreshAttrDropdowns();
    if (name) {
      const inp = r.querySelector('.hh-a-in');
      if (inp) inp.focus();
    }
  }

  function addValToRow(r, v) {
    v = (v || '').trim();
    if (!v || !getRowName(r)) return;
    const attrName = getRowName(r);
    if (!knownAttributes[attrName]) knownAttributes[attrName] = [];
    const list = knownAttributes[attrName];

    let canon = list.find(x => ci(x, v));
    if (!canon) {
      list.push(v);
      canon = v;
    }
    if (!r._vals.some(x => ci(x, canon))) {
      r._vals.push(canon);
    }
    renderTags(r);
  }

  function addAttrRow(initialName = '', initialVals = []) {
    const r = document.createElement('div');
    r.className = 'hh-attr-row';
    r._vals = Array.isArray(initialVals) ? [...initialVals] : (initialVals ? [String(initialVals)] : []);
    r.dataset.cur = initialName;

    r.innerHTML = `
      <select class="hh-a-name" aria-label="Tên thuộc tính"></select>
      <div class="hh-tagwrap ${initialName ? '' : 'disabled'}">
        <div class="hh-tagbox">
          <span class="hh-tags"></span>
          <input class="hh-a-in" ${initialName ? '' : 'disabled'} placeholder="Nhập giá trị và nhấn Enter" autocomplete="off" />
        </div>
        <button type="button" class="hh-quick" ${initialName ? '' : 'disabled'}>Chọn nhanh</button>
      </div>
      <button type="button" class="hh-icon-btn del" title="Xóa dòng thuộc tính">${ICON('i-trash')}</button>
    `;

    attrRows.appendChild(r);
    refreshAttrDropdowns();
    if (initialName) {
      renderTags(r);
      setRowEnabled(r, true);
    }
  }

  $('#hhAddAttr').onclick = () => addAttrRow();

  attrRows.addEventListener('change', e => {
    if (!e.target.classList.contains('hh-a-name')) return;
    const r = e.target.closest('.hh-attr-row');
    if (e.target.value === '__new') {
      e.target.value = getRowName(r);
      openPrompt('Tạo thuộc tính mới', 'Tên thuộc tính', '', n => {
        if (!knownAttributes[n]) knownAttributes[n] = [];
        setRowAttr(r, n);
      });
      return;
    }
    setRowAttr(r, e.target.value);
  });

  attrRows.addEventListener('keydown', e => {
    if (!e.target.classList.contains('hh-a-in')) return;
    const r = e.target.closest('.hh-attr-row');
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addValToRow(r, e.target.value);
      e.target.value = '';
    } else if (e.key === 'Backspace' && !e.target.value && r._vals.length) {
      r._vals.pop();
      renderTags(r);
    }
  });

  attrRows.addEventListener('focusout', e => {
    if (e.target.classList.contains('hh-a-in') && e.target.value.trim()) {
      addValToRow(e.target.closest('.hh-attr-row'), e.target.value);
      e.target.value = '';
    }
  });

  attrRows.addEventListener('click', e => {
    const r = e.target.closest('.hh-attr-row');
    if (!r) return;
    const tagX = e.target.closest('.hh-tag button');
    if (tagX) {
      r._vals.splice(+tagX.dataset.i, 1);
      renderTags(r);
      return;
    }
    if (e.target.closest('.del')) {
      r.remove();
      refreshAttrDropdowns();
      return;
    }
    if (e.target.closest('.hh-quick') && !e.target.closest('.hh-quick').disabled) {
      openPickModal(r);
    } else if (e.target.closest('.hh-tagbox')) {
      const inp = r.querySelector('.hh-a-in');
      if (inp) inp.focus();
    }
  });

  /* ---------- Modal Chọn Nhanh Giá Trị Thuộc Tính ---------- */
  const pk = { row: null, name: '', sel: new Set(), q: '', sort: 'asc' };

  const getFilteredPickList = () => {
    const list = (knownAttributes[pk.name] || [])
      .filter(v => v.toLowerCase().includes(pk.q.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'vi'));
    return pk.sort === 'desc' ? list.reverse() : list;
  };

  function renderPickChips() {
    const list = getFilteredPickList();
    const chipsBox = $('#pkChips');
    if (!chipsBox) return;

    if (!list.length) {
      chipsBox.innerHTML = '<p class="text-muted small m-0">Chưa có giá trị nào. Hãy nhập giá trị ở ô thuộc tính rồi nhấn Enter để lưu vào danh sách.</p>';
      $('#pkAll').textContent = 'Chọn tất cả';
      return;
    }

    chipsBox.innerHTML = list.map(v => `
      <button type="button" class="hh-chip ${pk.sel.has(v) ? 'on' : ''}" data-v="${esc(v)}">${esc(v)}</button>
    `).join('');

    $('#pkAll').textContent = list.every(v => pk.sel.has(v)) ? 'Bỏ chọn tất cả' : 'Chọn tất cả';
  }

  function openPickModal(r) {
    pk.row = r;
    pk.name = getRowName(r);
    pk.sel = new Set(r._vals);
    pk.q = '';
    pk.sort = 'asc';
    $('#pkSearch').value = '';
    $('#pkSort').value = 'asc';
    $('#pkTitle').textContent = 'Chọn giá trị: ' + pk.name;
    renderPickChips();
    show($('#hhPickOv'));
  }

  $('#pkChips').addEventListener('click', e => {
    const c = e.target.closest('.hh-chip');
    if (!c) return;
    const v = c.dataset.v;
    if (pk.sel.has(v)) pk.sel.delete(v);
    else pk.sel.add(v);
    renderPickChips();
  });
  $('#pkSearch').addEventListener('input', e => {
    pk.q = e.target.value;
    renderPickChips();
  });
  $('#pkSort').addEventListener('change', e => {
    pk.sort = e.target.value;
    renderPickChips();
  });
  $('#pkAll').onclick = () => {
    const list = getFilteredPickList();
    const all = list.every(v => pk.sel.has(v));
    list.forEach(v => all ? pk.sel.delete(v) : pk.sel.add(v));
    renderPickChips();
  };
  $('#pkDone').onclick = () => {
    if (pk.row && knownAttributes[pk.name]) {
      pk.row._vals = knownAttributes[pk.name].filter(v => pk.sel.has(v));
      renderTags(pk.row);
    }
    hide($('#hhPickOv'));
  };

  /* ---------- Validation & Thu thập dữ liệu Form ---------- */
  function validateForm() {
    let firstInvalid = null;
    const check = (box, ok) => {
      box.classList.toggle('invalid', !ok);
      if (!ok && !firstInvalid) firstInvalid = box;
    };

    check($('#hhFldTen'), $('#formTenHang').value.trim() !== '');
    check($('#hhFldNhom'), $('#formMaNhom').value !== '');
    check($('#hhFldDvt'), $('#formMaDvt').value !== '');

    if (firstInvalid) {
      $$('.hh-tab')[0].click();
      firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const targetInput = firstInvalid.querySelector('input, select');
      if (targetInput) targetInput.focus({ preventScroll: true });
    }
    return !firstInvalid;
  }

  ['#formTenHang', '#formMaNhom', '#formMaDvt'].forEach(s => {
    const el = $(s);
    if (el) {
      el.addEventListener('input', e => e.target.closest('.hh-f')?.classList.remove('invalid'));
      el.addEventListener('change', e => e.target.closest('.hh-f')?.classList.remove('invalid'));
    }
  });

  function collectFormData() {
    const attrData = $$('.hh-attr-row', attrRows)
      .filter(r => getRowName(r) && r._vals.length)
      .map(r => ({
        ten: getRowName(r),
        giaTri: r._vals.join(', ')
      }));

    const isDirectSale = $('#chkBanTrucTiep').checked;
    const moTaHtml = $('#formMoTa').innerHTML.trim();

    return {
      maHang: parseInt($('#formMaHang').value) || 0,
      maHangNoiBo: $('#formMaHangNoiBo').value.trim() || null,
      quyCach: $('#formQuyCach').value.trim() || null,
      tenHang: $('#formTenHang').value.trim(),
      maNhom: parseInt($('#formMaNhom').value) || 0,
      maDvt: parseInt($('#formMaDvt').value) || 0,
      giaVon: getNum($('#formGiaVon')),
      giaBanThamKhao: getNum($('#formGiaBan')),
      tonKhoBanDau: getNum($('#formTonKhoBanDau')),
      tonToiThieu: getNum($('#formTonToiThieu')),
      tonCaoNhat: getNum($('#formTonCaoNhat')),
      viTri: $('#formViTri').value.trim() || null,
      trongLuong: getNum($('#formTrongLuong')),
      donViTrongLuong: $('#formDonViTrongLuong').value || 'g',
      thuocTinhJson: JSON.stringify(attrData),
      moTa: moTaHtml || null,
      trangThai: isDirectSale ? 'DANG_BAN' : 'NGUNG_BAN',
      danhSachHinhAnhBase64: imgs.map(i => i.base64).filter(Boolean),
      viTriAnhChinh: mainIdx,
      xoaHinhAnh: imgs.length === 0
    };
  }

  function resetForm() {
    $('#formMaHang').value = '0';
    $('#formMaHangNoiBo').value = '';
    $('#formQuyCach').value = '';
    $('#formTenHang').value = '';
    $('#formMaNhom').selectedIndex = 0;
    $('#formMaDvt').selectedIndex = 0;
    $('#formGiaVon').value = '0';
    $('#formGiaBan').value = '0';
    $('#formTonKhoBanDau').value = '0';
    $('#formTonToiThieu').value = '0';
    $('#formTonCaoNhat').value = '999,999,999';
    $('#formViTri').value = '';
    $('#formTrongLuong').value = '0';
    $('#formDonViTrongLuong').value = 'g';
    $('#formMoTa').innerHTML = '';
    $('#chkBanTrucTiep').checked = true;

    imgs = [];
    mainIdx = 0;
    renderImgs();

    attrRows.innerHTML = '';
    addAttrRow();

    $$('.hh-f.invalid').forEach(f => f.classList.remove('invalid'));
    $$('.hh-tab')[0].click();
    $('#boxInitialStock').style.display = '';
  }

  /* ---------- Lưu Hàng hóa ---------- */
  function doSave(mode) {
    if (!validateForm()) return;
    const payload = collectFormData();
    const isEdit = payload.maHang > 0;
    const url = isEdit ? ('/HangHoa/Edit/' + payload.maHang) : '/HangHoa/Create';

    const saveBtn = $('#btnSaveProduct');
    const origText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';

    jQuery.ajax({
      url: url,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function (res) {
        saveBtn.disabled = false;
        saveBtn.textContent = origText;

        if (typeof window.loadTable === 'function') {
          window.loadTable();
        }

        if (mode === 'again') {
          resetForm();
          showToast('Đã lưu hàng hóa. Mời nhập mặt hàng tiếp theo.');
          $('#formTenHang').focus();
        } else if (mode === 'copy') {
          $('#formMaHang').value = '0';
          $('#formMaHangNoiBo').value = '';
          $('#formQuyCach').value = '';
          showToast('Đã lưu hàng hóa. Đã sao chép sang hàng mới.');
          $('#formTenHang').focus();
        } else {
          hide($('#hangHoaModalOv'));
          resetForm();
          showToast(res.message || 'Đã lưu hàng hóa thành công.');
        }
      },
      error: function (xhr) {
        saveBtn.disabled = false;
        saveBtn.textContent = origText;
        alert('Lỗi: ' + (xhr.responseJSON?.message || 'Không thể lưu hàng hóa.'));
      }
    });
  }

  $('#btnSaveProduct').onclick = () => doSave('close');
  $('#btnSaveAgain').onclick = () => doSave('again');
  $('#btnSaveCopy').onclick = () => {
    $('#hhSplitMenu').classList.remove('show');
    doSave('copy');
  };
  $('#btnCaret').onclick = e => {
    e.stopPropagation();
    $('#hhSplitMenu').classList.toggle('show');
  };
  document.addEventListener('click', () => $('#hhSplitMenu').classList.remove('show'));

  // Chặn Submit khi ấn Enter ở các input đơn dòng
  $('#hangHoaModalOv').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !e.target.classList.contains('hh-a-in')) {
      e.preventDefault();
    }
  });

  /* ---------- Giao diện mở Modal toàn cục ---------- */
  window.openCreateProductModal = function () {
    resetForm();
    $('#hhModalTitle').textContent = 'Tạo hàng hóa';
    $('#boxInitialStock').style.display = '';
    show($('#hangHoaModalOv'));
    setTimeout(() => $('#formTenHang').focus(), 40);
  };

  window.openEditProductModal = function (id, isCopy = false) {
    resetForm();
    $('#hhModalTitle').textContent = isCopy ? 'Thêm mới hàng hóa (Sao chép)' : 'Cập nhật hàng hóa';
    $('#formMaHang').value = isCopy ? '0' : id;
    $('#boxInitialStock').style.display = isCopy ? '' : 'none';

    jQuery.ajax({
      url: '/HangHoa/GetItem/' + id,
      type: 'GET',
      success: function (res) {
        $('#formMaHangNoiBo').value = isCopy ? (res.maHangNoiBo ? res.maHangNoiBo + '_CP' : '') : (res.maHangNoiBo || '');
        $('#formQuyCach').value = res.quyCach || '';
        $('#formTenHang').value = isCopy ? ((res.tenHang || '') + ' (Copy)') : (res.tenHang || '');
        $('#formMaNhom').value = res.maNhom || '';
        $('#formMaDvt').value = res.maDvt || '';
        $('#formGiaVon').value = formatNum(res.giaVon);
        $('#formGiaBan').value = formatNum(res.giaBanThamKhao);
        $('#formTonKhoBanDau').value = '0';
        $('#formTonToiThieu').value = formatNum(res.tonToiThieu);
        $('#formTonCaoNhat').value = formatNum(res.tonCaoNhat ?? 999999999);
        $('#formViTri').value = res.viTri || '';
        $('#formTrongLuong').value = res.trongLuong || 0;
        $('#formDonViTrongLuong').value = res.donViTrongLuong || 'g';
        $('#formMoTa').innerHTML = res.moTa || '';
        $('#chkBanTrucTiep').checked = (res.trangThai === 'DANG_BAN');

        // Nạp tối đa 5 ảnh
        imgs = [];
        if (Array.isArray(res.danhSachHinhAnhBase64) && res.danhSachHinhAnhBase64.length > 0) {
          imgs = res.danhSachHinhAnhBase64.map(b => ({ base64: b, url: b }));
          mainIdx = Math.min(res.viTriAnhChinh || 0, imgs.length - 1);
        } else if (res.hinhAnhBase64) {
          imgs = [{ base64: res.hinhAnhBase64, url: res.hinhAnhBase64 }];
          mainIdx = 0;
        }
        renderImgs();

        // Nạp thuộc tính
        if (attrRows) {
          attrRows.innerHTML = '';
          let listAttrs = [];
          try {
            if (res.thuocTinhJson) {
              listAttrs = typeof res.thuocTinhJson === 'string' ? JSON.parse(res.thuocTinhJson) : res.thuocTinhJson;
            }
          } catch (e) { listAttrs = []; }

          if (Array.isArray(listAttrs) && listAttrs.length > 0) {
            listAttrs.forEach(it => {
              const name = it.Ten || it.ten || '';
              const valStr = it.GiaTri || it.giaTri || '';
              const vals = valStr.split(',').map(s => s.trim()).filter(Boolean);
              if (name) addAttrRow(name, vals);
            });
          }
          if (!attrRows.children.length) addAttrRow();
        }

        show($('#hangHoaModalOv'));
      },
      error: function (xhr) {
        alert('Không thể tải thông tin hàng hóa: ' + (xhr.responseJSON?.message || 'Lỗi kết nối.'));
      }
    });
  };

  // Khởi tạo ban đầu
  if (attrRows) {
    addAttrRow();
  }
  renderImgs();
})();
