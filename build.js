/* Static site generator for Nova Refrigeration & Appliance Repair
 * Run: node build.js
 * Outputs plain static HTML into the project root (index.html, services/, areas/, ...).
 * All content is sourced from nova.txt. Contact details are PLACEHOLDERS — search
 * for the values in the CONFIG block below and replace them with the real ones. */

const fs = require("fs");
const path = require("path");

/* ----------------------------------------------------------------------- */
/* CONFIG — replace these placeholders with real business details          */
/* ----------------------------------------------------------------------- */
const CONFIG = {
  name: "Nova Refrigeration & Appliance Repair",
  shortName: "Nova Appliance Repair",
  phoneDisplay: "(512) 555-0209",          // TODO: real phone
  phoneTel: "+15125550199",                 // TODO: real phone (E.164)
  smsBody: "Hi Nova, I need appliance repair service.",
  email: "info@novarefrigerationappliance.com", // TODO: real email
  cityState: "Austin, Texas",
  hours: "Mon–Sat: 7:00 AM – 7:00 PM",
  domain: "novarefrigerationappliance.com",
  mapQuery: "Austin, Texas",
  // Web3Forms access key — get a free one (no login) at https://web3forms.com
  // by entering the email where you want submissions delivered, then paste it here.
  web3formsKey: "3e3a576c-d904-49e5-871f-ee45dd499aa2",
};

/* ----------------------------------------------------------------------- */
/* DATA (from nova.txt)                                                    */
/* ----------------------------------------------------------------------- */
const SERVICES = [
  {
    slug: "refrigerator-repair",
    name: "Refrigerator Repair",
    icon: "❄️",
    blurb: "Fridge not cooling, leaking, or making noise? We diagnose and fix all refrigerator problems fast.",
    intro: "A failing refrigerator can spoil hundreds of dollars in food in a matter of hours. Our technicians repair every major refrigerator brand and problem, often the same day.",
    issues: ["Not cooling", "Warm refrigerator section", "Warm freezer section", "Ice buildup / defrost issues", "Water leaks", "Noisy operation", "Temperature control issues", "Control board replacement", "Fan motor replacement", "Sensor replacement", "Thermostat replacement"],
  },
  {
    slug: "ice-maker-repair",
    name: "Ice Maker Repair",
    icon: "🧊",
    blurb: "No ice, slow ice, or an overflowing ice maker? We get it producing again.",
    intro: "From built-in ice makers to refrigerator dispensers, we repair the assemblies, valves, and controls that keep the ice flowing.",
    issues: ["No ice production", "Slow ice production", "Overflowing ice maker", "Ice dispenser issues", "Water valve replacement", "Ice maker assembly replacement"],
  },
  {
    slug: "freezer-repair",
    name: "Freezer Repair",
    icon: "🥶",
    blurb: "Freezer not freezing or building up frost? Protect your frozen goods with a fast repair.",
    intro: "Whether it's a stand-alone freezer or the freezer compartment of your fridge, we restore proper temperatures and stop frost problems at the source.",
    issues: ["Not freezing", "Excessive frost buildup", "Temperature fluctuations", "Door seal issues"],
  },
  {
    slug: "washer-repair",
    name: "Washer Repair",
    icon: "🌀",
    blurb: "Washer won't drain, spin, or start? We repair top-load and front-load washers.",
    intro: "A broken washer disrupts the whole household. We diagnose error codes, leaks, and mechanical failures and get your laundry moving again.",
    issues: ["Not draining", "Not spinning", "Not starting", "Control board issues", "Water leaks", "Error codes"],
  },
  {
    slug: "dryer-repair",
    name: "Dryer Repair",
    icon: "🔥",
    blurb: "Dryer not heating or taking forever? Gas and electric dryer repair, including vent issues.",
    intro: "A dryer that won't heat is often a quick fix — and a safety concern when vents are clogged. We service gas and electric dryers and address ventilation problems.",
    issues: ["Not heating", "Long drying times", "Won't start", "Thermal fuse replacement", "Heating element replacement", "Gas dryer repair", "Ventilation-related issues"],
  },
  {
    slug: "dishwasher-repair",
    name: "Dishwasher Repair",
    icon: "🍽️",
    blurb: "Dishes not getting clean or water pooling at the bottom? We fix it.",
    intro: "From clogged pumps to failed control boards and leaks, we restore your dishwasher to spotless, leak-free performance.",
    issues: ["Not cleaning properly", "Not draining", "Water leaks", "Control board replacement", "Pump replacement"],
  },
  {
    slug: "oven-repair",
    name: "Oven & Range Repair",
    icon: "🔆",
    blurb: "Oven not heating or heating unevenly? Gas and electric oven & range repair.",
    intro: "Don't let a broken oven ruin dinner. We repair gas and electric ovens and ranges — from ignition problems to uneven baking and control issues.",
    issues: ["Not heating", "Uneven heating", "Ignition problems", "Control board issues", "Temperature sensor replacement", "Gas and electric ovens"],
  },
  {
    slug: "cooktop-repair",
    name: "Cooktop Repair",
    icon: "🍳",
    blurb: "Burner or igniter trouble on your cooktop? We repair gas and electric cooktops.",
    intro: "We fix burner, igniter, switch, and gas valve problems on gas and electric cooktops so every burner lights and heats the way it should.",
    issues: ["Burner issues", "Igniter problems", "Switch replacement", "Gas valve replacement"],
  },
  {
    slug: "microwave-repair",
    name: "Microwave Repair",
    icon: "📻",
    blurb: "Microwave not heating or door not latching? We repair built-in and OTR microwaves.",
    intro: "We repair over-the-range and built-in microwaves — heating problems, door and switch failures, and control board faults.",
    issues: ["Door issues", "Heating issues", "Switch replacement", "Control board repair"],
  },
];

