const API_URL = '/api';

// Initialize checkout
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadCheckoutData();
  setupCheckoutForm();
});

// Check authentication
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login first');
    window.location.href = '/';
  }
}

// Load checkout data
function loadCheckoutData() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (cart.length === 0) {
    alert('Your cart is empty');
    window.location.href = '/';
    return;
  }

  // Display order items with per-item discount info
  const orderItems = document.getElementById('orderItems');
  orderItems.innerHTML = cart.map(item => {
    const discountedPrice = item.price;
    const originalPrice   = item.originalPrice && item.originalPrice > item.price
                              ? item.originalPrice : item.price;
    const lineTotal    = discountedPrice * item.quantity;
    const origTotal    = originalPrice   * item.quantity;
    const savedAmount  = origTotal - lineTotal;
    const hasDiscount  = savedAmount > 0;

    return `
      <div class="order-item">
        <div style="flex:1;">
          <div class="order-item-name">${item.name}</div>
          <small style="color:#64748b;">Qty: ${item.quantity}</small>
          ${hasDiscount ? `<small style="display:block;color:#16a34a;font-weight:600;">
            🏷️ You save ₹${savedAmount.toFixed(0)} on this item
          </small>` : ''}
        </div>
        <div style="text-align:right;">
          <div class="order-item-price">₹${lineTotal}</div>
          ${hasDiscount ? `<small style="text-decoration:line-through;color:#94a3b8;">₹${origTotal}</small>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // MRP = sum of originalPrice × qty; payable = sum of discounted price × qty
  const mrpTotal     = cart.reduce((sum, item) => {
    const orig = (item.originalPrice && item.originalPrice > item.price) ? item.originalPrice : item.price;
    return sum + (orig * item.quantity);
  }, 0);
  const payableTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = mrpTotal - payableTotal;

  document.getElementById('mrpTotal').textContent   = mrpTotal;
  document.getElementById('orderTotal').textContent = payableTotal;

  if (totalDiscount > 0) {
    document.getElementById('discountAmount').textContent = totalDiscount.toFixed(0);
    document.getElementById('discountRow').style.display  = 'flex';
  } else {
    document.getElementById('discountRow').style.display = 'none';
  }

  // Pre-fill user email if available
  if (user.email) {
    document.getElementById('customerEmail').value = user.email;
  }
}

// Setup checkout form
function setupCheckoutForm() {
  document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
}

// Handle checkout
async function handleCheckout(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn.disabled) return;
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Processing...';

  const token = localStorage.getItem('token');
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  console.log('Checkout Debug:', { hasToken: !!token, hasUser: !!user._id, cartItems: cart.length });

  // Validate authentication
  if (!token) {
    alert('Session expired. Please login again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order';
    window.location.href = '/';
    return;
  }

  if (!user._id) {
    console.error('User data missing:', user);
    alert('User data missing. Please login again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    return;
  }

  if (cart.length === 0) {
    alert('Your cart is empty');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order';
    return;
  }

  const customerDetails = {
    name:    document.getElementById('customerName').value,
    email:   document.getElementById('customerEmail').value,
    phone:   document.getElementById('customerPhone').value,
    address: document.getElementById('customerAddress').value
  };

  // Validate customer details
  if (!customerDetails.name || !customerDetails.email || !customerDetails.phone || !customerDetails.address) {
    alert('Please fill all delivery details');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order';
    return;
  }

  const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
  if (!paymentMethodEl) {
    alert('Please select a payment method');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order';
    return;
  }

  const paymentMethod = paymentMethodEl.value;

  // Use discounted price (item.price) — this is what the customer pays
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const checkoutRequest = {
    items: cart,
    customerDetails,
    totalPrice,
    paymentMethod
  };

  console.log('✓ Checkout validation passed, storing request...');

  // Store checkout request with user ID to prevent cross-user collision
  const checkoutKey = `checkout_${user._id}`;
  sessionStorage.setItem(checkoutKey, JSON.stringify(checkoutRequest));
  
  console.log('✓ Redirecting to order confirmation...');
  
  // Redirect to order confirmation page
  submitBtn.disabled = false;
  submitBtn.textContent = 'Place Order';
  window.location.href = '/order-confirmation';
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  window.location.href = '/';
}
