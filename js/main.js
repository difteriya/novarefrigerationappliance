/* Nova Refrigeration & Appliance Repair — main.js */
(function () {
  "use strict";

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

  // Service request form — submits to Netlify Forms via AJAX (no page reload).
  // The form's name/data-netlify attributes let Netlify detect and capture it.
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

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString(),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          showMsg("Thanks! Your request has been received. We'll call you back shortly — for fastest service, call us now.", true);
          form.reset();
        })
        .catch(function () {
          // Happens when not yet deployed to Netlify (e.g. opened as a local file).
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