const SPECIALIZED = [
  {
    name: "Sealed System Refrigeration Repair",
    intro: "Sealed-system work is the most technical refrigeration repair there is — and a specialty of ours.",
    issues: ["Compressor replacement", "Refrigerant leak diagnosis", "Leak repair", "Filter drier replacement", "System evacuation and recharge", "Capillary tube restrictions", "Sealed system rebuilds"],
  },
  {
    name: "Built-In Refrigerator Repair",
    intro: "Specialized experience with high-end built-in refrigeration brands.",
    issues: ["Sub-Zero", "Thermador", "Viking", "Bosch", "GE Monogram"],
  },
];

const BRANDS = ["Samsung","LG","Whirlpool","Maytag","KitchenAid","GE Appliances","Frigidaire","Electrolux","Bosch","Thermador","Sub-Zero","Viking","JennAir","Wolf"];

const AREAS = [
  { slug: "austin", name: "Austin" },
  { slug: "round-rock", name: "Round Rock" },
  { slug: "cedar-park", name: "Cedar Park" },
  { slug: "georgetown", name: "Georgetown" },
  { slug: "pflugerville", name: "Pflugerville" },
  { slug: "lakeway", name: "Lakeway" },
  { slug: "bee-cave", name: "Bee Cave" },
  { slug: "west-lake-hills", name: "West Lake Hills" },
  { slug: "buda", name: "Buda" },
  { slug: "kyle", name: "Kyle" },
  { slug: "the-hills", name: "The Hills" },
  { slug: "dripping-springs", name: "Dripping Springs" },
];

const REVIEWS = [
  { stars: 5, text: "Our Sub-Zero stopped cooling and Nova had a tech out the same day. Diagnosed a sealed-system leak, fixed it right, and saved us from buying a new unit. Professional and honest.", who: "Marcus T.", where: "West Lake Hills" },
  { stars: 5, text: "Washer wouldn't drain on a Sunday morning with a houseful of laundry. Quick call, fast response, fixed in under an hour. Fair price too.", who: "Priya R.", where: "Round Rock" },
  { stars: 5, text: "Our freezer was building up frost and the fridge was getting warm. They explained exactly what was wrong, replaced the defrost sensor, and it's been perfect since.", who: "Dana K.", where: "Cedar Park" },
  { stars: 5, text: "Gas oven wouldn't ignite. The technician was on time, clean, and clearly knew the brand inside out. Highly recommend for any appliance repair.", who: "Jorge M.", where: "Pflugerville" },
  { stars: 5, text: "Ice maker quit completely. They had the assembly and water valve on the truck and replaced it on the spot. Same-day service as promised.", who: "Allison W.", where: "Georgetown" },
  { stars: 5, text: "Dryer was taking three cycles to dry a load. Turned out to be a clogged vent and a failing heating element. Fast, friendly, and reasonably priced.", who: "Ben S.", where: "Leander" },
];

const FAQS = [
  { q: "Do you offer same-day appliance repair?", a: "Yes. We offer same-day service for most refrigerator, freezer, and appliance repairs throughout the Austin metro area whenever scheduling allows. Call us early in the day for the best chance at a same-day appointment." },
  { q: "What areas do you serve?", a: "We serve Austin and the surrounding metro, including Round Rock, Cedar Park, Leander, Georgetown, Pflugerville, Lakeway, Bee Cave, West Lake Hills, Buda, Kyle, and Hutto." },
  { q: "Which appliance brands do you repair?", a: "We service all major brands including Samsung, LG, Whirlpool, Maytag, KitchenAid, GE Appliances, Frigidaire, Electrolux, Bosch, Thermador, Sub-Zero, Viking, JennAir, and Wolf — plus built-in and high-end refrigeration like Sub-Zero, Thermador, Viking, Bosch, and GE Monogram." },
  { q: "Do you repair sealed refrigeration systems?", a: "Yes. Sealed-system work is a specialty. We handle compressor replacement, refrigerant leak diagnosis and repair, filter drier replacement, system evacuation and recharge, capillary tube restrictions, and full sealed-system rebuilds." },
  { q: "How much does a repair cost?", a: "Every repair is different. We provide a clear diagnosis and an up-front estimate before any work begins, so you can decide with no surprises. Call or request service online for a quote." },
  { q: "Do you repair both gas and electric appliances?", a: "Yes. We service gas and electric ovens, ranges, cooktops, and dryers, including ignition, gas valve, and ventilation-related issues." },
  { q: "How do I schedule a repair?", a: "Call us, send a text, or use the Request Service form on our website. Tell us your appliance, brand, and the problem, and we'll get you scheduled — often the same day." },
];

/* Active promotions — swap the `img` files in /assets for your own photos any time. */
const PROMOS = [
  {
    img: "assets/promo-labor.png",
    badge: "Service Special",
    price: "$185",
    unit: "minimum labor",
    title: "Flat Minimum Labor Rate",
    desc: "Straightforward, up-front pricing on every visit — a $185 minimum labor charge covers diagnosis and getting hands on the repair. No hidden fees, no surprises.",
  },
  {
    img: "assets/promo-military.jpg",
    badge: "We Support Our Troops",
    price: "$30 OFF",
    unit: "for military",
    title: "Military Discount",
    desc: "A thank-you to those who serve. Active-duty and veteran households receive $30 off their appliance repair. Just mention it when you book.",
  },
];

