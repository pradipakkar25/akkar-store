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
  const userStr = localStorage.getItem('user');
  
  if (!token) {
    alert('Session expired. Please login first');
    window.location.href = '/';
    return;
  }

  let user = {};
  try {
    user = JSON.parse(userStr || '{}');
  } catch (e) {
    console.error('Failed to parse user:', e);
    localStorage.removeItem('user');
    alert('Session error. Please login again');
    window.location.href = '/';
    return;
  }

  if (!user._id && !user.id) {
    alert('User data corrupted. Please login again');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    return;
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

  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Validate token
    if (!token) {
      throw new Error('Session expired. Please login again.');
    }

    // Parse and validate user
    let user = {};
    try {
      user = JSON.parse(userStr || '{}');
    } catch (e) {
      throw new Error('User data corrupted. Please login again.');
    }

    const userId = user._id || user.id;
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }

    // Validate cart
    if (cart.length === 0) {
      throw new Error('Your cart is empty');
    }

    // Validate customer details
    const customerDetails = {
      name:    document.getElementById('customerName').value.trim(),
      email:   document.getElementById('customerEmail').value.trim(),
      phone:   document.getElementById('customerPhone').value.trim(),
      address: document.getElementById('customerAddress').value.trim()
    };

    if (!customerDetails.name || !customerDetails.email || !customerDetails.phone || !customerDetails.address) {
      throw new Error('Please fill all delivery details');
    }

    // Validate payment method
    const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
    if (!paymentMethodEl) {
      throw new Error('Please select a payment method');
    }

    const paymentMethod = paymentMethodEl.value;
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (totalPrice <= 0) {
      throw new Error('Invalid order total');
    }

    const checkoutRequest = {
      items: cart,
      customerDetails,
      totalPrice,
      paymentMethod
    };

    // Store checkout request with user ID to prevent cross-user collision
    const checkoutKey = `checkout_${userId}`;
    sessionStorage.setItem(checkoutKey, JSON.stringify(checkoutRequest));
    
    // Redirect to order confirmation page
    window.location.href = '/order-confirmation';

  } catch (error) {
    alert('Error: ' + error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order';
  }
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  window.location.href = '/';
}
