/* Nova Refrigeration & Appliance Repair — main.js */
(function () {
  "use strict";

  // Dark / night mode toggle (initial theme is set by an inline script in <head>)
  var root = document.documentElement;
  var themeBtn = document.querySelector(".theme-toggle");
  var setIcon = function () {
    if (themeBtn) themeBtn.textContent = root.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
  };
  setIcon();
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      setIcon();
    });
  }

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") nav.classList.remove("open");
    });
  }

  // Service request form — submits to Web3Forms via AJAX (no page reload).
  // The hidden access_key field (set in build.js CONFIG) routes the email.
  var form = document.querySelector("#service-form");
  if (form) {
    var success = form.parentNode.querySelector(".form-success");
    var showMsg = function (text, ok) {
      if (!success) return;
      success.style.display = "block";
      success.textContent = text;
      success.style.background = ok ? "#e6f7ee" : "#fdecec";
      success.style.borderColor = ok ? "#b6e6cb" : "#f3c2c2";
      success.style.color = ok ? "#15703d" : "#9b2222";
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending…"; }

      var payload = Object.fromEntries(new FormData(form).entries());
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.success) {
            showMsg("Thanks! Your request has been received. We'll call you back shortly — for fastest service, call us now.", true);
            form.reset();
          } else {
            throw new Error((data && data.message) || "submit failed");
          }
        })
        .catch(function () {
          showMsg("Sorry, we couldn't send your request right now. Please call or text us and we'll help right away.", false);
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Request Service"; }
        });
    });
  }

  // Set current year in footers
  var yearEls = document.querySelectorAll("[data-year]");
  var year = new Date().getFullYear();
  yearEls.forEach(function (el) { el.textContent = year; });
})();

