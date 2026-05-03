const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const STORE_URL = process.env.STORE_URL || 'http://localhost:5000';

// Log email service status on startup
console.log('\n═══════════════════════════════════════════════════════════');
console.log('📧 EMAIL SERVICE CONFIGURATION');
console.log('═══════════════════════════════════════════════════════════');
console.log('Resend API Key:', process.env.RESEND_API_KEY ? '✓ Configured' : '✗ Not configured');
console.log('Gmail SMTP:', (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) ? '✓ Configured' : '✗ Not configured');
console.log('Admin Email:', process.env.ADMIN_EMAIL ? `✓ ${process.env.ADMIN_EMAIL}` : '✗ Not configured (CRITICAL)');
console.log('═══════════════════════════════════════════════════════════\n');

if (!process.env.ADMIN_EMAIL) {
  console.error('⚠️  CRITICAL: ADMIN_EMAIL not set in environment variables!');
  console.error('⚠️  Admin will not receive order notifications and payment queries.');
  console.error('⚠️  Set ADMIN_EMAIL in .env file immediately!');
}

// ─── Shared email wrapper ─────────────────────────────────────────────────────
// Uses Resend if RESEND_API_KEY is set (Railway/production)
// Falls back to Gmail SMTP if EMAIL_USER + EMAIL_PASSWORD are set (localhost)
const sendMail = async ({ to, subject, html }) => {

  // ── Option 1: Resend (works on Railway, no SMTP blocking) ──
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const result = await resend.emails.send({
        from: 'Akkar Store <onboarding@resend.dev>',
        to: to,
        subject: subject,
        html: html
      });
      
      // Resend returns { id, error } or { id } on success
      if (result.error) {
        console.error(`✗ Resend failed → ${to} | ${result.error.message}`);
        return false;
      }
      
      if (result.id) {
        console.log(`✓ Email sent (Resend) → ${to} | ID: ${result.id}`);
        return true;
      }
      
      console.warn(`⚠️  Unexpected Resend response → ${to}`, result);
      return false;
      
    } catch (err) {
      console.error(`✗ Resend error → ${to} | ${err.message}`);
      return false;
    }
  }

  // ── Option 2: Gmail SMTP (localhost development) ──
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        connectionTimeout: 3000,
        socketTimeout: 3000
      });

      // Send with timeout
      const sendPromise = transporter.sendMail({
        from: `"Akkar General & Bangles Store" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });

      // Set a 5 second timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout')), 5000)
      );

      await Promise.race([sendPromise, timeoutPromise]);
      console.log(`✓ Email sent (Gmail) → ${to} | ${subject}`);
      return true;
    } catch (err) {
      console.warn(`⚠️  Email skipped (timeout/error) → ${to} | ${err.message}`);
      // Don't throw - just log and return false
      return false;
    }
  }

  // ── No email configured ──
  console.warn(`⚠️  Email skipped → ${to} | No email service configured`);
  return false;
};

// ─── Shared HTML shell ───────────────────────────────────────────────────────
const shell = (bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .wrap { max-width:600px; margin:30px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .header { background:linear-gradient(135deg,#f97316,#ea580c); padding:28px 32px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:1.6rem; letter-spacing:-0.5px; }
    .header p  { color:rgba(255,255,255,0.85); margin:4px 0 0; font-size:0.9rem; }
    .body { padding:28px 32px; color:#1e293b; }
    .body h2 { font-size:1.2rem; margin:0 0 12px; color:#0f172a; }
    .body p  { margin:0 0 12px; line-height:1.6; color:#475569; }
    table { width:100%; border-collapse:collapse; margin:16px 0; }
    th { background:#fff7ed; color:#ea580c; padding:10px 12px; text-align:left; font-size:0.85rem; }
    td { padding:10px 12px; border-bottom:1px solid #f1f5f9; font-size:0.9rem; color:#374151; }
    .total-row td { font-weight:700; color:#f97316; font-size:1rem; border-bottom:none; }
    .btn { display:inline-block; background:linear-gradient(135deg,#f97316,#ea580c); color:#fff !important; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:700; font-size:0.95rem; margin:8px 0; }
    .info-box { background:#fff7ed; border-left:4px solid #f97316; border-radius:0 8px 8px 0; padding:14px 16px; margin:16px 0; }
    .info-box p { margin:0; color:#92400e; font-size:0.9rem; }
    .footer { background:#f8fafc; padding:18px 32px; text-align:center; color:#94a3b8; font-size:0.8rem; border-top:1px solid #f1f5f9; }
    .divider { border:none; border-top:1px solid #f1f5f9; margin:20px 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🛍️ Akkar General & Bangles Store</h1>
      <p>since 1986 &bull; Quality you can trust</p>
    </div>
    <div class="body">${bodyContent}</div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Akkar General &amp; Bangles Store &bull; All rights reserved<br>
      Questions? Reply to this email or contact us at akkargeneralstore@gmail.com
    </div>
  </div>
</body>
</html>`;

// ─── Items table helper ───────────────────────────────────────────────────────
const itemsTable = (items) => `
  <table>
    <thead>
      <tr>
        <th>Product</th><th>Qty</th><th>Price</th><th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(i => `
        <tr>
          <td>${i.name}</td>
          <td>${i.quantity}</td>
          <td>₹${i.price}</td>
          <td>₹${i.price * i.quantity}</td>
        </tr>`).join('')}
    </tbody>
  </table>`;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. WELCOME EMAIL — sent on signup
// ═══════════════════════════════════════════════════════════════════════════════
const sendWelcomeEmail = async ({ name, email }) => {
  return sendMail({
    to: email,
    subject: '🎉 Welcome to Akkar General & Bangles Store!',
    html: shell(`
      <h2>Welcome, ${name}! 🎉</h2>
      <p>We're thrilled to have you as part of the <strong>Akkar General & Bangles Store</strong> family — serving quality products since 1986.</p>
      <div class="info-box">
        <p>🛍️ Browse our wide range of <strong>Groceries, Bangles & Beauty Products</strong> at the best prices.</p>
      </div>
      <p>Here's what you can do with your account:</p>
      <ul style="color:#475569;line-height:2;">
        <li>🛒 Add products to cart and checkout easily</li>
        <li>📦 Track your orders in real time</li>
        <li>🏷️ Get exclusive offers and discounts</li>
        <li>💳 Pay securely via UPI</li>
      </ul>
      <p style="text-align:center;margin-top:24px;">
        <a href="${STORE_URL}" class="btn">Start Shopping →</a>
      </p>
    `)
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ORDER CONFIRMATION — sent to customer after payment screenshot upload
// ═══════════════════════════════════════════════════════════════════════════════
const sendOrderConfirmationToCustomer = async ({ orderId, items, customerDetails, totalPrice, paymentMethod }) => {
  const upiId = 'prakash.akkar@ybl';
  const payLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Akkar%20General%20%26%20Bangles%20Store&am=${totalPrice}&cu=INR&tn=Order%20${orderId}`;

  return sendMail({
    to: customerDetails.email,
    subject: `✅ Order Received — ₹${totalPrice} | Akkar Store`,
    html: shell(`
      <h2>Your order is received! ✅</h2>
      <p>Hi <strong>${customerDetails.name}</strong>, thank you for shopping with us. We've received your payment screenshot and will verify it shortly.</p>
      <div class="info-box">
        <p><strong>Order ID:</strong> ${orderId}<br>
        <strong>Payment Method:</strong> ${paymentMethod === 'upi_link' ? 'UPI Link' : 'UPI QR Code'}<br>
        <strong>UPI ID:</strong> ${upiId}</p>
      </div>
      ${itemsTable(items)}
      <table>
        <tr class="total-row"><td>Amount to Pay</td><td>₹${totalPrice}</td></tr>
      </table>
      <p style="text-align:center;">
        <a href="${payLink}" class="btn">💳 Pay ₹${totalPrice} via UPI</a>
      </p>
      <hr class="divider">
      <h2>Delivery Details</h2>
      <p>📍 <strong>${customerDetails.address}</strong><br>📞 ${customerDetails.phone}</p>
      <p style="color:#94a3b8;font-size:0.85rem;">We'll send you another email once your payment is verified and your order is dispatched.</p>
    `)
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ORDER NOTIFICATION — sent to admin when new order arrives
// ═══════════════════════════════════════════════════════════════════════════════
const sendOrderEmailToAdmin = async ({ orderId, items, customerDetails, totalPrice }) => {
  if (!process.env.ADMIN_EMAIL) {
    console.error('❌ ADMIN_EMAIL not configured - order notification not sent');
    return false;
  }
  
  return sendMail({
    to: process.env.ADMIN_EMAIL,
    subject: `🛒 New Order ₹${totalPrice} — ${customerDetails.name}`,
    html: shell(`
      <h2>New Order Received 🛒</h2>
      <div class="info-box">
        <p><strong>Order ID:</strong> ${orderId}<br>
        <strong>Customer:</strong> ${customerDetails.name}<br>
        <strong>Email:</strong> ${customerDetails.email}<br>
        <strong>Phone:</strong> ${customerDetails.phone}<br>
        <strong>Address:</strong> ${customerDetails.address}</p>
      </div>
      ${itemsTable(items)}
      <table>
        <tr class="total-row"><td>Total</td><td>₹${totalPrice}</td></tr>
      </table>
      <p style="text-align:center;">
        <a href="${STORE_URL}/admin" class="btn">View in Admin Panel →</a>
      </p>
    `)
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. DELIVERY STATUS UPDATE — sent to customer when admin changes order status
// ═══════════════════════════════════════════════════════════════════════════════
const STATUS_INFO = {
  processing: { emoji: '⚙️', label: 'Processing', color: '#2563eb', msg: 'Your order is being prepared and will be dispatched soon.' },
  shipped:    { emoji: '🚚', label: 'Shipped',     color: '#7c3aed', msg: 'Your order is on its way! Expect delivery within 1–3 days.' },
  delivered:  { emoji: '✅', label: 'Delivered',   color: '#16a34a', msg: 'Your order has been delivered. We hope you love it!' },
  cancelled:  { emoji: '❌', label: 'Cancelled',   color: '#dc2626', msg: 'Your order has been cancelled. Contact us if this was a mistake.' },
  pending:    { emoji: '⏳', label: 'Pending',     color: '#d97706', msg: 'Your order is pending confirmation.' }
};

const sendOrderStatusEmail = async ({ orderId, customerEmail, customerName, orderStatus, items, totalPrice }) => {
  const info = STATUS_INFO[orderStatus] || STATUS_INFO.pending;
  return sendMail({
    to: customerEmail,
    subject: `${info.emoji} Order ${info.label} — Akkar Store`,
    html: shell(`
      <h2>Order Update: <span style="color:${info.color};">${info.emoji} ${info.label}</span></h2>
      <p>Hi <strong>${customerName}</strong>,</p>
      <p>${info.msg}</p>
      <div class="info-box">
        <p><strong>Order ID:</strong> ${orderId}<br>
        <strong>Status:</strong> <span style="background:${info.color}20;color:${info.color};padding:2px 10px;border-radius:999px;font-weight:700;">${info.label}</span></p>
      </div>
      ${itemsTable(items)}
      <table>
        <tr class="total-row"><td>Total</td><td>₹${totalPrice}</td></tr>
      </table>
      ${orderStatus === 'delivered' ? `
        <div style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;margin-top:16px;">
          <p style="color:#16a34a;font-weight:700;margin:0;">🙏 Thank you for shopping with us!</p>
          <a href="${STORE_URL}" class="btn" style="margin-top:12px;">Shop Again →</a>
        </div>` : ''}
    `)
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. OFFER BROADCAST — admin sends offer to all users
// ═══════════════════════════════════════════════════════════════════════════════
const sendOfferBroadcast = async ({ recipients, offerTitle, offerBody, offerImage }) => {
  const imageHtml = offerImage
    ? `<img src="${offerImage}" alt="Offer" style="width:100%;border-radius:8px;margin:16px 0;">`
    : '';

  let sent = 0;
  for (const { name, email } of recipients) {
    const ok = await sendMail({
      to: email,
      subject: `🏷️ ${offerTitle} — Akkar Store`,
      html: shell(`
        <h2>🏷️ Special Offer Just for You!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        ${imageHtml}
        <div class="info-box">
          <p style="font-size:1.05rem;font-weight:700;color:#ea580c;">${offerTitle}</p>
          <p style="margin-top:8px;">${offerBody}</p>
        </div>
        <p style="text-align:center;margin-top:20px;">
          <a href="${STORE_URL}" class="btn">🛍️ Shop the Offer →</a>
        </p>
        <p style="color:#94a3b8;font-size:0.8rem;margin-top:16px;">
          You're receiving this because you have an account at Akkar General &amp; Bangles Store.
        </p>
      `)
    });
    if (ok) sent++;
  }
  return sent;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. PAYMENT QUERY — customer sends a payment issue to admin
// ═══════════════════════════════════════════════════════════════════════════════
const sendPaymentQuery = async ({ customerName, customerEmail, orderId, queryMessage }) => {
  if (!process.env.ADMIN_EMAIL) {
    console.error('❌ ADMIN_EMAIL not configured - payment query not sent to admin');
    // Still send confirmation to customer
    return sendMail({
      to: customerEmail,
      subject: `✅ We received your payment query — Akkar Store`,
      html: shell(`
        <h2>We got your message! ✅</h2>
        <p>Hi <strong>${customerName}</strong>,</p>
        <p>Thank you for reaching out. We've received your payment query and will get back to you within <strong>24 hours</strong>.</p>
        <div class="info-box">
          <p><strong>Your message:</strong><br>${queryMessage}</p>
        </div>
        <p>If it's urgent, you can also reach us directly at <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>.</p>
      `)
    });
  }

  await sendMail({
    to: process.env.ADMIN_EMAIL,
    subject: `💬 Payment Query — ${customerName} | Order ${orderId}`,
    html: shell(`
      <h2>💬 Payment Query Received</h2>
      <div class="info-box">
        <p><strong>From:</strong> ${customerName} (${customerEmail})<br>
        <strong>Order ID:</strong> ${orderId || 'Not specified'}</p>
      </div>
      <p><strong>Message:</strong></p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px;color:#374151;line-height:1.7;">
        ${queryMessage}
      </div>
      <p style="margin-top:16px;">Reply directly to <a href="mailto:${customerEmail}">${customerEmail}</a> to respond.</p>
    `)
  });

  return sendMail({
    to: customerEmail,
    subject: `✅ We received your payment query — Akkar Store`,
    html: shell(`
      <h2>We got your message! ✅</h2>
      <p>Hi <strong>${customerName}</strong>,</p>
      <p>Thank you for reaching out. We've received your payment query and will get back to you within <strong>24 hours</strong>.</p>
      <div class="info-box">
        <p><strong>Your message:</strong><br>${queryMessage}</p>
      </div>
      <p>If it's urgent, you can also reach us directly at <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>.</p>
    `)
  });
};

module.exports = {
  sendWelcomeEmail,
  sendOrderConfirmationToCustomer,
  sendOrderEmailToAdmin,
  sendOrderStatusEmail,
  sendOfferBroadcast,
  sendPaymentQuery
};
