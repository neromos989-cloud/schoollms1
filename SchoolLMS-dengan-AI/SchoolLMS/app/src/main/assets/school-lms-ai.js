/* School Lms: jendela AI mode guru (versi untuk aplikasi Android).
   Taruh di app/src/main/assets/ lalu disuntikkan dari MainActivity (lihat MainActivity-snippet.kt.txt).
   Mode guru diaktifkan dengan mengetuk pojok kiri atas halaman 5 kali berturut-turut. */
(function () {
  "use strict";
  if (document.getElementById("slms")) return;

  // ===== PENGATURAN: sesuaikan tiga baris pertama =====
  const CONFIG = {
    API_URL: "https://GANTI-DENGAN-ALAMAT-WORKER.workers.dev",
    QUESTION_SELECTOR: "#soal", // elemen yang berisi soal aktif (teks dan/atau gambar)
    AUTO_ANSWER: true,
    TITLE: "School Lms",
    MANUAL_IMAGE: true, // tombol Tambah gambar (aplikasi sudah punya pemilih file)
    isTeacher: () => {
      try { return new URLSearchParams(location.search).has("guru") || localStorage.getItem("slms_guru") === "1"; }
      catch (e) { return false; }
    },
  };
  if (!CONFIG.isTeacher()) {
    let n = 0, t0 = 0;
    document.addEventListener("click", (e) => {
      if (e.clientX > 48 || e.clientY > 48) { n = 0; return; }
      const now = Date.now();
      n = now - t0 < 800 ? n + 1 : 1;
      t0 = now;
      if (n >= 5) { try { localStorage.setItem("slms_guru", "1"); } catch (x) {} location.reload(); }
    }, true);
    return;
  }

  const css = `
#slms{position:fixed;right:16px;bottom:16px;width:min(380px,calc(100vw - 32px));height:320px;min-width:240px;min-height:120px;max-width:calc(100vw - 8px);max-height:90vh;display:flex;flex-direction:column;overflow:hidden;resize:both;background:#16352b;color:#eef6f1;border:1px solid #e8c533;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.35);z-index:2147483000;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;box-sizing:border-box}
#slms *{box-sizing:border-box}
#slms.slms-min{width:52px!important;height:52px!important;min-width:0;min-height:0;border-radius:50%;resize:none}
#slms.slms-min .slms-body,#slms.slms-min strong,#slms.slms-min .slms-mn,#slms.slms-min .slms-off{display:none}
#slms.slms-min .slms-hd{padding:0;height:100%;justify-content:center;border-bottom:0}
#slms .slms-robot{display:none}
#slms.slms-min .slms-robot{display:block}
#slms .slms-hd{display:flex;align-items:center;gap:8px;padding:8px 10px;cursor:grab;touch-action:none;user-select:none;border-bottom:1px solid rgba(255,255,255,.18)}
#slms .slms-hd strong{flex:1;font-size:14px}
#slms button{font:600 12px system-ui,sans-serif;padding:4px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.35);background:transparent;color:inherit;cursor:pointer}
#slms .slms-body{flex:1;overflow:auto;padding:10px 12px}
#slms .slms-ctl{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;font-size:12px;margin-bottom:8px}
#slms .slms-ctl label{display:flex;align-items:center;gap:6px}
#slms .slms-codebox{display:none;gap:6px;margin-bottom:8px}
#slms .slms-codebox.on{display:flex}
#slms .slms-codebox input{flex:1;min-width:0;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.25);color:inherit;font:inherit;font-size:13px}
#slms .slms-out{white-space:pre-wrap;word-break:break-word;margin:0;font:inherit;font-size:14px}
#slms .slms-st{font-size:12px;opacity:.85;margin-top:6px}`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "slms";
  root.setAttribute("role", "complementary");
  root.innerHTML = `
<div class="slms-hd">
  <svg class="slms-robot" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 5v3"/><circle cx="16" cy="4" r="1.5"/><rect x="6" y="8" width="20" height="17" rx="4"/><circle cx="12" cy="15" r="1.6" fill="currentColor"/><circle cx="20" cy="15" r="1.6" fill="currentColor"/><path d="M12 20h8"/><path d="M3 14v4M29 14v4"/></svg>
  <strong></strong>
  <button class="slms-off" type="button" aria-label="Matikan mode guru">Matikan</button>
  <button class="slms-mn" type="button" aria-label="Kecilkan jendela">Kecilkan</button>
</div>
<div class="slms-body">
  <div class="slms-codebox"><input type="password" class="slms-code" placeholder="Kode guru" autocomplete="off"><button class="slms-save" type="button">Simpan</button></div>
  <div class="slms-ctl">
    <label><input type="checkbox" class="slms-auto"> Jawab otomatis</label>
    <label>Transparansi <input type="range" class="slms-op" min="40" max="100" value="100"></label>
    <button class="slms-ask" type="button">Jawab sekarang</button>
    <button class="slms-img" type="button">Tambah gambar</button>
    <input class="slms-file" type="file" accept="image/*" multiple hidden>
  </div>
  <pre class="slms-out"></pre>
  <div class="slms-st" role="status"></div>
</div>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  $("strong").textContent = CONFIG.TITLE;
  $(".slms-auto").checked = CONFIG.AUTO_ANSWER;
  if (!CONFIG.MANUAL_IMAGE) $(".slms-img").style.display = "none";

  let ctl = null, timer = null, manualImgs = [], lastKey = "", lastBase = "";
  const cache = new Map();
  const st = (t) => { $(".slms-st").textContent = t || ""; };
  const show = (t) => { $(".slms-out").textContent = t || ""; };
  const getCode = () => { try { return sessionStorage.getItem("slms_code") || ""; } catch (e) { return ""; } };
  const setCode = (c) => { try { c ? sessionStorage.setItem("slms_code", c) : sessionStorage.removeItem("slms_code"); } catch (e) {} };
  const needCode = (msg) => { $(".slms-codebox").classList.add("on"); st(msg || "Masukkan kode guru lalu tekan Simpan."); };

  // Perkecil gambar (maks 1600 px) lalu ubah ke JPEG base64 agar ringan dikirim.
  async function toImage(blob) {
    const bmp = await createImageBitmap(blob);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    const g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(bmp, 0, 0, c.width, c.height);
    return { media_type: "image/jpeg", data: c.toDataURL("image/jpeg", 0.9).split(",")[1] };
  }

  function readQuestion() {
    const el = document.querySelector(CONFIG.QUESTION_SELECTOR);
    if (!el) return null;
    const srcs = [...el.querySelectorAll("img")].map((i) => i.currentSrc || i.src).filter(Boolean);
    const bg = (getComputedStyle(el).backgroundImage || "").match(/url\(["']?([^"')]+)["']?\)/);
    if (bg) srcs.push(bg[1]);
    return {
      text: (el.innerText || "").trim(),
      srcs: srcs.slice(0, 4),
      cvs: [...el.querySelectorAll("canvas")].slice(0, 4),
    };
  }
  const keyOf = (q) => q.text + "|" + q.srcs.join(",") + "|" + q.cvs.length + "|" + manualImgs.map((m) => m.id).join(",");
  const NOTE = "Sebagian gambar soal tidak bisa dibaca otomatis. Pakai Tambah gambar atau tempel gambar (Ctrl+V).";

  async function ask(force) {
    const q = readQuestion();
    if (!q) { st("Elemen soal tidak ditemukan. Periksa QUESTION_SELECTOR di school-lms-ai.js."); return; }
    if (!q.text && !q.srcs.length && !q.cvs.length && !manualImgs.length) { st("Soal kosong."); return; }
    const key = keyOf(q);
    if (!force && cache.has(key)) { show(cache.get(key)); return; }

    const code = getCode();
    if (!code) { needCode(); return; }
    if (ctl) ctl.abort();
    const c = new AbortController();
    ctl = c;
    st("AI sedang menjawab…");
    let note = "";
    try {
      const images = manualImgs.map((m) => m.image);
      const urls = [];
      if (!images.length) {
        for (const s of q.srcs) {
          try { images.push(await toImage(await (await fetch(s)).blob())); }
          catch (e) {
            const u = new URL(s, location.href).href;
            if (u.startsWith("https://")) urls.push(u); else note = NOTE;
          }
        }
        for (const cv of q.cvs) {
          try { images.push(await toImage(await new Promise((ok, no) => cv.toBlob((b) => (b ? ok(b) : no()), "image/png")))); }
          catch (e) { note = NOTE; }
        }
      }
      const res = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Teacher-Code": code },
        body: JSON.stringify({ question: q.text, images, imageUrls: urls }),
        signal: c.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { setCode(""); needCode("Kode guru salah. Masukkan lagi lalu tekan Simpan."); return; }
      if (!res.ok) throw new Error(data.error || "Kesalahan " + res.status);
      cache.set(key, data.answer);
      const now = readQuestion();
      if (now && keyOf(now) === key) { show(data.answer); st(note); }
    } catch (e) {
      if (c.signal.aborted) return;
      st("Gagal menjawab: " + (e.message || "tidak diketahui") + ". Coba lagi.");
    }
  }

  // Pantau pergantian soal dan jawab otomatis.
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const q = readQuestion();
      if (!q) return;
      const base = q.text + "|" + q.srcs.join(",") + "|" + q.cvs.length;
      if (base !== lastBase) { lastBase = base; manualImgs = []; }
      const k = keyOf(q);
      if (k === lastKey) return;
      lastKey = k;
      if (ctl) ctl.abort();
      show(cache.get(k) || "");
      if (getCode()) st(""); else needCode();
      if ($(".slms-auto").checked && getCode() && (q.text || q.srcs.length || q.cvs.length) && !cache.has(k)) ask(false);
    }, 600);
  }
  function watch() {
    const el = document.querySelector(CONFIG.QUESTION_SELECTOR);
    if (!el) { setTimeout(watch, 1000); return; }
    new MutationObserver(schedule).observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["src"] });
    schedule();
  }
  watch();

  $(".slms-save").onclick = () => {
    const v = $(".slms-code").value.trim();
    if (!v) { st("Kode guru belum diisi."); return; }
    setCode(v);
    $(".slms-code").value = "";
    $(".slms-codebox").classList.remove("on");
    st("");
    ask(true);
  };
  $(".slms-off").onclick = () => {
    try { localStorage.removeItem("slms_guru"); } catch (e) {}
    setCode("");
    root.remove();
  };
  $(".slms-ask").onclick = () => ask(true);
  $(".slms-img").onclick = () => $(".slms-file").click();
  async function addImages(files) {
    if (!files.length) return;
    try {
      for (const f of files) manualImgs.push({ id: Date.now() + "-" + manualImgs.length, image: await toImage(f) });
      manualImgs = manualImgs.slice(-4);
      st(manualImgs.length + " gambar ditambahkan.");
      ask(true);
    } catch (err) { st("Gagal membaca gambar."); }
  }
  $(".slms-file").onchange = (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    addImages(files);
  };
  document.addEventListener("paste", (e) => {
    const files = [...(e.clipboardData ? e.clipboardData.items : [])]
      .filter((i) => i.type.startsWith("image/"))
      .map((i) => i.getAsFile())
      .filter(Boolean);
    if (files.length) addImages(files);
  });
  $(".slms-op").oninput = (e) => { root.style.opacity = e.target.value / 100; };

  // Kecilkan menjadi ikon robot, geser, dan buka kembali.
  const hd = $(".slms-hd");
  function fit() {
    if (!root.style.left) return;
    const r = root.getBoundingClientRect();
    root.style.left = Math.min(Math.max(0, r.left), Math.max(0, innerWidth - r.width)) + "px";
    root.style.top = Math.min(Math.max(0, r.top), Math.max(0, innerHeight - r.height)) + "px";
  }
  addEventListener("resize", fit);
  function setMin(m) {
    root.classList.toggle("slms-min", m);
    fit();
    if (m) { hd.setAttribute("role", "button"); hd.setAttribute("tabindex", "0"); hd.setAttribute("aria-label", "Buka jendela AI"); }
    else { hd.removeAttribute("role"); hd.removeAttribute("tabindex"); hd.removeAttribute("aria-label"); }
  }
  $(".slms-mn").onclick = () => setMin(true);
  hd.addEventListener("keydown", (e) => {
    if (root.classList.contains("slms-min") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setMin(false); }
  });
  let dx = 0, dy = 0, sx = 0, sy = 0, moved = 0, drag = false;
  hd.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    drag = true; moved = 0; sx = e.clientX; sy = e.clientY;
    const r = root.getBoundingClientRect();
    dx = e.clientX - r.left; dy = e.clientY - r.top;
    hd.setPointerCapture(e.pointerId);
    hd.style.cursor = "grabbing";
  });
  hd.addEventListener("pointermove", (e) => {
    if (!drag) return;
    moved = Math.max(moved, Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy));
    root.style.left = Math.min(Math.max(0, e.clientX - dx), Math.max(0, innerWidth - root.offsetWidth)) + "px";
    root.style.top = Math.min(Math.max(0, e.clientY - dy), Math.max(0, innerHeight - root.offsetHeight)) + "px";
    root.style.right = "auto"; root.style.bottom = "auto";
  });
  const end = () => {
    const was = drag;
    drag = false; hd.style.cursor = "grab";
    if (was && moved < 8 && root.classList.contains("slms-min")) setMin(false);
  };
  hd.addEventListener("pointerup", end);
  hd.addEventListener("pointercancel", end);
})();
