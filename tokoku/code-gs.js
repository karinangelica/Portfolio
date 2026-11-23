// ============================================================
// TokoKu Manager — Google Apps Script
// Versi: 1.0  |  Cocok untuk minimarket GrabMart/GoMart/WA
// ============================================================

// ── NAMA SHEET ──────────────────────────────────────────────
const SHEET_PRODUK   = 'Produk';
const SHEET_STOK     = 'Stok Alert';
const SHEET_SALES    = 'Sales & Supplier';
const SHEET_SETTINGS = 'Pengaturan';

// ── MENU DI GOOGLE SHEETS ───────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🛒 TokoKu Manager')
    .addItem('📦 Buka Panel Utama',      'bukaSidebar')
    .addSeparator()
    .addItem('🔄 Refresh Semua Sheet',   'refreshSemuaSheet')
    .addItem('⚠️  Cek Stok Tipis/Kosong', 'cekStokAlert')
    .addSeparator()
    .addItem('📋 Setup Awal (Pertama Kali)', 'setupAwal')
    .addToUi();
}

// ── BUKA SIDEBAR ─────────────────────────────────────────────
function bukaSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('🛒 TokoKu Manager')
    .setWidth(380);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ── SETUP AWAL ───────────────────────────────────────────────
function setupAwal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  _setupSheetProduk(ss);
  _setupSheetStok(ss);
  _setupSheetSales(ss);
  _setupSheetSettings(ss);

  ui.alert('✅ Setup Selesai!', 
    'Sheet sudah dibuat:\n\n' +
    '• Produk — daftar semua produk\n' +
    '• Stok Alert — produk stok tipis/kosong\n' +
    '• Sales & Supplier — kontak sales\n' +
    '• Pengaturan — nama toko & config\n\n' +
    'Klik menu "TokoKu Manager > Buka Panel Utama" untuk mulai.',
    ui.ButtonSet.OK);
}

function _setupSheetProduk(ss) {
  let sh = ss.getSheetByName(SHEET_PRODUK);
  if (!sh) sh = ss.insertSheet(SHEET_PRODUK);
  else sh.clearContents();

  const headers = [
    'ID','Nama Produk','Kategori','Barcode','Satuan',
    'Harga Normal','GrabMart +10%','GrabMart +15%','WA Business +10%',
    'Stok','Stok Min','Margin (%)','Platform','Foto URL','Update Terakhir'
  ];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format header
  const hRange = sh.getRange(1, 1, 1, headers.length);
  hRange.setBackground('#1a1a1a').setFontColor('#ffffff')
        .setFontWeight('bold').setFontSize(10)
        .setHorizontalAlignment('center');

  // Freeze row & column
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);

  // Column widths
  const widths = [60,220,140,130,70,110,110,110,120,70,70,80,150,100,120];
  widths.forEach((w,i) => sh.setColumnWidth(i+1, w));

  // Contoh data awal
  const contoh = [
    [_id(),'Minyak Goreng Bimoli 1L','Kebutuhan Pokok','8998877001001','Botol',20000,'','','',50,10,10,'GrabMart, GoMart, WA Business','',_now()],
    [_id(),'Gula Pasir 1kg','Kebutuhan Pokok','8997001234567','Kg',14000,'','','',30,10,10,'GrabMart, GoMart, WA Business','',_now()],
    [_id(),'Indomie Goreng','Mie & Pasta','8999999011065','Bungkus',3500,'','','',8,20,15,'GrabMart, GoMart, WA Business','',_now()],
    [_id(),'Teh Botol Sosro 350ml','Minuman','8999999047888','Botol',5000,'','','',0,15,15,'GrabMart, GoMart, WA Business','',_now()],
    [_id(),'Aqua 600ml','Minuman','8996001111111','Botol',4000,'','','',60,20,10,'GrabMart, GoMart, WA Business','',_now()],
    [_id(),'Chitato Original 68g','Snack','8999388123456','Pcs',11000,'','','',25,10,15,'GrabMart, GoMart','',_now()],
    [_id(),'Sabun Lifebuoy 85g','Toiletries','8999999123456','Pcs',5000,'','','',40,10,15,'GrabMart, WA Business','',_now()],
    [_id(),'Sunlight 800ml','Toiletries','8999999876543','Botol',18000,'','','',15,5,15,'GrabMart, WA Business','',_now()],
    [_id(),'Kapal Api Sachet','Minuman','8992761234567','Sachet',2500,'','','',100,30,15,'GrabMart, GoMart, WA Business','',_now()],
    [_id(),'Beras Premium 5kg','Kebutuhan Pokok','8996001234567','Kg',75000,'','','',20,5,10,'GrabMart, WA Business','',_now()],
  ];
  sh.getRange(2, 1, contoh.length, headers.length).setValues(contoh);

  _hitungHarga(ss); // hitung kolom harga platform
  _formatSheetProduk(ss);
}

