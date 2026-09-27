"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const storage = require("./storage");

const root = __dirname;
const contentFile = path.join(root, "content", "collections.json");
const homeFile = path.join(root, "content", "home.json");
const servicesFile = path.join(root, "content", "services.json");
const bundledCollections = JSON.parse(fs.readFileSync(contentFile, "utf8"));
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD || "";
const sessions = new Map();
const attempts = new Map();
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8" };

function send(res, status, body, type = "application/json; charset=utf-8", headers = {}) {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers });
  res.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
}
function bodyJson(req, limit = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on("data", (chunk) => { size += chunk.length; if (size > limit) { reject(new Error("Request too large")); req.destroy(); } else chunks.push(chunk); });
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch { reject(new Error("Invalid JSON")); } });
    req.on("error", reject);
  });
}
function bodyBytes(req, limit = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0; let tooLarge = false;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) tooLarge = true;
      else if (!tooLarge) chunks.push(chunk);
    });
    req.on("end", () => {
      if (tooLarge) { const error = new Error("Image must be under 8 MB"); error.status = 413; reject(error); }
      else resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}
function currentSession(req) {
  const match = /(?:^|; )nova_admin=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || "");
  if (!match) return false;
  const expires = sessions.get(match[1]);
  if (!expires || expires < Date.now()) { sessions.delete(match[1]); return false; }
  return true;
}
function sameOrigin(req) {
  const origin = req.headers.origin;
  return !origin || new URL(origin).host === req.headers.host;
}
function safePage(raw) {
  const name = String(raw || "").replace(/\\/g, "/");
  if (!/^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html$/.test(name) || name.startsWith("admin/")) return null;
  const full = path.resolve(root, name);
  return full.startsWith(root + path.sep) ? { name, full } : null;
}
function htmlPages() {
  const dirs = ["", "services", "areas", "blog", "work", "brands"];
  return dirs.flatMap((dir) => {
    const folder = path.join(root, dir);
    if (!fs.existsSync(folder)) return [];
    return fs.readdirSync(folder).filter((file) => file.endsWith(".html")).map((file) => path.posix.join(dir, file));
  }).sort();
}
function validateCollections(data) {
  if (!data || typeof data !== "object") throw new Error("Invalid content");
  for (const [name, field] of [["blog", "posts"], ["work", "projects"], ["brands", "profiles"]]) {
    if (!data[name] || !Array.isArray(data[name][field]) || !Array.isArray(data[name].faq)) throw new Error(`Invalid ${name} collection`);
    const slugs = new Set();
    for (const item of data[name][field]) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug || "") || slugs.has(item.slug)) throw new Error(`Invalid or duplicate ${name} slug`);
      if (!["draft", "published"].includes(item.status)) throw new Error("Status must be draft or published");
      if (name === "work" && item.gallery !== undefined) {
        if (!Array.isArray(item.gallery) || item.gallery.length > 30) throw new Error("A project gallery can contain up to 30 photos");
        for (const photo of item.gallery) {
          if (!photo || typeof photo.image !== "string" || typeof photo.alt !== "string" || typeof photo.caption !== "string" || (photo.image && !/^assets\/[\w /().-]+\.(?:png|jpe?g|webp|gif)$/i.test(photo.image))) throw new Error("Invalid project gallery photo");
        }
      }
      slugs.add(item.slug);
    }
  }
}
function validateHome(data) {
  if (!data || !Array.isArray(data.faq) || !Array.isArray(data.offers)) throw new Error("Invalid home page content");
  for (const item of data.faq) if (typeof item.question !== "string" || typeof item.answer !== "string") throw new Error("Each FAQ needs a question and answer");
  for (const offer of data.offers) {
    if (typeof offer.title !== "string" || !["published", "draft"].includes(offer.status)) throw new Error("Invalid offer");
    if (typeof offer.img !== "string" || (offer.img && !offer.img.startsWith("assets/"))) throw new Error("Offer image must be a local asset");
  }
}
function validateServices(data) {
  if (!data || typeof data.warranty?.heading !== "string" || typeof data.warranty?.intro !== "string" || !Array.isArray(data.warranty?.cards) || !data.details || typeof data.details !== "object" || !data.faq || typeof data.faq !== "object") throw new Error("Invalid service content");
  for (const card of data.warranty.cards) if (["duration", "title", "description"].some((key) => typeof card[key] !== "string")) throw new Error("Invalid warranty card");
  for (const entries of Object.values(data.details)) {
    if (!Array.isArray(entries) || entries.some((item) => typeof item.heading !== "string" || typeof item.body !== "string")) throw new Error("Invalid service detail");
  }
  for (const entries of Object.values(data.faq)) {
    if (!Array.isArray(entries) || entries.some((item) => typeof item.question !== "string" || typeof item.answer !== "string")) throw new Error("Invalid service FAQ");
  }
}
function rebuild() {
  const buildPath = path.join(root, "build.js");
  delete require.cache[require.resolve(buildPath)];
  require(buildPath);
}
function removeUnpublished(oldData, newData) {
  for (const [key, field, dir] of [["blog", "posts", "blog"], ["work", "projects", "work"], ["brands", "profiles", "brands"]]) {
    const keep = new Set(newData[key][field].filter((item) => item.status === "published").map((item) => item.slug));
    for (const item of oldData[key][field]) if (!keep.has(item.slug)) {
      const file = path.join(root, dir, `${item.slug}.html`);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
}
function notFound(req, res, pathname) {
  if (/^\/(?:assets|css|js)\//.test(pathname)) return send(res, 404, "Not found", "text/plain; charset=utf-8");
  return send(res, 404, fs.readFileSync(path.join(root, "404.html")), "text/html; charset=utf-8", { "X-Robots-Tag": "noindex, nofollow" });
}
function staticFile(req, res, pathname) {
  let name;
  try { name = decodeURIComponent(pathname).replace(/^\/+/, "") || "index.html"; }
  catch { return notFound(req, res, pathname); }
  if (name.endsWith("/")) name += "index.html";
  if (!path.posix.extname(name)) name += ".html";
  if (!/^(?:assets|css|js|services|areas|blog|work|brands)\/[\w %().-]+(?:\/[\w %().-]+)*$/.test(name) && !/^[a-z0-9-]+\.(?:html|xml|txt)$/.test(name)) return notFound(req, res, pathname);
  const full = path.resolve(root, name);
  if (!full.startsWith(root + path.sep) || !mime[path.extname(full)]) return notFound(req, res, pathname);
  fs.readFile(full, (error, data) => error ? notFound(req, res, pathname) : send(res, 200, data, mime[path.extname(full)], { "Cache-Control": "public, max-age=300" }));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;
    if (pathname === "/services/microwave-repair.html" || pathname === "/services/microwave-repair") return send(res, 301, "", "text/plain; charset=utf-8", { Location: "/services" });
    if (pathname === "/coffeeplanet/") {
      return send(res, 302, "", "text/plain; charset=utf-8", { Location: "/coffeeplanet" });
    }
    if (pathname === "/coffeeplanet") {
      return send(res, 200, fs.readFileSync(path.join(root, "admin", "index.html")), "text/html; charset=utf-8", { "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src 'self'", "X-Robots-Tag": "noindex, nofollow" });
    }
    if (pathname === "/admin/app.js" || pathname === "/admin/style.css") return send(res, 200, fs.readFileSync(path.join(root, pathname)), mime[path.extname(pathname)]);
    if (!pathname.startsWith("/admin/") && pathname.endsWith(".html")) {
      const clean = pathname === "/index.html" ? "/" : pathname.slice(0, -5);
      return send(res, 301, "", "text/plain; charset=utf-8", { Location: clean + url.search });
    }
    if (!pathname.startsWith("/admin/api/")) return staticFile(req, res, pathname);
    if (req.method !== "GET" && !sameOrigin(req)) return send(res, 403, { error: "Origin rejected" });
    if (pathname === "/admin/api/login" && req.method === "POST") {
      if (!adminPassword) return send(res, 503, { error: "Set ADMIN_PASSWORD in the hosting environment first." });
      const ip = req.socket.remoteAddress || "unknown";
      const state = attempts.get(ip) || { count: 0, since: Date.now() };
      if (Date.now() - state.since > 15 * 60 * 1000) { state.count = 0; state.since = Date.now(); }
      if (state.count >= 10) return send(res, 429, { error: "Too many attempts. Try again later." });
      const data = await bodyJson(req, 1024);
      const supplied = crypto.createHash("sha256").update(String(data.password || "")).digest();
      const expected = crypto.createHash("sha256").update(adminPassword).digest();
      if (!crypto.timingSafeEqual(supplied, expected)) { state.count++; attempts.set(ip, state); return send(res, 401, { error: "Incorrect password" }); }
      attempts.delete(ip);
      const token = crypto.randomBytes(32).toString("hex"); sessions.set(token, Date.now() + 12 * 60 * 60 * 1000);
      const secure = req.headers["x-forwarded-proto"] === "https" || req.socket.encrypted ? "; Secure" : "";
      return send(res, 200, { ok: true }, "application/json; charset=utf-8", { "Set-Cookie": `nova_admin=${token}; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=43200${secure}` });
    }
    if (!currentSession(req)) return send(res, 401, { error: "Sign in required" });
    if (pathname === "/admin/api/storage" && req.method === "GET") return send(res, 200, { mode: storage.configured ? "mysql" : "local" });
    if (pathname === "/admin/api/logout" && req.method === "POST") {
      const token = /nova_admin=([a-f0-9]{64})/.exec(req.headers.cookie || "")?.[1]; if (token) sessions.delete(token);
      return send(res, 200, { ok: true }, "application/json; charset=utf-8", { "Set-Cookie": "nova_admin=; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=0" });
    }
    if (pathname === "/admin/api/collections" && req.method === "GET") return send(res, 200, JSON.parse(fs.readFileSync(contentFile, "utf8")));
    if (/^\/admin\/api\/collection\/(?:blog|work|brands)$/.test(pathname) && req.method === "POST") {
      const name = pathname.split("/").at(-1);
      const section = await bodyJson(req, 2 * 1024 * 1024);
      const oldData = JSON.parse(fs.readFileSync(contentFile, "utf8"));
      const nextData = { ...oldData, [name]: section };
      validateCollections(nextData);
      await storage.saveContent("collections", nextData, rebuild);
      removeUnpublished(oldData, nextData);
      return send(res, 200, { ok: true });
    }
    if (/^\/admin\/api\/brands\/(?:profile|delete|meta)$/.test(pathname) && req.method === "POST") {
      const action = pathname.split("/").at(-1);
      const data = await bodyJson(req, 256 * 1024);
      const oldData = JSON.parse(fs.readFileSync(contentFile, "utf8"));
      const nextData = structuredClone(oldData);
      const profiles = nextData.brands.profiles;
      if (action === "delete") {
        const index = profiles.findIndex((item) => item.slug === data.slug);
        if (index >= 0) profiles.splice(index, 1);
      } else if (action === "profile") {
        if (!data.profile || typeof data.profile !== "object") return send(res, 400, { error: "Invalid brand profile" });
        const index = data.originalSlug ? profiles.findIndex((item) => item.slug === data.originalSlug) : -1;
        if (data.originalSlug && index < 0) return send(res, 409, { error: "Brand changed elsewhere. Reload and try again." });
        if (index < 0) profiles.push(data.profile);
        else profiles[index] = data.profile;
      } else {
        if (!data || typeof data !== "object" || Array.isArray(data) || "profiles" in data) return send(res, 400, { error: "Invalid brand page information" });
        nextData.brands = { ...nextData.brands, ...data };
      }
      validateCollections(nextData);
      await storage.saveContent("collections", nextData, rebuild);
      removeUnpublished(oldData, nextData);
      return send(res, 200, { ok: true });
    }
    if (pathname === "/admin/api/home" && req.method === "GET") return send(res, 200, JSON.parse(fs.readFileSync(homeFile, "utf8")));
    if (pathname === "/admin/api/services" && req.method === "GET") return send(res, 200, JSON.parse(fs.readFileSync(servicesFile, "utf8")));
    if (pathname === "/admin/api/services" && (req.method === "POST" || req.method === "PUT")) {
      const data = await bodyJson(req); validateServices(data);
      await storage.saveContent("services", data, rebuild);
      return send(res, 200, { ok: true });
    }
    if (pathname === "/admin/api/home" && (req.method === "POST" || req.method === "PUT")) {
      const data = await bodyJson(req); validateHome(data);
      await storage.saveContent("home", data, rebuild);
      return send(res, 200, { ok: true });
    }
    if (pathname === "/admin/api/collections" && (req.method === "POST" || req.method === "PUT")) {
      const data = await bodyJson(req); validateCollections(data);
      const oldData = JSON.parse(fs.readFileSync(contentFile, "utf8"));
      await storage.saveContent("collections", data, rebuild);
      removeUnpublished(oldData, data);
      return send(res, 200, { ok: true });
    }
    if (pathname === "/admin/api/pages" && req.method === "GET") return send(res, 200, htmlPages());
    if (pathname === "/admin/api/page" && req.method === "GET") {
      const page = safePage(url.searchParams.get("path"));
      if (!page || !fs.existsSync(page.full)) return send(res, 404, { error: "Page not found" });
      return send(res, 200, { html: fs.readFileSync(page.full, "utf8") });
    }
    if (pathname === "/admin/api/page" && (req.method === "POST" || req.method === "PUT")) {
      const contentType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
      const data = contentType === "text/html"
        ? { path: url.searchParams.get("path"), html: (await bodyBytes(req, 3 * 1024 * 1024)).toString("utf8") }
        : await bodyJson(req, 3 * 1024 * 1024);
      const page = safePage(data.path);
      if (!page || !fs.existsSync(page.full) || typeof data.html !== "string" || !/^<!doctype html>/i.test(data.html.trim())) return send(res, 400, { error: "Invalid page" });
      await storage.savePage(page.name, data.html, rebuild);
      return send(res, 200, { ok: true });
    }
    if (pathname === "/admin/api/upload" && req.method === "POST") {
      const type = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
      const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" }[type];
      if (!ext) return send(res, 415, { error: "Use PNG, JPEG, WebP, or GIF" });
      const buffer = await bodyBytes(req);
      if (!buffer.length || buffer.length > 8 * 1024 * 1024) return send(res, 400, { error: "Image must be under 8 MB" });
      const valid = ext === "png" ? buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) : ext === "jpg" ? buffer.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")) : ext === "webp" ? buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" : buffer.toString("ascii", 0, 3) === "GIF";
      if (!valid) return send(res, 400, { error: "Invalid image data" });
      const name = `${Date.now()}-${crypto.randomBytes(5).toString("hex")}.${ext}`;
      const assetPath = await storage.saveUpload(name, type, buffer);
      return send(res, 200, { path: assetPath });
    }
    return send(res, 404, { error: "Unknown endpoint" });
  } catch (error) {
    console.error(error);
    return send(res, error.status || 500, { error: error.message || "Server error" });
  }
});

storage.initialize(rebuild).then(() => {
  removeUnpublished(bundledCollections, JSON.parse(fs.readFileSync(contentFile, "utf8")));
  server.listen(port, () => console.log(`Nova site and admin running at http://localhost:${port}/ (${storage.configured ? "MySQL" : "local files"})`));
}).catch((error) => {
  console.error("Storage initialization failed:", error);
  process.exit(1);
});
