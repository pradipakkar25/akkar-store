const multer = require('multer');
const path = require('path');
const fs = require('fs');

console.log('ℹ Using local storage for all file uploads');

// ─── Product image upload ────────────────────────────────────────────────────
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, 'product-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});

const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    /jpeg|jpg|png|gif|webp/.test(file.mimetype) ? cb(null, true) : cb(new Error('Images only'));
  }
});

// ─── Banner image upload ─────────────────────────────────────────────────────
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/banners');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, 'banner-' + Date.now() + path.extname(file.originalname));
  }
});

const uploadBanner = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    /jpeg|jpg|png|gif|webp/.test(file.mimetype) ? cb(null, true) : cb(new Error('Images only'));
  }
});

// ─── Payment proof upload ─────────────────────────────────────────────────────
const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/payment-proofs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `payment-proof-${req.params?.id || 'new'}-${Date.now()}${ext}`);
  }
});

const uploadPayment = multer({
  storage: paymentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Helper: get the public URL from an uploaded file
function getFileUrl(file, localPrefix = '/uploads/') {
  if (!file) return null;
  return `${localPrefix}${file.filename}`;
}

module.exports = { uploadProduct, uploadBanner, uploadPayment, getFileUrl };
