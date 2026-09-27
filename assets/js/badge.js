/* ==========================================================================
   Hanging ID badge — Verlet rope + rigid card, draggable, throwable, flippable
   No dependencies. Runs only while the hero is on screen.
   ========================================================================== */
(() => {
  "use strict";

  const stage = document.getElementById("badgeStage");
  const card = document.getElementById("idCard");
  const inner = card && card.querySelector(".id-card-inner");
  const strapPath = document.getElementById("strapPath");
  const strapEdge = document.getElementById("strapEdge");
  const svg = document.getElementById("lanyard");
  if (!stage || !card || !inner || !strapPath) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    card.style.touchAction = "pan-y"; // let people scroll past it on phones
    const hint = stage.querySelector(".badge-hint");
    if (hint) hint.textContent = "Swipe the badge sideways · tap to flip";
  }

  /* ---------- config ---------- */
  const SEGMENTS = 14;
  const GRAVITY = 2400;          // px / s²
  const STEP = 1 / 120;          // fixed physics step
  const ITER = 14;               // constraint iterations
  const ROPE_DAMP = 0.988;
  const CARD_DAMP = 0.989;
  const RING = 21;               // px from card top up to the ring centre

  /* ---------- state ---------- */
  let W = 0, H = 0, cardW = 0, cardH = 0;
  let anchor = { x: 0, y: -40 };
  let segLen = 20;
  let cardLen = 0;
  const rope = [];               // rope points, rope[SEGMENTS] is the clip
  let bottom = null;             // bottom-centre of the card
  let drag = null;               // { t, x, y, id }
  let pressed = null;
  let flip = 0, flipV = 0, flipTarget = 0;
  let tilt = 0;
  let running = false, visible = true, raf = 0, last = 0, acc = 0, clock = 0;

  const pt = (x, y, inv = 1) => ({ x, y, px: x, py: y, inv });

  /* ---------- layout ---------- */
  function measure() {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    cardW = card.offsetWidth; cardH = card.offsetHeight;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const mobile = window.innerWidth <= 860;
    anchor = { x: W * 0.5, y: -40 };
    const bottomPad = mobile ? 74 : 170;
    const clipY = Math.max(70, Math.min(H * (mobile ? 0.5 : 0.25), H - cardH - RING - bottomPad));
    segLen = (clipY - anchor.y) / SEGMENTS;
    cardLen = RING + cardH;
  }

  function place(angleDeg) {
    // lay the rope + card out in a straight line at an angle from vertical
    const a = (angleDeg * Math.PI) / 180;
    const dx = Math.sin(a), dy = Math.cos(a);
    rope.length = 0;
    for (let i = 0; i <= SEGMENTS; i++) {
      rope.push(pt(anchor.x + dx * segLen * i, anchor.y + dy * segLen * i, i === 0 ? 0 : 1));
    }
    const c = rope[SEGMENTS];
    bottom = pt(c.x + dx * cardLen, c.y + dy * cardLen, 0.22);
  }

  /* ---------- physics ---------- */
  function integrate(p, damp, fx, fy) {
    if (!p.inv) return;
    let vx = (p.x - p.px) * damp;
    let vy = (p.y - p.py) * damp;
    const max = 70;
    const v = Math.hypot(vx, vy);
    if (v > max) { vx *= max / v; vy *= max / v; }
    p.px = p.x; p.py = p.y;
    p.x += vx + fx * STEP * STEP;
    p.y += vy + (GRAVITY + fy) * STEP * STEP;
  }

  function solve(a, b, len, rigid) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 0.0001;
    if (!rigid && d <= len) return; // straps go slack, they do not push
    const w = a.inv + b.inv;
    if (!w) return;
    const diff = (d - len) / d;
    a.x += dx * diff * (a.inv / w); a.y += dy * diff * (a.inv / w);
    b.x -= dx * diff * (b.inv / w); b.y -= dy * diff * (b.inv / w);
  }

  function pin() {
    if (!drag) return;
    const c = rope[SEGMENTS];
    const t = drag.t;
    const px = c.x + (bottom.x - c.x) * t;
    const py = c.y + (bottom.y - c.y) * t;
    const dx = drag.x - px, dy = drag.y - py;
    const s = 1 / ((1 - t) * (1 - t) + t * t);
    c.x += dx * (1 - t) * s; c.y += dy * (1 - t) * s;
    bottom.x += dx * t * s; bottom.y += dy * t * s;
  }

  function step() {
    clock += STEP;
    const breeze = drag ? 0 : Math.sin(clock * 0.8) * 60 + Math.sin(clock * 2.1) * 22;
    for (let i = 1; i <= SEGMENTS; i++) integrate(rope[i], ROPE_DAMP, breeze * 0.3, 0);
    integrate(bottom, CARD_DAMP, breeze, 0);

    for (let k = 0; k < ITER; k++) {
      rope[0].x = anchor.x; rope[0].y = anchor.y;
      for (let i = 0; i < SEGMENTS; i++) solve(rope[i], rope[i + 1], segLen, false);
      solve(rope[SEGMENTS], bottom, cardLen, true);
      pin();
    }

    // flip spring
    flipV += ((flipTarget - flip) * 170 - flipV * 15) * STEP;
    flip += flipV * STEP;
  }

  /* ---------- render ---------- */
  function strapD() {
    let d = `M ${rope[0].x.toFixed(1)} ${rope[0].y.toFixed(1)}`;
    for (let i = 1; i < SEGMENTS; i++) {
      const mx = (rope[i].x + rope[i + 1].x) / 2;
      const my = (rope[i].y + rope[i + 1].y) / 2;
      d += ` Q ${rope[i].x.toFixed(1)} ${rope[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    const e = rope[SEGMENTS];
    d += ` L ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
    return d;
  }

  function render() {
    const c = rope[SEGMENTS];
    const ax = bottom.x - c.x, ay = bottom.y - c.y;
    const len = Math.hypot(ax, ay) || 1;
    const ux = ax / len, uy = ay / len;
    const angle = Math.atan2(ax, ay);                     // 0 = hanging straight down
    const topX = c.x + ux * RING, topY = c.y + uy * RING;

    const vx = bottom.x - bottom.px;
    tilt += (Math.max(-38, Math.min(38, vx * 2.2)) - tilt) * 0.12;

    card.style.transform =
      `translate3d(${(topX - cardW / 2).toFixed(2)}px, ${topY.toFixed(2)}px, 0) rotate(${(-angle).toFixed(4)}rad)`;
    inner.style.setProperty("--flip", `${flip.toFixed(2)}deg`);
    inner.style.setProperty("--tilt", `${tilt.toFixed(2)}deg`);
    const deg = (angle * 180) / Math.PI;
    card.style.setProperty("--sheen-x", `${(55 + deg * 2.4 + tilt * 1.2).toFixed(1)}%`);
    card.style.setProperty("--sheen-a", `${(deg * 0.6).toFixed(1)}deg`);

    const d = strapD();
    strapPath.setAttribute("d", d);
    strapEdge.setAttribute("d", d);
  }

  /* ---------- loop ---------- */
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    acc += dt;
    while (acc >= STEP) { step(); acc -= STEP; }
    render();
  }
  function start() {
    if (running || reduced) return;
    running = true; last = performance.now(); acc = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function sync() { (visible && !document.hidden) ? start() : stop(); }

  /* ---------- input ---------- */
  const toStage = (e) => {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const projectT = (p) => {
    const c = rope[SEGMENTS];
    const ax = bottom.x - c.x, ay = bottom.y - c.y;
    const t = ((p.x - c.x) * ax + (p.y - c.y) * ay) / (ax * ax + ay * ay);
    return Math.max(0.08, Math.min(1, t));
  };

  card.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (e.pointerType === "mouse") e.preventDefault(); // no text selection while dragging
    const p = toStage(e);
    pressed = { x: e.clientX, y: e.clientY, id: e.pointerId, t: projectT(p), p };
  });

  window.addEventListener("pointermove", (e) => {
    if (!pressed || e.pointerId !== pressed.id) return;
    const moved = Math.hypot(e.clientX - pressed.x, e.clientY - pressed.y);
    if (!drag && moved > 5 && !reduced) {
      drag = { t: pressed.t, ...toStage(e) };
      card.classList.add("is-dragging");
      try { card.setPointerCapture(e.pointerId); } catch (_) {}
      start();
    }
    if (drag) { const p = toStage(e); drag.x = p.x; drag.y = p.y; }
  }, { passive: true });

  const release = (e) => {
    if (!pressed || (e && e.pointerId !== pressed.id)) return;
    const wasDrag = !!drag;
    drag = null; pressed = null;
    card.classList.remove("is-dragging");
    if (!wasDrag && e && e.type === "pointerup") toggleFlip();
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);

  // brushing past the card gives it a little push
  stage.addEventListener("pointermove", (e) => {
    if (drag || pressed || reduced || e.pointerType !== "mouse") return;
    const k = 0.06;
    bottom.px -= e.movementX * k;
    bottom.py -= e.movementY * k * 0.3;
  });

  function toggleFlip() {
    flipTarget = flipTarget ? 0 : 180;
    card.setAttribute("aria-pressed", String(!!flipTarget));
    if (reduced) { flip = flipTarget; render(); }
    else start();
  }
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleFlip(); }
    if (!reduced && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      bottom.px += e.key === "ArrowLeft" ? 14 : -14;
    }
  });

  /* ---------- boot ---------- */
  function boot() {
    measure();
    if (reduced) { place(0); render(); return; }
    place(-48); // enter with a swing from the left
    render();
  }

  const img = card.querySelector("img");
  const go = () => {
    boot();
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting; sync();
    }).observe(stage);
    document.addEventListener("visibilitychange", sync);
    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const prevW = W;
        measure();
        if (Math.abs(prevW - W) > 1 || reduced) { place(reduced ? 0 : -8); render(); }
      }, 120);
    });
  };
  if (img && !img.complete) {
    let done = false;
    const once = () => { if (!done) { done = true; go(); } };
    img.addEventListener("load", once, { once: true });
    img.addEventListener("error", once, { once: true });
    setTimeout(once, 1500);
  } else go();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (rope.length) { measure(); } });
})();
