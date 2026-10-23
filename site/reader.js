/* Newspaper rack + reader for the Form A public announcement.
   To add another newspaper: put <slug>.pdf, <slug>-page.webp, <slug>-thumb.webp and
   <slug>-notice.webp in /newspapers/ and add a line below. `box` is where the notice
   sits on the page, as fractions of the page width/height: [left, top, right, bottom]. */

const EDITIONS = [
  { slug: "assam-rising", paper: "The Assam Rising", city: "Assam", lang: "English", page: 3, box: [0.7015, 0.5394, 0.8925, 0.7695] },
  { slug: "dainandin-barta", paper: "Dainandin Barta", city: "Assam", lang: "Assamese", page: 3, box: [0.7035, 0.7156, 0.8945, 0.9461] },
  { slug: "hills-times", paper: "The Hills Times", city: "Guwahati", lang: "English", page: 7, box: [0.7017, 0.7159, 0.9293, 0.9657] },
  { slug: "rupang", paper: "Rupang", city: "Meghalaya", lang: "Khasi", page: 6, box: [0.7277, 0.7037, 0.9661, 0.9948] },
  { slug: "fe-kolkata", paper: "Financial Express", city: "Kolkata", lang: "English", page: 5, box: [0.7402, 0.4663, 1.0, 0.7182] },
  { slug: "fe-delhi", paper: "Financial Express", city: "Delhi", lang: "English", page: 5, box: [0.7389, 0.4663, 0.9955, 0.7204] },
  { slug: "fe-chandigarh", paper: "Financial Express", city: "Chandigarh", lang: "English", page: 5, box: [0.7389, 0.4665, 0.9955, 0.7198] },
  { slug: "fe-pune", paper: "Financial Express", city: "Pune", lang: "English", page: 5, box: [0.7315, 0.4674, 0.9834, 0.7104] },
  { slug: "fe-hyderabad", paper: "Financial Express", city: "Hyderabad", lang: "English", page: 5, box: [0.7389, 0.4663, 0.9955, 0.7204] },
  { slug: "fe-bengaluru", paper: "Financial Express", city: "Bengaluru", lang: "English", page: 5, box: [0.7389, 0.4663, 0.9955, 0.7204] },
  { slug: "fe-chennai", paper: "Financial Express", city: "Chennai", lang: "English", page: 5, box: [0.7389, 0.4663, 0.9955, 0.7204] },
  { slug: "fe-kochi", paper: "Financial Express", city: "Kochi", lang: "English", page: 5, box: [0.7389, 0.4663, 0.9955, 0.7204] },
];
const DATE = "Wednesday, 14 October 2026";
const DIR = "/newspapers/";
const CLAIMS_DUE = new Date("2026-10-26T23:59:59+05:30");

const $ = (s, r = document) => r.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---------- countdown ---------- */
function countdown() {
  const el = $("#pa-countdown");
  if (!el) return;
  const ms = CLAIMS_DUE - Date.now();
  const days = Math.ceil(ms / 86400000);
  if (ms <= 0) {
    el.textContent = "This date has passed. Contact the IRP about any claim.";
    $("#pa-due")?.classList.add("is-past");
  } else el.textContent = days <= 1 ? "Last day today" : `${days} days left`;
}

/* ---------- publication record: one card per newspaper, full front of the page ---------- */
function buildStand() {
  const grid = $("#stand");
  if (!grid) return;
  grid.innerHTML = EDITIONS.map(
    (e, i) => `
    <button type="button" class="pub" data-i="${i}" aria-label="View ${esc(e.paper)}, ${esc(e.city)} edition, page ${e.page}">
      <span class="pub__page"><img src="${DIR}${e.slug}-thumb.webp" alt="" loading="lazy" decoding="async"></span>
      <span class="pub__name">${esc(e.paper)}</span>
      <span class="pub__meta">${esc(e.city)} &middot; ${esc(e.lang)}</span>
      <span class="pub__meta">14 Oct 2026 &middot; Page ${e.page}</span>
      <span class="pub__view">View page</span>
    </button>`
  ).join("");
  grid.addEventListener("click", (ev) => {
    const b = ev.target.closest(".pub");
    if (b) open(+b.dataset.i, "page", b);
  });
}

