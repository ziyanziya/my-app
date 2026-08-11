const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'activity_contents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const name = `${Date.now()}-${Math.random().toString(36).substring(2,8)}${ext}`;
    cb(null, name);
  }
});

const allowed = [
  'image/',
  'audio/',
  'video/',
  'application/pdf'
];

const fileFilter = (req, file, cb) => {
  const mimetype = file.mimetype || '';
  if (allowed.some(a => mimetype.startsWith(a))) return cb(null, true);
  return cb(new Error('Unsupported file type'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024 } });

module.exports = upload;
