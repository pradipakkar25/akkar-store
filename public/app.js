const API_URL = '/api';

// Store all products for filtering
let allProducts = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadCategories();
  loadProducts();
  setupEventListeners();
  loadOfferBanners();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

// Check authentication status
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (token && (user._id || user.id)) {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    document.getElementById('accountBtn').style.display = 'inline-block';
    document.getElementById('userGreeting').style.display = 'inline-block';
    document.getElementById('userGreeting').textContent = `Welcome, ${user.name}!`;
    
    if (user.isAdmin) {
      document.getElementById('adminBtn').style.display = 'inline-block';
    }
  }
}

// Load categories from API
async function loadCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const categories = await response.json();

    // Update category filter dropdown
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && Array.isArray(categories)) {
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = `${cat.icon} ${cat.name}`;
        categoryFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Load products from API
async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const products = await response.json();
    if (Array.isArray(products)) {
      allProducts = products;
      displayProducts(allProducts);
    } else {
      console.error('Products response is not an array:', products);
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Filter products based on search and category
function filterProducts() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const selectedCategory = document.getElementById('categoryFilter').value;

  const filtered = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                         product.description.toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    document.getElementById('productsList').innerHTML = '';
    document.getElementById('noProductsMsg').style.display = 'block';
  } else {
    document.getElementById('noProductsMsg').style.display = 'none';
    displayProducts(filtered);
  }
}

// Display products
function displayProducts(products) {
  const productsList = document.getElementById('productsList');
  productsList.innerHTML = '';

  if (!Array.isArray(products)) {
    console.error('Products is not an array:', products);
    return;
  }

  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.style.position = 'relative';

    // Offer badge — big and bold
    const hasOffer = product.discountPercent > 0 || product.offerLabel;
    const offerBadgeHtml = hasOffer ? `
      <div style="
        position:absolute;top:12px;left:12px;z-index:2;
        background:linear-gradient(135deg,#ef4444,#b91c1c);
        color:white;padding:0.55rem 1.1rem;border-radius:999px;
        font-size:1.05rem;font-weight:900;
        box-shadow:0 4px 16px rgba(185,28,28,0.55);
        letter-spacing:0.2px;line-height:1;
        text-shadow:0 1px 2px rgba(0,0,0,0.2);
        border:2px solid rgba(255,255,255,0.35);
      ">
        ${product.discountPercent > 0 ? `🔥 ${product.discountPercent}% OFF` : `🏷️ ${product.offerLabel}`}
      </div>` : '';

    // Price display — strikethrough original price
    const priceHtml = product.originalPrice && product.originalPrice > product.price
      ? `<p class="product-price" style="display:flex;align-items:baseline;gap:0.5rem;flex-wrap:wrap;">
           <span>₹${product.price}</span>
           <span style="text-decoration:line-through;color:#94a3b8;font-size:1rem;font-weight:500;">₹${product.originalPrice}</span>
           <span style="background:#dcfce7;color:#16a34a;font-size:0.8rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:999px;">
             Save ₹${product.originalPrice - product.price}
           </span>
         </p>`
      : `<p class="product-price">₹${product.price}</p>`;

    // Offer label pill — big and visible
    const offerLabelHtml = product.offerLabel
      ? `<div style="
           display:inline-block;background:linear-gradient(135deg,#fff7ed,#ffedd5);
           color:#ea580c;border:2px solid #fb923c;border-radius:0.75rem;
           font-size:1rem;font-weight:800;padding:0.4rem 1rem;
           margin-bottom:0.6rem;box-shadow:0 2px 8px rgba(249,115,22,0.2);
         ">🏷️ ${product.offerLabel}</div>`
      : '';

    // Create image element
    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.name;
    img.className = 'product-image';
    img.style.width = '100%';
    img.style.height = '200px';
    img.style.objectFit = 'contain';
    img.style.backgroundColor = '#f0f0f0';
    img.style.padding = '10px';

    // Create info section
    const infoDiv = document.createElement('div');
    infoDiv.className = 'product-info';
    infoDiv.innerHTML = `
      <span class="product-category">${product.category}</span>
      <h3 class="product-name">${product.name}</h3>
      ${priceHtml}
      ${offerLabelHtml}
      <p class="product-description">${product.description.substring(0, 100)}...</p>
      <p class="product-stock">Stock: ${product.stock} available</p>
      <div class="product-qr-section">
        <button class="btn btn-secondary btn-small" onclick="toggleQRCode('${product._id}')">
          📱 Scan QR
        </button>
        <div id="qr-${product._id}" class="product-qr-code" style="display:none; margin-top: 10px; text-align: center;"></div>
      </div>
      <div class="product-actions">
        <button class="btn btn-primary" onclick="addToCart('${product._id}', '${encodeURIComponent(product.name)}', ${product.price}, ${product.originalPrice || product.price})">
          Add to Cart
        </button>
      </div>
    `;
    
    productCard.appendChild(img);
    productCard.appendChild(infoDiv);
    // Insert offer badge as HTML overlay
    if (hasOffer) {
      productCard.insertAdjacentHTML('afterbegin', offerBadgeHtml);
    }
    productsList.appendChild(productCard);
  });
}

