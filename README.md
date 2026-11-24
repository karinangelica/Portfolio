# Portfolio Karin Angelica

Portfolio pribadi untuk pendaftaran S-Class BINUS @Alam Sutera. Halaman portfolio (`index.html` dan `html/`)

## Struktur folder

```
index.html              halaman utama: demo proyek, prestasi, tentang, keahlian, kontak
html/archipelore.html   studi kasus Archipelore (dengan demo langsung)
html/sankalpa.html      studi kasus Sankalpa: video, layar game, buku karya tulis
css/base.css            variabel warna & font, reset, tombol, jendela popover
css/navbar.css          navigasi atas (semua halaman)
css/main.css            khusus index.html
css/demo.css            tab demo proyek, bingkai browser, ponsel
css/buku.css            buku yang bisa dibalik (index & Sankalpa)
css/proyek.css          halaman studi kasus
css/sankalpa.css        video, penjelajah layar game, pilihan buku
css/footer.css          footer (semua halaman)
demo/archipelore/       kode asli Archipelore dari GitHub (gambar dikompres)
demo/online-shop/       kode asli Archipelore Online Shop dari GitHub
demo/password/          demo Password Checker: password_tool.py asli dijalankan lewat Pyodide
demo/tokoku/            demo TokoKu Manager: Code.gs & Sidebar asli di atas tiruan Google Sheets
images/                 foto, screenshot, sertifikat, halaman karya tulis, layar game Sankalpa
```

## Interaksi tanpa JavaScript

- **Tab demo proyek** dan **pilihan level Sankalpa**: `input type="radio"` + selector `:checked ~`.
- **Buku yang bisa dibalik**: setiap lembar punya `checkbox`, lalu `:has(:checked)` memutar lembar dengan `transform: rotateY(-180deg)`.
- **Perbesar sertifikat & halaman buku**: atribut HTML `popover` dan `popovertarget`.
- **Layar game**: galeri geser dengan `scroll-snap`.

Demo di dalam bingkai (`<iframe>`) adalah proyek terpisah.

### Demo TokoKu Manager (`demo/tokoku/`)

- `code-gs.js` adalah `Code.gs` asli, hanya ganti ekstensi supaya bisa dimuat browser.
- `sidebar.html` adalah `Sidebar.html` dari repo [Minimarket-Dashboard](https://github.com/karinangelica/Minimarket-Dashboard) dengan tambahan satu baris `<script src="bridge.js">`.
- `bridge.js` menggantikan `google.script.run`: panggilan dari panel dikirim ke halaman induk lewat `postMessage`.
- `mock-apps-script.js` meniru `SpreadsheetApp`, `HtmlService`, `Utilities`, dan `Logger` di memori.
- `shell.js` dan `shell.css` menggambar tampilan spreadsheet. Saat dibuka, demo menjalankan `setupAwal()`, `onOpen()`, dan `bukaSidebar()` dari Code.gs. Archipelore memakai JavaScript aslinya. Demo Password Checker memakai JavaScript kecil untuk memuat Python (Pyodide) saat pengunjung mulai mencoba.

Catatan: video Sankalpa diputar dari Google Drive, jadi akses file di Drive harus "Siapa saja yang memiliki link".