/* ---------------------------------------------------------------------- */
/* Motion — page transitions, scroll reveals, counters, progress bar       */
/* ---------------------------------------------------------------------- */
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var doc = document;
  var body = doc.body;
  if (reduced) return;

  /* ---------- Page enter / leave ---------- */
  var hasViewTransitions = !!doc.startViewTransition &&
    window.CSS && CSS.supports && CSS.supports("view-transition-name: none");

  if (!hasViewTransitions) {
    body.classList.add("page-enter");

    doc.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      if (a.origin !== location.origin) return;                       // external link
      if (/^(tel:|mailto:|sms:)/i.test(a.getAttribute("href") || "")) return;
      if (a.pathname === location.pathname && a.hash) return;         // in-page anchor

      e.preventDefault();
      body.classList.add("page-leave");
      var url = a.href;
      setTimeout(function () { location.href = url; }, 220);
    });
  }

  // Restore visibility when returning through the back/forward cache
  window.addEventListener("pageshow", function (ev) {
    if (ev.persisted) body.classList.remove("page-leave");
  });

  /* ---------- Scroll progress bar + sticky header state ---------- */
  var bar = doc.createElement("div");
  bar.className = "scroll-progress";
  body.appendChild(bar);
  var header = doc.querySelector(".site-header");

  /* ---------- Scroll reveal ---------- */
  var GROUPS = [
    { sel: ".section-head",                 anim: "up",    stagger: 0   },
    { sel: ".grid > *",                     anim: "up",    stagger: 90  },
    { sel: ".steps > .step",                anim: "up",    stagger: 110 },
    { sel: ".stats > .stat",                anim: "zoom",  stagger: 80  },
    { sel: ".chips > .chip",                anim: "zoom",  stagger: 50  },
    { sel: ".area-grid > a",                anim: "up",    stagger: 40  },
    { sel: ".feature",                      anim: "up",    stagger: 90  },
    { sel: ".faq-item",                     anim: "up",    stagger: 60  },
    { sel: ".form-wrap",                    anim: "right", stagger: 0   },
    { sel: ".map-embed",                    anim: "zoom",  stagger: 0   },
    { sel: ".split > *",                    anim: "left",  stagger: 120 },
    { sel: ".prose > *",                    anim: "up",    stagger: 40  },
    { sel: ".coming-soon > *",              anim: "up",    stagger: 80  },
    { sel: ".cta-band .container > *",      anim: "up",    stagger: 80  },
    { sel: ".site-footer .footer-grid > *", anim: "up",    stagger: 70  }
  ];

  var pending = [];

  GROUPS.forEach(function (g) {
    doc.querySelectorAll(g.sel).forEach(function (el) {
      if (el.hasAttribute("data-reveal")) return;
      if (el.closest(".hero, .page-hero")) return;   // hero has its own entrance animation
      if (el.closest("[data-reveal]")) return;       // never nest reveals

      var idx = 0;
      if (g.stagger && el.parentNode) {
        var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.nodeType === 1; });
        idx = Math.min(Math.max(sibs.indexOf(el), 0), 6);
      }
      var anim = g.sel === ".split > *" ? (idx % 2 ? "right" : "left") : g.anim;

      el.setAttribute("data-reveal", anim);
      if (idx) el.style.setProperty("--reveal-delay", idx * g.stagger + "ms");
      pending.push(el);
    });
  });

  var reveal = function (el) {
    el.classList.add("in-view");
    var i = pending.indexOf(el);
    if (i !== -1) pending.splice(i, 1);
  };

  // Primary: IntersectionObserver. Fallback below covers browsers/states where it stays quiet.
  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    pending.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Stat counters ---------- */
  var counters = [];
  doc.querySelectorAll(".stat .big").forEach(function (el) {
    var raw = el.textContent.trim();
    var m = raw.match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (!m) return;
    var digits = m[2].replace(/,/g, "");
    var target = parseFloat(digits);
    if (!isFinite(target) || target <= 0) return;
    counters.push({
      el: el, raw: raw, target: target, prefix: m[1], suffix: m[3],
      decimals: (digits.split(".")[1] || "").length,
      grouped: m[2].indexOf(",") !== -1
    });
  });

  var runCounter = function (c) {
    var start = null, dur = 1300;
    var fmt = function (v) {
      var s = v.toFixed(c.decimals);
      if (c.grouped) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return c.prefix + s + c.suffix;
    };
    var tick = function (ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      c.el.textContent = p < 1 ? fmt(c.target * (1 - Math.pow(1 - p, 3))) : c.raw;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ---------- Throttled scroll handler: progress, reveals, counters ---------- */
  var inViewport = function (el, margin) {
    var r = el.getBoundingClientRect();
    if (r.height === 0 && r.width === 0) return false;
    return r.top < window.innerHeight - margin && r.bottom > 0;
  };

  var apply = function () {
    var max = doc.documentElement.scrollHeight - window.innerHeight;
    var y = window.pageYOffset || doc.documentElement.scrollTop;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    if (header) header.classList.toggle("scrolled", y > 20);

    for (var i = pending.length - 1; i >= 0; i--) {
      var el = pending[i];
      if (inViewport(el, 60)) {
        if (io) io.unobserve(el);
        reveal(el);
      }
    }

    for (var j = counters.length - 1; j >= 0; j--) {
      if (inViewport(counters[j].el, 40)) {
        runCounter(counters[j]);
        counters.splice(j, 1);
      }
    }
  };

  // Time-based throttle (not rAF: rAF is paused while a tab is hidden).
  var last = 0, timer = null;
  var update = function () {
    var now = new Date().getTime();
    if (now - last > 80) { last = now; apply(); }
    else {
      clearTimeout(timer);
      timer = setTimeout(function () { last = new Date().getTime(); apply(); }, 80);
    }
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  window.addEventListener("load", update);
  // rAF is paused in hidden tabs — re-check directly when the page becomes visible.
  doc.addEventListener("visibilitychange", function () { if (!doc.hidden) apply(); });
  // Safety net: a low-frequency poll guarantees reveals fire even if scroll
  // events or frames are throttled (hidden tab, restored session, momentum scroll).
  var poll = setInterval(function () {
    apply();
    if (!pending.length && !counters.length) clearInterval(poll);
  }, 250);

  apply();
})();
