const express = require('express');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { uploadProduct, getFileUrl } = require('../config/cloudinary');
const router = express.Router();

// Use unified uploader (Cloudinary in production, local disk in dev)
const upload = uploadProduct;

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single product by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add product (admin only)
router.post('/', verifyToken, isAdmin, upload.single('image'), [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Delete uploaded file if validation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, price, description, category, stock } = req.body;
    const originalPrice   = req.body.originalPrice   ? parseFloat(req.body.originalPrice)   : null;
    const discountPercent = req.body.discountPercent  ? parseFloat(req.body.discountPercent)  : 0;
    const offerLabel      = req.body.offerLabel       || '';

    // Use uploaded image or fallback to provided URL or default
    let image = req.body.image;
    if (req.file) {
      image = getFileUrl(req.file, '/uploads/');
    }
    if (!image) {
      image = '/uploads/placeholder.svg';
    }

    const product = new Product({
      name,
      price,
      originalPrice,
      discountPercent,
      offerLabel,
      description,
      category,
      image,
      stock
    });

    await product.save();
    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    // Delete uploaded file if save fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product (admin only)
router.put('/:id', verifyToken, isAdmin, upload.single('image'), [
  body('name').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('description').optional().trim().notEmpty(),
  body('category').optional().trim().notEmpty(),
  body('stock').optional().isInt({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Delete uploaded file if validation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, price, description, category, stock } = req.body;

    let product = await Product.findById(req.params.id);
    if (!product) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name) product.name = name;
    if (price !== undefined) product.price = price;
    if (description) product.description = description;
    if (category) product.category = category;
    if (stock !== undefined) product.stock = stock;

    // Offer fields
    if (req.body.originalPrice !== undefined)
      product.originalPrice = req.body.originalPrice ? parseFloat(req.body.originalPrice) : null;
    if (req.body.discountPercent !== undefined)
      product.discountPercent = parseFloat(req.body.discountPercent) || 0;
    if (req.body.offerLabel !== undefined)
      product.offerLabel = req.body.offerLabel || '';
    
    // Handle image update
    if (req.file) {
      product.image = getFileUrl(req.file, '/uploads/');
    } else if (req.body.image) {
      product.image = req.body.image;
    }
    
    product.updatedAt = Date.now();

    await product.save();
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    // Delete uploaded file if save fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete image file if it's a local upload
    if (product.image && product.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '../public', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
