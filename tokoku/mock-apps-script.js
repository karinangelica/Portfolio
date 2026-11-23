// Tiruan kecil layanan Google Apps Script (SpreadsheetApp, HtmlService, Utilities, Logger)
// supaya Code.gs asli bisa berjalan di browser. Semua data disimpan di memori.
(function () {
  const hooks = {
    alert() {},
    menu() {},
    sidebar() {},
    activate() {}
  };
  const sheets = [];
  let active = null;

  function colToNum(letters) {
    return letters.toUpperCase().split("").reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
  }

  function parseA1(a1) {
    const m = a1.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/i);
    if (!m) throw new Error("Range tidak dikenal: " + a1);
    const col = colToNum(m[1]);
    const row = parseInt(m[2], 10);
    const col2 = m[3] ? colToNum(m[3]) : col;
    const row2 = m[4] ? parseInt(m[4], 10) : row;
    return { row, col, numRows: row2 - row + 1, numCols: col2 - col + 1 };
  }

  const kosong = (v) => v === "" || v === null || v === undefined;

  class Sheet {
    constructor(name) {
      this.name = name;
      this.cells = [];
      this.fmt = [];
      this.widths = {};
      this.frozenRows = 0;
      this.frozenCols = 0;
    }

    get(r, c) {
      const row = this.cells[r - 1];
      return row && !kosong(row[c - 1]) ? row[c - 1] : "";
    }

    set(r, c, v) {
      while (this.cells.length < r) this.cells.push([]);
      const row = this.cells[r - 1];
      while (row.length < c - 1) row.push("");
      row[c - 1] = kosong(v) ? "" : v;
    }

    style(r, c) {
      return (this.fmt[r - 1] && this.fmt[r - 1][c]) || {};
    }

    setStyle(r, c, key, val) {
      while (this.fmt.length < r) this.fmt.push({});
      const row = this.fmt[r - 1];
      row[c] = Object.assign({}, row[c], { [key]: val });
    }

    getName() { return this.name; }
    getMaxRows() { return 1000; }
    getMaxColumns() { return 26; }

    getLastRow() {
      for (let r = this.cells.length; r > 0; r--) {
        if (this.cells[r - 1].some((v) => !kosong(v))) return r;
      }
      return 0;
    }

    getLastColumn() {
      let max = 0;
      this.cells.forEach((row) => {
        for (let c = row.length; c > 0; c--) {
          if (!kosong(row[c - 1])) { max = Math.max(max, c); break; }
        }
      });
      return max;
    }

    getRange(a, b, c, d) {
      if (typeof a === "string") {
        const p = parseA1(a);
        return new Range(this, p.row, p.col, p.numRows, p.numCols);
      }
      return new Range(this, a, b, c || 1, d || 1);
    }

    getDataRange() {
      return new Range(this, 1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1));
    }

    appendRow(values) {
      const r = this.getLastRow() + 1;
      values.forEach((v, i) => this.set(r, i + 1, v));
      return this;
    }

    deleteRow(r) {
      this.cells.splice(r - 1, 1);
      this.fmt.splice(r - 1, 1);
      return this;
    }

    clearContents() { this.cells = []; return this; }
    clear() { this.cells = []; this.fmt = []; return this; }
    setFrozenRows(n) { this.frozenRows = n; return this; }
    setFrozenColumns(n) { this.frozenCols = n; return this; }
    setColumnWidth(c, w) { this.widths[c] = w; return this; }
    activate() { return spreadsheet.setActiveSheet(this); }
  }

  class Range {
    constructor(sheet, row, col, numRows, numCols) {
      Object.assign(this, { sheet, row, col, numRows, numCols });
    }

    getValues() {
      const out = [];
      for (let i = 0; i < this.numRows; i++) {
        const row = [];
        for (let j = 0; j < this.numCols; j++) row.push(this.sheet.get(this.row + i, this.col + j));
        out.push(row);
      }
      return out;
    }

    getValue() { return this.sheet.get(this.row, this.col); }

    setValues(values) {
      if (values.length !== this.numRows || values.some((r) => r.length !== this.numCols)) {
        throw new Error("Jumlah baris/kolom data tidak cocok dengan range.");
      }
      values.forEach((r, i) => r.forEach((v, j) => this.sheet.set(this.row + i, this.col + j, v)));
      return this;
    }

    setValue(v) { this.sheet.set(this.row, this.col, v); return this; }

    _gaya(key, val) {
      for (let i = 0; i < this.numRows; i++) {
        for (let j = 0; j < this.numCols; j++) this.sheet.setStyle(this.row + i, this.col + j, key, val);
      }
      return this;
    }

    setBackground(c) { return this._gaya("bg", c); }
    setFontColor(c) { return this._gaya("color", c); }
    setFontWeight(w) { return this._gaya("weight", w); }
    setFontSize(s) { return this._gaya("size", s); }
    setHorizontalAlignment(a) { return this._gaya("align", a); }
    setNumberFormat() { return this; }
    clearContent() {
      for (let i = 0; i < this.numRows; i++) {
        for (let j = 0; j < this.numCols; j++) this.sheet.set(this.row + i, this.col + j, "");
      }
      return this;
    }
  }

  const spreadsheet = {
    getName() { return "Cempaka Baru"; },
    getSheetByName(name) { return sheets.find((s) => s.name === name) || null; },
    getSheets() { return sheets.slice(); },
    insertSheet(name) {
      const s = new Sheet(name);
      sheets.push(s);
      if (!active) active = s;
      return s;
    },
    getActiveSheet() { return active; },
    setActiveSheet(s) {
      active = s;
      hooks.activate(s);
      return s;
    }
  };

  const ui = {
    ButtonSet: { OK: "OK", OK_CANCEL: "OK_CANCEL", YES_NO: "YES_NO" },
    Button: { OK: "OK", CANCEL: "CANCEL", YES: "YES", NO: "NO" },
    alert(title, message) {
      if (message === undefined) hooks.alert({ judul: "", pesan: String(title) });
      else hooks.alert({ judul: String(title), pesan: String(message) });
      return "OK";
    },
    createMenu(name) {
      const menu = { name, items: [] };
      return {
        addItem(label, fn) { menu.items.push({ label, fn }); return this; },
        addSeparator() { menu.items.push({ separator: true }); return this; },
        addToUi() { hooks.menu(menu); }
      };
    },
    showSidebar(html) { hooks.sidebar(html); }
  };

  window.SpreadsheetApp = {
    getActiveSpreadsheet: () => spreadsheet,
    getActive: () => spreadsheet,
    getUi: () => ui
  };

  window.HtmlService = {
    createHtmlOutputFromFile(file) {
      return {
        file,
        title: "",
        width: 300,
        setTitle(t) { this.title = t; return this; },
        setWidth(w) { this.width = w; return this; }
      };
    }
  };

  window.Utilities = {
    formatDate(date, timeZone, pattern) {
      const parts = {};
      new Intl.DateTimeFormat("en-GB", {
        timeZone, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
      }).formatToParts(date).forEach((p) => { parts[p.type] = p.value; });
      return pattern
        .replace("yyyy", parts.year).replace("MM", parts.month).replace("dd", parts.day)
        .replace("HH", parts.hour === "24" ? "00" : parts.hour).replace("mm", parts.minute).replace("ss", parts.second);
    }
  };

  window.Logger = { log: (m) => console.log("[Logger]", m) };

  window.AppsScriptMock = { hooks, sheets, spreadsheet };
})();