// Scroll to about section
function scrollToAbout() {
  document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
}

// Add to cart
function addToCart(productId, productName, productPrice, originalPrice) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login first');
    openLoginModal();
    return;
  }

  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const existingItem = cart.find(item => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      productId,
      name: decodeURIComponent(productName),
      price: productPrice,
      originalPrice: originalPrice || productPrice,
      quantity: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert('Product added to cart!');
}

// Update cart count
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  document.getElementById('cartCount').textContent = count;
}

// Open cart modal
function openCart() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login first');
    openLoginModal();
    return;
  }

  const modal = document.getElementById('cartModal');
  modal.classList.add('active');
  displayCart();
}

// Close cart modal
function closeCart() {
  document.getElementById('cartModal').classList.remove('active');
}

// Display cart items
function displayCart() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartItems = document.getElementById('cartItems');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const emptyCartMsg = document.getElementById('emptyCartMsg');

  if (cart.length === 0) {
    cartItems.innerHTML = '';
    emptyCartMsg.style.display = 'block';
    checkoutBtn.style.display = 'none';
    return;
  }

  emptyCartMsg.style.display = 'none';
  checkoutBtn.style.display = 'block';

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price}</div>
      </div>
      <div class="cart-item-quantity">
        <button onclick="updateQuantity('${item.productId}', -1)">-</button>
        <span>${item.quantity}</span>
        <button onclick="updateQuantity('${item.productId}', 1)">+</button>
      </div>
      <div>₹${item.price * item.quantity}</div>
      <button class="btn btn-secondary" onclick="removeFromCart('${item.productId}')">Remove</button>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  document.getElementById('cartTotal').textContent = total;
}

// Update quantity
function updateQuantity(productId, change) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const item = cart.find(item => item.productId === productId);

  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      cart = cart.filter(item => item.productId !== productId);
    }
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  displayCart();
}

// Remove from cart
function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart = cart.filter(item => item.productId !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  displayCart();
}

// Proceed to checkout
function proceedToCheckout() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (cart.length === 0) {
    alert('Your cart is empty');
    return;
  }
  window.location.href = '/checkout';
}

// Handle login
// Handle login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorMsg = document.getElementById('loginError');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMsg.textContent = data.message || 'Login failed';
      return;
    }

    // Save token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Verify data was saved
    console.log('✓ Login successful - User data saved:', data.user);
    
    closeLoginModal();
    checkAuth();
    updateCartCount();
    alert('Login successful!');

    // Redirect admin users to admin panel
    if (data.user.isAdmin) {
      setTimeout(() => { window.location.href = '/admin'; }, 500);
    }
  } catch (error) {
    errorMsg.textContent = 'Error: ' + error.message;
    console.error('Login error:', error);
  }
}

// Handle register
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const errorMsg = document.getElementById('registerError');

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMsg.textContent = data.message || 'Registration failed';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    closeLoginModal();
    checkAuth();
    updateCartCount();
    alert('Registration successful!');
  } catch (error) {
    errorMsg.textContent = 'Error: ' + error.message;
  }
}

// Open login modal
function openLoginModal() {
  document.getElementById('loginModal').classList.add('active');
}

