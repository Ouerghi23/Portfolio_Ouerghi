/* ==========================================================================
   Interactions: header, nav, reveals, counters, magnetic buttons,
   spotlight cards, project filters, timeline progress, copy email, clock.
   ========================================================================== */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  window.__revealReady = true;

  /* ---------- header state + progress ---------- */
  const header = document.getElementById("siteHeader");
  const progress = document.getElementById("progress");
  const timeline = document.getElementById("timeline");
  const timelineFill = document.getElementById("timelineFill");
  let ticking = false;

  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    if (timeline && timelineFill && root.classList.contains("motion")) {
      const r = timeline.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      timelineFill.style.setProperty("--p", p.toFixed(3));
    }
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- nav: mobile toggle ---------- */
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- nav: sliding active indicator ---------- */
  const indicator = document.getElementById("navIndicator");
  const links = [...nav.querySelectorAll(".nav-link")];
  const moveIndicator = (link) => {
    if (!indicator) return;
    if (!link) { indicator.style.opacity = "0"; return; }
    indicator.style.opacity = "1";
    indicator.style.width = `${link.offsetWidth}px`;
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
  };
  const sectionIds = links.map((l) => l.getAttribute("href").slice(1));
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  let current = null;
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) current = en.target.id; });
    const top = window.scrollY < window.innerHeight * 0.5;
    links.forEach((l) => l.classList.toggle("is-active", !top && l.getAttribute("href") === `#${current}`));
    moveIndicator(top ? null : links.find((l) => l.classList.contains("is-active")));
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));
  window.addEventListener("resize", () => moveIndicator(links.find((l) => l.classList.contains("is-active"))));

  /* ---------- scroll reveal with sibling stagger ---------- */
  const reveals = [...document.querySelectorAll("[data-reveal]")];
  const groups = new Map();
  reveals.forEach((el) => {
    const g = el.parentElement;
    const i = groups.get(g) || 0;
    el.style.setProperty("--i", Math.min(i, 6));
    groups.set(g, i + 1);
  });
  if (!root.classList.contains("motion")) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (!reduced) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        co.unobserve(el);
        const target = +el.dataset.count;
        const suffix = el.dataset.suffix || "";
        const t0 = performance.now(), dur = 1600;
        const tick = (now) => {
          const k = Math.min(1, (now - t0) / dur);
          const e = 1 - Math.pow(1 - k, 4);
          el.textContent = Math.round(target * e) + suffix;
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => co.observe(el));
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      const strength = el.classList.contains("email-big") ? 0.12 : 0.28;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transition = "transform .2s cubic-bezier(.16,1,.3,1)";
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform .7s cubic-bezier(.16,1,.3,1)";
        el.style.transform = "";
      });
    });
  }

  /* ---------- spotlight cards ---------- */
  if (finePointer) {
    document.querySelectorAll(".spotlight").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- project filters ---------- */
  const filters = [...document.querySelectorAll(".filter")];
  const projects = [...document.querySelectorAll(".project")];
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      filters.forEach((b) => { const on = b === btn; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", String(on)); });
      const show = projects.filter((p) => f === "all" || p.dataset.cat.split(" ").includes(f));
      const hide = projects.filter((p) => !show.includes(p));
      if (reduced) {
        hide.forEach((p) => p.classList.add("is-hidden"));
        show.forEach((p) => p.classList.remove("is-hidden"));
        return;
      }
      projects.forEach((p) => { p.style.opacity = "0"; p.style.transform = "translateY(12px) scale(.985)"; });
      setTimeout(() => {
        hide.forEach((p) => p.classList.add("is-hidden"));
        show.forEach((p, i) => {
          p.classList.remove("is-hidden");
          p.classList.add("is-in");
          p.style.transitionDelay = `${i * 50}ms`;
          requestAnimationFrame(() => requestAnimationFrame(() => { p.style.opacity = ""; p.style.transform = ""; }));
          setTimeout(() => { p.style.transitionDelay = ""; }, 700 + i * 50);
        });
      }, 260);
    });
  });

  /* ---------- marquee: duplicate the list for a seamless loop ---------- */
  document.querySelectorAll(".marquee-track").forEach((track) => {
    const list = track.querySelector(".marquee-list");
    if (!list) return;
    const clone = list.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });

  /* ---------- copy email + toast ---------- */
  const toast = document.getElementById("toast");
  let toastTimer;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2200);
  };
  document.querySelectorAll(".copy-email").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const email = btn.dataset.email;
      const label = btn.querySelector(".copy-label");
      const original = label ? label.textContent : "";
      try {
        await navigator.clipboard.writeText(email);
        say("Email copied to clipboard");
        if (label) { label.textContent = "Copied"; setTimeout(() => { label.textContent = original; }, 1800); }
      } catch (_) {
        window.location.href = `mailto:${email}`;
      }
    });
  });

  /* ---------- CV button: only shown if the PDF exists ---------- */
  const cv = document.getElementById("cvLink");
  if (cv && location.protocol.startsWith("http")) {
    fetch(cv.getAttribute("href"), { method: "HEAD" })
      .then((r) => { if (r.ok) cv.hidden = false; })
      .catch(() => {});
  }

  /* ---------- local time in Tunis ---------- */
  const timeEl = document.getElementById("localTime");
  if (timeEl) {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Tunis" });
    const tick = () => { timeEl.textContent = fmt.format(new Date()); };
    tick(); setInterval(tick, 30000);
  }
})();