function _setupSheetStok(ss) {
  let sh = ss.getSheetByName(SHEET_STOK);
  if (!sh) sh = ss.insertSheet(SHEET_STOK);
  else sh.clearContents();

  const headers = ['Nama Produk','Kategori','Stok Saat Ini','Stok Min','Status','Perlu Restock'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.getRange(1, 1, 1, headers.length)
    .setBackground('#EF4444').setFontColor('#ffffff')
    .setFontWeight('bold').setFontSize(10)
    .setHorizontalAlignment('center');
  sh.setFrozenRows(1);
  const widths2 = [220,140,110,80,90,100];
  widths2.forEach((w,i) => sh.setColumnWidth(i+1, w));
}

function _setupSheetSales(ss) {
  let sh = ss.getSheetByName(SHEET_SALES);
  if (!sh) sh = ss.insertSheet(SHEET_SALES);
  else sh.clearContents();

  const headers = ['ID','Nama Sales','No. WhatsApp','Perusahaan/Brand','Kategori Produk','Hari Kunjungan','Min. Order (Rp)','Termin Bayar','Catatan'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.getRange(1, 1, 1, headers.length)
    .setBackground('#128C7E').setFontColor('#ffffff')
    .setFontWeight('bold').setFontSize(10)
    .setHorizontalAlignment('center');
  sh.setFrozenRows(1);
  const widths3 = [60,160,130,180,160,130,110,100,180];
  widths3.forEach((w,i) => sh.setColumnWidth(i+1, w));

  // Contoh data sales
  const contoh = [
    [_id(),'Pak Budi','082312345678','PT Indofood','Mie, Bumbu, Snack','Senin & Kamis',500000,'14 hari','Kirim H+1'],
    [_id(),'Ibu Sari','083456789012','Wings Group','Deterjen, Sabun','Selasa',300000,'7 hari','COD tersedia'],
    [_id(),'Mas Deni','085678901234','UD Maju Bersama','Sembako, Beras, Gula','Rabu & Sabtu',1000000,'Cash','Nego harga'],
  ];
  sh.getRange(2, 1, contoh.length, headers.length).setValues(contoh);
}

function _setupSheetSettings(ss) {
  let sh = ss.getSheetByName(SHEET_SETTINGS);
  if (!sh) sh = ss.insertSheet(SHEET_SETTINGS);
  else sh.clearContents();

  sh.getRange('A1').setValue('Pengaturan TokoKu Manager').setFontWeight('bold').setFontSize(14);
  const data = [
    ['',''],
    ['Nama Toko', 'TokoKu Minimarket'],
    ['Alamat', 'Jl. Contoh No. 1'],
    ['No. WhatsApp Toko', '08123456789'],
    ['Min. Order WA (Rp)', 50000],
    ['',''],
    ['Margin Default GrabMart (%)', 10],
    ['Margin Default WA Business (%)', 10],
    ['Stok Min Default', 10],
  ];
  sh.getRange(2, 1, data.length, 2).setValues(data);
  sh.getRange(2, 1, data.length, 1).setFontWeight('bold');
  sh.setColumnWidth(1, 220);
  sh.setColumnWidth(2, 200);
}

// ── HITUNG HARGA PLATFORM ────────────────────────────────────
function _hitungHarga(ss) {
  const sh = ss.getSheetByName(SHEET_PRODUK);
  if (!sh) return;
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return;

  const data = sh.getRange(2, 1, lastRow - 1, 15).getValues();
  data.forEach((row, i) => {
    const harga  = parseFloat(row[5]) || 0;
    const margin = (parseFloat(row[11]) || 10) / 100;
    if (harga > 0) {
      // GrabMart: harga / 0.92 * (1+margin), dibulatkan ke 100
      row[6] = Math.round(harga / 0.92 * (1 + 0.10) / 100) * 100;  // +10%
      row[7] = Math.round(harga / 0.92 * (1 + 0.15) / 100) * 100;  // +15%
      row[8] = Math.round(harga * (1 + 0.10) / 100) * 100;          // WA +10%
    }
  });
  sh.getRange(2, 1, data.length, 15).setValues(data);
  _formatSheetProduk(ss);
}

function _formatSheetProduk(ss) {
  try {
    const sh = ss.getSheetByName(SHEET_PRODUK);
    if (!sh) return;
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return;

    // Warna kolom harga platform (font color only, no number format)
    try { sh.getRange(2, 7, lastRow-1, 1).setFontColor('#00843B').setFontWeight('bold'); } catch(e) {}
    try { sh.getRange(2, 8, lastRow-1, 1).setFontColor('#C05621').setFontWeight('bold'); } catch(e) {}
    try { sh.getRange(2, 9, lastRow-1, 1).setFontColor('#128C7E').setFontWeight('bold'); } catch(e) {}

    // Stok alert — warnai baris jika tipis/kosong
    const data = sh.getRange(2, 1, lastRow - 1, 11).getValues();
    data.forEach((row, i) => {
      try {
        const stok = parseInt(row[9]) || 0;
        const min  = parseInt(row[10]) || 10;
        if (stok <= 0) {
          sh.getRange(i + 2, 1, 1, 15).setBackground('#FEE2E2');
        } else if (stok < min) {
          sh.getRange(i + 2, 1, 1, 15).setBackground('#FEF3C7');
        } else {
          const bg = (i % 2 === 0) ? '#F8F9FA' : '#FFFFFF';
          sh.getRange(i + 2, 1, 1, 15).setBackground(bg);
        }
      } catch(e) {}
    });
  } catch(e) {
    // Formatting gagal — tidak masalah, data tetap tersimpan
    Logger.log('Format error (non-critical): ' + e.message);
  }
}

// ── CEK STOK ALERT ───────────────────────────────────────────
function cekStokAlert() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const shP = ss.getSheetByName(SHEET_PRODUK);
  const shA = ss.getSheetByName(SHEET_STOK);
  if (!shP || !shA) { SpreadsheetApp.getUi().alert('Jalankan Setup Awal dulu!'); return; }

  const lastRow = shP.getLastRow();
  if (lastRow < 2) return;

  const data = shP.getRange(2, 1, lastRow - 1, 11).getValues();
  const alerts = data
    .filter(row => row[1]) // ada nama produk
    .filter(row => {
      const stok = parseInt(row[9]) || 0;
      const min  = parseInt(row[10]) || 10;
      return stok < min;
    })
    .map(row => {
      const stok   = parseInt(row[9]) || 0;
      const min    = parseInt(row[10]) || 10;
      const status = stok <= 0 ? 'KOSONG' : 'TIPIS';
      return [row[1], row[2], stok, min, status, min - stok];
    });

  shA.clearContents();
  const headers = ['Nama Produk','Kategori','Stok Saat Ini','Stok Min','Status','Perlu Restock'];
  shA.getRange(1, 1, 1, 6).setValues([headers])
     .setBackground('#EF4444').setFontColor('#ffffff')
     .setFontWeight('bold');

  if (alerts.length > 0) {
    shA.getRange(2, 1, alerts.length, 6).setValues(alerts);
    // Warna baris kosong vs tipis
    alerts.forEach((row, i) => {
      const bg = row[4] === 'KOSONG' ? '#FEE2E2' : '#FEF3C7';
      const fc = row[4] === 'KOSONG' ? '#991b1b' : '#92400e';
      shA.getRange(i + 2, 5, 1, 1).setBackground(bg).setFontColor(fc).setFontWeight('bold');
    });
  }

  ss.setActiveSheet(shA);
  SpreadsheetApp.getUi().alert(`⚠️ Stok Alert`, 
    `Ditemukan ${alerts.length} produk perlu restock:\n` +
    `• ${alerts.filter(r=>r[4]==='KOSONG').length} produk KOSONG\n` +
    `• ${alerts.filter(r=>r[4]==='TIPIS').length} produk TIPIS\n\n` +
    `Lihat sheet "Stok Alert" untuk detailnya.`,
    SpreadsheetApp.getUi().ButtonSet.OK);
}

// ── REFRESH SEMUA SHEET ──────────────────────────────────────
function refreshSemuaSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  _hitungHarga(ss);
  cekStokAlert();
  SpreadsheetApp.getUi().alert('✅ Semua sheet berhasil di-refresh!');
}

