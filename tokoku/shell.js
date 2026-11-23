// Tampilan spreadsheet untuk demo: menggambar sheet dari tiruan SpreadsheetApp,
// membangun menu dari onOpen(), membuka Sidebar, dan meneruskan google.script.run ke Code.gs.
(function () {
  const mock = window.AppsScriptMock;
  const app = document.getElementById("app");
  const grid = document.getElementById("grid");
  const tabSheet = document.getElementById("tab-sheet");
  const menuTombol = document.getElementById("menu-tombol");
  const menuIsi = document.getElementById("menu-isi");
  const frame = document.getElementById("sidebar-frame");
  const API = ["getProduk", "getSales", "getStats", "tambahProduk", "editProduk", "hapusProduk", "updateStok", "tambahSales", "hapusSales", "cekStokAlert"];
  const FORMAT_RIBUAN = { "Produk": [6, 7, 8, 9], "Sales & Supplier": [7] };

  let sheetAktif = null;
  let pilihan = { r: 1, c: 1 };
  let senyap = false;
  const kilat = {};
  const antrean = [];

  // ---------- dialog pengganti ui.alert ----------
  const dialog = document.getElementById("dialog");
  function tampilkanDialog() {
    if (!dialog.hidden || !antrean.length) return;
    const d = antrean.shift();
    document.getElementById("dialog-judul").textContent = d.judul || "Pemberitahuan";
    document.getElementById("dialog-pesan").textContent = d.pesan;
    dialog.hidden = false;
    document.getElementById("dialog-ok").focus();
  }
  document.getElementById("dialog-ok").addEventListener("click", () => {
    dialog.hidden = true;
    tampilkanDialog();
  });

  mock.hooks.alert = (d) => {
    if (senyap) return;
    antrean.push(d);
    tampilkanDialog();
  };

  // ---------- menu dari onOpen() ----------
  mock.hooks.menu = (menu) => {
    menuTombol.textContent = menu.name;
    menuIsi.innerHTML = "";
    menu.items.forEach((item) => {
      const li = document.createElement("li");
      if (item.separator) {
        li.className = "pemisah";
        li.setAttribute("role", "separator");
      } else {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = item.label;
        b.addEventListener("click", () => {
          tutupMenu();
          jalankan(item.fn, []);
        });
        li.append(b);
      }
      menuIsi.append(li);
    });
  };

  function tutupMenu() {
    menuIsi.hidden = true;
    menuTombol.setAttribute("aria-expanded", "false");
  }
  menuTombol.addEventListener("click", () => {
    const buka = menuIsi.hidden;
    menuIsi.hidden = !buka;
    menuTombol.setAttribute("aria-expanded", String(buka));
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".menu-wrap")) tutupMenu();
  });

  // ---------- sidebar ----------
  mock.hooks.sidebar = (html) => {
    document.getElementById("sidebar-judul").textContent = html.title;
    app.style.setProperty("--lebar-panel", Math.min(html.width, 420) + "px");
    if (!frame.getAttribute("src")) frame.setAttribute("src", "sidebar.html");
    app.classList.add("panel-buka");
  };
  document.getElementById("sidebar-tutup").addEventListener("click", () => app.classList.remove("panel-buka"));
  document.getElementById("tombol-panel").addEventListener("click", () => jalankan("bukaSidebar", []));

  mock.hooks.activate = (sheet) => {
    sheetAktif = sheet;
  };

  // ---------- menjalankan fungsi Code.gs ----------
  function jalankan(nama, args) {
    const sebelum = sheetAktif ? sheetAktif.cells.map((r) => r.slice()) : [];
    const namaSebelum = sheetAktif && sheetAktif.name;
    const hasil = window[nama](...args);
    gambar(namaSebelum === (sheetAktif && sheetAktif.name) ? sebelum : null);
    return hasil;
  }

  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || !d.tokoku) return;
    if (d.tokoku === "tutup") {
      app.classList.remove("panel-buka");
      return;
    }
    if (d.tokoku !== "panggil") return;
    const sumber = e.source;
    // jeda kecil supaya terasa seperti memanggil server Google
    setTimeout(() => {
      let result = null;
      let error = null;
      try {
        if (!API.includes(d.nama)) throw new Error("Fungsi " + d.nama + " tidak tersedia di demo.");
        result = jalankan(d.nama, d.args);
        if (result === undefined) result = null;
      } catch (err) {
        error = err.message;
      }
      sumber.postMessage({ tokoku: "hasil", id: d.id, result, error }, "*");
    }, 320);
  });

  // ---------- menggambar sheet ----------
  const huruf = (n) => {
    let s = "";
    while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
    return s;
  };

  function tampilNilai(sheet, c, v) {
    if (typeof v === "number") {
      const ribuan = (FORMAT_RIBUAN[sheet.name] || []).includes(c);
      return ribuan ? v.toLocaleString("en-US") : String(v);
    }
    return String(v);
  }

  function gambar(sebelum) {
    const s = sheetAktif;
    const nRow = Math.max(s.getLastRow() + 6, 24);
    const nCol = Math.min(Math.max(s.getLastColumn() + 2, 8), 26);
    const lebar = (c) => s.widths[c] || 100;
    const kiri = [46];
    for (let c = 1; c <= nCol; c++) kiri.push(kiri[c - 1] + lebar(c));

    let html = "<thead><tr><th class=\"sudut\"></th>";
    for (let c = 1; c <= nCol; c++) {
      const beku = c <= s.frozenCols ? ` class="beku-kolom" style="left:${kiri[c - 1]}px;min-width:${lebar(c)}px;max-width:${lebar(c)}px"` : ` style="min-width:${lebar(c)}px;max-width:${lebar(c)}px"`;
      html += `<th scope="col"${beku}>${huruf(c)}</th>`;
    }
    html += "</tr></thead><tbody>";
    for (let r = 1; r <= nRow; r++) {
      const bekuBaris = r <= s.frozenRows;
      html += `<tr${bekuBaris ? " class=\"beku-baris\"" : ""}><th scope="row">${r}</th>`;
      for (let c = 1; c <= nCol; c++) {
        const v = s.get(r, c);
        const st = s.style(r, c);
        const css = [];
        if (st.bg) css.push(`background:${st.bg}`);
        if (st.color) css.push(`color:${st.color}`);
        if (st.weight === "bold") css.push("font-weight:700");
        if (st.size) css.push(`font-size:${Math.min(st.size, 16)}px`);
        if (st.align) css.push(`text-align:${st.align}`);
        else if (typeof v === "number") css.push("text-align:right");
        const kelas = [];
        if (c <= s.frozenCols) { kelas.push("beku-kolom"); css.push(`left:${kiri[c - 1]}px`); }
        const kunci = s.name + "|" + r + "|" + c;
        if (sebelum) {
          const lama = sebelum[r - 1] ? sebelum[r - 1][c - 1] : "";
          if (String(lama === undefined ? "" : lama) !== String(v)) kilat[kunci] = performance.now();
        }
        const umur = kilat[kunci] ? performance.now() - kilat[kunci] : Infinity;
        if (umur < 1800) {
          kelas.push("berubah");
          css.push(`animation-delay:-${Math.round(umur)}ms`);
        }
        if (pilihan.r === r && pilihan.c === c) kelas.push("dipilih");
        html += `<td data-r="${r}" data-c="${c}"${kelas.length ? ` class="${kelas.join(" ")}"` : ""}${css.length ? ` style="${css.join(";")}"` : ""}>${escapeHtml(tampilNilai(s, c, v))}</td>`;
      }
      html += "</tr>";
    }
    grid.innerHTML = html + "</tbody>";
    gambarTab();
    perbaruiRumus();
  }

  function escapeHtml(t) {
    return t.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch]));
  }

  function perbaruiRumus() {
    document.getElementById("kotak-nama").textContent = huruf(pilihan.c) + pilihan.r;
    const v = sheetAktif.get(pilihan.r, pilihan.c);
    document.getElementById("isi-rumus").textContent = v === "" ? "" : String(v);
  }

  grid.addEventListener("click", (e) => {
    const td = e.target.closest("td");
    if (!td) return;
    pilihan = { r: +td.dataset.r, c: +td.dataset.c };
    grid.querySelectorAll("td.dipilih").forEach((x) => x.classList.remove("dipilih"));
    td.classList.add("dipilih");
    perbaruiRumus();
  });

  function gambarTab() {
    tabSheet.innerHTML = "";
    mock.sheets.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = s.name;
      if (s === sheetAktif) b.setAttribute("aria-current", "true");
      b.addEventListener("click", () => {
        sheetAktif = s;
        pilihan = { r: 1, c: 1 };
        gambar(null);
      });
      tabSheet.append(b);
    });
  }

  // ---------- mulai: jalankan fungsi asli dari Code.gs ----------
  senyap = true;
  setupAwal();
  senyap = false;
  sheetAktif = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRODUK);
  onOpen();
  bukaSidebar();
  gambar(null);
})();
