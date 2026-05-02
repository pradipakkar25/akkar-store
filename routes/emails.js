const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { sendOfferBroadcast, sendPaymentQuery } = require('../services/emailService');
const router = express.Router();

// ─── Broadcast offer to all users (admin only) ───────────────────────────────
router.post('/broadcast-offer', verifyToken, isAdmin, [
  body('offerTitle').trim().notEmpty().withMessage('Offer title is required'),
  body('offerBody').trim().notEmpty().withMessage('Offer body is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { offerTitle, offerBody, offerImage } = req.body;

    // Get all non-admin users
    const users = await User.find({ isAdmin: false }, 'name email');
    if (!users.length) {
      return res.json({ message: 'No users to send to', sent: 0 });
    }

    // Send broadcast non-blocking
    sendOfferBroadcast({ recipients: users, offerTitle, offerBody, offerImage })
      .then(sent => console.log(`Broadcast sent to ${sent} users`))
      .catch(err => console.error('Broadcast error:', err.message));

    res.json({ message: `Sending offer to ${users.length} users...`, total: users.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── Payment query from customer ─────────────────────────────────────────────
router.post('/payment-query', verifyToken, [
  body('queryMessage').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { orderId, queryMessage } = req.body;

    // Get user details from token
    const user = await User.findById(req.userId, 'name email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Send query non-blocking
    sendPaymentQuery({
      customerName:  user.name,
      customerEmail: user.email,
      orderId:       orderId || 'Not specified',
      queryMessage
    })
      .catch(err => console.error('Payment query email error:', err.message));

    res.json({ message: 'Your query has been sent. We will reply within 24 hours.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
