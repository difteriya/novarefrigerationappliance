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

  // Service request form (no backend — client-side confirmation)
  var form = document.querySelector("#service-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var success = form.querySelector(".form-success");
      if (success) {
        success.style.display = "block";
        success.textContent =
          "Thanks! Your request has been received. We'll call you back shortly — for fastest service, call us now.";
      }
      form.reset();
      if (success) success.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  // Set current year in footers
  var yearEls = document.querySelectorAll("[data-year]");
  var year = new Date().getFullYear();
  yearEls.forEach(function (el) { el.textContent = year; });
})();
