const express = require('express');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const OfferBanner = require('../models/OfferBanner');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { uploadBanner, getFileUrl } = require('../config/cloudinary');
const router = express.Router();

// Get all active banners (public)
router.get('/', async (req, res) => {
  try {
    const banners = await OfferBanner.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all banners (admin)
router.get('/admin/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const banners = await OfferBanner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create banner (admin) — supports optional image upload
router.post('/', verifyToken, isAdmin, uploadBanner.single('bannerImage'), [
  body('text').trim().notEmpty().withMessage('Banner text is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { text, subText, bgColor, textColor, emoji, isActive } = req.body;
    const image = req.file ? getFileUrl(req.file, '/uploads/banners/') : '';
    const banner = new OfferBanner({ text, subText, bgColor, textColor, emoji, image, isActive });
    await banner.save();
    res.status(201).json({ message: 'Banner created', banner });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle active/inactive (admin)
router.put('/:id/toggle', verifyToken, isAdmin, async (req, res) => {
  try {
    const banner = await OfferBanner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    banner.isActive = !banner.isActive;
    await banner.save();
    res.json({ message: `Banner ${banner.isActive ? 'activated' : 'deactivated'}`, banner });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete banner (admin)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const banner = await OfferBanner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    // Delete image file if exists
    if (banner.image) {
      const imgPath = path.join(__dirname, '../public', banner.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    res.json({ message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