// ── API UNTUK SIDEBAR ────────────────────────────────────────

function getProduk() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_PRODUK);
    if (!sh) return [];
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return [];

    // Pastikan sheet punya minimal 15 kolom
    const currCols = sh.getLastColumn();
    if (currCols < 15) {
      sh.getRange(1, 15).setValue(sh.getRange(1,15).getValue() || 'Update Terakhir');
    }

    const rows = sh.getRange(2, 1, lastRow - 1, 15).getValues();
    return rows
      .filter(r => r[1] && r[1].toString().trim() !== '')
      .map(r => {
        const harga  = parseFloat(r[5]) || 0;
        const margin = parseFloat(r[11]) || 10;
        const g10 = parseFloat(r[6]) || Math.round(harga/0.92*1.10/100)*100;
        const g15 = parseFloat(r[7]) || Math.round(harga/0.92*1.15/100)*100;
        const w10 = parseFloat(r[8]) || Math.round(harga*1.10/100)*100;
        return {
          id:       String(r[0] || _id()),
          nama:     String(r[1]),
          kat:      String(r[2] || 'Lainnya'),
          bar:      String(r[3] || ''),
          sat:      String(r[4] || 'Pcs'),
          harga:    harga,
          grab10:   g10,
          grab15:   g15,
          wa10:     w10,
          stok:     parseInt(r[9]) || 0,
          stokMin:  parseInt(r[10]) || 10,
          margin:   margin,
          platform: String(r[12] || 'GrabMart, GoMart, WA Business'),
          foto:     String(r[13] || ''),
          updated:  String(r[14] || ''),
        };
      });
  } catch(e) {
    Logger.log('getProduk error: ' + e.message);
    // Kembalikan array kosong dengan pesan error supaya sidebar tidak stuck
    return [{_error: e.message}];
  }
}

