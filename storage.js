"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const contentFiles = {
  collections: path.join(root, "content", "collections.json"),
  home: path.join(root, "content", "home.json"),
  services: path.join(root, "content", "services.json"),
};
const overrideRoot = path.join(root, "content", "page-overrides");
const uploadsRoot = path.join(root, "assets", "uploads");
const variableNames = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const configured = variableNames.every((name) => process.env[name]);
if (!configured && variableNames.some((name) => process.env[name])) {
  throw new Error(`Incomplete database configuration: set ${variableNames.join(", ")}`);
}

const pool = configured ? require("mysql2/promise").createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  charset: "utf8mb4",
}) : null;

function writeFile(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, data, { mode: 0o600 });
  fs.renameSync(temporary, file);
}

function walk(dir, suffix = "") {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(suffix, entry.name);
    return entry.isDirectory() ? walk(path.join(dir, entry.name), relative) : [relative];
  });
}

function safeStoredPath(name) {
  return /^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html$/.test(name) && !name.startsWith("admin/");
}

async function initialize(rebuild) {
  if (!pool) {
    if (process.env.ALLOW_LOCAL_STORAGE !== "1") throw new Error("Database is required: configure DB_HOST, DB_USER, DB_PASSWORD and DB_NAME");
    return;
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS nova_content (
    content_key VARCHAR(32) PRIMARY KEY,
    body LONGTEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await pool.query(`CREATE TABLE IF NOT EXISTS nova_page_overrides (
    page_path VARCHAR(255) PRIMARY KEY,
    html LONGTEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await pool.query(`CREATE TABLE IF NOT EXISTS nova_uploads (
    asset_path VARCHAR(255) PRIMARY KEY,
    mime_type VARCHAR(64) NOT NULL,
    image_data LONGBLOB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  // Seed only missing rows. A later deployment must never overwrite admin edits.
  for (const [key, file] of Object.entries(contentFiles)) {
    await pool.execute("INSERT IGNORE INTO nova_content (content_key, body) VALUES (?, ?)", [key, fs.readFileSync(file, "utf8")]);
  }
  for (const relative of walk(overrideRoot).filter(safeStoredPath)) {
    await pool.execute("INSERT IGNORE INTO nova_page_overrides (page_path, html) VALUES (?, ?)", [relative, fs.readFileSync(path.join(overrideRoot, relative), "utf8")]);
  }
  for (const relative of walk(uploadsRoot)) {
    const assetPath = `assets/uploads/${relative}`;
    if (!/^assets\/uploads\/[a-zA-Z0-9._-]+\.(?:png|jpg|webp|gif)$/.test(assetPath)) continue;
    const mime = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif" }[path.extname(relative).slice(1)];
    await pool.execute("INSERT IGNORE INTO nova_uploads (asset_path, mime_type, image_data) VALUES (?, ?, ?)", [assetPath, mime, fs.readFileSync(path.join(uploadsRoot, relative))]);
  }

  const [documents] = await pool.query("SELECT content_key, body FROM nova_content");
  for (const row of documents) if (contentFiles[row.content_key]) writeFile(contentFiles[row.content_key], row.body);

  // Generated HTML belongs to the deployment. Remove stale overrides, then restore the DB set.
  for (const relative of walk(overrideRoot).filter(safeStoredPath)) fs.unlinkSync(path.join(overrideRoot, relative));
  const [pages] = await pool.query("SELECT page_path, html FROM nova_page_overrides");
  for (const row of pages) {
    if (safeStoredPath(row.page_path)) writeFile(path.join(overrideRoot, row.page_path), row.html);
  }
  const [uploads] = await pool.query("SELECT asset_path, image_data FROM nova_uploads");
  for (const row of uploads) {
    if (/^assets\/uploads\/[a-zA-Z0-9._-]+\.(?:png|jpg|webp|gif)$/.test(row.asset_path)) {
      writeFile(path.join(root, row.asset_path), row.image_data);
    }
  }
  rebuild();
}

async function saveContent(key, data, rebuild) {
  const file = contentFiles[key];
  if (!file) throw new Error("Unknown content type");
  const next = JSON.stringify(data, null, 2) + "\n";
  const previous = fs.readFileSync(file, "utf8");
  if (!pool) {
    writeFile(file, next);
    try { rebuild(); } catch (error) { writeFile(file, previous); rebuild(); throw error; }
    return;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("UPDATE nova_content SET body = ? WHERE content_key = ?", [next, key]);
    writeFile(file, next);
    rebuild();
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    writeFile(file, previous);
    rebuild();
    throw error;
  } finally {
    connection.release();
  }
}

async function savePage(name, html, rebuild) {
  if (!safeStoredPath(name)) throw new Error("Invalid page path");
  const file = path.join(overrideRoot, name);
  const previous = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (!pool) {
    writeFile(file, html);
    rebuild();
    return;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("INSERT INTO nova_page_overrides (page_path, html) VALUES (?, ?) ON DUPLICATE KEY UPDATE html = VALUES(html)", [name, html]);
    writeFile(file, html);
    rebuild();
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (previous === null) fs.rmSync(file, { force: true }); else writeFile(file, previous);
    rebuild();
    throw error;
  } finally {
    connection.release();
  }
}

async function saveUpload(name, mime, data) {
  const assetPath = `assets/uploads/${name}`;
  if (!/^assets\/uploads\/[a-zA-Z0-9._-]+\.(?:png|jpg|webp|gif)$/.test(assetPath)) throw new Error("Invalid upload path");
  if (pool) await pool.execute("INSERT INTO nova_uploads (asset_path, mime_type, image_data) VALUES (?, ?, ?)", [assetPath, mime, data]);
  writeFile(path.join(root, assetPath), data);
  return assetPath;
}

module.exports = { configured, initialize, saveContent, savePage, saveUpload };
