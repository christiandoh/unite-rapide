const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
const MAX_SIZE = 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(UPLOAD_DIR, 'proofs'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIMES.includes(file.mimetype) && !allowedExts.includes(ext)) {
    return cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG ou HEIC.'), false);
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

module.exports = upload;