/* ---------- reader ---------- */
const R = { i: 0, mode: "page", z: 1, x: 0, y: 0, opener: null };
let reader, desk, sheet, img, mark, crisp;

function open(i, mode = "page", opener = null) {
  R.opener = opener;
  reader.hidden = false;
  document.documentElement.classList.add("rd-open");
  show(i, mode);
  $("#rd-close").focus();
}
function close() {
  reader.hidden = true;
  document.documentElement.classList.remove("rd-open");
  R.opener?.focus();
}

function show(i, mode = R.mode) {
  R.i = (i + EDITIONS.length) % EDITIONS.length;
  R.mode = mode;
  const e = EDITIONS[R.i];
  $("#rd-title").textContent = e.paper;
  $("#rd-meta").textContent = `${e.city} edition · ${DATE} · Page ${e.page} · ${e.lang}`;
  $("#rd-pdf").href = DIR + e.slug + ".pdf";
  reader.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === mode)));
  reader.querySelectorAll(".rd-strip button").forEach((b, k) => b.setAttribute("aria-selected", String(k === R.i)));
  reader.querySelector(".rd-strip [aria-selected=true]")?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  reader.dataset.mode = mode;
  img.alt = `${e.paper}, ${e.city} edition, page ${e.page}, carrying the Form A public announcement`;
  sheet.classList.add("is-loading");
  img.onload = () => {
    sheet.classList.remove("is-loading");
    fit();
    mark.classList.remove("is-on");
  };
  img.src = DIR + e.slug + "-page.webp";
  const [l, t, r, b] = e.box;
  const pos = { left: l * 100 + "%", top: t * 100 + "%", width: (r - l) * 100 + "%", height: (b - t) * 100 + "%" };
  Object.assign(mark.style, pos);
  // on the full page, lay the sharp notice scan exactly over its spot so zooming in stays readable
  Object.assign(crisp.style, pos);
  crisp.src = mode === "page" ? DIR + e.slug + "-notice.webp" : "";
}

/* fit the sheet to the desk */
function fit() {
  const dw = desk.clientWidth, dh = desk.clientHeight;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const pad = window.innerWidth < 640 ? 12 : 40;
  const s = Math.min((dw - pad * 2) / iw, (dh - pad * 2) / ih);
  sheet.style.width = iw * s + "px";
  sheet.style.height = ih * s + "px";
  R.z = 1; R.x = 0; R.y = 0;
  apply(false);
}

function apply(anim = true) {
  sheet.style.transition = anim ? "transform .45s cubic-bezier(.2,.7,.2,1)" : "none";
  sheet.style.transform = `translate(${R.x}px, ${R.y}px) scale(${R.z})`;
  reader.classList.toggle("is-zoomed", R.z > 1.05);
}

function clampPan() {
  const w = sheet.offsetWidth * R.z, h = sheet.offsetHeight * R.z;
  const mx = Math.max(0, (w - desk.clientWidth) / 2 + 40);
  const my = Math.max(0, (h - desk.clientHeight) / 2 + 40);
  R.x = Math.max(-mx, Math.min(mx, R.x));
  R.y = Math.max(-my, Math.min(my, R.y));
}

/* zoom around a point given in desk coordinates (cx, cy) */
function zoomAt(nz, cx, cy, anim = true) {
  nz = Math.max(1, Math.min(6, nz));
  const r = desk.getBoundingClientRect();
  const ox = cx - r.width / 2, oy = cy - r.height / 2;
  R.x = ox - ((ox - R.x) * nz) / R.z;
  R.y = oy - ((oy - R.y) * nz) / R.z;
  R.z = nz;
  if (R.z === 1) { R.x = 0; R.y = 0; }
  clampPan();
  apply(anim);
}