// Close login modal
function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('active');
  document.getElementById('loginForm').reset();
  document.getElementById('registerForm').reset();
  document.getElementById('loginError').textContent = '';
  document.getElementById('registerError').textContent = '';
}

// Switch between login and register tabs
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  if (tab === 'login') {
    document.getElementById('loginForm').classList.add('active');
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
  } else {
    document.getElementById('registerForm').classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
  }
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  window.location.href = '/';
}

// Close modal when clicking outside
window.onclick = function(event) {
  const loginModal = document.getElementById('loginModal');
  const cartModal = document.getElementById('cartModal');

  if (event.target === loginModal) {
    closeLoginModal();
  }
  if (event.target === cartModal) {
    closeCart();
  }
};

// Update cart count on page load
updateCartCount();

// Toggle QR Code display
function toggleQRCode(productId) {
  const qrDiv = document.getElementById(`qr-${productId}`);
  
  if (qrDiv.style.display === 'none') {
    qrDiv.style.display = 'block';
    generateProductQRCode(productId);
  } else {
    qrDiv.style.display = 'none';
  }
}

// Generate QR Code for product
function generateProductQRCode(productId) {
  const product = allProducts.find(p => p._id === productId);
  if (!product) return;

  const qrDiv = document.getElementById(`qr-${productId}`);
  qrDiv.innerHTML = ''; // Clear previous QR code

  // Create QR code data with product information
  // Format: productId|productName|productPrice
  const qrData = `${window.location.origin}/product-checkout?id=${productId}&name=${encodeURIComponent(product.name)}&price=${product.price}`;

  // Generate QR code
  new QRCode(qrDiv, {
    text: qrData,
    width: 150,
    height: 150,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  // Add instruction text
  const instruction = document.createElement('p');
  instruction.style.fontSize = '12px';
  instruction.style.color = '#666';
  instruction.style.marginTop = '8px';
  instruction.textContent = 'Scan to checkout with this product';
  qrDiv.appendChild(instruction);
}

// Handle product checkout from QR code scan
function handleProductCheckout() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  const productName = params.get('name');
  const productPrice = params.get('price');

  if (productId && productName && productPrice) {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      window.location.href = '/';
      return;
    }

    // Add product to cart
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart = [{
      productId,
      name: decodeURIComponent(productName),
      price: parseFloat(productPrice),
      quantity: 1
    }];

    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Redirect to checkout
    window.location.href = '/checkout';
  }
}

// Check if this is a product checkout page
if (window.location.pathname === '/product-checkout') {
  handleProductCheckout();
}

// Open account modal
function openAccountModal() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login first');
    openLoginModal();
    return;
  }

  const modal = document.getElementById('accountModal');
  modal.classList.add('active');
  loadUserOrders();
  loadUserProfile();
}

// Close account modal
function closeAccountModal() {
  document.getElementById('accountModal').classList.remove('active');
}

// Switch account tabs
function switchAccountTab(tab) {
  document.querySelectorAll('.account-tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.account-tab-btn').forEach(el => el.classList.remove('active'));

  if (tab === 'orders') {
    document.getElementById('ordersTab').classList.add('active');
    document.querySelectorAll('.account-tab-btn')[0].classList.add('active');
  } else {
    document.getElementById('profileTab').classList.add('active');
    document.querySelectorAll('.account-tab-btn')[1].classList.add('active');
  }
}