function getSales() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_SALES);
    if (!sh) return [];
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return [];
    const rows = sh.getRange(2, 1, lastRow - 1, 9).getValues();
    return rows
      .filter(r => r[1] && r[1].toString().trim() !== '')
      .map(r => ({
        id:   r[0] ? r[0].toString() : _id(),
        nama: r[1].toString(),
        wa:   (r[2] || '').toString(),
        cmp:  (r[3] || '').toString(),
        kat:  (r[4] || '').toString(),
        hari: (r[5] || '').toString(),
        min:  parseFloat(r[6]) || 0,
        trm:  (r[7] || '').toString(),
        cat:  (r[8] || '').toString()
      }));
  } catch(e) {
    Logger.log('getSales error: ' + e.message);
    return [];
  }
}

function tambahProduk(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PRODUK);
  const grab10 = p.harga > 0 ? Math.round(p.harga / 0.92 * 1.10 / 100) * 100 : 0;
  const grab15 = p.harga > 0 ? Math.round(p.harga / 0.92 * 1.15 / 100) * 100 : 0;
  const wa10   = p.harga > 0 ? Math.round(p.harga * 1.10 / 100) * 100 : 0;
  sh.appendRow([
    _id(), p.nama, p.kat, p.bar||'', p.sat||'Pcs',
    p.harga, grab10, grab15, wa10,
    p.stok||0, p.stokMin||10, p.margin||10,
    p.platform||'GrabMart, GoMart, WA Business',
    p.foto||'', _now()
  ]);
  _formatSheetProduk(ss);
  return true;
}

