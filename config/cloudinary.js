const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ─── Cloudinary Configuration ────────────────────────────────────────────────
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✓ Cloudinary configured for production');
} else {
  console.log('ℹ Cloudinary not configured, using local storage for development');
}

// ─── Product image upload ────────────────────────────────────────────────────
let uploadProduct;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const productStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'akkar-store/products',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    }
  });
  uploadProduct = multer({
    storage: productStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
  });
} else {
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
  uploadProduct = multer({
    storage: productStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      /jpeg|jpg|png|gif|webp/.test(file.mimetype) ? cb(null, true) : cb(new Error('Images only'));
    }
  });
}

// ─── Banner image upload ─────────────────────────────────────────────────────
let uploadBanner;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const bannerStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'akkar-store/banners',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    }
  });
  uploadBanner = multer({
    storage: bannerStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
  });
} else {
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
  uploadBanner = multer({
    storage: bannerStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      /jpeg|jpg|png|gif|webp/.test(file.mimetype) ? cb(null, true) : cb(new Error('Images only'));
    }
  });
}

// ─── Payment proof upload ─────────────────────────────────────────────────────
let uploadPayment;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const paymentStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'akkar-store/payment-proofs',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf']
    }
  });
  uploadPayment = multer({
    storage: paymentStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
  });
} else {
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
  uploadPayment = multer({
    storage: paymentStorage,
    limits: { fileSize: 5 * 1024 * 1024 }
  });
}

// Helper: get the public URL from an uploaded file
function getFileUrl(file, localPrefix = '/uploads/') {
  if (!file) return null;
  
  console.log('getFileUrl called with:', { 
    hasSecureUrl: !!file.secure_url, 
    hasPath: !!file.path, 
    hasFilename: !!file.filename,
    fileKeys: Object.keys(file)
  });
  
  // Cloudinary file — has secure_url property
  if (file.secure_url) {
    console.log('✓ Using Cloudinary secure_url:', file.secure_url);
    return file.secure_url;
  }
  
  // Cloudinary file — fallback to path
  if (file.path) {
    console.log('✓ Using Cloudinary path:', file.path);
    return file.path;
  }
  
  // Local file
  if (file.filename) {
    const url = `${localPrefix}${file.filename}`;
    console.log('✓ Using local file:', url);
    return url;
  }
  
  console.warn('⚠️ Could not determine file URL from:', file);
  return null;
}

module.exports = { uploadProduct, uploadBanner, uploadPayment, getFileUrl };