// Load user orders
async function loadUserOrders() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_URL}/orders/user/my-orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const orders = await response.json();
    const ordersList = document.getElementById('ordersList');
    const noOrdersMsg = document.getElementById('noOrdersMsg');

    if (!Array.isArray(orders) || orders.length === 0) {
      ordersList.innerHTML = '';
      noOrdersMsg.style.display = 'block';
      return;
    }

    noOrdersMsg.style.display = 'none';

    // Status color map
    const statusColor = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#10b981',
      cancelled: '#ef4444'
    };
    const paymentColor = {
      pending: '#f59e0b',
      completed: '#10b981',
      failed: '#ef4444'
    };

    ordersList.innerHTML = orders.map(order => {
      const canCancel = ['pending', 'processing'].includes(order.orderStatus);
      const isCancelled = order.orderStatus === 'cancelled';

      return `
        <div class="order-card" style="border-left: 4px solid ${statusColor[order.orderStatus] || '#64748b'}; ${isCancelled ? 'opacity:0.75;' : ''}">
          <div class="order-header">
            <div>
              <h4>Order #${order._id.substring(0, 8).toUpperCase()}</h4>
              <p class="order-date">📅 ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div class="order-status" style="display:flex;flex-direction:column;gap:0.4rem;align-items:flex-end;">
              <span style="
                background:${statusColor[order.orderStatus] || '#64748b'};
                color:white;padding:0.25rem 0.75rem;
                border-radius:999px;font-size:0.75rem;font-weight:700;
              ">${order.orderStatus.toUpperCase()}</span>
              <span style="
                background:${paymentColor[order.paymentStatus] || '#64748b'};
                color:white;padding:0.25rem 0.75rem;
                border-radius:999px;font-size:0.75rem;font-weight:600;
              ">💳 ${order.paymentStatus.toUpperCase()}</span>
            </div>
          </div>
          <div class="order-items" style="margin:0.75rem 0;padding:0.75rem;background:#f8fafc;border-radius:0.5rem;">
            ${order.items.map(item => `
              <p style="margin:0.2rem 0;color:#374151;">• ${item.name} × ${item.quantity} = <strong>₹${item.price * item.quantity}</strong></p>
            `).join('')}
          </div>
          <div class="order-footer" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
            <div>
              <p style="font-size:1.1rem;font-weight:700;color:#f97316;">Total: ₹${order.totalPrice}</p>
              <p style="font-size:0.85rem;color:#64748b;">📍 ${order.customerDetails.address}</p>
            </div>
            ${canCancel ? `
              <button onclick="cancelUserOrder('${order._id}')" style="
                background:#ef4444;color:white;border:none;
                padding:0.5rem 1.2rem;border-radius:0.5rem;
                cursor:pointer;font-weight:600;font-size:0.9rem;
                transition:all 0.2s ease;
              " onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                ❌ Cancel Order
              </button>
            ` : isCancelled ? `
              <span style="color:#ef4444;font-weight:600;font-size:0.9rem;">🚫 Order Cancelled</span>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

// Cancel user order
async function cancelUserOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;

  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Could not cancel order');
      return;
    }

    alert('✓ Order cancelled successfully!');
    loadUserOrders(); // Refresh the list
  } catch (error) {
    alert('Error cancelling order: ' + error.message);
  }
}

// Load user profile
function loadUserProfile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  document.getElementById('profileName').textContent = user.name || 'N/A';
  document.getElementById('profileEmail').textContent = user.email || 'N/A';
  document.getElementById('profileType').textContent = user.isAdmin ? 'Admin' : 'Customer';
  document.getElementById('profileDate').textContent = new Date().toLocaleDateString();
}

// ─── FLOATING OFFER BANNERS ──────────────────────────────────────────────────

async function loadOfferBanners() {
  try {
    const response = await fetch(`${API_URL}/offer-banners`);
    if (!response.ok) return;
    const banners = await response.json();
    if (!banners.length) return;

    const container = document.getElementById('offerBannersContainer');
    if (!container) return;

    banners.forEach((banner, i) => {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'offer-banner-float';
        el.style.background = banner.bgColor  || '#f97316';
        el.style.color      = banner.textColor || '#ffffff';

        const mediaHtml = banner.image
          ? `<img src="${window.location.origin}${banner.image}" class="banner-img" alt="offer" onerror="this.style.display='none'">`
          : `<span class="banner-emoji">${banner.emoji || '🎉'}</span>`;

        el.innerHTML = `
          ${mediaHtml}
          <div class="banner-body">
            <div class="banner-main">${banner.text}</div>
            ${banner.subText ? `<div class="banner-sub">${banner.subText}</div>` : ''}
          </div>
          <button class="banner-close" onclick="closeBanner(this)" title="Close">✕</button>
        `;
        container.appendChild(el);
      }, i * 450);
    });
  } catch (error) {
    // Silently fail — banners are non-critical
  }
}

function closeBanner(btn) {
  const banner = btn.closest('.offer-banner-float');
  banner.classList.add('removing');
  setTimeout(() => banner.remove(), 350);
}
