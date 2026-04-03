/**
 * Swire RGM Assessment Portal — animation layer
 * Scroll-triggered entry, count-up, stagger
 */

(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─────────────────────────────────────────────
   * 1. Scroll-triggered entry via IntersectionObserver
   * ───────────────────────────────────────────── */
  const REVEAL_SELECTOR = [
    ".hero-home",
    ".page-hero",
    ".panel",
    ".cta-panel",
    ".icon-card",
    ".route-card",
    ".flow-step",
    ".logic-step",
    ".pillar-card",
    ".stage-card",
    ".enabler-card",
    ".cycle-step",
    ".stat-card",
    ".summary-card",
    ".question-card",
    ".admin-card",
  ].join(",");

  function applyStagger(parent) {
    const children = parent.querySelectorAll(
      ".icon-card, .route-card, .flow-step, .logic-step, " +
      ".pillar-card, .stage-card, .enabler-card, .cycle-step, " +
      ".stat-card, .summary-card, .admin-card"
    );
    children.forEach((el, i) => {
      if (!el.style.animationDelay) {
        el.style.animationDelay = `${i * 60}ms`;
      }
    });
  }

  if (!prefersReduced && "IntersectionObserver" in window) {
    // Remove the always-on CSS animation class
    document.documentElement.classList.add("js-scroll-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            applyStagger(entry.target);
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    function observeAll() {
      document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (!el.classList.contains("is-visible")) {
          observer.observe(el);
        }
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", observeAll);
    } else {
      observeAll();
    }

    // Re-observe after dynamic content (questionnaire renders)
    const mutationObserver = new MutationObserver(() => observeAll());
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  /* ─────────────────────────────────────────────
   * 2. Count-up for hero stat numbers
   * ───────────────────────────────────────────── */
  function countUp(el, target, duration) {
    if (prefersReduced) return;
    const start = performance.now();
    const from = 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (target - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const COUNT_IDS = [
    { id: "hero-pillar-count",   target: 4  },
    { id: "hero-stage-count",    target: 5  },
    { id: "hero-question-count", target: 48 },
    { id: "hero-enabler-count",  target: 4  },
  ];

  function initCountUp() {
    COUNT_IDS.forEach(({ id, target }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            countUp(el, target, 900);
            io.disconnect();
          }
        },
        { threshold: 0.5 }
      );
      io.observe(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCountUp);
  } else {
    initCountUp();
  }

  /* ─────────────────────────────────────────────
   * 3. Metric bar fill animation on scroll
   * ───────────────────────────────────────────── */
  function animateBars() {
    if (prefersReduced) return;
    document.querySelectorAll(".metric-bar-fill").forEach((bar) => {
      const finalWidth = bar.style.width || "0%";
      bar.style.width = "0%";
      bar.style.transition = "none";

      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            requestAnimationFrame(() => {
              bar.style.transition = "width 700ms cubic-bezier(0.22,1,0.36,1)";
              bar.style.width = finalWidth;
            });
            io.disconnect();
          }
        },
        { threshold: 0.4 }
      );
      io.observe(bar);
    });
  }

  document.addEventListener("DOMContentLoaded", animateBars);
  // Also re-run when results are rendered dynamically
  document.addEventListener("rgm:results-rendered", animateBars);
})();
