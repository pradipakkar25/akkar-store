/**
 * Quick Verification Script for Payment System
 * Verifies that the payment system is correctly configured
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   PAYMENT SYSTEM VERIFICATION - Akkar General Store       ║');
console.log('║   Phone Number: 9923554590                                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let allChecks = true;

// Check 1: Verify frontend files exist
console.log('=== CHECK 1: Frontend Files ===');
const frontendFiles = [
  'public/checkout.html',
  'public/checkout.js',
  'public/order-confirmation.html',
  'public/order-confirmation.js'
];

frontendFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file} - NOT FOUND`);
    allChecks = false;
  }
});

// Check 2: Verify backend files exist
console.log('\n=== CHECK 2: Backend Files ===');
const backendFiles = [
  'routes/orders.js',
  'models/Order.js',
  'services/emailService.js'
];

backendFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file} - NOT FOUND`);
    allChecks = false;
  }
});

// Check 3: Verify phone number in files
console.log('\n=== CHECK 3: Phone Number Configuration ===');

const filesToCheck = [
  { file: 'public/checkout.html', label: 'Checkout HTML' },
  { file: 'public/order-confirmation.html', label: 'Confirmation HTML' },
  { file: 'public/order-confirmation.js', label: 'Confirmation JS' },
  { file: 'routes/orders.js', label: 'Orders Route' }
];

filesToCheck.forEach(({ file, label }) => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('9923554590')) {
    console.log(`✓ ${label} - Phone number found`);
  } else {
    console.log(`✗ ${label} - Phone number NOT found`);
    allChecks = false;
  }
});

// Check 4: Verify UPI ID format
console.log('\n=== CHECK 4: UPI ID Configuration ===');

const upiIdFiles = [
  { file: 'public/order-confirmation.html', label: 'Confirmation HTML' },
  { file: 'public/order-confirmation.js', label: 'Confirmation JS' },
  { file: 'routes/orders.js', label: 'Orders Route' }
];

upiIdFiles.forEach(({ file, label }) => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('9923554590@postbank') || (content.includes('phoneNumber') && content.includes('@postbank'))) {
    console.log(`✓ ${label} - UPI ID format correct`);
  } else {
    console.log(`✗ ${label} - UPI ID format incorrect`);
    allChecks = false;
  }
});

// Check 5: Verify QR Code library
console.log('\n=== CHECK 5: QR Code Library ===');

const qrFiles = [
  { file: 'public/order-confirmation.html', label: 'Confirmation HTML' },
  { file: 'public/order-confirmation.js', label: 'Confirmation JS' }
];

qrFiles.forEach(({ file, label }) => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('qrcode') || content.includes('QRCode')) {
    console.log(`✓ ${label} - QR Code support found`);
  } else {
    console.log(`✗ ${label} - QR Code support NOT found`);
    allChecks = false;
  }
});

// Check 6: Verify payment methods
console.log('\n=== CHECK 6: Payment Methods ===');

const checkoutContent = fs.readFileSync('public/checkout.html', 'utf8');
if (checkoutContent.includes('upi_link') && checkoutContent.includes('upi_qr')) {
  console.log('✓ Both payment methods configured (UPI Link & QR Code)');
} else {
  console.log('✗ Payment methods not properly configured');
  allChecks = false;
}

// Check 7: Verify Order model
console.log('\n=== CHECK 7: Order Model ===');

const orderModelContent = fs.readFileSync('models/Order.js', 'utf8');
if (orderModelContent.includes('paymentMethod') && orderModelContent.includes('paymentStatus')) {
  console.log('✓ Order model has payment fields');
} else {
  console.log('✗ Order model missing payment fields');
  allChecks = false;
}

// Check 8: Verify email service
console.log('\n=== CHECK 8: Email Service ===');

const emailServiceContent = fs.readFileSync('services/emailService.js', 'utf8');
if (emailServiceContent.includes('sendOrderConfirmationToCustomer') && emailServiceContent.includes('sendOrderEmailToAdmin')) {
  console.log('✓ Email service configured');
} else {
  console.log('✗ Email service not properly configured');
  allChecks = false;
}

// Check 9: Verify test script
console.log('\n=== CHECK 9: Test Script ===');

if (fs.existsSync('scripts/testPaymentFlow.js')) {
  console.log('✓ Payment flow test script exists');
} else {
  console.log('✗ Payment flow test script NOT found');
  allChecks = false;
}

// Check 10: Verify documentation
console.log('\n=== CHECK 10: Documentation ===');

const docFiles = [
  'QR_CODE_PAYMENT_GUIDE.md',
  'PAYMENT_SYSTEM_REFERENCE.md'
];

docFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file}`);
  } else {
    console.log(`✗ ${file} - NOT FOUND`);
    allChecks = false;
  }
});

// Summary
console.log('\n╔════════════════════════════════════════════════════════════╗');
if (allChecks) {
  console.log('║                  ✓ ALL CHECKS PASSED                       ║');
} else {
  console.log('║                  ✗ SOME CHECKS FAILED                      ║');
}
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Payment System Summary
console.log('PAYMENT SYSTEM CONFIGURATION:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Phone Number:        9923554590');
console.log('UPI ID:              9923554590@postbank');
console.log('Bank:                Post Bank');
console.log('Store Name:          Akkar General Store');
console.log('Payment Methods:     UPI Link, UPI QR Code');
console.log('QR Code Library:     QRCode.js (CDN)');
console.log('Authentication:      JWT Token');
console.log('Email Notifications: Enabled');
console.log('Receipt Download:    Enabled');
console.log('Mobile Responsive:   Yes');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('PAYMENT FLOW:');
console.log('1. Customer adds products to cart');
console.log('2. Clicks "Checkout"');
console.log('3. Fills delivery details');
console.log('4. Selects payment method (UPI Link or QR Code)');
console.log('5. Clicks "Place Order"');
console.log('6. Views order confirmation with payment details');
console.log('7. Completes payment via UPI');
console.log('8. Downloads receipt with payment info\n');

console.log('TESTING:');
console.log('Run: node scripts/testPaymentFlow.js\n');

process.exit(allChecks ? 0 : 1);
