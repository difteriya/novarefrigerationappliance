/* Nova Refrigeration & Appliance Repair — main.js */
(function () {
  "use strict";

  // Dark / night mode toggle (initial theme is set by an inline script in <head>)
  var root = document.documentElement;
  var themeBtn = document.querySelector(".theme-toggle");
  var setIcon = function () {
    if (!themeBtn) return;
    var dark = root.getAttribute("data-theme") === "dark";
    themeBtn.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.3 15.7A9 9 0 0 1 8.3 3.7 9 9 0 1 0 20.3 15.7Z"/></svg>';
    themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    themeBtn.title = dark ? "Switch to light mode" : "Switch to dark mode";
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
  // Desktop menus open on hover and close when the pointer leaves.
  var desktopMenu = window.matchMedia("(hover: hover) and (min-width: 1001px)");
  document.querySelectorAll(".nav-group").forEach(function (group) {
    group.addEventListener("pointerenter", function (event) {
      if (!desktopMenu.matches || event.pointerType === "touch") return;
      document.querySelectorAll(".nav-group").forEach(function (other) { if (other !== group) other.open = false; });
      group.open = true;
    });
    group.addEventListener("pointerleave", function (event) {
      if (desktopMenu.matches && event.pointerType !== "touch") group.open = false;
    });
  });

  /* --------------------------------------------------------------------- */
  /* Service request form                                                    */
  /* Every field is validated in the browser before anything is sent, so an  */
  /* empty (or junk) form can never reach the inbox. The form keeps          */
  /* `novalidate` so these messages replace the browser's native bubbles.    */
  /* --------------------------------------------------------------------- */
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

    var EMAIL_RE = /^[^\s@;,"'<>()\[\]\\]+@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,24}$/;
    var LETTER_RE = /[A-Za-z\u00C0-\u024F]/;
    var URL_RE = /(https?:\/\/|www\.|<\s*a\s|\[url)/i;

    var digitsOf = function (v) { return (v || "").replace(/\D/g, ""); };

    // US/Canada numbers: 10 digits, or 11 with a leading country code 1.
    // Area codes and exchange codes may not start with 0 or 1.
    var phoneProblem = function (raw) {
      var d = digitsOf(raw);
      if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
      if (d.length < 10) return "Enter a 10-digit US phone number, e.g. (512) 555-0123.";
      if (d.length > 10) return "That's too many digits for a US phone number.";
      if (/^(\d)\1{9}$/.test(d)) return "Please enter a real phone number we can reach you on.";
      if (d.charAt(0) === "0" || d.charAt(0) === "1") return "Area code can't start with 0 or 1.";
      if (d.charAt(3) === "0" || d.charAt(3) === "1") return "That phone number isn't valid — please check it.";
      return "";
    };

    var formatPhone = function (raw) {
      var d = digitsOf(raw);
      if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
      if (d.length !== 10) return raw;
      return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
    };

    // Returns "" when the field is fine, otherwise the message to show.
    var RULES = {
      name: function (v) {
        if (!v) return "Please enter your name.";
        if (v.length < 2) return "Please enter your full name (at least 2 characters).";
        if (v.length > 60) return "Please keep your name under 60 characters.";
        if (!LETTER_RE.test(v)) return "Please enter your name using letters.";
        if (URL_RE.test(v)) return "Please enter your name, not a web address.";
        return "";
      },
      phone: function (v) {
        if (!v) return "Please enter a phone number so we can call you back.";
        return phoneProblem(v);
      },
      email: function (v) {
        if (!v) return ""; // optional
        if (v.length > 120) return "That email address is too long.";
        if (!EMAIL_RE.test(v)) return "Please enter a valid email address, e.g. you@example.com.";
        return "";
      },
      city: function (v) { return v ? "" : "Please choose the city you're in."; },
      appliance: function (v) { return v ? "" : "Please choose the appliance or service you need."; },
      brand: function (v) {
        if (!v) return ""; // optional
        if (v.length > 40) return "Please keep the brand under 40 characters.";
        if (URL_RE.test(v)) return "Please enter a brand name, not a web address.";
        return "";
      },
      message: function (v) {
        if (!v) return "Please tell us what's wrong with the appliance.";
        if (v.length < 10) return "Please add a little more detail (at least 10 characters).";
        if (v.length > 1200) return "Please keep the description under 1200 characters.";
        if (!LETTER_RE.test(v)) return "Please describe the problem in words so we can help.";
        return "";
      }
    };

    var fieldOf = function (name) { return form.querySelector("#" + name); };

    var setError = function (el, msg) {
      var box = document.getElementById(el.id + "-error");
      var wrap = el.closest(".field");
      if (msg) {
        el.setAttribute("aria-invalid", "true");
        if (wrap) wrap.classList.add("has-error");
        if (box) box.textContent = msg;
      } else {
        el.removeAttribute("aria-invalid");
        if (wrap) wrap.classList.remove("has-error");
        if (box) box.textContent = "";
      }
      return !msg;
    };

    var checkField = function (name) {
      var el = fieldOf(name);
      if (!el) return true;
      return setError(el, RULES[name](el.value.trim()));
    };

    // Validate on blur; once a field is flagged, re-check it as the user types
    // so the error clears the moment it is fixed.
    Object.keys(RULES).forEach(function (name) {
      var el = fieldOf(name);
      if (!el) return;
      var evt = el.tagName === "SELECT" ? "change" : "blur";
      el.addEventListener(evt, function () {
        if (name === "phone" && !phoneProblem(el.value)) el.value = formatPhone(el.value);
        checkField(name);
      });
      el.addEventListener("input", function () {
        var wrap = el.closest(".field");
        if (wrap && wrap.classList.contains("has-error")) checkField(name);
      });
    });

    // Live character counter on the description.
    var message = fieldOf("message");
    var counter = document.getElementById("message-count");
    if (message && counter) {
      var max = parseInt(message.getAttribute("maxlength"), 10) || 1200;
      var updateCount = function () {
        var n = message.value.trim().length;
        counter.textContent = n ? n + " / " + max + " characters" : "";
      };
      message.addEventListener("input", updateCount);
      updateCount();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: bots tick the hidden checkbox. Show the normal success
      // message and drop the submission.
      var honey = form.querySelector('[name="botcheck"]');
      if (honey && honey.checked) {
        showMsg("Thanks! Your request has been received.", true);
        form.reset();
        return;
      }

      var firstBad = null;
      Object.keys(RULES).forEach(function (name) {
        if (!checkField(name) && !firstBad) firstBad = fieldOf(name);
      });
      if (firstBad) {
        showMsg("Please fix the highlighted fields and try again.", false);
        firstBad.focus();
        firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending…"; }

      var payload = Object.fromEntries(new FormData(form).entries());
      payload.name = (payload.name || "").trim();
      payload.phone = formatPhone(payload.phone || "");
      payload.email = (payload.email || "").trim();
      payload.brand = (payload.brand || "").trim();
      payload.message = (payload.message || "").trim();
      payload.urgency = form.querySelector("#urgency") && form.querySelector("#urgency").checked
        ? "YES — emergency, same-day service requested"
        : "No";

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
            Object.keys(RULES).forEach(function (name) {
              var el = fieldOf(name);
              if (el) setError(el, "");
            });
            if (counter) counter.textContent = "";
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
        // A fast flick (or jumping straight to the footer) can carry an element
        // right past the viewport without it ever reporting as intersecting —
        // anything already above the fold is revealed too, so nothing is left
        // stuck at opacity 0.
        var past = entry.boundingClientRect.bottom <= 0;
        if (!entry.isIntersecting && !past) return;
        reveal(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    pending.forEach(function (el) { io.observe(el); });
  }

  // Safety net: reveal anything that has scrolled above the viewport.
  var catchUp = function () {
    pending.slice().forEach(function (el) {
      if (el.getBoundingClientRect().bottom <= 0) {
        if (io) io.unobserve(el);
        reveal(el);
      }
    });
  };
  window.addEventListener("scroll", catchUp, { passive: true });
  window.addEventListener("resize", catchUp);

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
