/* ==========================================================================
   Chaïma Ouerghi — Portfolio interactions
   Language (EN/FR) · theme · header · reveals · badge · case-study tabs ·
   work index · command menu · copy email · vCard · CV · local time
   ========================================================================== */
(() => {
  "use strict";
  const doc = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
  };

  /* ---------- strings used from script ---------- */
  const T = {
    en: {
      title: "Chaïma Ouerghi · AI Engineer",
      copied: "Email copied", copyFail: "Copy failed. Email: shaymaouerghi0@gmail.com",
      copy: "Copy", copyEmail: "Copy email", copiedShort: "Copied",
      vcard: "Contact card downloaded",
      toLight: "Switch to light theme", toDark: "Switch to dark theme",
      flipFront: "ID badge of Chaïma Ouerghi. Press to see the back.",
      flipBack: "Back of the ID badge. Press to see the front.",
      groups: { nav: "Go to", act: "Actions", links: "Links" },
      empty: "No results",
      cmd: {
        profile: "Profile", case: "Case study: SpiriCom", work: "Selected work", exp: "Experience",
        cap: "Capabilities", edu: "Education", contact: "Contact",
        copy: "Copy email address", vcf: "Save contact card (.vcf)", cv: "Download CV",
        theme: "Toggle light / dark theme", lang: "Afficher en français", print: "Print or save as PDF",
        gh: "Open GitHub", li: "Open LinkedIn", repo: "Open SpiriCom repository",
      },
    },
    fr: {
      title: "Chaïma Ouerghi · Ingénieure IA",
      copied: "Email copié", copyFail: "Copie impossible. Email : shaymaouerghi0@gmail.com",
      copy: "Copier", copyEmail: "Copier l’email", copiedShort: "Copié",
      vcard: "Fiche contact téléchargée",
      toLight: "Passer au thème clair", toDark: "Passer au thème sombre",
      flipFront: "Badge de Chaïma Ouerghi. Appuyez pour voir le verso.",
      flipBack: "Verso du badge. Appuyez pour voir le recto.",
      groups: { nav: "Aller à", act: "Actions", links: "Liens" },
      empty: "Aucun résultat",
      cmd: {
        profile: "Profil", case: "Étude de cas : SpiriCom", work: "Projets", exp: "Expérience",
        cap: "Compétences", edu: "Formation", contact: "Contact",
        copy: "Copier l’adresse email", vcf: "Enregistrer la fiche contact (.vcf)", cv: "Télécharger le CV",
        theme: "Basculer thème clair / sombre", lang: "Show in English", print: "Imprimer ou enregistrer en PDF",
        gh: "Ouvrir GitHub", li: "Ouvrir LinkedIn", repo: "Ouvrir le dépôt SpiriCom",
      },
    },
  };
  let lang = "en";
  const t = () => T[lang];

  /* ---------- language ---------- */
  function setLang(next, save) {
    lang = next === "fr" ? "fr" : "en";
    doc.lang = lang;
    $$("[data-fr]").forEach((el) => {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      el.innerHTML = lang === "fr" ? el.dataset.fr : el.dataset.en;
    });
    $$("[data-fr-aria-label]").forEach((el) => {
      if (el.dataset.enAria === undefined) el.dataset.enAria = el.getAttribute("aria-label") || "";
      el.setAttribute("aria-label", lang === "fr" ? el.dataset.frAriaLabel : el.dataset.enAria);
    });
    $$("[data-fr-placeholder]").forEach((el) => {
      if (el.dataset.enPh === undefined) el.dataset.enPh = el.getAttribute("placeholder") || "";
      el.setAttribute("placeholder", lang === "fr" ? el.dataset.frPlaceholder : el.dataset.enPh);
    });
    document.title = t().title;
    updateThemeLabel();
    updateBadgeLabel();
    if (save) store.set("co-lang", lang);
    if (!cmdk.hidden) renderCmdk();
  }

  /* ---------- theme ---------- */
  const themeBtn = $("#themeToggle");
  function updateThemeLabel() {
    const dark = doc.getAttribute("data-theme") !== "light";
    themeBtn.setAttribute("aria-label", dark ? t().toLight : t().toDark);
  }
  function toggleTheme() {
    const next = doc.getAttribute("data-theme") === "light" ? "dark" : "light";
    doc.setAttribute("data-theme", next);
    store.set("co-theme", next);
    updateThemeLabel();
  }
  themeBtn.addEventListener("click", toggleTheme);
  $("#langToggle").addEventListener("click", () => setLang(lang === "fr" ? "en" : "fr", true));

  /* ---------- header + progress ---------- */
  const header = $("#siteHeader"), progress = $("#progress");
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("is-scrolled", y > 8);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- nav ---------- */
  const nav = $("#nav"), navToggle = $("#navToggle");
  const setMenu = (open) => { nav.classList.toggle("is-open", open); navToggle.setAttribute("aria-expanded", String(open)); };
  navToggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("click", (e) => { if (nav.classList.contains("is-open") && !nav.contains(e.target) && !navToggle.contains(e.target)) setMenu(false); });

  const links = $$(".nav-link", nav);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${id}`));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  ["top", "profile", "case-study", "work", "experience", "capabilities", "education", "contact"]
    .map((id) => document.getElementById(id)).filter(Boolean).forEach((s) => spy.observe(s));

  /* ---------- reveals ---------- */
  const reveals = $$(".reveal");
  if (!doc.classList.contains("motion")) reveals.forEach((el) => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- badge: still, tiny hover tilt, click to flip ---------- */
  const card = $("#badgeCard");
  const inner = card && $(".card-inner", card);
  function updateBadgeLabel() {
    if (card) card.setAttribute("aria-label", card.classList.contains("is-flipped") ? t().flipBack : t().flipFront);
  }
  if (card) {
    card.addEventListener("click", () => {
      card.classList.toggle("is-flipped");
      card.setAttribute("aria-pressed", String(card.classList.contains("is-flipped")));
      updateBadgeLabel();
    });
    if (fine && !reduced) {
      const MAX = 3; // degrees: deliberately subtle
      card.addEventListener("pointerenter", () => card.classList.add("is-tracking"));
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.setProperty("--ry", `${(px * MAX * 2).toFixed(2)}deg`);
        inner.style.setProperty("--rx", `${(-py * MAX * 2).toFixed(2)}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-tracking");
        inner.style.setProperty("--ry", "0deg"); inner.style.setProperty("--rx", "0deg");
      });
    }
  }

  /* ---------- case-study tabs ---------- */
  const tabs = $$('#caseTabs [role="tab"]');
  const selectTab = (tab, focus) => {
    tabs.forEach((tb) => {
      const on = tb === tab;
      tb.setAttribute("aria-selected", String(on));
      tb.tabIndex = on ? 0 : -1;
      document.getElementById(tb.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tb, i) => {
    tb.addEventListener("click", () => selectTab(tb));
    tb.addEventListener("keydown", (e) => {
      let j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") j = 0;
      if (e.key === "End") j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); selectTab(tabs[j], true); }
    });
  });

  /* ---------- work index: filter + expand ---------- */
  const rows = $$("#workIndex .row");
  const countEl = $("#workCount");
  rows.forEach((row) => {
    const head = $(".row-head", row), body = $(".row-body", row);
    head.addEventListener("click", () => {
      const open = !row.classList.contains("is-open");
      row.classList.toggle("is-open", open);
      head.setAttribute("aria-expanded", String(open));
      body.inert = !open;
    });
  });
  $$(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const f = chip.dataset.filter;
      $$(".chip").forEach((c) => { const on = c === chip; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", String(on)); });
      let n = 0;
      rows.forEach((row) => {
        const show = f === "all" || row.dataset.cat.split(" ").includes(f);
        row.classList.toggle("is-out", !show);
        if (show) n++;
      });
      countEl.textContent = n;
    });
  });

  /* ---------- toast ---------- */
  const toast = $("#toast"); let toastT;
  const say = (msg) => { toast.textContent = msg; toast.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("is-on"), 2200); };

  /* ---------- copy email ---------- */
  const EMAIL = "shaymaouerghi0@gmail.com";
  async function copyEmail(btn) {
    try {
      await navigator.clipboard.writeText(EMAIL);
      say(t().copied);
      const label = btn && $(".copy-label", btn);
      if (label) { const prev = label.innerHTML; label.textContent = t().copiedShort; setTimeout(() => { label.innerHTML = prev; }, 1600); }
    } catch (_) { say(t().copyFail); }
  }
  $$(".copy-email").forEach((b) => b.addEventListener("click", () => copyEmail(b)));

  /* ---------- vCard ---------- */
  function saveVcard() {
    const v = [
      "BEGIN:VCARD", "VERSION:3.0", "N:Ouerghi;Chaïma;;;", "FN:Chaïma Ouerghi",
      "TITLE:AI Engineer & Full-Stack Developer", `EMAIL;TYPE=INTERNET:${EMAIL}`, "TEL;TYPE=CELL:+21693176660",
      "ADR;TYPE=HOME:;;;La Goulette;;;Tunisia",
      "URL:https://github.com/Ouerghi23", "URL:https://linkedin.com/in/OuerghiChaima", "END:VCARD",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([v], { type: "text/vcard;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "Chaima_Ouerghi.vcf" });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    say(t().vcard);
  }
  $("#vcardBtn").addEventListener("click", saveVcard);

  /* ---------- CV (button appears only if the PDF exists) ---------- */
  const cv = $("#cvLink"); let hasCv = false;
  if (cv && location.protocol.startsWith("http")) {
    fetch(cv.getAttribute("href"), { method: "HEAD" }).then((r) => { if (r.ok) { cv.hidden = false; hasCv = true; } }).catch(() => {});
  }

  /* ---------- local time ---------- */
  const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Tunis" });
  const tick = () => $$(".js-time").forEach((el) => { el.textContent = fmt.format(new Date()); });
  tick(); setInterval(tick, 20000);

  /* ---------- command menu ---------- */
  const cmdk = $("#cmdk"), input = $("#cmdkInput"), list = $("#cmdkList");
  const kbdLabel = isMac ? "⌘K" : "Ctrl K";
  $$("#cmdkKbd, .js-kbd").forEach((k) => { k.textContent = kbdLabel; });
  const go = (id) => () => document.getElementById(id).scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  const open = (href) => () => window.open(href, "_blank", "noopener");
  const commands = () => {
    const c = t().cmd, g = t().groups;
    const items = [
      { g: g.nav, k: "profile", run: go("profile") },
      { g: g.nav, k: "case", run: go("case-study") },
      { g: g.nav, k: "work", run: go("work") },
      { g: g.nav, k: "exp", run: go("experience") },
      { g: g.nav, k: "cap", run: go("capabilities") },
      { g: g.nav, k: "edu", run: go("education") },
      { g: g.nav, k: "contact", run: go("contact") },
      { g: g.act, k: "copy", run: () => copyEmail(null), hint: EMAIL },
      { g: g.act, k: "vcf", run: saveVcard },
      ...(hasCv ? [{ g: g.act, k: "cv", run: () => cv.click() }] : []),
      { g: g.act, k: "theme", run: toggleTheme },
      { g: g.act, k: "lang", run: () => setLang(lang === "fr" ? "en" : "fr", true), hint: lang === "fr" ? "EN" : "FR" },
      { g: g.act, k: "print", run: () => window.print() },
      { g: g.links, k: "gh", run: open("https://github.com/Ouerghi23"), hint: "github.com" },
      { g: g.links, k: "li", run: open("https://linkedin.com/in/OuerghiChaima"), hint: "linkedin.com" },
      { g: g.links, k: "repo", run: open("https://github.com/Ouerghi23/SpiriCom"), hint: "github.com" },
    ];
    return items.map((it) => ({ ...it, label: c[it.k] }));
  };
  let shown = [], active = 0, lastFocus = null;

  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  function renderCmdk() {
    const q = norm(input.value.trim());
    shown = commands().filter((c) => !q || norm(`${c.label} ${c.g} ${c.hint || ""}`).includes(q));
    active = Math.min(active, Math.max(0, shown.length - 1));
    list.innerHTML = "";
    if (!shown.length) {
      const li = document.createElement("li"); li.className = "cmdk-empty"; li.textContent = t().empty; list.appendChild(li);
      input.removeAttribute("aria-activedescendant"); return;
    }
    let group = null;
    shown.forEach((c, i) => {
      if (c.g !== group) {
        group = c.g;
        const gh = document.createElement("li"); gh.className = "cmdk-group"; gh.setAttribute("role", "presentation"); gh.textContent = group; list.appendChild(gh);
      }
      const li = document.createElement("li");
      li.className = "cmdk-item"; li.id = `cmd-${i}`; li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === active));
      li.innerHTML = `<span></span>${c.hint ? "<small></small>" : ""}`;
      li.firstChild.textContent = c.label;
      if (c.hint) li.lastChild.textContent = c.hint;
      li.addEventListener("pointermove", () => { if (active !== i) { active = i; paint(); } });
      li.addEventListener("click", () => runCmd(i));
      list.appendChild(li);
    });
    paint();
  }
  function paint() {
    $$(".cmdk-item", list).forEach((li, i) => li.setAttribute("aria-selected", String(i === active)));
    const cur = document.getElementById(`cmd-${active}`);
    if (cur) { input.setAttribute("aria-activedescendant", cur.id); cur.scrollIntoView({ block: "nearest" }); }
  }
  function runCmd(i) { const c = shown[i]; if (!c) return; closeCmdk(); setTimeout(c.run, 10); }
  function openCmdk() {
    lastFocus = document.activeElement;
    cmdk.hidden = false; input.value = ""; active = 0; renderCmdk();
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => input.focus());
  }
  function closeCmdk() {
    cmdk.hidden = true; document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $("#cmdkOpen").addEventListener("click", openCmdk);
  $$("[data-close]", cmdk).forEach((el) => el.addEventListener("click", closeCmdk));
  input.addEventListener("input", () => { active = 0; renderCmdk(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % Math.max(1, shown.length); paint(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + shown.length) % Math.max(1, shown.length); paint(); }
    else if (e.key === "Enter") { e.preventDefault(); runCmd(active); }
    else if (e.key === "Tab") { e.preventDefault(); } // keep focus inside the dialog
  });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); cmdk.hidden ? openCmdk() : closeCmdk(); return; }
    if (e.key === "Escape") { if (!cmdk.hidden) closeCmdk(); else setMenu(false); }
    if (e.key === "/" && cmdk.hidden && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openCmdk(); }
  });

  /* ---------- boot ---------- */
  const saved = store.get("co-lang") || doc.getAttribute("data-lang-pending");
  doc.removeAttribute("data-lang-pending");
  setLang(saved === "fr" ? "fr" : "en", false);
})();
