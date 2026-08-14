const asyncHandler = require('../middlewares/asyncHandler');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'adhan');
const SETTINGS_FILE = path.resolve(UPLOAD_DIR, 'settings.json');
const CATALOG_FILE = path.resolve(UPLOAD_DIR, 'catalog.json');

function safeName(name) {
  return path.basename(name);
}

function readCatalog() {
  try {
    if (!fs.existsSync(CATALOG_FILE)) return {};
    return JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8')) || {};
  } catch (_error) {
    return {};
  }
}

function writeCatalog(catalog) {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), 'utf8');
}

function filePayload(req, name, catalog) {
  return {
    name,
    displayName: catalog[name]?.displayName || path.parse(name).name,
    url: `${req.protocol}://${req.get('host')}/uploads/adhan/${encodeURIComponent(name)}`,
  };
}

exports.list = asyncHandler(async (req, res) => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    return res.json({ success: true, data: [] });
  }
  const catalog = readCatalog();
  const files = fs.readdirSync(UPLOAD_DIR)
    .filter((f) => f !== path.basename(SETTINGS_FILE) && f !== path.basename(CATALOG_FILE))
    .map((f) => filePayload(req, f, catalog));
  res.json({ success: true, data: files });
});

exports.upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    const err = new Error('لم يتم إرفاق ملف.'); err.status = 400; throw err;
  }
  const file = req.file;
  const catalog = readCatalog();
  const displayName = String(req.body?.displayName || req.body?.name || path.parse(file.originalname).name).trim();
  catalog[file.filename] = { displayName: displayName || path.parse(file.originalname).name };
  writeCatalog(catalog);
  res.status(201).json({ success: true, data: filePayload(req, file.filename, catalog) });
});

exports.update = asyncHandler(async (req, res) => {
  const previousName = safeName(req.params.name);
  const previousPath = path.join(UPLOAD_DIR, previousName);
  if (!fs.existsSync(previousPath)) {
    const err = new Error('Adhan file not found'); err.status = 404; throw err;
  }

  const catalog = readCatalog();
  let name = previousName;
  if (req.file) {
    name = req.file.filename;
    fs.unlinkSync(previousPath);
    delete catalog[previousName];
  }
  const currentName = catalog[name]?.displayName || path.parse(name).name;
  const displayName = String(req.body?.displayName || req.body?.name || currentName).trim();
  catalog[name] = { displayName: displayName || currentName };
  writeCatalog(catalog);
  res.json({ success: true, data: filePayload(req, name, catalog) });
});

exports.remove = asyncHandler(async (req, res) => {
  const name = safeName(req.params.name);
  const target = path.join(UPLOAD_DIR, name);
  if (!target.startsWith(UPLOAD_DIR)) {
    const err = new Error('اسم ملف غير صالح'); err.status = 400; throw err;
  }
  if (fs.existsSync(target)) fs.unlinkSync(target);
  const catalog = readCatalog();
  delete catalog[name];
  writeCatalog(catalog);
  res.json({ success: true });
});

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return { fajrFile: null, fajrEnabled: false };
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) || { fajrFile: null, fajrEnabled: false };
  } catch (e) { return { fajrFile: null, fajrEnabled: false }; }
}

function writeSettings(obj) {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(obj, null, 2), 'utf8');
    return true;
  } catch (e) { return false; }
}

exports.getSettings = asyncHandler(async (_req, res) => {
  const s = readSettings();
  res.json({ success: true, data: s });
});

exports.saveSettings = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const allowed = { fajrFile: payload.fajrFile || null, fajrEnabled: !!payload.fajrEnabled };
  const ok = writeSettings(allowed);
  if (!ok) { const err = new Error('فشل حفظ الإعدادات'); err.status = 500; throw err; }
  res.json({ success: true, data: allowed });
});