function editProduk(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PRODUK);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return false;

  const ids = sh.getRange(2, 1, lastRow-1, 1).getValues().flat();
  const rowIdx = ids.indexOf(p.id);
  if (rowIdx < 0) return false;

  const r = rowIdx + 2; // 1-based + header
  const grab10 = p.harga > 0 ? Math.round(p.harga / 0.92 * 1.10 / 100) * 100 : 0;
  const grab15 = p.harga > 0 ? Math.round(p.harga / 0.92 * 1.15 / 100) * 100 : 0;
  const wa10   = p.harga > 0 ? Math.round(p.harga * 1.10 / 100) * 100 : 0;

  sh.getRange(r, 1, 1, 15).setValues([[
    p.id, p.nama, p.kat, p.bar||'', p.sat||'Pcs',
    p.harga, grab10, grab15, wa10,
    p.stok||0, p.stokMin||10, p.margin||10,
    p.platform||'GrabMart, GoMart, WA Business',
    p.foto||'', _now()
  ]]);
  _formatSheetProduk(ss);
  return true;
}

function hapusProduk(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PRODUK);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return false;

  const ids = sh.getRange(2, 1, lastRow-1, 1).getValues().flat();
  const rowIdx = ids.indexOf(id);
  if (rowIdx < 0) return false;

  sh.deleteRow(rowIdx + 2);
  return true;
}

function updateStok(id, stokBaru) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PRODUK);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return false;

  const ids = sh.getRange(2, 1, lastRow-1, 1).getValues().flat();
  const rowIdx = ids.indexOf(id);
  if (rowIdx < 0) return false;

  const r = rowIdx + 2;
  sh.getRange(r, 10).setValue(stokBaru); // kolom Stok
  sh.getRange(r, 15).setValue(_now());    // update terakhir
  _formatSheetProduk(ss);
  return true;
}

function tambahSales(s) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_SALES);
  sh.appendRow([_id(), s.nama, s.wa, s.cmp||'', s.kat||'', s.hari||'', s.min||0, s.trm||'', s.cat||'']);
  return true;
}

function hapusSales(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_SALES);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return false;
  const ids = sh.getRange(2, 1, lastRow-1, 1).getValues().flat();
  const rowIdx = ids.indexOf(id);
  if (rowIdx < 0) return false;
  sh.deleteRow(rowIdx + 2);
  return true;
}

function getStats() {
  const prods = getProduk();
  const sales = getSales();
  const low   = prods.filter(p => (parseInt(p.stok)||0) < (parseInt(p.stokMin)||10)).length;
  const totalStok = prods.reduce((a, p) => a + (parseInt(p.stok)||0), 0);
  return { totalProduk: prods.length, stokTipis: low, totalStok, totalSales: sales.length };
}

// ── HELPERS ──────────────────────────────────────────────────
function _id()  { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function _now() { return Utilities.formatDate(new Date(), 'Asia/Makassar', 'dd/MM/yyyy HH:mm'); }

// ── DEBUG — jalankan ini dari Apps Script editor untuk cek error ──
function debugCekData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PRODUK);
  const ui = SpreadsheetApp.getUi();
  
  if (!sh) { ui.alert('Sheet "Produk" tidak ditemukan!'); return; }
  
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  
  let msg = `Sheet: ${SHEET_PRODUK}\n`;
  msg += `Last Row: ${lastRow}\n`;
  msg += `Last Col: ${lastCol}\n\n`;
  
  if (lastRow >= 2) {
    try {
      const cols = Math.max(lastCol, 15);
      const rows = sh.getRange(2, 1, Math.min(lastRow-1, 3), cols).getValues();
      msg += `Baris pertama:\n`;
      msg += `ID: ${rows[0][0]}\n`;
      msg += `Nama: ${rows[0][1]}\n`;
      msg += `Harga: ${rows[0][5]}\n`;
      msg += `Stok: ${rows[0][9]}\n`;
      msg += `\nTotal baris data: ${rows.filter(r=>r[1]).length} (dari ${lastRow-1} baris)`;
    } catch(e) {
      msg += 'ERROR baca data: ' + e.message;
    }
  }
  
  ui.alert('Debug Info', msg, ui.ButtonSet.OK);
}