/* Trust / value highlights shown on the home page. */
const FEATURES = [
  { icon: "shield", title: "Spare Parts Guarantee", text: "We stand behind our work — every spare part we install is backed by a guarantee." },
  { icon: "clock", title: "Same-Day Repair", text: "Same-day appliance repair is available across the Austin metro whenever scheduling allows." },
  { icon: "badge", title: "Insured & EPA Certified", text: "Our technicians are fully insured and EPA certified for safe, code-compliant refrigeration work." },
  { icon: "trophy", title: "Proven Track Record", text: "5+ years of experience and 10,000+ completed orders for homeowners across the metro." },
];

const FEATURE_ICONS = {
  shield: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#1763b6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M40 8l28 10v20c0 18-12 30-28 34C24 68 12 56 12 38V18z"/><path d="M30 40l8 8 14-16"/></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#1763b6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="42" r="30"/><path d="M40 24v18l12 8"/><path d="M28 8h24"/></svg>',
  badge: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#1763b6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="32" r="22"/><path d="M30 48l-6 24 16-9 16 9-6-24"/><path d="M31 32l6 6 12-12"/></svg>',
  trophy: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#1763b6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 12h32v18a16 16 0 0 1-32 0z"/><path d="M24 18H14v6a10 10 0 0 0 10 10M56 18h10v6a10 10 0 0 1-10 10"/><path d="M34 46h12M30 68h20M40 46v22"/></svg>',
};

/* ----------------------------------------------------------------------- */
/* HELPERS                                                                 */
/* ----------------------------------------------------------------------- */
const C = CONFIG;
const smsHref = `sms:${C.phoneTel}?&body=${encodeURIComponent(C.smsBody)}`;
const telHref = `tel:${C.phoneTel}`;

// `depth` = how many directories deep the page is from root (0 = root, 1 = services/x.html)
const rel = (depth, p) => (depth === 0 ? "" : "../".repeat(depth)) + p;

