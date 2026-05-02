const express = require('express');
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { sendOrderEmailToAdmin, sendOrderConfirmationToCustomer, sendOrderStatusEmail } = require('../services/emailService');
const { uploadPayment, getFileUrl } = require('../config/cloudinary');
const router = express.Router();

// Use unified uploader — Cloudinary in production, local disk in dev
const upload = uploadPayment;

// Create order after payment screenshot upload (user)
router.post('/payment-request', verifyToken, upload.single('screenshot'), async (req, res) => {
  try {
    // Check for file first
    if (!req.file) {
      console.error('No payment screenshot file provided');
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }

    console.log('Payment screenshot uploaded:', req.file.filename || req.file.path);

    // Parse items and customerDetails from FormData
    let items = req.body.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        console.error('Error parsing items:', e.message);
        return res.status(400).json({ message: 'Invalid items format' });
      }
    }

    let customerDetails = req.body.customerDetails;
    if (typeof customerDetails === 'string') {
      try {
        customerDetails = JSON.parse(customerDetails);
      } catch (e) {
        console.error('Error parsing customerDetails:', e.message);
        return res.status(400).json({ message: 'Invalid customer details format' });
      }
    }

    const totalPrice = parseFloat(req.body.totalPrice);
    const paymentMethod = req.body.paymentMethod;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }
    if (!customerDetails || !customerDetails.name || !customerDetails.email) {
      return res.status(400).json({ message: 'Customer details are required' });
    }
    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({ message: 'Valid total price is required' });
    }
    if (!['upi_link', 'upi_qr'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Valid payment method is required' });
    }

    // Verify stock availability
    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
    }

    // Create order only after payment screenshot upload
    const order = new Order({
      userId: req.userId,
      items,
      customerDetails,
      totalPrice,
      paymentMethod,
      paymentStatus: 'pending',
      paymentVerificationStatus: 'pending',
      paymentScreenshot: getFileUrl(req.file, '/uploads/payment-proofs/'),
      orderStatus: 'pending'
    });

    await order.save();
    console.log('Order created with payment proof:', order._id);

    const orderDetails = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      items,
      customerDetails,
      totalPrice
    };

    // Send emails non-blocking — won't crash if email fails
    sendOrderEmailToAdmin(orderDetails)
      .catch(err => console.error('Admin email error:', err.message));
    sendOrderConfirmationToCustomer(orderDetails)
      .catch(err => console.error('Customer email error:', err.message));

    res.status(201).json({
      message: 'Order created successfully after payment proof upload',
      order,
      paymentInstructions: {
        upiLink: `upi://pay?pa=${encodeURIComponent('prakash.akkar@ybl')}&pn=Akkar%20General%20Store&am=${totalPrice}&tn=Order%20Payment`,
        message: 'Your payment proof has been uploaded and will be verified by admin.',
        upiId: 'prakash.akkar@ybl'
      }
    });
  } catch (error) {
    console.error('Error creating order with payment proof:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create order (user)
router.post('/', verifyToken, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('customerDetails.name').trim().notEmpty().withMessage('Name is required'),
  body('customerDetails.email').isEmail().withMessage('Valid email is required'),
  body('customerDetails.phone').trim().notEmpty().withMessage('Phone is required'),
  body('customerDetails.address').trim().notEmpty().withMessage('Address is required'),
  body('totalPrice').isFloat({ min: 0 }).withMessage('Valid total price is required'),
  body('paymentMethod').isIn(['upi_link', 'upi_qr']).withMessage('Valid payment method is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { items, customerDetails, totalPrice, paymentMethod } = req.body;

    // Verify stock availability
    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
    }

    // Create order
    const order = new Order({
      userId: req.userId,
      items,
      customerDetails,
      totalPrice,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending'
    });

    await order.save();

    // Send emails non-blocking — won't crash if email fails
    const orderDetails = {
      orderId: order._id,
      items,
      customerDetails,
      totalPrice
    };

    sendOrderEmailToAdmin(orderDetails)
      .catch(err => console.error('Admin email error:', err.message));
    sendOrderConfirmationToCustomer(orderDetails)
      .catch(err => console.error('Customer email error:', err.message));

    res.status(201).json({
      message: 'Order created successfully',
      order,
      paymentInstructions: {
        upiLink: `upi://pay?pa=${encodeURIComponent('prakash.akkar@ybl')}&pn=Akkar%20General%20Store&am=${totalPrice}&tn=Order%20Payment`,
        message: 'Please complete the payment using the UPI link or QR code, then upload the payment screenshot for verification.',
        upiId: 'prakash.akkar@ybl'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user orders
router.get('/user/my-orders', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).populate('items.productId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all orders (admin only)
router.get('/admin/all-orders', verifyToken, isAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.orderStatus = req.query.status;
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    const orders = await Order.find(filter).populate('userId', 'name email').populate('items.productId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single order
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is owner or admin
    if (order.userId.toString() !== req.userId && !req.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload payment screenshot for user order
router.post('/:id/upload-proof', verifyToken, upload.single('screenshot'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!req.file) {
      console.error('No screenshot file provided for order:', req.params.id);
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }

    console.log('Payment proof uploaded for order:', req.params.id, 'File:', req.file.filename || req.file.path);

    order.paymentScreenshot = getFileUrl(req.file, '/uploads/payment-proofs/');
    order.paymentVerificationStatus = 'pending';
    order.paymentStatus = 'pending';
    await order.save();

    console.log('Order updated with payment proof:', order._id);

    res.json({
      message: 'Payment screenshot uploaded successfully. Awaiting admin verification.',
      order
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel order (user - only if pending)
router.put('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only the order owner can cancel
    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Only allow cancellation if order is pending or processing
    if (!['pending', 'processing'].includes(order.orderStatus)) {
      return res.status(400).json({ message: `Cannot cancel an order that is already ${order.orderStatus}` });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status (admin only)
router.put('/:id/status', verifyToken, isAdmin, [
  body('orderStatus').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Valid status is required'),
  body('paymentStatus').optional().isIn(['pending', 'completed', 'failed']).withMessage('Valid payment status is required'),
  body('paymentVerificationStatus').optional().isIn(['none', 'pending', 'verified', 'rejected']).withMessage('Valid verification status is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { orderStatus, paymentStatus, paymentVerificationStatus } = req.body;

    let order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'completed' && order.paymentVerificationStatus !== 'verified') {
        order.paymentVerificationStatus = 'verified';
      }
      if (paymentStatus === 'failed') {
        order.paymentVerificationStatus = 'rejected';
      }
    }
    if (paymentVerificationStatus) {
      order.paymentVerificationStatus = paymentVerificationStatus;
      if (paymentVerificationStatus === 'verified') {
        order.paymentStatus = 'completed';
      }
      if (paymentVerificationStatus === 'rejected') {
        order.paymentStatus = 'failed';
      }
    }

    await order.save();

    // Send delivery status email to customer when order status changes
    if (orderStatus && ['processing', 'shipped', 'delivered', 'cancelled'].includes(orderStatus)) {
      sendOrderStatusEmail({
        orderId:       order._id,
        customerEmail: order.customerDetails.email,
        customerName:  order.customerDetails.name,
        orderStatus,
        items:         order.items,
        totalPrice:    order.totalPrice
      }).catch(() => {});
    }

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
