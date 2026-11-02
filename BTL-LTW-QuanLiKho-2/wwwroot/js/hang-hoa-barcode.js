/**
 * Module In Tem Mã Vạch Hàng Hóa Chuẩn KiotViet & Máy In Nhiệt
 * Mã vạch Code 128 thuần JavaScript (Zero External Dependency)
 */
(function (window, document, $) {
  'use strict';

  // 107 mẫu nhị phân theo bảng mã ISO/IEC 15417 Code 128
  const CODE128_PATTERNS = [
    "11011001100", "11001101100", "11001100110", "10010011000", "10010001100",
    "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
    "11001000100", "11000100100", "10110011100", "10011011100", "10011001110",
    "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
    "11001001110", "11011100100", "11001110100", "11101101110", "11101001100",
    "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
    "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
    "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
    "11000101000", "11000100010", "10110111000", "10110001110", "10001101110",
    "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
    "11000101110", "11011101000", "11011100010", "11011101110", "11101011000",
    "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
    "11101111010", "11001000010", "11110001010", "10100110000", "10100001100",
    "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
    "10110000100", "10011010000", "10011000010", "10000110100", "10000110010",
    "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
    "10100111100", "10010111100", "10010011110", "10111100100", "10011110100",
    "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
    "11011110110", "11110110110", "10101111000", "10100011110", "10001011110",
    "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
    "10111101110", "11101011110", "11110101110",
    "11010000100", // 103: Start A
    "11010010000", // 104: Start B
    "11010011100", // 105: Start C
    "1100011101011" // 106: Stop (13 bits)
  ];

  /**
   * Sinh chuỗi SVG mã vạch chuẩn Code 128 (Start B)
   */
  function generateCode128Svg(rawText, height) {
    height = height || 40;
    let text = (rawText || "").trim();
    if (!text) text = "000000";

    // Lọc ký tự hợp lệ ASCII 32 - 126
    const cleanText = text.replace(/[^\x20-\x7E]/g, '');
    if (!cleanText) return '';

    const codes = [104]; // Start Code B
    let checksum = 104;

    for (let i = 0; i < cleanText.length; i++) {
      const val = cleanText.charCodeAt(i) - 32;
      codes.push(val);
      checksum += val * (i + 1);
    }

    codes.push(checksum % 103);
    codes.push(106); // Stop

    let binaryStr = "";
    for (let j = 0; j < codes.length; j++) {
      binaryStr += CODE128_PATTERNS[codes[j]];
    }

    let rects = "";
    let barWidth = 0;
    let startX = 0;

    for (let k = 0; k < binaryStr.length; k++) {
      if (binaryStr[k] === '1') {
        if (barWidth === 0) startX = k;
        barWidth++;
      } else {
        if (barWidth > 0) {
          rects += `<rect x="${startX}" y="0" width="${barWidth}" height="${height}" fill="#000" />`;
          barWidth = 0;
        }
      }
    }
    if (barWidth > 0) {
      rects += `<rect x="${startX}" y="0" width="${barWidth}" height="${height}" fill="#000" />`;
    }

    const totalWidth = binaryStr.length;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" preserveAspectRatio="none" style="width: 100%; height: ${height}px; display: block;">${rects}</svg>`;
  }

  window.generateCode128Svg = generateCode128Svg;

  // Dữ liệu hàng hóa đang được mở để in tem
  let currentBarcodeItem = {
    id: 0,
    name: '',
    code: '',
    price: 0,
    ton: 0
  };

  /**
   * Mở Modal cấu hình in tem mã vạch
   */
  window.openPrintBarcodeModal = function (item) {
    if (!item) return;
    currentBarcodeItem = {
      id: item.id || 0,
      name: item.name || '',
      code: item.code || ('HH' + String(item.id).padStart(6, '0')),
      price: Number(item.price) || 0,
      ton: Number(item.ton) || 1
    };

    const modal = document.getElementById('hhBarcodeModalOv');
    if (!modal) return;

    // Điền dữ liệu vào form
    const inputName = document.getElementById('bcItemName');
    const inputCode = document.getElementById('bcItemCode');
    const inputPrice = document.getElementById('bcItemPrice');
    const inputQty = document.getElementById('bcPrintQty');
    const btnTonQty = document.getElementById('btnSetTonQty');

    if (inputName) inputName.value = currentBarcodeItem.name;
    if (inputCode) inputCode.value = currentBarcodeItem.code;
    if (inputPrice) inputPrice.value = currentBarcodeItem.price > 0 ? currentBarcodeItem.price.toLocaleString('vi-VN') : '0';
    if (inputQty) inputQty.value = 1;
    if (btnTonQty) {
      btnTonQty.textContent = `Theo tồn (${currentBarcodeItem.ton > 0 ? currentBarcodeItem.ton : 1})`;
    }

    renderBarcodePreview();
    modal.classList.add('show');
  };

  /**
   * Cập nhật khung xem trước tem mã vạch (Live Preview)
   */
  function renderBarcodePreview() {
    const shopName = (document.getElementById('bcShopName')?.value || 'TỔNG KHO GAS PHÚ QUỐC').trim();
    const prodName = (document.getElementById('bcItemName')?.value || currentBarcodeItem.name).trim();
    const barcodeCode = (document.getElementById('bcItemCode')?.value || currentBarcodeItem.code).trim();
    const rawPrice = document.getElementById('bcItemPrice')?.value || '0';

    const showShop = document.getElementById('bcOptShop')?.checked !== false;
    const showName = document.getElementById('bcOptName')?.checked !== false;
    const showPrice = document.getElementById('bcOptPrice')?.checked !== false;
    const showCode = document.getElementById('bcOptCode')?.checked !== false;

    // Cập nhật DOM Preview
    const elShop = document.getElementById('previewShopName');
    const elName = document.getElementById('previewProdName');
    const elSvg = document.getElementById('previewSvgWrap');
    const elCode = document.getElementById('previewCodeText');
    const elPrice = document.getElementById('previewPriceText');

    if (elShop) {
      elShop.textContent = shopName;
      elShop.style.display = showShop ? 'block' : 'none';
    }

    if (elName) {
      elName.textContent = prodName;
      elName.style.display = showName ? 'block' : 'none';
    }

    if (elSvg) {
      elSvg.innerHTML = generateCode128Svg(barcodeCode, 38);
    }

    if (elCode) {
      elCode.textContent = barcodeCode;
      elCode.style.display = showCode ? 'block' : 'none';
    }

    if (elPrice) {
      // Định dạng số tiền
      let cleanPrice = rawPrice.replace(/\./g, '').replace(/,/g, '').replace(/[^\d]/g, '');
      let priceNum = Number(cleanPrice) || 0;
      elPrice.textContent = priceNum > 0 ? priceNum.toLocaleString('vi-VN') + ' đ' : '0 đ';
      elPrice.style.display = showPrice ? 'block' : 'none';
    }
  }

  /**
   * Tạo các tem nhãn trong vùng in và kích hoạt lệnh in
   */
  function executePrint() {
    const qtyInput = document.getElementById('bcPrintQty');
    let qty = parseInt(qtyInput?.value || '1', 10);
    if (isNaN(qty) || qty <= 0) qty = 1;
    if (qty > 500) qty = 500; // Giới hạn an toàn chống treo trình duyệt

    const paperSize = document.querySelector('input[name="bcPaperSize"]:checked')?.value || '35x22';
    const shopName = (document.getElementById('bcShopName')?.value || 'TỔNG KHO GAS PHÚ QUỐC').trim();
    const prodName = (document.getElementById('bcItemName')?.value || currentBarcodeItem.name).trim();
    const barcodeCode = (document.getElementById('bcItemCode')?.value || currentBarcodeItem.code).trim();
    const rawPrice = document.getElementById('bcItemPrice')?.value || '0';
    let cleanPrice = rawPrice.replace(/\./g, '').replace(/,/g, '').replace(/[^\d]/g, '');
    let priceStr = (Number(cleanPrice) || 0).toLocaleString('vi-VN') + ' đ';

    const showShop = document.getElementById('bcOptShop')?.checked !== false;
    const showName = document.getElementById('bcOptName')?.checked !== false;
    const showPrice = document.getElementById('bcOptPrice')?.checked !== false;
    const showCode = document.getElementById('bcOptCode')?.checked !== false;

    // Sinh HTML 1 con tem
    const svgContent = generateCode128Svg(barcodeCode, 30);
    const singleLabelHtml = `
      <div class="print-item">
        ${showShop ? `<div class="p-shop">${escapeHtml(shopName)}</div>` : ''}
        ${showName ? `<div class="p-name">${escapeHtml(prodName)}</div>` : ''}
        <div class="p-svg-wrap">${svgContent}</div>
        ${showCode ? `<div class="p-code">${escapeHtml(barcodeCode)}</div>` : ''}
        ${showPrice ? `<div class="p-price">${priceStr}</div>` : ''}
      </div>
    `;

    // Tạo N bản sao trong container in
    let printArea = document.getElementById('printBarcodeArea');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'printBarcodeArea';
      document.body.appendChild(printArea);
    }

    printArea.className = 'mode-' + paperSize;
    let fullHtml = '';
    for (let i = 0; i < qty; i++) {
      fullHtml += singleLabelHtml;
    }
    printArea.innerHTML = fullHtml;

    // Đóng modal trước khi mở Print Dialog
    const modal = document.getElementById('hhBarcodeModalOv');
    if (modal) modal.classList.remove('show');

    // Chờ DOM cập nhật và gọi window.print()
    setTimeout(function () {
      window.print();
    }, 150);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Khởi tạo các sự kiện khi DOM sẵn sàng
  $(document).ready(function () {
    // 1. Bắt sự kiện bấm nút "In tem mã" trên từng dòng hàng hóa
    $(document).on('click', '.btn-print-barcode', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const btn = $(this);
      const item = {
        id: btn.data('id'),
        name: btn.data('name'),
        code: btn.data('code'),
        price: btn.data('price'),
        ton: btn.data('ton')
      };

      window.openPrintBarcodeModal(item);
    });

    // 2. Tương tác form cấu hình -> Cập nhật Live Preview
    $('#bcItemName, #bcItemCode, #bcItemPrice, #bcShopName').on('input', renderBarcodePreview);
    $('#bcOptShop, #bcOptName, #bcOptPrice, #bcOptCode').on('change', renderBarcodePreview);

    // 3. Nút tăng giảm số lượng tem
    $('#btnBcQtyMinus').on('click', function () {
      const inp = $('#bcPrintQty');
      let val = parseInt(inp.val() || '1', 10);
      if (val > 1) inp.val(val - 1);
    });

    $('#btnBcQtyPlus').on('click', function () {
      const inp = $('#bcPrintQty');
      let val = parseInt(inp.val() || '1', 10);
      inp.val(val + 1);
    });

    // Nút chọn nhanh số lượng
    $('.quick-qty-btn').on('click', function () {
      const qty = $(this).data('qty');
      if (qty === 'ton') {
        $('#bcPrintQty').val(currentBarcodeItem.ton > 0 ? currentBarcodeItem.ton : 1);
      } else {
        $('#bcPrintQty').val(parseInt(qty, 10) || 1);
      }
    });

    // 4. Nút bấm in ngay
    $('#btnExecutePrintBarcode').on('click', function () {
      executePrint();
    });

    // 5. Đóng modal
    $(document).on('click', '[data-close="hhBarcodeModalOv"]', function () {
      $('#hhBarcodeModalOv').removeClass('show');
    });
  });

})(window, document, jQuery);