function head(depth, { title, desc, canonical }) {
  const base = `https://${C.domain}/`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="${rel(depth, "assets/favicon.svg")}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${rel(depth, "assets/favicon.svg")}">
<meta name="description" content="${desc}">
<link rel="canonical" href="${base}${canonical === "index.html" ? "" : canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#0b2a4a">
<link rel="preconnect" href="https://www.google.com">
<link rel="stylesheet" href="${rel(depth, "css/styles.css")}">
</head>
<body>`;
}

function header(depth, active) {
  const link = (href, label, key) =>
    `<a href="${rel(depth, href)}"${active === key ? ' class="active" aria-current="page"' : ""}>${label}</a>`;
  return `
<div class="topbar">
  <div class="container">
    <span>⭐ 5-Star Rated · Serving ${C.cityState} & Surrounding Areas</span>
    <div class="topbar-right">
      <span>🕒 ${C.hours}</span>
      <a href="${telHref}">📞 ${C.phoneDisplay}</a>
    </div>
  </div>
</div>
<header class="site-header">
  <div class="container">
    <a class="brand" href="${rel(depth, "index.html")}">
      <img class="logo-mark logo-dark" src="${rel(depth, "assets/logo.svg")}" alt="${C.name} logo" width="48" height="54">
      <img class="logo-mark logo-white" src="${rel(depth, "assets/logo-white.svg")}" alt="${C.name} logo" width="48" height="54">
      <span>${C.name.split(" & ")[0]}<small>Refrigeration &amp; Appliance Repair</small></span>
    </a>
    <nav class="nav" aria-label="Main navigation">
      ${link("index.html", "Home", "home")}
      ${link("about.html", "About", "about")}
      ${link("services.html", "Services", "services")}
      ${link("service-areas.html", "Service Areas", "areas")}
      ${link("our-work.html", "Our Work", "work")}
      ${link("contact.html", "Contact", "contact")}
    </nav>
    <div class="header-actions">
      <button class="theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode">🌙</button>
      <a class="btn btn-call" href="${telHref}">📞 Call Now</a>
      <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>`;
}

function ctaBand(depth) {
  return `
<section class="section cta-band">
  <div class="container">
    <h2>Call Now for Fast Appliance Repair Service</h2>
    <p>Same-day service available across the ${C.cityState} metro. Talk to a real technician and get your appliance fixed today.</p>
    <div class="hero-cta">
      <a class="btn btn-call btn-lg" href="${telHref}">📞 Call ${C.phoneDisplay}</a>
      <a class="btn btn-outline btn-lg" href="${smsHref}">💬 Text Us</a>
      <a class="btn btn-ghost btn-lg" href="${rel(depth, "contact.html")}">Schedule Service Online</a>
    </div>
  </div>
</section>`;
}

function footer(depth) {
  const sLinks = SERVICES.slice(0, 7)
    .map((s) => `<li><a href="${rel(depth, "services/" + s.slug + ".html")}">${s.name}</a></li>`).join("\n        ");
  const aLinks = AREAS.slice(0, 8)
    .map((a) => `<li><a href="${rel(depth, "areas/" + a.slug + ".html")}">${a.name}</a></li>`).join("\n        ");
  return `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand" href="${rel(depth, "index.html")}" style="color:#fff">
          <img class="logo-mark" src="${rel(depth, "assets/logo-white.svg")}" alt="${C.name} logo" width="48" height="54">
          <span style="color:#fff">${C.name.split(" & ")[0]}<small style="color:#9fc1e3">Refrigeration &amp; Appliance Repair</small></span>
        </a>
        <p style="margin-top:14px;max-width:34ch">Residential appliance repair and refrigeration services for ${C.cityState} and the surrounding metro. Same-day service available.</p>
        <p><a href="${telHref}">📞 ${C.phoneDisplay}</a><br><a href="${smsHref}">💬 Text us</a><br><a href="mailto:${C.email}">✉️ ${C.email}</a></p>
      </div>
      <div>
        <h4>Services</h4>
        <ul>
        ${sLinks}
        </ul>
      </div>
      <div>
        <h4>Service Areas</h4>
        <ul>
        ${aLinks}
        <li><a href="${rel(depth, "service-areas.html")}">View all areas →</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="${rel(depth, "about.html")}">About Us</a></li>
          <li><a href="${rel(depth, "our-work.html")}">Our Work</a></li>
          <li><a href="${rel(depth, "index.html")}#reviews">Reviews</a></li>
          <li><a href="${rel(depth, "index.html")}#faq">FAQ</a></li>
          <li><a href="${rel(depth, "contact.html")}">Contact Us</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year>2026</span> ${C.name}. All rights reserved.</span>
      <span>${C.cityState} · ${C.hours}</span>
    </div>
  </div>
</footer>
<div class="mobile-callbar">
  <a class="mc-call" href="${telHref}">📞 Call Now</a>
  <a class="mc-text" href="${smsHref}">💬 Text Us</a>
</div>
<script src="${rel(depth, "js/main.js")}"></script>
</body>
</html>`;
}

function pageHero(depth, { title, sub, crumbs }) {
  const trail = crumbs
    ? `<div class="breadcrumb"><a href="${rel(depth, "index.html")}">Home</a> › ${crumbs}</div>`
    : "";
  return `
<section class="page-hero">
  <div class="container">
    ${trail}
    <h1>${title}</h1>
    ${sub ? `<p>${sub}</p>` : ""}
  </div>
</section>`;
}

function localBusinessSchema() {
  return `<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: C.name,
  telephone: C.phoneDisplay,
  email: C.email,
  url: `https://${C.domain}/`,
  areaServed: AREAS.map((a) => a.name + ", TX"),
  address: { "@type": "PostalAddress", addressLocality: "Austin", addressRegion: "TX", addressCountry: "US" },
  openingHours: "Mo-Sa 07:00-19:00",
  description: "Residential appliance repair and refrigeration services in the Austin, Texas metro area.",
}, null, 2)}
</script>`;
}

function write(relPath, html) {
  const full = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html, "utf8");
  console.log("  wrote " + relPath);
}

/* ----------------------------------------------------------------------- */
/* PAGE BUILDERS                                                           */
/* ----------------------------------------------------------------------- */

function serviceCards(depth) {
  return SERVICES.map((s) => `
    <a class="card service-card" href="${rel(depth, "services/" + s.slug + ".html")}">
      <div class="icon"><img src="${rel(depth, "assets/icons/" + s.slug + ".svg")}" alt="${s.name} icon" width="44" height="44"></div>
      <h3>${s.name}</h3>
      <p>${s.blurb}</p>
      <span class="arrow">Learn more →</span>
    </a>`).join("");
}

function promoCards(depth) {
  return PROMOS.map((p) => `
    <div class="card promo-card">
      <div class="promo-media"><img src="${rel(depth, p.img)}" alt="${p.title}" loading="lazy"><span class="promo-badge">${p.badge}</span></div>
      <div class="promo-body">
        <div class="promo-price">${p.price} <span>${p.unit}</span></div>
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        <a class="btn btn-call" href="${telHref}">📞 Claim This Offer</a>
      </div>
    </div>`).join("");
}

function featureCards() {
  return FEATURES.map((f) => `
    <div class="feature">
      <div class="feature-icon">${FEATURE_ICONS[f.icon]}</div>
      <h3>${f.title}</h3>
      <p>${f.text}</p>
    </div>`).join("");
}

function faqItems() {
  return FAQS.map((f) => `
      <details class="faq-item">
        <summary>${f.q}</summary>
        <div class="faq-body">${f.a}</div>
      </details>`).join("");
}

function faqSchema() {
  return `<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
}, null, 2)}
</script>`;
}

function brandChips() {
  return BRANDS.map((b) => `<div class="chip">${b}</div>`).join("\n      ");
}

function areaLinks(depth) {
  return AREAS.map((a) => `<a href="${rel(depth, "areas/" + a.slug + ".html")}">📍 ${a.name}</a>`).join("\n      ");
}

function reviewCards(list) {
  return (list || REVIEWS).map((r) => `
    <div class="review">
      <div class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
      <p>"${r.text}"</p>
      <p class="who">${r.who}<span>${r.where}</span></p>
    </div>`).join("");
}

/* ---------- HOME ---------- */
function buildHome() {
  const html = head(0, {
    title: `${C.name} | Same-Day Appliance & Refrigerator Repair in ${C.cityState}`,
    desc: `Fast, reliable residential appliance and refrigerator repair in ${C.cityState} and surrounding areas. Same-day service. Call ${C.phoneDisplay}.`,
    canonical: "index.html",
  }) + localBusinessSchema() + faqSchema() + header(0, "home") + `
