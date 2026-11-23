// Pengganti google.script.run untuk demo di luar Google Sheets.
// Panggilan dari Sidebar dikirim ke halaman induk (index.html) lewat postMessage,
// lalu halaman induk menjalankan fungsi Code.gs yang asli dan mengirim hasilnya kembali.
(function () {
  const pending = {};
  let seq = 0;

  function runner(onSuccess, onFailure) {
    return new Proxy({}, {
      get(_, name) {
        if (name === "withSuccessHandler") return (fn) => runner(fn, onFailure);
        if (name === "withFailureHandler") return (fn) => runner(onSuccess, fn);
        if (name === "withUserObject") return () => runner(onSuccess, onFailure);
        return (...args) => {
          const id = ++seq;
          pending[id] = { onSuccess, onFailure };
          window.parent.postMessage({ tokoku: "panggil", id, nama: name, args }, "*");
        };
      }
    });
  }

  window.google = {
    script: {
      run: runner(),
      host: {
        close() {
          window.parent.postMessage({ tokoku: "tutup" }, "*");
        }
      }
    }
  };

  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || d.tokoku !== "hasil") return;
    const p = pending[d.id];
    if (!p) return;
    delete pending[d.id];
    if (d.error) {
      if (p.onFailure) p.onFailure(new Error(d.error));
    } else if (p.onSuccess) {
      p.onSuccess(d.result);
    }
  });
})();
