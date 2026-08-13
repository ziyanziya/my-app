const asyncHandler = require('../middlewares/asyncHandler');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'adhan');
const SETTINGS_FILE = path.resolve(UPLOAD_DIR, 'settings.json');

function safeName(name) {
  return path.basename(name);
}

exports.list = asyncHandler(async (req, res) => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    return res.json({ success: true, data: [] });
  }
  const files = fs.readdirSync(UPLOAD_DIR).map((f) => ({
    name: f,
    url: `${req.protocol}://${req.get('host')}/uploads/adhan/${encodeURIComponent(f)}`,
  }));
  res.json({ success: true, data: files });
});

exports.upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    const err = new Error('لم يتم إرفاق ملف.'); err.status = 400; throw err;
  }
  const file = req.file;
  res.status(201).json({ success: true, data: { name: file.filename, url: `${req.protocol}://${req.get('host')}/uploads/adhan/${encodeURIComponent(file.filename)}` } });
});

exports.remove = asyncHandler(async (req, res) => {
  const name = safeName(req.params.name);
  const target = path.join(UPLOAD_DIR, name);
  if (!target.startsWith(UPLOAD_DIR)) {
    const err = new Error('اسم ملف غير صالح'); err.status = 400; throw err;
  }
  if (fs.existsSync(target)) fs.unlinkSync(target);
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