<section class="hero">
  <div class="container">
    <span class="same-day">⚡ Same-Day Service Available</span>
    <h1>Fast, Reliable Appliance &amp; Refrigerator Repair in ${C.cityState}</h1>
    <p class="lead">From refrigerators and freezers to washers, dryers, ovens, and more — Nova gets your home appliances working again, often the same day.</p>
    <div class="hero-badges">
      <span>✓ Same-Day Service</span>
      <span>✓ All Major Brands</span>
      <span>✓ Sealed-System Specialists</span>
    </div>
    <div class="hero-cta">
      <a class="btn btn-call btn-lg" href="${telHref}">📞 Call Now: ${C.phoneDisplay}</a>
      <a class="btn btn-outline btn-lg" href="${smsHref}">💬 Text Us</a>
      <a class="btn btn-ghost btn-lg" href="contact.html">Request Service</a>
    </div>
  </div>
</section>

<section class="section" id="promos">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Active Promotions</span>
      <h2>Current Offers &amp; Discounts</h2>
      <p>Honest pricing and a little extra appreciation for our customers.</p>
    </div>
    <div class="grid grid-2 promo-grid">
      ${promoCards(0)}
    </div>
  </div>
</section>

<section class="section alt">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Why Homeowners Choose Nova</span>
      <h2>Repairs You Can Trust</h2>
    </div>
    <div class="grid grid-4 feature-grid">
      ${featureCards()}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">What We Repair</span>
      <h2>Appliance Repair Services</h2>
      <p>Expert residential repair for every major appliance in your home.</p>
    </div>
    <div class="grid grid-3">
      ${serviceCards(0)}
    </div>
    <div style="text-align:center;margin-top:36px">
      <a class="btn btn-primary btn-lg" href="services.html">View All Services →</a>
    </div>
  </div>
</section>

<section class="section alt">
  <div class="container">
    <div class="stats">
      <div class="stat"><div class="big">10,000+</div><div class="lbl">Orders Completed</div></div>
      <div class="stat"><div class="big">5+ yrs</div><div class="lbl">Experience</div></div>
      <div class="stat"><div class="big">14+</div><div class="lbl">Brands Serviced</div></div>
      <div class="stat"><div class="big">Same-Day</div><div class="lbl">Service Available</div></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Simple Process</span>
      <h2>How It Works</h2>
    </div>
    <div class="steps">
      <div class="step"><div class="num"></div><h3>Call or Request Online</h3><p>Tell us your appliance, brand, and the problem. We'll schedule a visit — often the same day.</p></div>
      <div class="step"><div class="num"></div><h3>Expert Diagnosis</h3><p>Our technician inspects the appliance and gives you a clear, up-front estimate before any work begins.</p></div>
      <div class="step"><div class="num"></div><h3>Fixed Right</h3><p>We complete the repair with quality parts and get your home running smoothly again.</p></div>
    </div>
  </div>
</section>

<section class="section alt">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Brands We Service</span>
      <h2>We Repair All Major Brands</h2>
      <p>Including specialized experience with high-end and built-in refrigeration.</p>
    </div>
    <div class="chips">
      ${brandChips()}
    </div>
  </div>
</section>

<section class="section" id="reviews">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Reviews</span>
      <h2>What Our Customers Say</h2>
      <p>Homeowners across the ${C.cityState} metro trust Nova for honest, fast repairs.</p>
    </div>
    <div class="grid grid-3">
      ${reviewCards(REVIEWS)}
    </div>
    <p class="form-note" style="text-align:center;margin-top:28px">Reviews shown are representative customer testimonials.</p>
  </div>
</section>

<section class="section alt" id="faq">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">FAQ</span>
      <h2>Frequently Asked Questions</h2>
      <p>Everything you need to know about scheduling appliance repair with Nova.</p>
    </div>
    <div class="container" style="max-width:840px;padding:0">
      ${faqItems()}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Service Areas</span>
      <h2>Proudly Serving the Greater ${C.cityState} Area</h2>
    </div>
    <div class="area-grid">
      ${areaLinks(0)}
    </div>
  </div>
</section>

` + ctaBand(0) + footer(0);
  write("index.html", html);
}

/* ---------- ABOUT ---------- */
function buildAbout() {
  const html = head(0, {
    title: `About Us | ${C.name}`,
    desc: `Learn about ${C.name} — trusted residential appliance and refrigeration repair serving ${C.cityState} and the surrounding metro.`,
    canonical: "about.html",
  }) + header(0, "about")
    + pageHero(0, { title: "About Nova Refrigeration & Appliance Repair", sub: `Trusted residential appliance and refrigeration repair serving ${C.cityState} and surrounding communities.`, crumbs: "About" })
    + `
