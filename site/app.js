/* Best Cement — CIRP information site
   3D plant scene (Three.js) + scroll story + page interactions. */

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js");

/* ------------------------------------------------------------------ */
/* Page interactions                                                   */
/* ------------------------------------------------------------------ */

// Keep --header-h equal to the real sticky header height (notice + bar)
const headerEl = document.getElementById("header");
function syncHeader() {
  if (headerEl) document.documentElement.style.setProperty("--header-h", headerEl.offsetHeight + "px");
}
syncHeader();
window.addEventListener("resize", syncHeader);
if (document.fonts) document.fonts.ready.then(syncHeader);

// Mobile navigation sheet
const navToggle = document.getElementById("menu");
const mainNav = document.getElementById("nav");
function setMenu(open) {
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  mainNav.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
}
if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => setMenu(navToggle.getAttribute("aria-expanded") !== "true"));
  mainNav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", () => setMenu(false));
}

// Active nav link + mobile quick-action bar
const actionBar = document.getElementById("actionbar");
const navLinks = [...document.querySelectorAll(".nav a")];
const navTargets = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);

function onScrollPage() {
  const storyEl = document.getElementById("top");
  if (actionBar && storyEl) {
    const past = storyEl.getBoundingClientRect().bottom < window.innerHeight * 0.6;
    const claims = document.getElementById("claims").getBoundingClientRect();
    const atClaims = claims.top < window.innerHeight && claims.bottom > 0;
    actionBar.classList.toggle("is-shown", past && !atClaims);
  }

  const probe = window.innerHeight * 0.3;
  let current = null;
  for (const sec of navTargets) {
    if (sec.getBoundingClientRect().top <= probe) current = sec.id;
  }
  navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + current));
}
window.addEventListener("scroll", onScrollPage, { passive: true });
onScrollPage();

// Reveal on scroll
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-in"));
}

// Smooth open/close for <details>
function animateDetails(details) {
  const summary = details.querySelector("summary");
  const body = [...details.children].filter((c) => c !== summary);
  if (!summary || !body.length || reduceMotion) return;
  let anim = null;
  summary.addEventListener("click", (e) => {
    e.preventDefault();
    if (anim) anim.cancel();
    const start = details.offsetHeight;
    if (details.open) {
      const end = summary.offsetHeight;
      anim = details.animate({ height: [start + "px", end + "px"] }, { duration: 280, easing: "ease-out" });
      anim.onfinish = () => { details.open = false; anim = null; details.style.height = ""; };
    } else {
      details.style.height = start + "px";
      details.open = true;
      const end = details.scrollHeight;
      anim = details.animate({ height: [start + "px", end + "px"] }, { duration: 320, easing: "ease-out" });
      anim.onfinish = () => { anim = null; details.style.height = ""; };
    }
  });
}
document.querySelectorAll("details").forEach((d) => { d.style.overflow = "hidden"; animateDetails(d); });

// Expand / collapse all
document.querySelectorAll("[data-toggle-all]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const group = document.querySelector(`[data-group="${btn.dataset.toggleAll}"]`);
    if (!group) return;
    const items = [...group.querySelectorAll("details")];
    const openAll = items.some((d) => !d.open);
    items.forEach((d) => { d.open = openAll; });
    btn.textContent = openAll ? "Close all" : "Open all";
  });
});

// Open an issue when linked directly (e.g. /#issue-3)
function openFromHash() {
  const el = location.hash && document.querySelector(location.hash);
  if (el && el.tagName === "DETAILS") el.open = true;
}
window.addEventListener("hashchange", openFromHash);
openFromHash();

/* ------------------------------------------------------------------ */
/* Scroll story                                                        */
/* ------------------------------------------------------------------ */

const story = document.getElementById("top");
const steps = [...document.querySelectorAll(".step")];
const dots = [...document.querySelectorAll(".dots i")];
let storyProgress = 0; // 0 → 1 across the story section

function onScrollStory() {
  if (!story) return;
  const r = story.getBoundingClientRect();
  const total = story.offsetHeight - window.innerHeight;
  storyProgress = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
  story.classList.toggle("is-scrolled", storyProgress > 0.02);

  const mid = window.innerHeight * 0.55;
  let active = 0;
  steps.forEach((s, i) => { if (s.getBoundingClientRect().top < mid) active = i; });
  steps.forEach((s, i) => s.classList.toggle("is-active", i === active));
  dots.forEach((d, i) => d.classList.toggle("is-on", i === active));
}
window.addEventListener("scroll", onScrollStory, { passive: true });
window.addEventListener("resize", onScrollStory);
onScrollStory();

/* ------------------------------------------------------------------ */
/* 3D plant                                                            */
/* ------------------------------------------------------------------ */

