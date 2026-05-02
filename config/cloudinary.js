const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// If Cloudinary env vars are set AND not disabled, use cloud storage
// Otherwise fall back to local disk storage (for local dev without Cloudinary)
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.DISABLE_CLOUDINARY
);

if (useCloudinary) {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('✓ Cloudinary configured');
  } catch (err) {
    console.error('✗ Cloudinary config error:', err.message);
    console.log('Falling back to local storage');
  }
} else {
  console.log('ℹ Using local storage for file uploads (Cloudinary disabled or not configured)');
}

// ─── Product image upload ────────────────────────────────────────────────────
const productStorage = useCloudinary && cloudinary.config().cloud_name
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder:         'akkar-store/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
      }
    })
  : multer.diskStorage({
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
const bannerStorage = useCloudinary && cloudinary.config().cloud_name
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder:         'akkar-store/banners',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 400, height: 400, crop: 'limit', quality: 'auto' }]
      }
    })
  : multer.diskStorage({
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

// ─── Payment proof upload — Cloudinary in production, local in dev ───────────
const paymentStorage = useCloudinary && cloudinary.config().cloud_name
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder:          'akkar-store/payment-proofs',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
        resource_type:   'auto'
      }
    })
  : multer.diskStorage({
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
// Works for both Cloudinary (file.path = full URL) and local (file.filename)
function getFileUrl(file, localPrefix = '/uploads/') {
  if (!file) return null;
  if (useCloudinary) return file.path; // Cloudinary returns full URL in file.path
  return `${localPrefix}${file.filename}`;
}

module.exports = { uploadProduct, uploadBanner, uploadPayment, getFileUrl, useCloudinary };