<section class="section">
  <div class="container split">
    <div class="prose">
      <p>${C.name} is a residential appliance repair and refrigeration company based in ${C.cityState}. We help homeowners across the metro keep their kitchens and laundry rooms running — quickly, honestly, and affordably.</p>
      <h2>Refrigeration is our specialty</h2>
      <p>While we repair every major home appliance, refrigeration is where we go deepest. Our technicians handle sealed-system work that many shops won't touch — compressor replacement, refrigerant leak diagnosis and repair, filter drier replacement, system evacuation and recharge, capillary tube restrictions, and full sealed-system rebuilds.</p>
      <p>We also have specialized experience with high-end and built-in refrigeration, including Sub-Zero, Thermador, Viking, Bosch, and GE Monogram.</p>
      <h2>Why homeowners choose Nova</h2>
      <ul>
        <li><b>Same-day service</b> available across the ${C.cityState} metro.</li>
        <li><b>Up-front pricing</b> with a clear estimate before any work begins.</li>
        <li><b>All major brands</b> — from Samsung and LG to Sub-Zero and Wolf.</li>
        <li><b>Honest diagnostics</b> — we'll tell you when a repair makes sense and when it doesn't.</li>
      </ul>
      <p>Whether your refrigerator stopped cooling overnight or your dryer just won't heat, we're ready to help. Call us, text us, or request service online.</p>
    </div>
    <div>
      <div class="form-wrap">
        <h3>Need a repair now?</h3>
        <p class="form-note">Call or text and talk to a real technician. Same-day appointments available.</p>
        <a class="btn btn-call btn-lg" href="${telHref}" style="width:100%;margin-bottom:10px">📞 Call ${C.phoneDisplay}</a>
        <a class="btn btn-primary btn-lg" href="${smsHref}" style="width:100%;margin-bottom:10px">💬 Text Us</a>
        <a class="btn btn-ghost btn-lg" href="contact.html" style="width:100%">Request Service Online</a>
        <ul class="info-list" style="margin-top:18px">
          <li><span class="ico">📍</span><div><b>Service Area</b>${C.cityState} & surrounding metro</div></li>
          <li><span class="ico">🕒</span><div><b>Hours</b>${C.hours}</div></li>
        </ul>
      </div>
    </div>
  </div>
</section>
` + ctaBand(0) + footer(0);
  write("about.html", html);
}

/* ---------- SERVICES OVERVIEW ---------- */
function buildServicesOverview() {
  const specialized = SPECIALIZED.map((s) => `
      <div class="card">
        <h3>${s.name}</h3>
        <p>${s.intro}</p>
        <ul class="checklist">
          ${s.issues.map((i) => `<li>${i}</li>`).join("\n          ")}
        </ul>
      </div>`).join("");

  const html = head(0, {
    title: `Appliance Repair Services | ${C.name}`,
    desc: `Refrigerator, freezer, washer, dryer, dishwasher, oven, cooktop, and microwave repair in ${C.cityState}. Sealed-system and built-in refrigeration specialists.`,
    canonical: "services.html",
  }) + header(0, "services")
    + pageHero(0, { title: "Appliance Repair Services", sub: "Expert residential repair for every major appliance in your home — plus specialized refrigeration services.", crumbs: "Services" })
    + `
<section class="section">
  <div class="container">
    <div class="grid grid-3">
      ${serviceCards(0)}
    </div>
  </div>
</section>

<section class="section alt">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Specialized</span>
      <h2>Specialized Refrigeration Services</h2>
      <p>Advanced repairs many shops won't take on.</p>
    </div>
    <div class="grid grid-2">
      ${specialized}
    </div>
  </div>
</section>
` + ctaBand(0) + footer(0);
  write("services.html", html);
}

/* ---------- INDIVIDUAL SERVICE PAGES ---------- */
function buildServicePages() {
  SERVICES.forEach((s) => {
    const others = SERVICES.filter((o) => o.slug !== s.slug).slice(0, 4);
    const html = head(1, {
      title: `${s.name} in ${C.cityState} | ${C.name}`,
      desc: `${s.blurb} Same-day ${s.name.toLowerCase()} for all major brands in the ${C.cityState} metro. Call ${C.phoneDisplay}.`,
      canonical: "services/" + s.slug + ".html",
    }) + header(1, "services")
      + pageHero(1, {
          title: s.name,
          sub: s.blurb,
          crumbs: `<a href="${rel(1, "services.html")}">Services</a> › ${s.name}`,
        })
      + `
<section class="section">
  <div class="container split">
    <div class="prose">
      <p>${s.intro}</p>
      <h2>Common ${s.name.replace(" Repair", "")} problems we fix</h2>
      <ul class="checklist">
        ${s.issues.map((i) => `<li>${i}</li>`).join("\n        ")}
      </ul>
      <h2>All major brands serviced</h2>
      <p>We repair ${BRANDS.join(", ")}, and more — including high-end and built-in models.</p>
      <h2>Same-day service across the ${C.cityState} metro</h2>
      <p>We serve ${AREAS.map((a) => a.name).join(", ")}. Call or request service online and we'll get you scheduled — often the same day.</p>
    </div>
    <div>
      <div class="form-wrap">
        <h3>Request ${s.name}</h3>
        <p class="form-note">Talk to a real technician. Same-day appointments available.</p>
        <a class="btn btn-call btn-lg" href="${telHref}" style="width:100%;margin-bottom:10px">📞 Call ${C.phoneDisplay}</a>
        <a class="btn btn-primary btn-lg" href="${smsHref}" style="width:100%;margin-bottom:10px">💬 Text Us</a>
        <a class="btn btn-ghost btn-lg" href="${rel(1, "contact.html")}" style="width:100%">Schedule Online</a>
      </div>
      <div class="card" style="margin-top:22px">
        <h3>Other Repairs</h3>
        <ul class="info-list">
          ${others.map((o) => `<li><span class="ico ico-img"><img src="${rel(1, "assets/icons/" + o.slug + ".svg")}" alt="" width="24" height="24"></span><div><a href="${o.slug}.html"><b>${o.name}</b></a></div></li>`).join("\n          ")}
        </ul>
      </div>
    </div>
  </div>
