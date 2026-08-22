(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* -----------------------------------------------------------------------
     Header state on scroll + progress bar
     ----------------------------------------------------------------------- */
  const header = document.getElementById("siteHeader");
  const progressBar = document.getElementById("progressBar");

  const onScroll = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    header.classList.toggle("scrolled", scrollY > 40);

    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
    progressBar.style.width = progress + "%";
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* -----------------------------------------------------------------------
     Mobile nav toggle
     ----------------------------------------------------------------------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* -----------------------------------------------------------------------
     Active nav link tracking
     ----------------------------------------------------------------------- */
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle(
        "is-active",
        link.getAttribute("href") === `#${id}`
      );
    });
  };

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => navObserver.observe(section));

  /* -----------------------------------------------------------------------
     Scroll reveal
     ----------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const delay = el.dataset.delay || 0;
          el.style.setProperty("--reveal-delay", `${delay}ms`);
          el.classList.add("is-visible");
          observer.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* -----------------------------------------------------------------------
     Animated counters
     ----------------------------------------------------------------------- */
  const counters = document.querySelectorAll(".stat-number");

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || "";
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
    } else {
      requestAnimationFrame(step);
    }
  };

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.6 }
  );

  counters.forEach((el) => counterObserver.observe(el));

  /* -----------------------------------------------------------------------
     Proficiency bars
     ----------------------------------------------------------------------- */
  const bars = document.querySelectorAll(".proficiency-fill");

  const barObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.width = (el.dataset.level || 0) + "%";
        observer.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );

  bars.forEach((el) => barObserver.observe(el));

  /* -----------------------------------------------------------------------
     3D tilt — project cards
     ----------------------------------------------------------------------- */
  if (!prefersReducedMotion) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const maxTilt = 8;

      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rotY = (px - 0.5) * maxTilt * 2;
        const rotX = (0.5 - py) * maxTilt * 2;
        card.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
      };

      const onLeave = () => {
        card.style.transform = "";
      };

      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
    });

    /* ---------------------------------------------------------------------
       Hero terminal parallax tilt
       --------------------------------------------------------------------- */
    const terminal = document.getElementById("heroTerminal");
    const heroAnchor = document.querySelector(".hero-scene-anchor");

    if (terminal && heroAnchor) {
      const baseX = -6;
      const baseY = 10;
      const range = 8;

      const onHeroMove = (e) => {
        const rect = heroAnchor.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const tiltX = baseX + (0.5 - py) * range;
        const tiltY = baseY + (px - 0.5) * range;
        terminal.style.setProperty("--tilt-x", `${tiltX}deg`);
        terminal.style.setProperty("--tilt-y", `${tiltY}deg`);
      };

      window.addEventListener("pointermove", onHeroMove, { passive: true });
    }
  }
})();
