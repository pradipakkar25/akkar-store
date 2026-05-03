require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const User = require('./models/User');

const app = express();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'pradipakkar557@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'pradip25082008';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

async function ensureDefaultAdmin() {
  try {
    const adminEmail = ADMIN_EMAIL.toLowerCase();
    let existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      let updated = false;

      if (!existingAdmin.isAdmin) {
        existingAdmin.isAdmin = true;
        updated = true;
      }

      const passwordMatches = await existingAdmin.comparePassword(ADMIN_PASSWORD);
      if (!passwordMatches) {
        existingAdmin.password = ADMIN_PASSWORD;
        updated = true;
      }

      if (updated) {
        await existingAdmin.save();
        console.log('Updated admin account:', adminEmail);
      } else {
        console.log('Default admin exists:', adminEmail);
      }
    } else {
      const admin = new User({
        name: ADMIN_NAME,
        email: adminEmail,
        password: ADMIN_PASSWORD,
        isAdmin: true
      });
      await admin.save();
      console.log('Default admin created:', adminEmail);
      console.log('Use password:', ADMIN_PASSWORD);
    }
  } catch (error) {
    console.error('Failed to ensure default admin user:', error.message);
  }
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await ensureDefaultAdmin();

  // Log Cloudinary status on startup
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🚀 AKKAR STORE SERVER STARTING');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Cloudinary:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Enabled' : '✗ Disabled (using local storage)');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/categories', require('./routes/categories'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/offer-banners', require('./routes/offerBanners'));
  app.use('/api/emails', require('./routes/emails'));

  // Serve frontend
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });

  app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
  });

  app.get('/product-checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.get('/order-confirmation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'order-confirmation.html'));
  });

  // Multer error handling middleware
  app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Max 5MB allowed.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files.' });
    }
    if (err.message && err.message.includes('Images only')) {
      return res.status(400).json({ message: 'Only image files are allowed.' });
    }
    next(err);
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    // err.stack may be undefined for non-Error objects; fall back to the full error
    console.error(err.stack || err.message || err);
    res.status(500).json({ message: 'Something went wrong!', error: err.message || String(err) });
  });

  const server = app.listen(PORT, () => {
    console.log(`Akkar General Store server running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the existing server or set a different PORT.`);
      process.exit(1);
    }
    throw err;
  });
}

startServer();