</section>
` + ctaBand(1) + footer(1);
    write("services/" + s.slug + ".html", html);
  });
}

/* ---------- SERVICE AREAS OVERVIEW ---------- */
function buildAreasOverview() {
  const html = head(0, {
    title: `Service Areas | ${C.name}`,
    desc: `Nova provides appliance and refrigerator repair across the ${C.cityState} metro: ${AREAS.map((a) => a.name).join(", ")}.`,
    canonical: "service-areas.html",
  }) + header(0, "areas")
    + pageHero(0, { title: "Service Areas", sub: `Proudly serving ${C.cityState} and communities across the metro with same-day appliance repair.`, crumbs: "Service Areas" })
    + `
<section class="section">
  <div class="container">
    <div class="area-grid">
      ${areaLinks(0)}
    </div>
  </div>
</section>
<section class="section alt">
  <div class="container" style="text-align:center">
    <iframe class="map-embed" loading="lazy" title="Service area map"
      src="https://www.google.com/maps?q=${encodeURIComponent(C.mapQuery)}&output=embed"></iframe>
  </div>
</section>
` + ctaBand(0) + footer(0);
  write("service-areas.html", html);
}

/* ---------- INDIVIDUAL AREA PAGES ---------- */
function buildAreaPages() {
  AREAS.forEach((a) => {
    const html = head(1, {
      title: `Appliance & Refrigerator Repair in ${a.name}, TX | ${C.name}`,
      desc: `Same-day appliance and refrigerator repair in ${a.name}, TX. Refrigerator, washer, dryer, oven, and more. Call ${C.phoneDisplay}.`,
      canonical: "areas/" + a.slug + ".html",
    }) + header(1, "areas")
      + pageHero(1, {
          title: `Appliance &amp; Refrigerator Repair in ${a.name}, TX`,
          sub: `Fast, reliable residential appliance repair for ${a.name} homeowners — same-day service available.`,
          crumbs: `<a href="${rel(1, "service-areas.html")}">Service Areas</a> › ${a.name}`,
        })
      + `
<section class="section">
  <div class="container split">
    <div class="prose">
      <p>Need appliance repair in ${a.name}? ${C.name} provides fast, dependable residential repair throughout ${a.name} and the greater ${C.cityState} area. Our technicians handle refrigeration and every major home appliance — often the same day.</p>
      <h2>Repairs we offer in ${a.name}</h2>
      <ul class="checklist">
        ${SERVICES.map((s) => `<li><a href="${rel(1, "services/" + s.slug + ".html")}">${s.name}</a></li>`).join("\n        ")}
      </ul>
      <h2>Refrigeration specialists</h2>
      <p>We're sealed-system specialists with experience on high-end and built-in refrigeration including Sub-Zero, Thermador, Viking, Bosch, and GE Monogram — serving ${a.name} and nearby.</p>
      <h2>All major brands serviced</h2>
      <p>${BRANDS.join(", ")}, and more.</p>
    </div>
    <div>
      <div class="form-wrap">
        <h3>Book Repair in ${a.name}</h3>
        <p class="form-note">Same-day appointments available. Talk to a real technician.</p>
        <a class="btn btn-call btn-lg" href="${telHref}" style="width:100%;margin-bottom:10px">📞 Call ${C.phoneDisplay}</a>
        <a class="btn btn-primary btn-lg" href="${smsHref}" style="width:100%;margin-bottom:10px">💬 Text Us</a>
        <a class="btn btn-ghost btn-lg" href="${rel(1, "contact.html")}" style="width:100%">Schedule Online</a>
      </div>
      <iframe class="map-embed" style="margin-top:22px;height:240px" loading="lazy" title="${a.name} map"
        src="https://www.google.com/maps?q=${encodeURIComponent(a.name + ", TX")}&output=embed"></iframe>
    </div>
  </div>
</section>
` + ctaBand(1) + footer(1);
    write("areas/" + a.slug + ".html", html);
  });
}

/* ---------- OUR WORK ---------- */
function buildOurWork() {
  const html = head(0, {
    title: `Our Work | ${C.name}`,
    desc: `A gallery of completed appliance and refrigeration repairs by ${C.name} in the ${C.cityState} metro — coming soon.`,
    canonical: "our-work.html",
  }) + header(0, "work")
    + pageHero(0, { title: "Our Work", sub: "A look at recent appliance and refrigeration repairs we've completed across the metro.", crumbs: "Our Work" })
    + `
<section class="section">
  <div class="container">
    <div class="coming-soon">
      <div class="coming-soon-icon">🛠️</div>
      <h2>Coming Soon</h2>
      <p>We're putting together a gallery of our completed repairs and projects. Check back soon to see our work in action.</p>
      <div class="hero-cta" style="justify-content:center">
        <a class="btn btn-call btn-lg" href="${telHref}">📞 Call ${C.phoneDisplay}</a>
        <a class="btn btn-ghost btn-lg" href="contact.html">Request Service</a>
      </div>
    </div>
  </div>
</section>
` + ctaBand(0) + footer(0);
  write("our-work.html", html);
}

/* ---------- CONTACT ---------- */
function buildContact() {
  const serviceOptions = SERVICES.map((s) => `<option>${s.name}</option>`).join("\n              ");
  const html = head(0, {
    title: `Contact Us | ${C.name}`,
    desc: `Contact ${C.name} for same-day appliance and refrigerator repair in ${C.cityState}. Call, text, or request service online.`,
    canonical: "contact.html",
  }) + header(0, "contact")
    + pageHero(0, { title: "Contact Us & Request Service", sub: "Call, text, or send a request — same-day appointments available across the metro.", crumbs: "Contact" })
    + `
