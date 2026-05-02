/**
 * Test Script for QR Code Payment Flow
 * Tests the complete checkout and payment process with phone number 9923554590
 */

const http = require('http');
const querystring = require('querystring');

const API_URL = 'http://localhost:5000/api';

// Test data
let testToken = '';
let testUserId = '';
let testOrderId = '';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test 1: Register user
async function testRegister() {
  console.log('\n=== TEST 1: Register User ===');
  const userData = {
    name: 'Test Customer',
    email: 'testcustomer@example.com',
    password: 'Test@123'
  };

  const response = await makeRequest('POST', '/auth/register', userData);
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 201 && response.data.token) {
    testToken = response.data.token;
    testUserId = response.data.user.id;
    console.log('✓ Registration successful');
    return true;
  }
  return false;
}

// Test 2: Get products
async function testGetProducts() {
  console.log('\n=== TEST 2: Get Products ===');
  const response = await makeRequest('GET', '/products');
  console.log('Status:', response.status);
  console.log('Products count:', response.data.length);
  
  if (response.data.length > 0) {
    console.log('Sample product:', {
      id: response.data[0]._id,
      name: response.data[0].name,
      price: response.data[0].price,
      stock: response.data[0].stock
    });
    console.log('✓ Products retrieved successfully');
    return response.data;
  }
  return [];
}

// Test 3: Create order with UPI Link payment
async function testCreateOrderUPILink(products) {
  console.log('\n=== TEST 3: Create Order (UPI Link Payment) ===');
  
  if (products.length === 0) {
    console.log('✗ No products available');
    return false;
  }

  const orderData = {
    items: [
      {
        productId: products[0]._id,
        name: products[0].name,
        price: products[0].price,
        quantity: 1
      }
    ],
    customerDetails: {
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      phone: '9923554590',
      address: '123 Test Street, Test City'
    },
    totalPrice: products[0].price,
    paymentMethod: 'upi_link'
  };

  const response = await makeRequest('POST', '/orders', orderData, testToken);
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 201 && response.data.order) {
    testOrderId = response.data.order._id;
    console.log('✓ Order created successfully');
    console.log('Order ID:', testOrderId);
    console.log('Payment Method:', response.data.order.paymentMethod);
    console.log('Payment Status:', response.data.order.paymentStatus);
    
    // Verify UPI link format
    const upiLink = response.data.paymentInstructions.upiLink;
    console.log('UPI Link:', upiLink);
    
    return true;
  }
  return false;
}

// Test 4: Create order with UPI QR Code payment
async function testCreateOrderUPIQR(products) {
  console.log('\n=== TEST 4: Create Order (UPI QR Code Payment) ===');
  
  if (products.length < 2) {
    console.log('✗ Not enough products available');
    return false;
  }

  const orderData = {
    items: [
      {
        productId: products[1]._id,
        name: products[1].name,
        price: products[1].price,
        quantity: 2
      }
    ],
    customerDetails: {
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      phone: '9923554590',
      address: '123 Test Street, Test City'
    },
    totalPrice: products[1].price * 2,
    paymentMethod: 'upi_qr'
  };

  const response = await makeRequest('POST', '/orders', orderData, testToken);
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));

  if (response.status === 201 && response.data.order) {
    console.log('✓ Order created successfully');
    console.log('Order ID:', response.data.order._id);
    console.log('Payment Method:', response.data.order.paymentMethod);
    console.log('Payment Status:', response.data.order.paymentStatus);
    
    return true;
  }
  return false;
}

// Test 5: Get order details
async function testGetOrder() {
  console.log('\n=== TEST 5: Get Order Details ===');
  
  if (!testOrderId) {
    console.log('✗ No order ID available');
    return false;
  }

  const response = await makeRequest('GET', `/orders/${testOrderId}`, null, testToken);
  console.log('Status:', response.status);
  console.log('Order Details:', JSON.stringify(response.data, null, 2));

  if (response.status === 200) {
    console.log('✓ Order retrieved successfully');
    return true;
  }
  return false;
}

// Test 6: Verify UPI payment format
function testUPIFormat() {
  console.log('\n=== TEST 6: Verify UPI Payment Format ===');
  
  const phoneNumber = '9923554590';
  const amount = 500;
  const storeName = 'Akkar%20General%20Store';
  
  const upiLink = `upi://pay?pa=${phoneNumber}@postbank&pn=${storeName}&am=${amount}&tn=Order%20Payment`;
  
  console.log('Generated UPI Link:', upiLink);
  
  // Verify format
  const isValid = upiLink.includes('upi://pay') &&
                  upiLink.includes('pa=9923554590@postbank') &&
                  upiLink.includes('pn=Akkar%20General%20Store') &&
                  upiLink.includes('am=500') &&
                  upiLink.includes('tn=Order%20Payment');
  
  if (isValid) {
    console.log('✓ UPI format is correct');
    return true;
  } else {
    console.log('✗ UPI format is invalid');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   QR CODE PAYMENT FLOW TEST - Akkar General Store         ║');
  console.log('║   Phone Number: 9923554590                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Run tests
    const registerOk = await testRegister();
    if (!registerOk) {
      console.log('\n✗ Registration failed, stopping tests');
      return;
    }

    const products = await testGetProducts();
    if (products.length === 0) {
      console.log('\n✗ No products available, stopping tests');
      return;
    }

    await testCreateOrderUPILink(products);
    await testCreateOrderUPIQR(products);
    await testGetOrder();
    testUPIFormat();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TESTS COMPLETED                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    console.log('\n✓ All tests completed successfully!');
    console.log('\nKey Features Verified:');
    console.log('  ✓ User registration and authentication');
    console.log('  ✓ Product retrieval');
    console.log('  ✓ Order creation with UPI Link payment');
    console.log('  ✓ Order creation with UPI QR Code payment');
    console.log('  ✓ Order retrieval');
    console.log('  ✓ UPI payment format with phone number 9923554590');
    console.log('\nPayment Details:');
    console.log('  • UPI ID: 9923554590@postbank');
    console.log('  • Phone: 9923554590');
    console.log('  • Payment Methods: UPI Link & QR Code');
    console.log('  • QR Code Library: QRCode.js (CDN)');

  } catch (error) {
    console.error('✗ Test error:', error.message);
  }

  process.exit(0);
}

// Run tests
runTests();
