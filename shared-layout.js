"use strict";

function warrantyMarkup(warranty) {
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  return `<section class="section alt warranty-section" aria-labelledby="warranty-heading">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Our commitment</span>
      <h2 id="warranty-heading">${esc(warranty.heading)}</h2>
      <p>${esc(warranty.intro)}</p>
    </div>
    <div class="grid grid-2 warranty-grid">
      ${warranty.cards.map((card) => `<div class="warranty-card"><span class="warranty-duration">${esc(card.duration)}</span><h3>${esc(card.title)}</h3><p>${esc(card.description)}</p></div>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

function block(html, type) {
  if (type === "header") {
    const header = /<header\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][^>]*>/i.exec(html);
    if (!header) return null;
    const topbar = /<div\b[^>]*class=["'][^"']*\btopbar\b[^"']*["'][^>]*>/i.exec(html.slice(0, header.index));
    const start = topbar ? topbar.index : header.index;
    const closing = html.toLowerCase().indexOf("</header>", header.index);
    return closing < 0 ? null : { start, end: closing + 9, html: html.slice(start, closing + 9) };
  }
  if (type === "cta" || type === "warranty") {
    const className = type === "cta" ? "cta-band" : "warranty-section";
    const opening = new RegExp(`<section\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, "i").exec(html);
    if (!opening) return null;
    const closing = html.toLowerCase().indexOf("</section>", opening.index);
    return closing < 0 ? null : { start: opening.index, end: closing + 10, html: html.slice(opening.index, closing + 10) };
  }
  const footer = /<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][^>]*>/i.exec(html);
  if (!footer) return null;
  const closing = html.toLowerCase().indexOf("</footer>", footer.index);
  if (closing < 0) return null;
  let end = closing + 9;
  const mobile = /^\s*<div\b[^>]*class=["'][^"']*\bmobile-callbar\b[^"']*["'][^>]*>/i.exec(html.slice(end));
  if (mobile) {
    const mobileEnd = html.toLowerCase().indexOf("</div>", end + mobile[0].length);
    if (mobileEnd >= 0) end = mobileEnd + 6;
  }
  return { start: footer.index, end, html: html.slice(footer.index, end) };
}

function serviceCards(html) {
  return [...html.matchAll(/<a\b[^>]*class=["'][^"']*\bservice-card\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi)].map(([card]) => card);
}

function normalized(fragment, pagePath) {
  const base = new URL(pagePath, "https://nova.invalid/");
  return fragment.replace(/\b(href|src)=(['"])(.*?)\2/gi, (match, attribute, quote, value) => {
    if (/^(?:\/|#|[a-z][a-z\d+.-]*:)/i.test(value)) return match;
    const target = new URL(value, base);
    const pathname = attribute.toLowerCase() === "href" ? target.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "") : target.pathname;
    return `${attribute}=${quote}${pathname}${target.search}${target.hash}${quote}`;
  });
}

function removeActive(tag) {
  tag = tag.replace(/\saria-current=(['"])page\1/gi, "");
  return tag.replace(/\sclass=(['"])([^'"]*)\1/i, (match, quote, classes) => {
    const kept = classes.split(/\s+/).filter((name) => name && name !== "active");
    return kept.length ? ` class=${quote}${kept.join(" ")}${quote}` : "";
  });
}
function addActive(tag, aria = false) {
  tag = removeActive(tag);
  tag = /\sclass=(['"])([^'"]*)\1/i.test(tag)
    ? tag.replace(/\sclass=(['"])([^'"]*)\1/i, (_, quote, classes) => ` class=${quote}${classes} active${quote}`)
    : tag.replace(/>$/, ' class="active">');
  return aria ? tag.replace(/>$/, ' aria-current="page">') : tag;
}
function activeLinks(fragment) {
  return new Set([...fragment.matchAll(/<a\b[^>]*>/gi)]
    .filter(([tag]) => /\bclass=(['"])[^'"]*\bactive\b[^'"]*\1/i.test(tag))
    .map(([tag]) => /\bhref=(['"])(.*?)\1/i.exec(tag)?.[2]).filter(Boolean));
}
function withPageState(shared, generated, pagePath) {
  const active = activeLinks(normalized(generated, pagePath));
  return shared.replace(/<a\b[^>]*>/gi, (tag) => {
    const href = /\bhref=(['"])(.*?)\1/i.exec(tag)?.[2];
    return href && active.has(href) ? addActive(tag, true) : removeActive(tag);
  }).replace(/<details\b[^>]*\bclass=(['"])[^'"]*\bnav-group\b[^'"]*\1[^>]*>[\s\S]*?<\/details>/gi, (details) => {
    const hasActiveLink = /<a\b[^>]*\bclass=(['"])[^'"]*\bactive\b[^'"]*\1/i.test(details);
    return details.replace(/<summary\b[^>]*>/i, (tag) => hasActiveLink ? addActive(tag) : removeActive(tag));
  });
}

function apply(html, layout, pagePath, generatedHtml = html) {
  for (const type of ["header", "cta", "warranty", "footer"]) {
    if (!layout?.[type]) continue;
    const current = block(html, type);
    if (!current) continue;
    const generated = block(generatedHtml, type);
    const replacement = type === "header" && generated
      ? withPageState(layout.header, generated.html, pagePath)
      : layout[type];
    html = html.slice(0, current.start) + replacement + html.slice(current.end);
  }
  if (Array.isArray(layout?.serviceCards) && layout.serviceCards.length === serviceCards(html).length) {
    let index = 0;
    html = html.replace(/<a\b[^>]*class=["'][^"']*\bservice-card\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, () => layout.serviceCards[index++]);
  }
  return html;
}

module.exports = { block, serviceCards, normalized, apply, warrantyMarkup };