<section class="section">
  <div class="container split">
    <div>
      <h2>Request Service</h2>
      <p>Tell us about your appliance and we'll get back to you fast. For the quickest response, call or text us directly.</p>
      <div class="form-wrap">
        <div class="form-success" role="status" style="display:none"></div>
        <form id="service-form" method="POST" action="https://api.web3forms.com/submit" novalidate>
          <input type="hidden" name="access_key" value="${C.web3formsKey}">
          <input type="hidden" name="subject" value="New Service Request — ${C.name}">
          <input type="hidden" name="from_name" value="${C.name} Website">
          <input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" style="display:none" aria-hidden="true">
          <div class="form-row">
            <div class="field">
              <label for="name">Full Name</label>
              <input id="name" name="name" type="text" required autocomplete="name">
            </div>
            <div class="field">
              <label for="phone">Phone</label>
              <input id="phone" name="phone" type="tel" required autocomplete="tel">
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" autocomplete="email">
            </div>
            <div class="field">
              <label for="city">City</label>
              <select id="city" name="city">
                ${AREAS.map((a) => `<option>${a.name}</option>`).join("\n                ")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="appliance">Appliance / Service Needed</label>
              <select id="appliance" name="appliance">
              ${serviceOptions}
                <option>Other</option>
              </select>
            </div>
            <div class="field">
              <label for="brand">Appliance Brand</label>
              <input id="brand" name="brand" type="text" placeholder="e.g. Samsung, Sub-Zero">
            </div>
          </div>
          <div class="field">
            <label for="urgency"><input type="checkbox" id="urgency" name="urgency" style="width:auto;margin-right:8px"> This is an emergency — I need same-day service</label>
          </div>
          <div class="field">
            <label for="message">Describe the Problem</label>
            <textarea id="message" name="message" placeholder="What's happening with your appliance?"></textarea>
          </div>
          <button class="btn btn-call btn-lg" type="submit" style="width:100%">Request Service</button>
          <p class="form-note" style="margin-top:12px">By submitting, you agree to be contacted about your repair request. Submissions are delivered by email via Web3Forms.</p>
        </form>
      </div>
    </div>
    <div>
      <h2>Get in Touch</h2>
      <ul class="info-list">
        <li><span class="ico">📞</span><div><b>Call</b><a href="${telHref}">${C.phoneDisplay}</a></div></li>
        <li><span class="ico">💬</span><div><b>Text</b><a href="${smsHref}">${C.phoneDisplay}</a></div></li>
        <li><span class="ico">✉️</span><div><b>Email</b><a href="mailto:${C.email}">${C.email}</a></div></li>
        <li><span class="ico">📍</span><div><b>Service Area</b>${C.cityState} & surrounding metro</div></li>
        <li><span class="ico">🕒</span><div><b>Hours</b>${C.hours}</div></li>
      </ul>
      <div style="margin:18px 0">
        <a class="btn btn-call btn-lg" href="${telHref}" style="width:100%;margin-bottom:10px">📞 Call Now</a>
        <a class="btn btn-primary btn-lg" href="${smsHref}" style="width:100%">💬 Text Us</a>
      </div>
      <iframe class="map-embed" loading="lazy" title="Service area map"
        src="https://www.google.com/maps?q=${encodeURIComponent(C.mapQuery)}&output=embed"></iframe>
    </div>
  </div>
</section>
` + ctaBand(0) + footer(0);
  write("contact.html", html);
}

/* ----------------------------------------------------------------------- */
/* SITEMAP + ROBOTS                                                        */
/* ----------------------------------------------------------------------- */
/* Every URL listed here must match the page's <link rel="canonical">.
 * The home page is canonicalised to the bare domain, so it is listed as "". */
function siteUrls() {
  return [
    { loc: "",                    changefreq: "weekly",  priority: "1.0" },
    { loc: "services.html",       changefreq: "monthly", priority: "0.9" },
    { loc: "service-areas.html",  changefreq: "monthly", priority: "0.9" },
    { loc: "contact.html",        changefreq: "monthly", priority: "0.9" },
    ...SERVICES.map((s) => ({ loc: "services/" + s.slug + ".html", changefreq: "monthly", priority: "0.8" })),
    ...AREAS.map((a) => ({ loc: "areas/" + a.slug + ".html", changefreq: "monthly", priority: "0.7" })),
    { loc: "about.html",          changefreq: "yearly",  priority: "0.6" },
    { loc: "our-work.html",       changefreq: "monthly", priority: "0.6" },
  ];
}

function buildSitemap() {
  const base = `https://${C.domain}/`;
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = siteUrls()
    .map((u) => `  <url>
    <loc>${base}${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`)
    .join("\n");

  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
}

function buildRobots() {
  const base = `https://${C.domain}/`;
  write("robots.txt", `User-agent: *
Allow: /

Sitemap: ${base}sitemap.xml
`);
}

/* ----------------------------------------------------------------------- */
/* RUN                                                                     */
/* ----------------------------------------------------------------------- */
console.log("Building " + C.name + " site...");
buildHome();
buildAbout();
buildServicesOverview();
buildServicePages();
buildAreasOverview();
buildAreaPages();
buildOurWork();
buildContact();
buildSitemap();
buildRobots();
console.log("Done.");
