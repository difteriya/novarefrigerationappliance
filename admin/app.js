(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const groups = { blog: { title: "Repair guides", field: "posts", singular: "guide" }, work: { title: "Our work", field: "projects", singular: "project" }, brands: { title: "Brands", field: "profiles", singular: "brand" } };
  let state = null, view = "home", selected = 0, pageList = [], pagePath = "index.html", sourceMode = false, pageHtml = "";
  let pageLayoutVersion = "", pageSharedBefore = {};
  let savedBrandMeta = "", savedBrandProfiles = new Map();
  function brandMeta() { const { profiles, ...meta } = state.brands; return meta; }
  async function saveBrands() {
    const current = new Set(state.brands.profiles);
    for (const [profile, saved] of savedBrandProfiles) if (!current.has(profile)) {
      await api("/admin/api/brands/delete", "POST", { slug: saved.slug });
      savedBrandProfiles.delete(profile);
    }
    for (const profile of state.brands.profiles) {
      const saved = savedBrandProfiles.get(profile);
      const snapshot = JSON.stringify(profile);
      if (!saved || saved.snapshot !== snapshot) {
        await api("/admin/api/brands/profile", "POST", { originalSlug: saved?.slug || null, profile });
        savedBrandProfiles.set(profile, { slug: profile.slug, snapshot });
      }
    }
    const meta = brandMeta(), snapshot = JSON.stringify(meta);
    if (snapshot !== savedBrandMeta) {
      await api("/admin/api/brands/meta", "POST", meta);
      savedBrandMeta = snapshot;
    }
  }
  async function api(url, method = "GET", data) {
    const response = await fetch(url, { method, credentials: "same-origin", headers: data ? { "Content-Type": "application/json" } : {}, body: data ? JSON.stringify(data) : undefined });
    const result = response.headers.get("content-type")?.includes("application/json") ? await response.json() : { error: response.status === 403 ? `The hosting security blocked this request (403). Contact Hostinger support${response.headers.get("x-hcdn-request-id") ? ` with request ID ${response.headers.get("x-hcdn-request-id")}` : ""} if it continues.` : `Request failed (${response.status})` };
    if (!response.ok) throw new Error(result.error || "Request failed");
    return result;
  }
  async function uploadImage(file) {
    const response = await fetch("/admin/api/upload", { method: "POST", credentials: "same-origin", headers: { "Content-Type": file.type }, body: file });
    const result = response.headers.get("content-type")?.includes("application/json") ? await response.json() : null;
    if (!response.ok) {
      const requestId = response.headers.get("x-hcdn-request-id");
      throw new Error(result?.error || (response.status === 403 ? `The hosting security blocked this image upload (403). Try a smaller image. If it continues, contact Hostinger support${requestId ? ` with request ID ${requestId}` : ""}.` : `Image upload failed (${response.status})`));
    }
    if (!result?.path) throw new Error("The upload returned an unexpected response. Please try again.");
    return result.path;
  }
  function status(message, error = false) { const el = $("#status"); el.textContent = message; el.style.color = error ? "#b3261e" : "#345e43"; }
  async function load() {
    const [collections, home, services, storage] = await Promise.all([api("/admin/api/collections"), api("/admin/api/home"), api("/admin/api/services"), api("/admin/api/storage")]);
    state = { ...collections, home, services };
    savedBrandMeta = JSON.stringify(brandMeta());
    savedBrandProfiles = new Map(state.brands.profiles.map((profile) => [profile, { slug: profile.slug, snapshot: JSON.stringify(profile) }]));
    $("#storage-mode").textContent = storage.mode === "mysql" ? "Database connected" : "Local storage · deploys can erase edits";
    pageList = await api("/admin/api/pages");
    $("#login").hidden = true; $("#app").hidden = false;
    await render();
  }
  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.target.querySelector("button"); button.disabled = true;
    try { await api("/admin/api/login", "POST", { password: $("#password").value }); $("#password").value = ""; await load(); }
    catch (error) { $("#login-message").textContent = error.message; }
    finally { button.disabled = false; }
  });
  $("#logout").addEventListener("click", async () => { await api("/admin/api/logout", "POST", {}); location.reload(); });
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", async () => {
    view = button.dataset.view; selected = 0;
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === button));
    await render();
  }));
  $("#save").addEventListener("click", async () => {
    const button = $("#save"); button.disabled = true; status("Saving…");
    try {
      if (view === "pages" || view === "contact") await savePage();
      else if (view === "home") await api("/admin/api/home", "POST", state.home);
      else if (view === "services") await api("/admin/api/services", "POST", state.services);
      else if (view === "brands") await saveBrands();
      else await api(`/admin/api/collection/${view}`, "POST", state[view]);
      status("Published successfully");
      pageList = await api("/admin/api/pages");
    } catch (error) { status(error.message, true); }
    finally { button.disabled = false; }
  });
  function at(path) { return path.reduce((value, part) => value[part], state); }
  function set(path, value) { at(path.slice(0, -1))[path.at(-1)] = value; }
  function label(key) {
    const names = { faq: "Questions", offers: "Offers", gallery: "Photo gallery", img: "Image", w: "Image width", h: "Image height", desc: "Description", unit: "Price note", badge: "Image label", alt: "Image description", warranty: "Warranty", duration: "Coverage period" };
    return names[key] || key.replace(/([A-Z])/g, " $1").replace(/[-_]/g, " ").replace(/^./, (c) => c.toUpperCase());
  }
  function template(group) {
    if (group === "blog") return { slug: "new-guide", status: "draft", title: "New repair guide", seoTitle: "", metaDescription: "", excerpt: "", datePublished: new Date().toISOString().slice(0, 10), dateModified: new Date().toISOString().slice(0, 10), author: "Nova Refrigeration & Appliance Repair", image: "", imageAlt: "", sections: [{ heading: "", paragraphs: [""] }], sources: [], faq: [] };
    if (group === "work") return { slug: "new-project", status: "draft", sample: false, title: "New project", seoTitle: "", metaDescription: "", excerpt: "", appliance: "", brand: "", area: "", image: "", imageAlt: "", gallery: [], problem: "", diagnosis: "", solution: "", faq: [] };
    return { slug: "new-brand", name: "New brand", status: "draft", logo: "", title: "", metaDescription: "", intro: "", focus: [""], sections: [{ heading: "", body: "" }], faq: [] };
  }
  function arrayTemplate(key, array, path) {
    if (key === "faq") return { question: "", answer: "" };
    if (key === "offers") return { status: "draft", img: "", w: 1200, h: 800, alt: "", badge: "", price: "", unit: "", title: "New offer", desc: "" };
    if (key === "gallery") return { image: "", alt: "", caption: "" };
    if (key === "sections") return path[0] === "brands" ? { heading: "", body: "" } : { heading: "", paragraphs: [""] };
    if (key === "sources") return { label: "", url: "https://" };
    if (array.length) return typeof array[0] === "string" ? "" : structuredClone(array[0]);
    return "";
  }
  function field(key, value, path) {
    const encoded = esc(JSON.stringify(path));
    if (Array.isArray(value)) return `<div class="nested"><h3>${esc(label(key))}</h3>${value.map((item, index) => `<div class="array-item"><div class="array-head"><strong>${esc(label(key))} ${index + 1}</strong><button type="button" data-remove="${esc(JSON.stringify([...path, index]))}">Remove</button></div>${typeof item === "object" ? Object.entries(item).map(([childKey, childValue]) => field(childKey, childValue, [...path, index, childKey])).join("") : field("Value", item, [...path, index])}</div>`).join("")}<button type="button" class="add-row" data-add="${encoded}">+ Add ${esc(key === "faq" ? "question" : key === "sections" ? "section" : "item")}</button></div>`;
    if (value && typeof value === "object") return `<div class="nested"><h3>${esc(label(key))}</h3>${Object.entries(value).map(([childKey, childValue]) => field(childKey, childValue, [...path, childKey])).join("")}</div>`;
    if (typeof value === "boolean") return `<div class="field"><label><input type="checkbox" data-field="${encoded}" ${value ? "checked" : ""}> ${esc(label(key))}</label></div>`;
    if (key === "status") return `<div class="field"><label>${esc(label(key))}</label><select data-field="${encoded}"><option value="draft" ${value === "draft" ? "selected" : ""}>Draft</option><option value="published" ${value === "published" ? "selected" : ""}>Published</option></select></div>`;
    const image = key === "image" || key === "logo" || key === "img";
    const long = /description|intro|excerpt|answer|problem|diagnosis|solution|paragraph|body|^Value$/i.test(key) && String(value).length > 75;
    const control = long ? `<textarea data-field="${encoded}">${esc(value)}</textarea>` : `<input ${typeof value === "number" ? 'type="number" min="1"' : ""} data-field="${encoded}" value="${esc(value)}">`;
    return `<div class="field"><label>${esc(label(key))}</label>${image ? `<div class="upload-row">${control}<button type="button" class="upload-button" data-upload="${encoded}">Upload</button></div>` : control}</div>`;
  }
  function bindFields(rerender) {
    document.querySelectorAll("[data-field]").forEach((input) => input.addEventListener("input", () => set(JSON.parse(input.dataset.field), input.type === "checkbox" ? input.checked : input.type === "number" ? Number(input.value) : input.value)));
    document.querySelectorAll("[data-add]").forEach((button) => button.addEventListener("click", () => { const path = JSON.parse(button.dataset.add); const array = at(path); array.push(arrayTemplate(path.at(-1), array, path)); rerender(); }));
    document.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => { const path = JSON.parse(button.dataset.remove); at(path.slice(0, -1)).splice(path.at(-1), 1); rerender(); }));
    document.querySelectorAll("[data-upload]").forEach((button) => button.addEventListener("click", async () => { try { const path = JSON.parse(button.dataset.upload); const uploaded = await pickUpload(); if (uploaded) { set(path, uploaded); rerender(); status("Image uploaded. Save to publish."); } } catch (error) { status(error.message, true); } }));
  }
  function renderHome() {
    $("#workspace").innerHTML = `<section class="panel"><h2>Home page FAQ</h2><p class="help">These questions appear on the home page and in its structured data.</p>${field("faq", state.home.faq, ["home", "faq"])}</section><section class="panel"><h2>Current offers</h2><p class="help">Add offers as drafts, upload their images, then publish when the details are approved.</p>${field("offers", state.home.offers, ["home", "offers"])}</section>`;
    bindFields(renderHome);
  }
  function renderServices() {
    const slugs = Object.keys(state.services.faq);
    const slug = slugs[selected] || slugs[0];
    const serviceName = (value) => value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const tabs = slugs.map((item, index) => `<button type="button" data-select="${index}" class="${index === selected ? "selected" : ""}"><strong>${esc(serviceName(item))}</strong><small>Service content</small></button>`).join("");
    $("#workspace").innerHTML = `<section class="panel"><h2>Warranty on all service pages</h2><p class="help">The heading, introduction, and coverage cards appear below every service.</p>${field("warranty", state.services.warranty, ["services", "warranty"])}</section><div class="collection-layout"><div class="item-list">${tabs}</div><section class="panel"><h2>${esc(serviceName(slug))} content</h2><p class="help">Service details and questions appear on this page. The questions also appear in structured data.</p>${field("details", state.services.details[slug], ["services", "details", slug])}${field("faq", state.services.faq[slug], ["services", "faq", slug])}</section></div>`;
    bindFields(renderServices);
    document.querySelectorAll("[data-select]").forEach((button) => button.addEventListener("click", () => { selected = Number(button.dataset.select); renderServices(); }));
  }
  function renderCollection() {
    const group = groups[view], data = state[view], items = data[group.field];
    if (view === "work") items.forEach((item) => { if (!Array.isArray(item.gallery)) item.gallery = []; });
    const meta = Object.entries(data).filter(([key]) => key !== group.field);
    $("#workspace").innerHTML = `<section class="panel"><h2>Page information</h2><p class="help">Edit the listing page title, search description, introduction, and questions.</p><div class="intro-fields">${meta.filter(([key]) => key !== "faq").map(([key, value]) => field(key, value, [view, key])).join("")}</div>${field("faq", data.faq, [view, "faq"])}</section><div class="collection-layout"><div class="item-list">${items.map((item, index) => `<button type="button" data-select="${index}" class="${index === selected ? "selected" : ""}"><strong>${esc(item.title || item.name || item.slug)}</strong><small>${esc(item.status)}${item.sample ? " · sample" : ""}</small></button>`).join("")}<button type="button" class="add" id="add-entry">+ Add ${group.singular}</button></div><section class="panel">${items[selected] ? `<div class="entry-head"><h2>${esc(items[selected].title || items[selected].name)}</h2><button type="button" class="danger" id="delete-entry">Delete</button></div>${items[selected].sample ? `<p class="sample-badge">Illustrative sample project</p>` : ""}${Object.entries(items[selected]).map(([key, value]) => field(key, value, [view, group.field, selected, key])).join("")}` : `<h2>No ${group.singular}s yet</h2><p>Add one to get started.</p>`}</section></div>`;
    bindFields(renderCollection);
    document.querySelectorAll("[data-select]").forEach((button) => button.addEventListener("click", () => { selected = Number(button.dataset.select); renderCollection(); }));
    $("#add-entry").addEventListener("click", () => { const item = template(view); let slug = item.slug, n = 2; while (items.some((entry) => entry.slug === slug)) slug = `${item.slug}-${n++}`; item.slug = slug; items.push(item); selected = items.length - 1; renderCollection(); });
    $("#delete-entry")?.addEventListener("click", () => { if (!confirm("Delete this item? Save to publish the removal.")) return; items.splice(selected, 1); selected = Math.max(0, selected - 1); renderCollection(); });
  }
  async function pickUpload() {
    const input = document.createElement("input"); input.type = "file"; input.accept = "image/png,image/jpeg,image/webp,image/gif";
    return new Promise((resolve, reject) => { input.onchange = async () => { const file = input.files?.[0]; if (!file) return resolve(null); if (file.size > 8 * 1024 * 1024) return reject(new Error("Image must be under 8 MB")); try { resolve(await uploadImage(file)); } catch (error) { reject(error); } }; input.click(); });
  }
  async function renderPages(contactOnly = false) {
    if (contactOnly) pagePath = "contact.html";
    $("#workspace").innerHTML = `<section class="panel"><h2>${contactOnly ? "Edit the contact page" : "Edit a site page"}</h2><p class="page-help">Click text in the preview to edit it. Click an image to replace it. Shared header, footer, call-to-action, warranty, and service cards update wherever they appear. Title and description below control how this page appears in search. All changes are saved when you press “Save and publish”.</p>${contactOnly ? "" : `<select id="page-select" class="page-select">${pageList.map((name) => `<option value="${esc(name)}" ${name === pagePath ? "selected" : ""}>${esc(name)}</option>`).join("")}</select>`}<div class="page-toolbar"><div class="field"><label>SEO title</label><input id="seo-title"></div><div class="field"><label>Meta description</label><textarea id="seo-description"></textarea></div></div><button type="button" class="toggle-source" id="toggle-source">Edit HTML source</button><iframe id="editor-frame" class="editor-frame" sandbox="allow-same-origin" title="Page editor"></iframe><textarea id="source-editor" class="source-editor" hidden spellcheck="false"></textarea><p class="muted">The HTML view also allows FAQ and schema edits. Image files can be uploaded in the visual view.</p></section>`;
    $("#page-select")?.addEventListener("change", async (event) => { pagePath = event.target.value; await loadPage(); });
    $("#toggle-source").addEventListener("click", () => { sourceMode = !sourceMode; const frame = $("#editor-frame"), source = $("#source-editor"); if (sourceMode) source.value = serializePage(); else { pageHtml = source.value; showFrame(); } frame.hidden = sourceMode; source.hidden = !sourceMode; $("#toggle-source").textContent = sourceMode ? "Edit visually" : "Edit HTML source"; });
    await loadPage();
  }
  async function loadPage() {
    const data = await api(`/admin/api/page?path=${encodeURIComponent(pagePath)}`);
    pageHtml = data.html; pageLayoutVersion = data.layoutVersion;
    pageSharedBefore = sharedMarkup(pageHtml);
    sourceMode = false; $("#source-editor").hidden = true; $("#editor-frame").hidden = false; $("#toggle-source").textContent = "Edit HTML source";
    showFrame();
  }
  function showFrame() {
    const html = pageHtml.replace(/<head>/i, '<head><base data-admin href="/">');
    $("#editor-frame").srcdoc = html;
    $("#editor-frame").onload = () => {
      const doc = $("#editor-frame").contentDocument;
      doc.designMode = "on";
      $("#seo-title").value = doc.title;
      $("#seo-description").value = doc.querySelector('meta[name="description"]')?.content || "";
      doc.addEventListener("click", async (event) => {
        if (event.target.closest("a")) event.preventDefault();
        if (event.target.tagName === "IMG") { event.preventDefault(); try { const uploaded = await pickUpload(); if (uploaded) { event.target.setAttribute("src", "/" + uploaded); status("Image uploaded. Save to publish."); } } catch (error) { status(error.message, true); } }
      }, true);
    };
  }
  function serializePage() {
    const doc = $("#editor-frame").contentDocument;
    if (!doc?.documentElement) return pageHtml;
    doc.title = $("#seo-title").value;
    const meta = doc.querySelector('meta[name="description"]'); if (meta) meta.content = $("#seo-description").value;
    const ogTitle = doc.querySelector('meta[property="og:title"]'); if (ogTitle) ogTitle.content = doc.title;
    const twitterTitle = doc.querySelector('meta[name="twitter:title"]'); if (twitterTitle) twitterTitle.content = doc.title;
    const ogDescription = doc.querySelector('meta[property="og:description"]'); if (ogDescription) ogDescription.content = $("#seo-description").value;
    const twitterDescription = doc.querySelector('meta[name="twitter:description"]'); if (twitterDescription) twitterDescription.content = $("#seo-description").value;
    doc.querySelector("base[data-admin]")?.remove();
    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  }
  function sharedMarkup(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const cards = [...doc.querySelectorAll(".service-card")].map((item) => item.outerHTML);
    return {
      header: [doc.querySelector(".topbar")?.outerHTML || "", doc.querySelector(".site-header")?.outerHTML || ""].join("\n"),
      footer: [doc.querySelector(".site-footer")?.outerHTML || "", doc.querySelector(".mobile-callbar")?.outerHTML || ""].join("\n"),
      cta: doc.querySelector(".cta-band")?.outerHTML || null,
      warranty: doc.querySelector(".warranty-section")?.outerHTML || null,
      serviceCards: cards.length ? cards : null,
    };
  }
  async function savePage() {
    const html = sourceMode ? $("#source-editor").value : serializePage();
    const shared = sharedMarkup(html);
    const changes = Object.keys(shared).filter((key) => JSON.stringify(shared[key]) !== JSON.stringify(pageSharedBefore[key]));
    const params = new URLSearchParams({ path: pagePath, layoutVersion: pageLayoutVersion, sharedChanged: changes.join(",") });
    const response = await fetch(`/admin/api/page?${params}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "text/html; charset=utf-8" }, body: html });
    const result = response.headers.get("content-type")?.includes("application/json") ? await response.json() : null;
    if (!response.ok) {
      const requestId = response.headers.get("x-hcdn-request-id");
      throw new Error(result?.error || (response.status === 403 ? `The hosting security blocked this page save (403). Contact Hostinger support${requestId ? ` with request ID ${requestId}` : ""} if it continues.` : `Page save failed (${response.status})`));
    }
    pageHtml = html; pageLayoutVersion = result.layoutVersion;
    pageSharedBefore = shared;
  }
  async function render() {
    $("#view-title").textContent = view === "home" ? "Home page" : view === "services" ? "Services" : view === "contact" ? "Contact page" : groups[view]?.title || "Site pages";
    $("#save").textContent = "Save and publish";
    if (view === "pages" || view === "contact") await renderPages(view === "contact"); else if (view === "home") renderHome(); else if (view === "services") renderServices(); else renderCollection();
  }
  api("/admin/api/collections").then(() => load()).catch(() => {});
})();