async function initPlant() {
  const canvas = document.getElementById("plant");
  const stage = document.getElementById("stage");
  if (!canvas || !stage) return;

  let THREE;
  try {
    THREE = await import(THREE_URL);
  } catch (err) {
    stage.classList.add("no-webgl");
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (err) {
    stage.classList.add("no-webgl");
    return;
  }

  const BG = 0x0f1d38;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(BG, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 90, 230);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 600);

  // Lights
  const hemi = new THREE.HemisphereLight(0xdfe6ee, 0x1a1c20, 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0e0, 2.5);
  sun.position.set(-60, 80, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80; sc.near = 10; sc.far = 260;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x8fa6c4, 0.6);
  rim.position.set(70, 30, -60);
  scene.add(rim);

  // Materials
  const mat = (color, rough = 0.9, metal = 0.0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const M = {
    concrete: mat(0xdfe3ea),
    concreteDark: mat(0xb4bcc9),
    steel: mat(0x2b5193, 0.55, 0.35),
    steelDark: mat(0x1f3d72, 0.6, 0.35),
    kiln: mat(0xe28541, 0.55, 0.25),
    roof: mat(0x2b5193, 0.7, 0.2),
    ground: mat(0x132446, 1),
  };


  const plant = new THREE.Group();
  scene.add(plant);

  function add(geo, material, x, y, z, opts = {}) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    if (opts.rx) m.rotation.x = opts.rx;
    if (opts.ry) m.rotation.y = opts.ry;
    if (opts.rz) m.rotation.z = opts.rz;
    m.castShadow = true;
    m.receiveShadow = true;
    (opts.parent || plant).add(m);
    return m;
  }
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rt, rb, h, s = 28) => new THREE.CylinderGeometry(rt, rb, h, s);

  // Ground
  const ground = new THREE.Mesh(new THREE.CircleGeometry(160, 64), M.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Plant pad
  add(box(110, 0.6, 64), mat(0x1b3058, 1), 6, 0.3, -4);

  // --- Preheater tower ---
  const towerX = -6, towerZ = 2;
  add(box(9, 4, 9), M.concreteDark, towerX, 2.6, towerZ);
  // open steel frame
  const legGeo = box(0.6, 34, 0.6);
  [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(([dx, dz]) => add(legGeo, M.steelDark, towerX + dx, 21.6, towerZ + dz, { edges: false }));
  for (let i = 0; i < 6; i++) add(box(9, 0.5, 9), M.steel, towerX, 8 + i * 5.6, towerZ);
  // cyclones
  const cyclone = (x, y, z, r) => {
    add(cyl(r, r, 3.2), M.concrete, x, y, z);
    add(cyl(r, 0.35, 3.4), M.concrete, x, y - 3.3, z);
  };
  cyclone(towerX - 2.4, 36, towerZ - 1.8, 1.7);
  cyclone(towerX + 2.4, 36, towerZ - 1.8, 1.7);
  cyclone(towerX - 2.2, 30.5, towerZ + 1.8, 1.9);
  cyclone(towerX + 2.2, 25, towerZ + 1.6, 2.0);
  cyclone(towerX - 2.2, 19.5, towerZ - 1.6, 2.1);
  // riser duct
  add(cyl(1.1, 1.1, 30), M.steel, towerX + 3.6, 21, towerZ + 3.4);
  add(box(10, 2.2, 10), M.roof, towerX, 40, towerZ);

  // --- Rotary kiln ---
  const kilnGroup = new THREE.Group();
  kilnGroup.position.set(towerX + 22, 5.8, towerZ);
  kilnGroup.rotation.z = -0.04;
  plant.add(kilnGroup);
  const kiln = add(cyl(1.9, 1.9, 36, 36), M.kiln, 0, 0, 0, { rz: Math.PI / 2, parent: kilnGroup });
  // tyres
  [-12, 0, 12].forEach((x) => add(cyl(2.25, 2.25, 0.8, 36), M.steelDark, x, 0, 0, { rz: Math.PI / 2, parent: kilnGroup, edges: false }));
  // piers
  [-12, 0, 12].forEach((x, i) => add(box(3, 4.6 + i * 0.5, 4.4), M.concreteDark, towerX + 22 + x, 2.3 + i * 0.25, towerZ));
  // kiln hood + cooler
  add(box(5, 7, 6), M.concrete, towerX + 42, 3.5, towerZ);
  add(box(12, 5, 8), M.concreteDark, towerX + 50, 2.5, towerZ);

  // --- Clinker silo ---
  add(cyl(7, 7, 18, 40), M.concrete, 60, 9, -8);
  add(cyl(1.6, 7, 4, 40), M.roof, 60, 20, -8);

  // --- Cement silos ---
  [16, 25, 34].forEach((x) => {
    add(cyl(3.6, 3.6, 24, 36), M.concrete, x, 12, -20);
    add(cyl(0.8, 3.6, 2.4, 36), M.roof, x, 25.2, -20);
  });
  add(box(26, 3, 5), M.steel, 25, 27, -20);

  // --- Packing plant & raw mill ---
  add(box(16, 10, 10), M.concreteDark, 25, 5, -33);
  add(box(16, 1, 11), M.roof, 25, 10.5, -33);
  add(box(14, 16, 14), M.concreteDark, -28, 8, -12);
  add(box(14.6, 1, 14.6), M.roof, -28, 16.5, -12);
  add(box(10, 9, 22), M.concrete, -26, 4.5, 18);

  // --- Stack ---
  add(cyl(1.1, 1.6, 48, 24), M.concrete, -20, 24, 10);
  add(cyl(1.15, 1.15, 2, 24), M.kiln, -20, 46, 10, { edges: false });

  // --- Conveyors ---
  const conveyor = (x1, y1, z1, x2, y2, z2, w = 1.4) => {
    const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2);
    const len = a.distanceTo(b);
    const g = box(w, 1.2, len);
    const m = new THREE.Mesh(g, M.steel);
    m.position.copy(a).lerp(b, 0.5);
    m.lookAt(b);
    m.castShadow = true;
    plant.add(m);
  };
  conveyor(-21, 15, -6, towerX - 4, 38, towerZ - 2);
  conveyor(towerX + 50, 4, towerZ - 4, 54, 18, -4);
  conveyor(56, 14, -12, 34, 25, -18);
  conveyor(25, 6, -22, 25, 6, -28, 1.2);

  // Ground cordon (appears as the story progresses)
  const cordon = new THREE.Mesh(
    new THREE.RingGeometry(78, 78.6, 128),
    new THREE.MeshBasicMaterial({ color: 0xe28541, transparent: true, opacity: 0, side: THREE.DoubleSide })
  );
  cordon.rotation.x = -Math.PI / 2;
  cordon.position.set(8, 0.08, -4);
  scene.add(cordon);

  // Stack plume
  const puffGeo = new THREE.SphereGeometry(1, 12, 10);
  const puffs = [];
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Mesh(puffGeo, new THREE.MeshStandardMaterial({ color: 0xe6eaf0, transparent: true, opacity: 0, roughness: 1, depthWrite: false }));
    p.userData.t = i / 14;
    scene.add(p);
    puffs.push(p);
  }

  // Sizing
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const mobile = w < 720;
    camera.fov = mobile ? 50 : 30;
    // Shift the rendered plant away from the text card:
    // to the right on desktop, upwards on phones.
    if (mobile) camera.setViewOffset(w, h, 0, h * 0.24, w, h);
    else camera.setViewOffset(w, h, -w * 0.17, h * 0.04, w, h);
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  // Visibility gating
  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop(); }, { threshold: 0 }).observe(stage);

  const warm = new THREE.Color(0xfff0e0), cold = new THREE.Color(0xa9bde0), tmp = new THREE.Color();
  const target = new THREE.Vector3();
  let smooth = 0, start = performance.now(), raf = 0;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);

  function frame(now) {
    const t = (now - start) / 1000;
    smooth += (storyProgress - smooth) * 0.06;
    const p = ease(smooth);

    // Camera: slow orbit, rising and pulling in as the story advances
    const angle = (reduceMotion ? 0 : t * 0.035) + 0.9 + p * 1.1;
    const radius = lerp(165, 150, p);
    const height = lerp(42, 98, p);
    const narrow = stage.clientWidth < 720 ? 1.05 : 1;
    target.set(8, lerp(14, 4, p), -4);
    camera.position.set(target.x + Math.cos(angle) * radius * narrow, height, target.z + Math.sin(angle) * radius * narrow);
    camera.lookAt(target);

    // Light: warm working light cooling to an administrative grey
    sun.color.copy(tmp.copy(warm).lerp(cold, p));
    sun.intensity = lerp(2.5, 1.4, p);
    hemi.intensity = lerp(0.55, 0.42, p);
    cordon.material.opacity = Math.max(0, (p - 0.45) / 0.55) * 0.9;

    // Kiln rotation
    if (!reduceMotion) kiln.rotation.y = t * 0.6;

    // Plume
    puffs.forEach((pf) => {
      const k = (pf.userData.t + t * 0.05) % 1;
      pf.position.set(-20 + k * 14, 48 + k * 16, 10 - k * 6);
      const s = 0.8 + k * 3.4;
      pf.scale.set(s, s, s);
      pf.material.opacity = Math.sin(k * Math.PI) * 0.22;
    });

    renderer.render(scene, camera);
  }

  function loop() {
    cancelAnimationFrame(raf);
    const tick = (now) => {
      frame(now);
      if (visible) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  loop();
}

initPlant();
