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
  function showToast(msg, type) {
    if (window.KiotToast) {
      window.KiotToast.show(msg, type || 'success');
      return;
    }
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
      if (target) {
        hide(target);
        if (target.id === 'hhEditItemOv' && editItemType === 'vitri') {
          openLocationDropdown();
        }
      }
    }
  });

  // Đóng modal bằng phím Escape
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const top = ['hhDeleteProductOv', 'hhEditItemOv', 'hhPickOv', 'hhPromptOv', 'hangHoaModalOv'].map(id => $('#' + id)).find(o => o && o.classList.contains('show'));
    if (top) {
      hide(top);
      if (top.id === 'hhEditItemOv' && editItemType === 'vitri') {
        openLocationDropdown();
      }
    }
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

  /* ---------- Quản lý 5 ảnh sản phẩm (Đóng gói KiotFilter.initImageUploader) ---------- */
  const imgUploader = (window.KiotFilter && typeof KiotFilter.initImageUploader === 'function')
    ? KiotFilter.initImageUploader({
        mainBoxSelector: '#hhImgMain',
        thumbsBoxSelector: '#hhThumbs',
        fileInputSelector: '#hhImgFile',
        fileReplaceMainSelector: '#hhImgFileReplaceMain',
        modalSelector: '#hhModalOv',
        maxImages: 5,
        maxDimension: 1200,
        quality: 0.88,
        onToast: (msg) => showToast(msg)
      })
    : null;

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

  /* ---------- Modal Sửa & Xóa Vị trí / Thuộc tính (Chuẩn KiotViet) ---------- */
  let editItemType = null; // 'vitri' | 'thuoctinh'
  let editItemOldVal = '';

  function openEditItemModal(type, val) {
    editItemType = type;
    editItemOldVal = (val || '').trim();
    const isVitri = type === 'vitri';

    const titleEl = $('#editItemTitle');
    const labelEl = $('#editItemLabel');
    const saveBtn = $('#btnEditItemSave');
    const inp = $('#editItemInput');
    const field = $('#editItemField');
    const err = $('#editItemErr');

    if (titleEl) titleEl.textContent = isVitri ? 'Sửa vị trí' : 'Sửa thuộc tính';
    if (labelEl) labelEl.textContent = isVitri ? 'Vị trí' : 'Tên thuộc tính';
    if (saveBtn) saveBtn.textContent = isVitri ? 'Lưu' : 'Xong';

    if (inp) inp.value = editItemOldVal;
    if (field) field.classList.remove('invalid');
    if (err) err.style.display = 'none';

    // Đảm bảo dropdown bên dưới được giữ nguyên trạng thái mở khi đang sửa
    if (isVitri) {
      openLocationDropdown();
    }

    show($('#hhEditItemOv'));
    setTimeout(() => {
      if (inp) {
        inp.focus();
        inp.select();
      }
    }, 50);
  }

  function handleEditItemSave() {
    const inp = $('#editItemInput');
    const field = $('#editItemField');
    const err = $('#editItemErr');
    const newVal = inp ? inp.value.trim() : '';

    if (!newVal) {
      if (err) {
        err.textContent = editItemType === 'vitri' ? 'Vui lòng nhập vị trí.' : 'Vui lòng nhập tên thuộc tính.';
        err.style.display = 'block';
      }
      if (field) field.classList.add('invalid');
      return;
    }

    if (ci(newVal, editItemOldVal)) {
      if (editItemType === 'vitri') {
        const idx = availableLocations.findIndex(a => ci(a, editItemOldVal));
        if (idx >= 0) availableLocations[idx] = newVal;
        const sIdx = selectedLocations.findIndex(s => ci(s, editItemOldVal));
        if (sIdx >= 0) selectedLocations[sIdx] = newVal;
        renderLocationTags();
        renderLocationDropdown($('#formViTriSearch')?.value || '');
        openLocationDropdown();
      } else {
        if (newVal !== editItemOldVal && knownAttributes[editItemOldVal]) {
          const vals = knownAttributes[editItemOldVal];
          delete knownAttributes[editItemOldVal];
          knownAttributes[newVal] = vals;
          $$('.hh-attr-row', attrRows).forEach(r => {
            if (ci(getRowName(r), editItemOldVal)) r.dataset.cur = newVal;
          });
          refreshAttrDropdowns();
        }
      }
      hide($('#hhEditItemOv'));
      return;
    }

    if (editItemType === 'vitri') {
      if (availableLocations.some(a => ci(a, newVal))) {
        if (err) {
          err.textContent = 'Vị trí "' + newVal + '" đã tồn tại trong danh sách.';
          err.style.display = 'block';
        }
        if (field) field.classList.add('invalid');
        return;
      }
      const idx = availableLocations.findIndex(a => ci(a, editItemOldVal));
      if (idx >= 0) {
        availableLocations[idx] = newVal;
      } else {
        availableLocations.push(newVal);
      }
      const sIdx = selectedLocations.findIndex(s => ci(s, editItemOldVal));
      if (sIdx >= 0) {
        selectedLocations[sIdx] = newVal;
      }
      renderLocationTags();
      renderLocationDropdown($('#formViTriSearch')?.value || '');
      openLocationDropdown();

      // Đồng bộ nếu có item ở menu lọc cột trái
      const sideItem = $(`#dropdownViTri .kiot-ms-item[data-val="${CSS.escape ? CSS.escape(editItemOldVal) : editItemOldVal}"]`);
      if (sideItem) {
        sideItem.dataset.val = newVal;
        sideItem.dataset.name = newVal;
        const sp = sideItem.querySelector('span');
        if (sp) sp.textContent = newVal;
      }

      hide($('#hhEditItemOv'));
      showToast('Đã cập nhật vị trí: ' + newVal);
    } else {
      if (knownAttributes[newVal]) {
        if (err) {
          err.textContent = 'Thuộc tính "' + newVal + '" đã tồn tại trong danh sách.';
          err.style.display = 'block';
        }
        if (field) field.classList.add('invalid');
        return;
      }
      const vals = knownAttributes[editItemOldVal] || [];
      delete knownAttributes[editItemOldVal];
      knownAttributes[newVal] = vals;

      $$('.hh-attr-row', attrRows).forEach(r => {
        if (ci(getRowName(r), editItemOldVal)) {
          r.dataset.cur = newVal;
        }
      });
      refreshAttrDropdowns();
      hide($('#hhEditItemOv'));
      showToast('Đã cập nhật thuộc tính: ' + newVal);
    }
  }

  function handleEditItemDelete() {
    if (!editItemOldVal) return;
    const itemLabel = editItemType === 'vitri' ? 'vị trí' : 'thuộc tính';
    const doDelete = () => {
      if (editItemType === 'vitri') {
        availableLocations = availableLocations.filter(a => !ci(a, editItemOldVal));
        selectedLocations = selectedLocations.filter(s => !ci(s, editItemOldVal));
        renderLocationTags();
        renderLocationDropdown($('#formViTriSearch')?.value || '');
        openLocationDropdown();

        // Đồng bộ nếu có item ở menu lọc cột trái
        const sideItem = $(`#dropdownViTri .kiot-ms-item[data-val="${CSS.escape ? CSS.escape(editItemOldVal) : editItemOldVal}"]`);
        if (sideItem) sideItem.remove();

        hide($('#hhEditItemOv'));
        showToast('Đã xóa vị trí: ' + editItemOldVal);
      } else {
        delete knownAttributes[editItemOldVal];
        $$('.hh-attr-row', attrRows).forEach(r => {
          if (ci(getRowName(r), editItemOldVal)) {
            setRowAttr(r, '');
          }
        });
        refreshAttrDropdowns();
        hide($('#hhEditItemOv'));
        showToast('Đã xóa thuộc tính: ' + editItemOldVal);
      }
    };

    if (window.KiotConfirm) {
      window.KiotConfirm.show({
        title: `Xóa ${itemLabel}`,
        message: `Bạn có chắc chắn muốn xóa ${itemLabel} <strong style="color: #111827;">${editItemOldVal}</strong> không? Thao tác này không thể hoàn tác.`,
        onConfirm: doDelete
      });
    } else if (confirm(`Bạn có chắc chắn muốn xóa ${itemLabel} "${editItemOldVal}" không?`)) {
      doDelete();
    }
  }

  $('#btnEditItemSave')?.addEventListener('click', handleEditItemSave);
  $('#btnEditItemDelete')?.addEventListener('click', handleEditItemDelete);
  $('#editItemInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditItemSave();
    }
  });
  $('#editItemInput')?.addEventListener('input', () => {
    $('#editItemField')?.classList.remove('invalid');
    const err = $('#editItemErr');
    if (err) err.style.display = 'none';
  });

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
          csMaNhom?.sync();
          $('#hhFldNhom').classList.remove('invalid');

          const $sidebar = jQuery('#dropdownNhomHang');
          if ($sidebar.length && !$sidebar.find(`.kiot-ms-item[data-val="${res.maNhom}"]`).length) {
            $sidebar.append(`
              <div class="kiot-ms-item" data-val="${res.maNhom}" data-name="${res.tenNhom}">
                <input type="checkbox" class="form-check-input" />
                <span class="kiot-ms-text">${res.tenNhom}</span>
                <button type="button" class="kiot-item-edit-btn hh-item-edit-btn" data-id="${res.maNhom}" data-name="${res.tenNhom}" data-type="nhomhang" title="Sửa nhóm hàng" aria-label="Sửa ${res.tenNhom}">
                  <i class="bi bi-pencil" style="font-size:12px;pointer-events:none;"></i>
                </button>
              </div>
            `);
          }

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
          csMaDvt?.sync();
          $('#hhFldDvt').classList.remove('invalid');
          showToast('Đã thêm đơn vị tính: ' + res.tenDvt);
        },
        error: function (xhr) {
          showToast('Lỗi: ' + (xhr.responseJSON?.message || 'Không thể tạo ĐVT.'));
        }
      });
    });
  };

  /* ==========================================================================
     HỆ THỐNG CUSTOM SINGLE-SELECT DROPDOWN (Nhóm hàng, ĐVT, Trọng lượng)
     Đồng nhất giao diện với Dropdown Vị trí (hover, bo góc, bóng mờ, tích xanh ✓)
     Tự động đảo hướng hiển thị ngược lên (drop-up) khi ở vị trí thấp
     ========================================================================== */
  function checkDropdownDirection(wrap, box, dropdown) {
    if (!wrap || !box || !dropdown) return;

    const boxRect = box.getBoundingClientRect();
    const modalBody = wrap.closest('.hh-m-body') || document.body;
    const bodyRect = modalBody.getBoundingClientRect();

    // Giới hạn dưới cùng giữa mép modal body và mép màn hình
    const containerBottom = Math.min(bodyRect.bottom, window.innerHeight);
    const containerTop = Math.max(bodyRect.top, 0);

    const spaceBelow = containerBottom - boxRect.bottom;
    const spaceAbove = boxRect.top - containerTop;

    const neededHeight = 220; // Chiều cao tối đa chuẩn của dropdown

    // Nếu khoảng trống bên dưới không đủ (< 220px) VÀ bên trên có nhiều khoảng trống hơn bên dưới
    if (spaceBelow < neededHeight && spaceAbove > spaceBelow) {
      wrap.classList.add('drop-up');
      const maxH = Math.min(220, Math.max(120, spaceAbove - 12));
      dropdown.style.maxHeight = maxH + 'px';
    } else {
      wrap.classList.remove('drop-up');
      const maxH = Math.min(220, Math.max(120, spaceBelow - 12));
      dropdown.style.maxHeight = maxH + 'px';
    }
  }

  function closeAllSingleSelects(exceptWrap = null) {
    $$('.hh-cs-wrap.open').forEach(w => {
      if (w !== exceptWrap) {
        w.classList.remove('open');
        w.classList.remove('drop-up');
        const dd = w.querySelector('.hh-cs-dropdown');
        if (dd) {
          dd.style.display = 'none';
          dd.style.maxHeight = '';
        }
        const sec = w.closest('.hh-sec, .hh-top-grid');
        if (sec) sec.style.zIndex = '';
        const inp = w.querySelector('.hh-cs-input');
        const targetId = w.dataset.selectId;
        const sel = targetId ? $(targetId) : null;
        if (inp && sel) {
          const opt = sel.options[sel.selectedIndex];
          inp.value = (opt && opt.value) ? opt.textContent.trim() : '';
        }
        w.querySelectorAll('.hh-cs-item').forEach(it => it.style.display = 'flex');
        const emptyEl = w.querySelector('.hh-cs-empty');
        if (emptyEl) emptyEl.style.display = 'none';
      }
    });
  }

  function initSingleSelect(config) {
    const { wrapId, boxId, inputId, dropdownId, listId, selectId, searchInputId, onSelect, onNew } = config;
    const wrap = $(wrapId);
    const box = $(boxId);
    const input = $(inputId);
    const dropdown = $(dropdownId);
    const list = $(listId);
    const select = $(selectId);
    const searchInput = searchInputId ? $(searchInputId) : dropdown?.querySelector('.hh-cs-search input');

    if (!wrap || !box || !input || !dropdown || !list || !select) return null;

    function openDropdown() {
      closeAllSingleSelects(wrap);
      closeLocationDropdown();
      checkDropdownDirection(wrap, box, dropdown);
      const sec = wrap.closest('.hh-sec, .hh-top-grid');
      if (sec) sec.style.zIndex = '50';
      dropdown.style.display = 'block';
      wrap.classList.add('open');
      if (searchInput) {
        searchInput.value = '';
        setTimeout(() => searchInput.focus(), 30);
      } else {
        input.focus();
      }
      filterItems('');
    }

    function closeDropdown() {
      dropdown.style.display = 'none';
      dropdown.style.maxHeight = '';
      wrap.classList.remove('open');
      wrap.classList.remove('drop-up');
      const sec = wrap.closest('.hh-sec, .hh-top-grid');
      if (sec) sec.style.zIndex = '';
      const curOpt = select.options[select.selectedIndex];
      input.value = (curOpt && curOpt.value) ? curOpt.textContent.trim() : '';
      if (searchInput) searchInput.value = '';
      filterItems('');
    }

    function selectValue(val, text) {
      select.value = val;
      input.value = text || (val ? select.options[select.selectedIndex]?.textContent?.trim() : '');
      updateSelectedUI();
      closeDropdown();
      select.closest('.hh-f')?.classList.remove('invalid');
      select.dispatchEvent(new Event('change', { bubbles: true }));
      select.dispatchEvent(new Event('input', { bubbles: true }));
      if (typeof onSelect === 'function') onSelect(val, text);
    }

    function updateSelectedUI() {
      const curVal = String(select.value ?? '');
      $$('.hh-cs-item', list).forEach(item => {
        const itemVal = String(item.dataset.val ?? '');
        item.classList.toggle('selected', itemVal === curVal);
      });
      const curOpt = select.options[select.selectedIndex];
      input.value = (curOpt && curOpt.value) ? curOpt.textContent.trim() : '';
    }

    function filterItems(query) {
      query = (query || '').toLowerCase().trim();
      let matchCount = 0;
      $$('.hh-cs-item', list).forEach(item => {
        if (item.classList.contains('hh-cs-new-item')) return;
        const text = (item.querySelector('span')?.textContent || item.textContent || '').toLowerCase();
        const matches = !query || text.includes(query);
        item.style.display = matches ? 'flex' : 'none';
        if (matches) matchCount++;
      });
      let emptyMsg = list.querySelector('.hh-cs-empty');
      if (!emptyMsg) {
        emptyMsg = document.createElement('div');
        emptyMsg.className = 'hh-cs-empty';
        emptyMsg.textContent = 'Không tìm thấy kết quả phù hợp';
        list.appendChild(emptyMsg);
      }
      emptyMsg.style.display = (matchCount === 0 && query) ? 'block' : 'none';
    }

    box.addEventListener('click', e => {
      e.stopPropagation();
      if (wrap.classList.contains('open')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    if (searchInput) {
      searchInput.addEventListener('click', e => e.stopPropagation());
      searchInput.addEventListener('input', e => {
        filterItems(e.target.value);
      });
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeDropdown();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const firstVisible = list.querySelector('.hh-cs-item:not([style*="display: none"]):not(.hh-cs-new-item)');
          if (firstVisible) {
            selectValue(firstVisible.dataset.val, firstVisible.querySelector('span')?.textContent?.trim());
          }
        }
      });
    }

    input.addEventListener('input', e => {
      if (searchInput) return;
      if (!wrap.classList.contains('open')) {
        checkDropdownDirection(wrap, box, dropdown);
        const sec = wrap.closest('.hh-sec, .hh-top-grid');
        if (sec) sec.style.zIndex = '50';
        dropdown.style.display = 'block';
        wrap.classList.add('open');
      }
      filterItems(e.target.value);
    });

    input.addEventListener('keydown', e => {
      if (searchInput) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const firstVisible = list.querySelector('.hh-cs-item:not([style*="display: none"]):not(.hh-cs-new-item)');
        if (firstVisible) {
          selectValue(firstVisible.dataset.val, firstVisible.querySelector('span')?.textContent?.trim());
        }
      }
    });

    list.addEventListener('click', e => {
      const editBtn = e.target.closest('.hh-item-edit-btn, .kiot-item-edit-btn');
      if (editBtn) {
        e.stopPropagation();
        const id = editBtn.dataset.id || editBtn.closest('[data-val]')?.dataset.val;
        const val = editBtn.dataset.val || editBtn.closest('[data-val]')?.querySelector('span')?.textContent?.trim();
        if (typeof window.handleEditNhomHang === 'function') {
          window.handleEditNhomHang(id, val);
        }
        return;
      }
      e.stopPropagation();
      const newItemBtn = e.target.closest('.hh-cs-new-item');
      if (newItemBtn) {
        closeDropdown();
        if (typeof onNew === 'function') onNew();
        return;
      }
      const item = e.target.closest('.hh-cs-item');
      if (!item) return;
      selectValue(item.dataset.val, item.querySelector('span')?.textContent?.trim());
    });

    function syncOptions() {
      list.innerHTML = '';
      const isNhom = (wrap && wrap.id && wrap.id.includes('Nhom')) || (list && list.id && list.id.includes('Nhom'));
      Array.from(select.options).forEach(opt => {
        if (opt.value === '') return;
        const isSel = (String(select.value) === String(opt.value));
        const level = opt.dataset.level ? parseInt(opt.dataset.level) : 0;
        const it = document.createElement('div');
        it.className = `hh-cs-item ${isSel ? 'selected' : ''}`;
        it.dataset.val = opt.value;
        if (level > 0) {
          it.style.paddingLeft = (12 + level * 16) + 'px';
        }
        const treePrefix = level > 0 ? `<span class="kiot-tree-branch text-muted me-1" style="font-family:monospace;font-size:12px;">└─</span>` : '';
        const editBtnHtml = isNhom ? `
          <button type="button" class="hh-item-edit-btn" data-type="nhom" data-id="${opt.value}" data-val="${esc(opt.textContent.trim())}" title="Sửa nhóm hàng" aria-label="Sửa nhóm hàng ${esc(opt.textContent.trim())}">
            <svg viewBox="0 0 24 24"><use href="#i-pencil"/></svg>
          </button>
        ` : '';
        it.innerHTML = `
          <span>${treePrefix}${esc(opt.textContent.trim())}</span>
          ${editBtnHtml}
          <svg class="hh-check-icon" viewBox="0 0 24 24" style="width:18px;height:18px;stroke:#2563eb;stroke-width:2.5;fill:none;stroke-linecap:round;stroke-linejoin:round;"><path d="M4 12l5 5L20 6"/></svg>
        `;
        list.appendChild(it);
      });
      if (config.newItemText) {
        const newBtn = document.createElement('div');
        newBtn.className = 'hh-cs-item hh-cs-new-item';
        newBtn.innerHTML = `<span>${config.newItemText}</span>`;
        list.appendChild(newBtn);
      }
      updateSelectedUI();
    }

    return {
      open: openDropdown,
      close: closeDropdown,
      select: selectValue,
      sync: syncOptions,
      updateUI: updateSelectedUI
    };
  }

  const csMaNhom = initSingleSelect({
    wrapId: '#wrapMaNhom',
    boxId: '#boxMaNhom',
    inputId: '#inputMaNhom',
    dropdownId: '#dropdownMaNhom',
    listId: '#listMaNhom',
    selectId: '#formMaNhom',
    searchInputId: '#searchMaNhom'
  });

  const csMaDvt = initSingleSelect({
    wrapId: '#wrapMaDvt',
    boxId: '#boxMaDvt',
    inputId: '#inputMaDvt',
    dropdownId: '#dropdownMaDvt',
    listId: '#listMaDvt',
    selectId: '#formMaDvt',
    searchInputId: '#searchMaDvt'
  });

  const csDonViTrongLuong = initSingleSelect({
    wrapId: '#wrapDonViTrongLuong',
    boxId: '#boxDonViTrongLuong',
    inputId: '#inputDonViTrongLuong',
    dropdownId: '#dropdownDonViTrongLuong',
    listId: '#listDonViTrongLuong',
    selectId: '#formDonViTrongLuong'
  });

  csMaNhom?.updateUI();
  csMaDvt?.updateUI();
  csDonViTrongLuong?.updateUI();

  /* ---------- Vị trí đa chọn (Multi-select dropdown tags chuẩn KiotViet) ---------- */
  let availableLocations = [
    'Kho trung tâm',
    'Kệ A1 - Tầng 1',
    'Kệ A1 - Tầng 2',
    'Kệ B2 - Tầng 1',
    'Kệ B2 - Tầng 2',
    'Khu vực xuất hàng'
  ];

  // Tự động nạp thêm vị trí từ danh sách vị trí đã nạp trong DB nếu có
  $$('#dropdownViTri .kiot-ms-item').forEach(el => {
    const v = el.dataset.val?.trim();
    if (v && !availableLocations.some(a => ci(a, v))) {
      availableLocations.push(v);
    }
  });

  let selectedLocations = [];

  function renderLocationTags() {
    const wrap = $('#formViTriTags');
    const hidden = $('#formViTri');
    if (!wrap) return;
    wrap.innerHTML = selectedLocations.map(loc => `
      <span class="hh-loc-tag" data-val="${esc(loc)}">
        <span>${esc(loc)}</span>
        <button type="button" class="hh-loc-tag-del" data-del="${esc(loc)}" title="Bỏ chọn ${esc(loc)}">×</button>
      </span>
    `).join('');
    if (hidden) {
      hidden.value = selectedLocations.join(', ');
    }
    const input = $('#formViTriSearch');
    if (input) {
      input.placeholder = selectedLocations.length ? '' : 'Chọn hoặc nhập vị trí...';
    }
  }

  function renderLocationDropdown(filterText = '') {
    const listEl = $('#formViTriList');
    if (!listEl) return;
    const filter = String(filterText || '').trim().toLowerCase();
    const filtered = availableLocations.filter(loc => !filter || loc.toLowerCase().includes(filter));

    if (!filtered.length) {
      listEl.innerHTML = `<div class="hh-multiselect-empty">Không tìm thấy vị trí "${esc(filterText)}" (Nhấn Enter hoặc nút "Tạo mới" để thêm)</div>`;
      return;
    }

    listEl.innerHTML = filtered.map(loc => {
      const isSel = selectedLocations.some(s => ci(s, loc));
      return `
        <div class="hh-multiselect-item ${isSel ? 'selected' : ''}" data-val="${esc(loc)}">
          <span>${esc(loc)}</span>
          <button type="button" class="hh-item-edit-btn" data-type="vitri" data-val="${esc(loc)}" title="Sửa vị trí" aria-label="Sửa vị trí ${esc(loc)}">
            <svg viewBox="0 0 24 24"><use href="#i-pencil"/></svg>
          </button>
          <svg class="hh-check-icon" viewBox="0 0 24 24" style="width:18px;height:18px;stroke:#2563eb;stroke-width:2.5;fill:none;stroke-linecap:round;stroke-linejoin:round;"><path d="M4 12l5 5L20 6"/></svg>
        </div>
      `;
    }).join('');
  }

  function toggleLocation(locName) {
    if (!locName) return;
    const idx = selectedLocations.findIndex(s => ci(s, locName));
    if (idx >= 0) {
      selectedLocations.splice(idx, 1);
    } else {
      selectedLocations.push(locName);
      if (!availableLocations.some(a => ci(a, locName))) {
        availableLocations.push(locName);
      }
    }
    renderLocationTags();
    renderLocationDropdown($('#formViTriSearch')?.value || '');
  }

  function addLocation(locName) {
    locName = (locName || '').trim();
    if (!locName) return;
    if (!availableLocations.some(a => ci(a, locName))) {
      availableLocations.push(locName);
    }
    if (!selectedLocations.some(s => ci(s, locName))) {
      selectedLocations.push(locName);
    }
    renderLocationTags();
    renderLocationDropdown($('#formViTriSearch')?.value || '');
  }

  function openLocationDropdown() {
    const dd = $('#formViTriDropdown');
    const wrap = $('#formViTriWrap');
    const box = $('#formViTriBox');
    if (!dd || !wrap || !box) return;
    closeAllSingleSelects();
    checkDropdownDirection(wrap, box, dd);
    const sec = wrap.closest('.hh-sec, .hh-top-grid');
    if (sec) sec.style.zIndex = '50';
    dd.style.display = 'block';
    wrap.classList.add('open');
    renderLocationDropdown($('#formViTriSearch')?.value || '');
  }

  function closeLocationDropdown() {
    const dd = $('#formViTriDropdown');
    const wrap = $('#formViTriWrap');
    if (dd) {
      dd.style.display = 'none';
      dd.style.maxHeight = '';
    }
    if (wrap) {
      wrap.classList.remove('open');
      wrap.classList.remove('drop-up');
      const sec = wrap.closest('.hh-sec, .hh-top-grid');
      if (sec) sec.style.zIndex = '';
    }
  }

  // Mở dropdown khi click vào box vị trí trong modal
  $('#formViTriBox')?.addEventListener('click', e => {
    const delBtn = e.target.closest('.hh-loc-tag-del');
    if (delBtn) {
      e.stopPropagation();
      const val = delBtn.dataset.del;
      const idx = selectedLocations.findIndex(s => ci(s, val));
      if (idx >= 0) {
        selectedLocations.splice(idx, 1);
        renderLocationTags();
        renderLocationDropdown($('#formViTriSearch')?.value || '');
      }
      return;
    }
    const input = $('#formViTriSearch');
    if (input) input.focus();
    openLocationDropdown();
  });

  $('#formViTriSearch')?.addEventListener('focus', () => {
    openLocationDropdown();
  });

  // Tìm kiếm hoặc nhập thêm vị trí
  $('#formViTriSearch')?.addEventListener('input', e => {
    openLocationDropdown();
    renderLocationDropdown(e.target.value);
  });

  $('#formViTriSearch')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.target.value.trim().replace(/^,+|,+$/g, '');
      if (val) {
        addLocation(val);
        e.target.value = '';
        renderLocationDropdown('');
      }
    } else if (e.key === 'Backspace' && !e.target.value && selectedLocations.length) {
      selectedLocations.pop();
      renderLocationTags();
      renderLocationDropdown('');
    }
  });

  // Click vào item trong dropdown (giữ dropdown mở, toggle checkmark)
  $('#formViTriList')?.addEventListener('click', e => {
    e.stopPropagation();
    const editBtn = e.target.closest('.hh-item-edit-btn');
    if (editBtn) {
      const val = editBtn.dataset.val;
      openEditItemModal('vitri', val);
      return;
    }
    const item = e.target.closest('.hh-multiselect-item');
    if (!item) return;
    const val = item.dataset.val;
    toggleLocation(val);
    const input = $('#formViTriSearch');
    if (input) {
      input.value = '';
      input.focus();
    }
  });

  // Đóng dropdown khi click ra ngoài (ngoại trừ khi đang thao tác trong modal sửa/prompt/confirm)
  document.addEventListener('click', e => {
    // 1. Không đóng dropdown nếu click xảy ra bên trong modal con (Sửa vị trí/thuộc tính, Prompt, Confirm, Delete, Pick...)
    if (e.target.closest('#hhEditItemOv, #hhPromptOv, #kiotPromptOv, #kiotConfirmOv, #hhDeleteProductOv, #hhPickOv, .kiot-prompt-ov, .kiot-confirm-ov, .modal-box')) {
      return;
    }
    // 2. Không đóng dropdown nếu đang có bất kỳ modal con nào đang hiển thị
    if (document.querySelector('#hhEditItemOv.show, #hhPromptOv.show, #kiotPromptOv.show, #kiotConfirmOv.show, #hhDeleteProductOv.show, #hhPickOv.show, .kiot-prompt-ov.show, .kiot-confirm-ov.show')) {
      return;
    }

    if (!e.target.closest('#formViTriWrap') && !e.target.closest('#btnNewViTri')) {
      closeLocationDropdown();
    }
    if (!e.target.closest('.hh-cs-wrap') && !e.target.closest('.hh-link')) {
      closeAllSingleSelects();
    }
    if (!e.target.closest('#wrapPkSort')) {
      $('#wrapPkSort')?.classList.remove('open');
    }
  });

  // Tự động kiểm tra và đảo hướng dropdown khi cuộn modal
  $('#hhModalBody')?.addEventListener('scroll', () => {
    const openWrap = document.querySelector('.hh-cs-wrap.open, .hh-multiselect-wrap.open');
    if (openWrap) {
      const box = openWrap.querySelector('.hh-cs-box, .hh-multiselect-box');
      const dd = openWrap.querySelector('.hh-cs-dropdown, .hh-multiselect-dropdown');
      if (box && dd) {
        checkDropdownDirection(openWrap, box, dd);
      }
    }
  }, { passive: true });

  // Nút Tạo mới Vị trí
  $('#btnNewViTri')?.addEventListener('click', () => {
    openPrompt('Tạo mới vị trí kho', 'Vị trí kho', '', val => {
      addLocation(val);
      showToast('Đã thêm và chọn vị trí: ' + val);
    });
  });

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
      const csInput = r.querySelector('.hh-a-input');
      const csList = r.querySelector('.hh-a-list');

      if (sel) {
        sel.innerHTML = '<option value="">Chọn thuộc tính</option>' +
          opts.map(n => `<option ${n === cur ? 'selected' : ''}>${esc(n)}</option>`).join('') +
          (cur && !opts.includes(cur) ? `<option value="${esc(cur)}" selected>${esc(cur)}</option>` : '') +
          '<option value="__new">+ Tạo thuộc tính mới</option>';
        sel.value = cur;
      }

      if (csInput) {
        csInput.value = cur || '';
      }

      if (csList) {
        const allItems = [...opts];
        if (cur && !allItems.includes(cur)) allItems.unshift(cur);
        csList.innerHTML = allItems.map(n => `
          <div class="hh-cs-item ${n === cur ? 'selected' : ''}" data-val="${esc(n)}">
            <span>${esc(n)}</span>
            <button type="button" class="hh-item-edit-btn" data-type="thuoctinh" data-val="${esc(n)}" title="Sửa thuộc tính" aria-label="Sửa thuộc tính ${esc(n)}">
              <svg viewBox="0 0 24 24"><use href="#i-pencil"/></svg>
            </button>
            <svg class="hh-check-icon" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg>
          </div>
        `).join('') + `
          <div class="hh-cs-item hh-cs-new-item" data-val="__new">
            <span>+ Tạo thuộc tính mới</span>
          </div>
        `;
      }
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
      <div class="hh-cs-wrap hh-a-cs-wrap" style="width: 220px; flex: none;">
        <div class="hh-cs-box">
          <input type="text" class="hh-cs-input hh-a-input" placeholder="Chọn thuộc tính" readonly autocomplete="off" />
          <svg class="hh-cs-arrow" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="hh-cs-dropdown" style="display: none;">
          <div class="hh-cs-list hh-a-list"></div>
        </div>
      </div>
      <select class="hh-a-name" aria-label="Tên thuộc tính" style="display:none;"></select>
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

    // Click vào nút sửa thuộc tính bút chì
    const editBtn = e.target.closest('.hh-item-edit-btn');
    if (editBtn) {
      e.stopPropagation();
      const val = editBtn.dataset.val;
      openEditItemModal('thuoctinh', val);
      return;
    }

    // Click vào item trong dropdown thuộc tính
    const aItem = e.target.closest('.hh-a-list .hh-cs-item');
    if (aItem) {
      e.stopPropagation();
      const wrap = aItem.closest('.hh-a-cs-wrap');
      const dd = wrap?.querySelector('.hh-cs-dropdown');
      if (dd) {
        dd.style.display = 'none';
        dd.style.maxHeight = '';
      }
      wrap?.classList.remove('open');
      wrap?.classList.remove('drop-up');
      const sec = wrap?.closest('.hh-sec, .hh-top-grid');
      if (sec) sec.style.zIndex = '';
      const val = aItem.dataset.val;
      if (val === '__new') {
        openPrompt('Tạo thuộc tính mới', 'Tên thuộc tính', '', n => {
          if (!knownAttributes[n]) knownAttributes[n] = [];
          setRowAttr(r, n);
        });
        return;
      }
      setRowAttr(r, val);
      return;
    }

    // Click vào box thuộc tính để mở/đóng dropdown
    const csBox = e.target.closest('.hh-a-cs-wrap .hh-cs-box');
    if (csBox) {
      e.stopPropagation();
      const wrap = csBox.closest('.hh-a-cs-wrap');
      const isOpen = wrap?.classList.contains('open');
      closeAllSingleSelects();
      closeLocationDropdown();
      if (!isOpen && wrap) {
        const dd = wrap.querySelector('.hh-cs-dropdown');
        if (dd) {
          checkDropdownDirection(wrap, csBox, dd);
          dd.style.display = 'block';
        }
        const sec = wrap.closest('.hh-sec, .hh-top-grid');
        if (sec) sec.style.zIndex = '50';
        wrap.classList.add('open');
      }
      return;
    }

    const tagX = e.target.closest('.hh-tag button');
    if (tagX) {
      r._vals.splice(+tagX.dataset.i, 1);
      renderTags(r);
      return;
    }
    if (e.target.closest('.del')) {
      const attrName = getRowName(r);
      const msg = attrName
        ? `Bạn có chắc chắn muốn xóa dòng thuộc tính <strong style="color: #111827;">${attrName}</strong> không? Thao tác này không thể hoàn tác.`
        : 'Bạn có chắc chắn muốn xóa dòng thuộc tính này không? Thao tác này không thể hoàn tác.';
      const doRemove = () => {
        r.remove();
        refreshAttrDropdowns();
      };
      if (window.KiotConfirm) {
        window.KiotConfirm.show({
          title: 'Xóa dòng thuộc tính',
          message: msg,
          onConfirm: doRemove
        });
      } else if (confirm(attrName ? `Bạn có chắc chắn muốn xóa dòng thuộc tính "${attrName}" không?` : 'Bạn có chắc chắn muốn xóa dòng thuộc tính này không?')) {
        doRemove();
      }
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
    if ($('#pkSort')) $('#pkSort').value = 'asc';
    if ($('#textPkSort')) $('#textPkSort').textContent = 'A → Z';
    $('#wrapPkSort')?.classList.remove('open');
    $$('#dropdownPkSort .hh-pk-sort-item').forEach(it => it.classList.toggle('selected', it.dataset.val === 'asc'));
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
  
  // Custom dropdown Sắp xếp A-Z / Z-A
  $('#boxPkSort')?.addEventListener('click', e => {
    e.stopPropagation();
    $('#wrapPkSort')?.classList.toggle('open');
  });

  $$('#dropdownPkSort .hh-pk-sort-item').forEach(it => {
    it.addEventListener('click', e => {
      e.stopPropagation();
      const val = it.dataset.val;
      const text = it.querySelector('span')?.textContent || (val === 'asc' ? 'A → Z' : 'Z → A');
      if ($('#textPkSort')) $('#textPkSort').textContent = text;
      $$('#dropdownPkSort .hh-pk-sort-item').forEach(x => x.classList.toggle('selected', x === it));
      $('#wrapPkSort')?.classList.remove('open');
      pk.sort = val;
      if ($('#pkSort')) $('#pkSort').value = val;
      renderPickChips();
    });
  });

  $('#pkSort')?.addEventListener('change', e => {
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
      hinhAnhBase64: (imgUploader && imgUploader.getImages().length > 0 && imgUploader.getImages()[0]) ? imgUploader.getImages()[0].base64 : null,
      danhSachHinhAnhBase64: imgUploader ? imgUploader.getImages().map(i => i.base64).filter(Boolean) : [],
      viTriAnhChinh: 0,
      xoaHinhAnh: imgUploader ? (imgUploader.getImages().length === 0) : true
    };
  }

  function resetForm() {
    $('#formMaHang').value = '0';
    $('#formMaHangNoiBo').value = '';
    $('#formQuyCach').value = '';
    $('#formTenHang').value = '';
    $('#formMaNhom').selectedIndex = 0;
    $('#formMaDvt').selectedIndex = 0;
    $('#formTrongLuong').value = '0';
    $('#formDonViTrongLuong').value = 'g';
    closeAllSingleSelects();
    csMaNhom?.updateUI();
    csMaDvt?.updateUI();
    csDonViTrongLuong?.updateUI();
    $('#formGiaVon').value = '0';
    $('#formGiaBan').value = '0';
    $('#formTonKhoBanDau').value = '0';
    $('#formTonToiThieu').value = '0';
    $('#formTonCaoNhat').value = '999,999,999';
    selectedLocations = [];
    renderLocationTags();
    renderLocationDropdown('');
    if ($('#formViTriSearch')) $('#formViTriSearch').value = '';
    const ddViTri = $('#formViTriDropdown');
    if (ddViTri) ddViTri.style.display = 'none';
    $('#formViTriWrap')?.classList.remove('open');
    $('#formMoTa').innerHTML = '';
    $('#chkBanTrucTiep').checked = true;

    if (imgUploader) imgUploader.clear();

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
    const curImgs = imgUploader ? imgUploader.getImages() : [];
    const mainImgUrl = (curImgs.length > 0 && curImgs[0]) ? curImgs[0].url : null;

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

        // Cập nhật ngay ảnh trên dòng bảng (Optimistic UI) giúp giao diện mượt mà không bị chớp hay trễ
        if (isEdit && mainImgUrl) {
          const thumb = document.querySelector(`.product-thumb-img[data-img-id="${payload.maHang}"]`);
          if (thumb) thumb.src = mainImgUrl;
          const popover = document.querySelector(`[data-popover-img-id="${payload.maHang}"]`);
          if (popover) popover.src = mainImgUrl;
          const detail = document.querySelector(`[data-detail-img-id="${payload.maHang}"]`);
          if (detail) detail.src = mainImgUrl;
        }

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
    if ($('#btnDeleteProductInModal')) $('#btnDeleteProductInModal').style.display = 'none';
    show($('#hangHoaModalOv'));
    setTimeout(() => $('#formTenHang').focus(), 40);
  };

  window.openEditProductModal = function (id, isCopy = false) {
    resetForm();
    $('#hhModalTitle').textContent = isCopy ? 'Thêm mới hàng hóa (Sao chép)' : 'Cập nhật hàng hóa';
    $('#formMaHang').value = isCopy ? '0' : id;
    $('#boxInitialStock').style.display = isCopy ? '' : 'none';
    if ($('#btnDeleteProductInModal')) $('#btnDeleteProductInModal').style.display = isCopy ? 'none' : 'inline-flex';

    jQuery.ajax({
      url: '/HangHoa/GetItem/' + id,
      type: 'GET',
      success: function (res) {
        $('#formMaHangNoiBo').value = isCopy ? (res.maHangNoiBo ? res.maHangNoiBo + '_CP' : '') : (res.maHangNoiBo || '');
        $('#formQuyCach').value = res.quyCach || '';
        $('#formTenHang').value = isCopy ? ((res.tenHang || '') + ' (Copy)') : (res.tenHang || '');
        $('#formMaNhom').value = res.maNhom || '';
        $('#formMaDvt').value = res.maDvt || '';
        csMaNhom?.updateUI();
        csMaDvt?.updateUI();
        $('#formGiaVon').value = formatNum(res.giaVon);
        $('#formGiaBan').value = formatNum(res.giaBanThamKhao);
        $('#formTonKhoBanDau').value = '0';
        $('#formTonToiThieu').value = formatNum(res.tonToiThieu);
        $('#formTonCaoNhat').value = formatNum(res.tonCaoNhat ?? 999999999);
        // Nạp vị trí đa chọn
        selectedLocations = [];
        if (res.viTri) {
          selectedLocations = res.viTri.split(',').map(s => s.trim()).filter(Boolean);
          selectedLocations.forEach(loc => {
            if (!availableLocations.some(a => ci(a, loc))) {
              availableLocations.push(loc);
            }
          });
        }
        renderLocationTags();
        renderLocationDropdown('');

        $('#formTrongLuong').value = res.trongLuong || 0;
        $('#formDonViTrongLuong').value = res.donViTrongLuong || 'g';
        csDonViTrongLuong?.updateUI();
        $('#formMoTa').innerHTML = res.moTa || '';
        $('#chkBanTrucTiep').checked = (res.trangThai === 'DANG_BAN');

        // Nạp tối đa 5 ảnh (1 ảnh to + 4 ảnh nhỏ bên phải)
        if (imgUploader) {
          if (Array.isArray(res.danhSachHinhAnhBase64) && res.danhSachHinhAnhBase64.length > 0) {
            imgUploader.setImages(res.danhSachHinhAnhBase64, res.viTriAnhChinh || 0);
          } else if (res.hinhAnhBase64) {
            imgUploader.setImages([res.hinhAnhBase64]);
          } else {
            imgUploader.clear();
          }
        }

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

  /* ---------- Xóa hàng hóa & Chuyển trạng thái Ngừng bán (Chuẩn KiotViet) ---------- */
  window.openDeleteProductModal = function (id, name) {
    if (!id) return;
    const hiddenId = $('#delProdId');
    const nameEl = $('#delProdName');
    const errBox = $('#delProdErrorBox');
    const btnDel = $('#btnConfirmDeleteProd');

    if (hiddenId) hiddenId.value = id;
    if (nameEl) nameEl.textContent = name || ('Mã #' + id);
    if (errBox) errBox.style.display = 'none';
    if (btnDel) {
      btnDel.disabled = false;
      btnDel.textContent = 'Đồng ý xóa';
    }
    show($('#hhDeleteProductOv'));
  };

  $('#btnDeleteProductInModal')?.addEventListener('click', () => {
    const id = parseInt($('#formMaHang').value) || 0;
    const name = $('#formTenHang').value.trim();
    if (id > 0) {
      window.openDeleteProductModal(id, name);
    }
  });

  $('#btnConfirmDeleteProd')?.addEventListener('click', () => {
    const id = parseInt($('#delProdId').value) || 0;
    if (id <= 0) return;

    const btn = $('#btnConfirmDeleteProd');
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Đang xóa...';

    jQuery.ajax({
      url: '/HangHoa/Delete/' + id,
      type: 'POST',
      success: function (res) {
        btn.disabled = false;
        btn.textContent = origText;
        hide($('#hhDeleteProductOv'));
        hide($('#hangHoaModalOv'));
        showToast(res.message || 'Đã xóa hàng hóa thành công.');
        if (typeof window.loadTable === 'function') {
          window.loadTable();
        }
      },
      error: function (xhr) {
        btn.disabled = false;
        btn.textContent = origText;
        const msg = xhr.responseJSON?.message || 'Không thể xóa hàng hóa do lỗi hệ thống.';
        const errBox = $('#delProdErrorBox');
        const errMsg = $('#delProdErrorMsg');
        const btnNgung = $('#btnSwitchNgungBan');
        if (errMsg) errMsg.textContent = msg;
        if (errBox) errBox.style.display = 'block';
        if (btnNgung) {
          btnNgung.style.display = xhr.responseJSON?.hasTransaction ? 'inline-flex' : 'none';
        }
      }
    });
  });

  $('#btnSwitchNgungBan')?.addEventListener('click', () => {
    const id = parseInt($('#delProdId').value) || 0;
    if (id <= 0) return;

    const btn = $('#btnSwitchNgungBan');
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Đang chuyển...';

    jQuery.ajax({
      url: '/HangHoa/NgungBan/' + id,
      type: 'POST',
      success: function (res) {
        btn.disabled = false;
        btn.textContent = origText;
        hide($('#hhDeleteProductOv'));
        hide($('#hangHoaModalOv'));
        showToast(res.message || 'Đã chuyển hàng hóa sang Ngừng bán.');
        if (typeof window.loadTable === 'function') {
          window.loadTable();
        }
      },
      error: function (xhr) {
        btn.disabled = false;
        btn.textContent = origText;
        alert('Lỗi: ' + (xhr.responseJSON?.message || 'Không thể cập nhật trạng thái.'));
      }
    });
  });

  // Khởi tạo ban đầu
  if (attrRows) {
    addAttrRow();
  }
  renderLocationTags();
  renderLocationDropdown();
  if (imgUploader) {
    imgUploader.render();
  }
})();