/* full page: glide to the Form A box */
function focusNotice(anim = true) {
  mark.classList.add("is-on");
  const [l, t, r, b] = EDITIONS[R.i].box;
  const sw = sheet.offsetWidth, sh = sheet.offsetHeight;
  const z = Math.min(desk.clientWidth / ((r - l) * sw * 1.12), (desk.clientHeight - 90) / ((b - t) * sh * 1.12), 6);
  R.z = Math.max(1, z);
  R.x = -(((l + r) / 2 - 0.5) * sw) * R.z;
  R.y = -(((t + b) / 2 - 0.5) * sh) * R.z + 18; // a little room above for the "Form A" tag
  apply(anim);

}

function wire() {
  reader = $("#reader"); desk = $("#rd-desk"); sheet = $("#rd-sheet"); img = $("#rd-img"); mark = $("#rd-mark"); crisp = $("#rd-crisp");
  if (!reader) return;

  $("#rd-strip").innerHTML = EDITIONS.map(
    (e, i) => `<button type="button" role="tab" data-i="${i}"><img src="${DIR}${e.slug}-thumb.webp" alt="" loading="lazy"><span>${esc(e.paper === "Financial Express" ? "FE " + e.city : e.paper.replace(/^The /, ""))}</span></button>`
  ).join("");
  $("#rd-strip").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (b) show(+b.dataset.i); });
  reader.querySelectorAll("[data-zoom]").forEach((b) =>
    b.addEventListener("click", () => { const r = desk.getBoundingClientRect(); zoomAt(R.z * (b.dataset.zoom > 0 ? 1.5 : 1 / 1.5), r.width / 2, r.height / 2); })
  );
  $("#rd-close").addEventListener("click", close);
  $("#rd-prev").addEventListener("click", () => show(R.i - 1));
  $("#rd-next").addEventListener("click", () => show(R.i + 1));
  $("#rd-jump").addEventListener("click", () => focusNotice());
  reader.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight" && R.z <= 1.05) show(R.i + 1);
    else if (e.key === "ArrowLeft" && R.z <= 1.05) show(R.i - 1);
    else if (e.key === "Tab") {
      const f = [...reader.querySelectorAll("button, a[href]")].filter((x) => x.offsetParent);
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.addEventListener("resize", () => { if (!reader.hidden && img.naturalWidth) fit(); });

  /* wheel zoom */
  desk.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = desk.getBoundingClientRect();
    zoomAt(R.z * Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top, false);
  }, { passive: false });

  /* drag, pinch, swipe, double-tap */
  const pts = new Map();
  let start = null, lastTap = 0;
  desk.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    desk.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    start = { x: R.x, y: R.y, z: R.z, px: e.clientX, py: e.clientY, d: null, t: Date.now() };
    if (pts.size === 2) { const [a, b] = [...pts.values()]; start.d = Math.hypot(a.x - b.x, a.y - b.y); start.mx = (a.x + b.x) / 2; start.my = (a.y + b.y) / 2; }
  });
  desk.addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId) || !start) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = desk.getBoundingClientRect();
    if (pts.size === 2 && start.d) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      R.z = start.z; R.x = start.x; R.y = start.y;
      zoomAt(start.z * (d / start.d), start.mx - r.left, start.my - r.top, false);
    } else if (pts.size === 1 && R.z > 1.02) {
      R.x = start.x + (e.clientX - start.px);
      R.y = start.y + (e.clientY - start.py);
      clampPan(); apply(false);
    }
  });
  const up = (e) => {
    if (!pts.has(e.pointerId)) return;
    const wasOne = pts.size === 1;
    pts.delete(e.pointerId);
    if (!start || !wasOne) { start = null; return; }
    const dx = e.clientX - start.px, dy = e.clientY - start.py;
    if (R.z <= 1.02 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(R.i + (dx < 0 ? 1 : -1));
    else if (Math.hypot(dx, dy) < 8 && Date.now() - start.t < 250) {
      const now = Date.now();
      if (now - lastTap < 320) { const r = desk.getBoundingClientRect(); R.z > 1.05 ? fit() : zoomAt(2.5, e.clientX - r.left, e.clientY - r.top); lastTap = 0; }
      else lastTap = now;
    }
    start = null;
  };
  desk.addEventListener("pointerup", up);
  desk.addEventListener("pointercancel", up);
}

buildStand();
wire();
countdown();
if (location.hash === "#read") open(0);
