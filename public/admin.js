const API_URL = '/api';

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
});

// Admin login via overlay
async function adminLogin() {
  const email = document.getElementById('adminLoginEmail').value.trim();
  const password = document.getElementById('adminLoginPassword').value;
  const errorEl = document.getElementById('adminLoginError');
  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Please enter email and password.';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok || !data.user || !data.user.isAdmin) {
      errorEl.textContent = data.message || 'Invalid admin credentials';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Hide login overlay and load admin panel
    document.getElementById('adminLoginOverlay').style.display = 'none';
    loadAdminPanel();
  } catch (error) {
    errorEl.textContent = 'Connection error: ' + error.message;
  }
}

// Check admin authentication
function checkAdminAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user.isAdmin) {
    // Show login overlay instead of redirecting
    document.getElementById('adminLoginOverlay').style.display = 'flex';
  } else {
    document.getElementById('adminLoginOverlay').style.display = 'none';
    loadAdminPanel();
  }
}

// Load admin panel after successful auth
function loadAdminPanel() {
  loadDashboard();
  setupAdminEventListeners();
}

// Setup event listeners
function setupAdminEventListeners() {
  document.getElementById('addProductForm').addEventListener('submit', handleAddProduct);
  document.getElementById('editProductForm').addEventListener('submit', handleEditProduct);
  document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
  document.getElementById('addBannerForm').addEventListener('submit', handleAddBanner);
  document.getElementById('broadcastForm').addEventListener('submit', handleBroadcast);
  loadCategories();
  loadCategoriesList();

  // Live banner preview
  ['bannerText','bannerSubText','bannerEmoji','bannerBgColor','bannerTextColor'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateBannerPreview);
  });
}

// Load dashboard
async function loadDashboard() {
  const token = localStorage.getItem('token');

  try {
    // Load products count
    const productsRes = await fetch(`${API_URL}/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const products = await productsRes.json();
    document.getElementById('totalProducts').textContent = products.length;

    // Load orders
    const ordersRes = await fetch(`${API_URL}/orders/admin/all-orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const orders = await ordersRes.json();
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('pendingOrders').textContent = orders.filter(o => o.orderStatus === 'pending').length;

    const totalSales = orders
      .filter(o => o.paymentStatus === 'completed' && o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + o.totalPrice, 0);
    document.getElementById('totalSales').textContent = `₹${totalSales}`;

    const paymentHistory = orders
      .filter(o => o.paymentStatus === 'completed')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // Show ALL completed payments — no slice

    document.getElementById('paymentHistory').innerHTML = paymentHistory.length === 0
      ? '<p style="color:#64748b;padding:1rem;">No completed payments yet.</p>'
      : `
        <div style="margin-bottom:0.75rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
          <span style="font-weight:700;color:#0f172a;">Showing all ${paymentHistory.length} completed payment${paymentHistory.length !== 1 ? 's' : ''}</span>
          <span style="font-weight:900;font-size:1.1rem;color:#f97316;">Total Collected: ₹${paymentHistory.reduce((s,o)=>s+o.totalPrice,0)}</span>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
            <thead>
              <tr style="background:linear-gradient(135deg,#f97316,#ea580c);color:white;">
                <th style="padding:0.85rem 1rem;text-align:left;white-space:nowrap;">#</th>
                <th style="padding:0.85rem 1rem;text-align:left;white-space:nowrap;">Order ID</th>
                <th style="padding:0.85rem 1rem;text-align:left;white-space:nowrap;">Date</th>
                <th style="padding:0.85rem 1rem;text-align:left;white-space:nowrap;">Customer</th>
                <th style="padding:0.85rem 1rem;text-align:left;white-space:nowrap;">Phone</th>
                <th style="padding:0.85rem 1rem;text-align:left;">Products Ordered</th>
                <th style="padding:0.85rem 1rem;text-align:right;white-space:nowrap;">Amount Paid</th>
                <th style="padding:0.85rem 1rem;text-align:center;white-space:nowrap;">Order Status</th>
                <th style="padding:0.85rem 1rem;text-align:center;white-space:nowrap;">Payment</th>
              </tr>
            </thead>
            <tbody>
              ${paymentHistory.map((order, idx) => {
                const statusColors = {
                  pending:    { bg:'#fef3c7', color:'#92400e' },
                  processing: { bg:'#dbeafe', color:'#1e40af' },
                  shipped:    { bg:'#ede9fe', color:'#5b21b6' },
                  delivered:  { bg:'#dcfce7', color:'#166534' },
                  cancelled:  { bg:'#fee2e2', color:'#991b1b' }
                };
                const sc = statusColors[order.orderStatus] || { bg:'#f1f5f9', color:'#475569' };
                const productsList = order.items.map(i =>
                  `<span style="display:inline-block;background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;border-radius:999px;padding:0.15rem 0.6rem;font-size:0.78rem;font-weight:600;margin:0.1rem;">
                    ${i.name} ×${i.quantity}
                  </span>`
                ).join(' ');

                return `
                  <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};border-bottom:1px solid #f1f5f9;"
                      onmouseover="this.style.background='#fff7ed'" onmouseout="this.style.background='${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}'">
                    <td style="padding:0.75rem 1rem;color:#94a3b8;font-size:0.8rem;">${idx + 1}</td>
                    <td style="padding:0.75rem 1rem;font-family:monospace;font-size:0.8rem;color:#64748b;">
                      #${order._id.substring(0, 8).toUpperCase()}
                    </td>
                    <td style="padding:0.75rem 1rem;white-space:nowrap;color:#475569;">
                      ${new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </td>
                    <td style="padding:0.75rem 1rem;">
                      <div style="font-weight:600;color:#0f172a;">${order.customerDetails.name}</div>
                      <div style="font-size:0.78rem;color:#64748b;">${order.customerDetails.email}</div>
                    </td>
                    <td style="padding:0.75rem 1rem;color:#475569;white-space:nowrap;">📞 ${order.customerDetails.phone}</td>
                    <td style="padding:0.75rem 1rem;max-width:260px;">${productsList}</td>
                    <td style="padding:0.75rem 1rem;text-align:right;font-weight:800;font-size:1rem;color:#f97316;white-space:nowrap;">₹${order.totalPrice}</td>
                    <td style="padding:0.75rem 1rem;text-align:center;">
                      <span style="background:${sc.bg};color:${sc.color};padding:0.3rem 0.75rem;border-radius:999px;font-size:0.78rem;font-weight:700;white-space:nowrap;">
                        ${order.orderStatus.toUpperCase()}
                      </span>
                    </td>
                    <td style="padding:0.75rem 1rem;text-align:center;">
                      <span style="background:#dcfce7;color:#166534;padding:0.3rem 0.75rem;border-radius:999px;font-size:0.78rem;font-weight:700;">
                        ✓ PAID
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// Switch admin tabs
function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));

  document.getElementById(tab + 'Tab').classList.add('active');
  event.target.classList.add('active');

  if (tab === 'categories') {
    loadCategoriesList();
  } else if (tab === 'products') {
    loadProductsList();
  } else if (tab === 'orders') {
    loadOrdersList();
  } else if (tab === 'deliveredOrders') {
    loadDeliveredOrdersList();
  } else if (tab === 'offerBanners') {
    loadBannersList();
  }
}

// Load products list
async function loadProductsList() {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const products = await response.json();
    displayProductsTable(products);
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Display products table
function displayProductsTable(products) {
  const productsList = document.getElementById('productsList');
  
  if (products.length === 0) {
    productsList.innerHTML = '<p>No products found</p>';
    return;
  }

  productsList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(product => `
          <tr>
            <td>${product.name}</td>
            <td>${product.category || 'General'}</td>
            <td>₹${product.price}</td>
            <td>${product.stock}</td>
            <td>${product.description.substring(0, 50)}...</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-primary" onclick="openEditModal('${product._id}')">Edit</button>
                <button class="btn btn-secondary" onclick="deleteProduct('${product._id}')">Delete</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Handle add product
async function handleAddProduct(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');

  // Validate form
  const name = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value.trim();
  const price = document.getElementById('productPrice').value;
  const stock = document.getElementById('productStock').value;
  const description = document.getElementById('productDescription').value.trim();

  if (!name || !category || !price || !stock || !description) {
    document.getElementById('productFormError').textContent = 'Please fill all required fields';
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('category', category);
  formData.append('price', parseFloat(price));
  formData.append('stock', parseInt(stock));
  formData.append('description', description);

  // Offer fields
  const originalPrice   = document.getElementById('productOriginalPrice').value;
  const discountPercent = document.getElementById('productDiscountPercent').value;
  const offerLabel      = document.getElementById('productOfferLabel').value.trim();
  if (originalPrice)   formData.append('originalPrice',   parseFloat(originalPrice));
  if (discountPercent) formData.append('discountPercent', parseFloat(discountPercent));
  if (offerLabel)      formData.append('offerLabel',      offerLabel);
  
  const imageFile = document.getElementById('productImage').files[0];
  if (imageFile) {
    formData.append('image', imageFile);
  } else {
    // If no image provided, use a placeholder
    formData.append('image', '/uploads/placeholder.svg');
  }

  try {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.errors?.[0]?.msg || 'Error adding product';
      document.getElementById('productFormError').textContent = errorMsg;
      console.error('Error:', data);
      return;
    }

    alert('Product added successfully!');
    document.getElementById('addProductForm').reset();
    document.getElementById('productFormError').textContent = '';
    loadProductsList();
  } catch (error) {
    document.getElementById('productFormError').textContent = 'Error: ' + error.message;
    console.error('Error:', error);
  }
}

// Open edit modal
async function openEditModal(productId) {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const product = await response.json();

    document.getElementById('editProductId').value = product._id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductCategory').value = product.category || 'Groceries';
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductStock').value = product.stock;
    document.getElementById('editProductDescription').value = product.description;

    // Offer fields
    document.getElementById('editProductOriginalPrice').value   = product.originalPrice   || '';
    document.getElementById('editProductDiscountPercent').value = product.discountPercent || '';
    document.getElementById('editProductOfferLabel').value      = product.offerLabel      || '';

    // Show current image preview
    const previewDiv = document.getElementById('currentImagePreview');
    if (product.image) {
      previewDiv.innerHTML = `
        <div style="margin-bottom: 10px;">
          <strong>Current Image:</strong>
          <img src="${product.image}" alt="${product.name}" style="max-width: 150px; max-height: 150px; border-radius: 5px; margin-top: 5px;">
        </div>
      `;
    }

    document.getElementById('editProductModal').classList.add('active');
  } catch (error) {
    console.error('Error loading product:', error);
  }
}

// Close edit modal
function closeEditModal() {
  document.getElementById('editProductModal').classList.remove('active');
}

// Handle edit product
async function handleEditProduct(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const productId = document.getElementById('editProductId').value;

  // Validate form
  const name = document.getElementById('editProductName').value.trim();
  const category = document.getElementById('editProductCategory').value.trim();
  const price = document.getElementById('editProductPrice').value;
  const stock = document.getElementById('editProductStock').value;
  const description = document.getElementById('editProductDescription').value.trim();

  if (!name || !category || !price || !stock || !description) {
    document.getElementById('editProductError').textContent = 'Please fill all required fields';
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('category', category);
  formData.append('price', parseFloat(price));
  formData.append('stock', parseInt(stock));
  formData.append('description', description);

  // Offer fields
  const editOriginalPrice   = document.getElementById('editProductOriginalPrice').value;
  const editDiscountPercent = document.getElementById('editProductDiscountPercent').value;
  const editOfferLabel      = document.getElementById('editProductOfferLabel').value.trim();
  formData.append('originalPrice',   editOriginalPrice   ? parseFloat(editOriginalPrice)   : '');
  formData.append('discountPercent', editDiscountPercent ? parseFloat(editDiscountPercent) : 0);
  formData.append('offerLabel',      editOfferLabel);
  
  const imageFile = document.getElementById('editProductImage').files[0];
  if (imageFile) {
    formData.append('image', imageFile);
  }

  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.errors?.[0]?.msg || 'Error updating product';
      document.getElementById('editProductError').textContent = errorMsg;
      console.error('Error:', data);
      return;
    }

    alert('Product updated successfully!');
    closeEditModal();
    loadProductsList();
  } catch (error) {
    document.getElementById('editProductError').textContent = 'Error: ' + error.message;
    console.error('Error:', error);
  }
}

// Delete product
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      alert('Error deleting product');
      return;
    }

    alert('Product deleted successfully!');
    loadProductsList();
  } catch (error) {
    console.error('Error deleting product:', error);
  }
}

// Load orders list
async function loadOrdersList() {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/orders/admin/all-orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const orders = await response.json();
    displayOrdersTable(orders);
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

// Load delivered orders list
async function loadDeliveredOrdersList() {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/orders/admin/all-orders?status=delivered`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const orders = await response.json();
    displayDeliveredOrdersTable(orders);
  } catch (error) {
    console.error('Error loading delivered orders:', error);
  }
}

// Display orders table
function displayOrdersTable(orders) {
  const ordersList = document.getElementById('ordersList');

  if (orders.length === 0) {
    ordersList.innerHTML = '<p>No orders found</p>';
    return;
  }

  ordersList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Status</th>
          <th>Payment</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(order => `
          <tr>
            <td>${order._id.substring(0, 8)}...</td>
            <td>${order.customerDetails.name}</td>
            <td>₹${order.totalPrice}</td>
            <td>${order.orderStatus}</td>
            <td>${order.paymentStatus}</td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-primary" onclick="openOrderDetails('${order._id}')">View</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function displayDeliveredOrdersTable(orders) {
  const ordersList = document.getElementById('deliveredOrdersList');

  if (orders.length === 0) {
    ordersList.innerHTML = '<p>No delivered orders found</p>';
    return;
  }

  ordersList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Status</th>
          <th>Payment</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(order => `
          <tr>
            <td>${order._id.substring(0, 8)}...</td>
            <td>${order.customerDetails.name}</td>
            <td>₹${order.totalPrice}</td>
            <td>${order.orderStatus}</td>
            <td>${order.paymentStatus}</td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-primary" onclick="openOrderDetails('${order._id}')">View</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Open order details
async function openOrderDetails(orderId) {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const order = await response.json();

    const itemsList = order.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>₹${item.price}</td>
        <td>${item.quantity}</td>
        <td>₹${item.price * item.quantity}</td>
      </tr>
    `).join('');

    const content = `
      <div class="order-details">
        <h3>Order ID: ${order._id}</h3>
        
        <h4>Customer Details:</h4>
        <p><strong>Name:</strong> ${order.customerDetails.name}</p>
        <p><strong>Email:</strong> ${order.customerDetails.email}</p>
        <p><strong>Phone:</strong> ${order.customerDetails.phone}</p>
        <p><strong>Address:</strong> ${order.customerDetails.address}</p>

        <h4>Order Items:</h4>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>

        <h4>Order Status:</h4>
        <select id="orderStatus" onchange="updateOrderStatus('${order._id}')">
          <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="processing" ${order.orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
          <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
          <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
          <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>

        <h4>Payment Status:</h4>
        <select id="paymentStatus" onchange="updatePaymentStatus('${order._id}')">
          <option value="pending" ${order.paymentStatus === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="completed" ${order.paymentStatus === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="failed" ${order.paymentStatus === 'failed' ? 'selected' : ''}>Failed</option>
        </select>

        <h4>Verification Status:</h4>
        <div style="display:flex;gap:0.75rem;align-items:center;margin-bottom:1rem;">
          <select id="paymentVerificationStatus" onchange="updatePaymentVerification('${order._id}')">
            <option value="none" ${order.paymentVerificationStatus === 'none' ? 'selected' : ''}>None</option>
            <option value="pending" ${order.paymentVerificationStatus === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="verified" ${order.paymentVerificationStatus === 'verified' ? 'selected' : ''}>✅ Verified</option>
            <option value="rejected" ${order.paymentVerificationStatus === 'rejected' ? 'selected' : ''}>❌ Rejected</option>
          </select>
        </div>
        ${order.paymentScreenshot ? `
          <h4>💳 Payment Proof Screenshot:</h4>
          <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:0.75rem;padding:1rem;margin:0.75rem 0;">
            <img src="${order.paymentScreenshot}" alt="Payment proof" style="max-width:100%;max-height:400px;border-radius:0.5rem;margin-bottom:0.75rem;">
            <br>
            <a href="${order.paymentScreenshot}" target="_blank" style="display:inline-block;background:#f97316;color:white;padding:0.5rem 1rem;border-radius:0.5rem;text-decoration:none;font-weight:600;">📥 Download Full Image</a>
          </div>
        ` : `
          <h4>💳 Payment Proof Screenshot:</h4>
          <p style="color:#dc2626;font-weight:600;">❌ No payment proof uploaded yet</p>
        `}

        <h3 style="margin-top: 1rem;">Total: ₹${order.totalPrice}</h3>

        <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
          ${order.orderStatus !== 'cancelled' ? `
            <button onclick="cancelOrder('${order._id}')" class="btn-cancel" style="background-color: #dc2626; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; transition: all 0.3s ease;">
              ❌ Cancel Order
            </button>
          ` : `
            <p style="color: #dc2626; font-weight: 600;">This order has been cancelled</p>
          `}
        </div>
      </div>
    `;

    document.getElementById('orderDetailsContent').innerHTML = content;
    document.getElementById('orderDetailsModal').classList.add('active');
  } catch (error) {
    console.error('Error loading order:', error);
  }
}

// Close order modal
function closeOrderModal() {
  document.getElementById('orderDetailsModal').classList.remove('active');
}

// Update order status
async function updateOrderStatus(orderId) {
  const token = localStorage.getItem('token');
  const orderStatus = document.getElementById('orderStatus').value;

  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderStatus })
    });

    if (!response.ok) {
      alert('Error updating order status');
      return;
    }

    alert('Order status updated!');
    loadOrdersList();
  } catch (error) {
    console.error('Error updating order:', error);
  }
}

// Update payment status
async function updatePaymentStatus(orderId) {
  const token = localStorage.getItem('token');
  const paymentStatus = document.getElementById('paymentStatus').value;

  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ paymentStatus })
    });

    if (!response.ok) {
      alert('Error updating payment status');
      return;
    }

    alert('Payment status updated!');
    loadOrdersList();
  } catch (error) {
    console.error('Error updating payment:', error);
  }
}

// Update payment verification status
async function updatePaymentVerification(orderId) {
  const token = localStorage.getItem('token');
  const paymentVerificationStatus = document.getElementById('paymentVerificationStatus').value;

  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ paymentVerificationStatus })
    });

    if (!response.ok) {
      alert('Error updating verification status');
      return;
    }

    alert('Verification status updated!');
    loadOrdersList();
  } catch (error) {
    console.error('Error updating verification:', error);
  }
}

// Cancel order
async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
    return;
  }

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderStatus: 'cancelled' })
    });

    if (!response.ok) {
      alert('Error cancelling order');
      return;
    }

    alert('✓ Order cancelled successfully!');
    closeOrderModal();
    loadOrdersList();
  } catch (error) {
    console.error('Error cancelling order:', error);
    alert('Error cancelling order');
  }
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// CATEGORY MANAGEMENT FUNCTIONS

// Load categories from API
async function loadCategories() {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const categories = await response.json();
    
    // Update product category dropdowns
    updateCategoryDropdowns(categories);
    
    // Load categories list
    loadCategoriesList();
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Update category dropdowns in product forms
function updateCategoryDropdowns(categories) {
  const selects = ['productCategory', 'editProductCategory'];
  
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      const currentValue = select.value;
      select.innerHTML = '<option value="">Select Category</option>';
      
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = `${cat.icon} ${cat.name}`;
        select.appendChild(option);
      });
      
      if (currentValue) {
        select.value = currentValue;
      }
    }
  });
}

// Load categories list
async function loadCategoriesList() {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const categories = await response.json();
    displayCategoriesTable(categories);
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Display categories table
function displayCategoriesTable(categories) {
  const categoriesList = document.getElementById('categoriesList');
  
  if (categories.length === 0) {
    categoriesList.innerHTML = '<p>No categories found. Add one to get started!</p>';
    return;
  }

  categoriesList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Icon</th>
          <th>Name</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${categories.map(cat => `
          <tr>
            <td>${cat.icon}</td>
            <td>${cat.name}</td>
            <td>${cat.description || 'N/A'}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-secondary" onclick="deleteCategory('${cat._id}')">Delete</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Handle add category
async function handleAddCategory(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');

  const categoryName = document.getElementById('categoryName').value.trim();
  const categoryIcon = document.getElementById('categoryIcon').value.trim();
  const categoryDescription = document.getElementById('categoryDescription').value.trim();

  if (!categoryName || !categoryIcon) {
    document.getElementById('categoryFormError').textContent = 'Please fill all required fields';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: categoryName,
        icon: categoryIcon,
        description: categoryDescription
      })
    });

    const data = await response.json();

    if (!response.ok) {
      document.getElementById('categoryFormError').textContent = data.message || 'Error adding category';
      return;
    }

    alert('Category added successfully!');
    document.getElementById('addCategoryForm').reset();
    document.getElementById('categoryFormError').textContent = '';
    loadCategories();
  } catch (error) {
    document.getElementById('categoryFormError').textContent = 'Error: ' + error.message;
  }
}

// Delete category
async function deleteCategory(categoryId) {
  if (!confirm('Are you sure you want to delete this category?')) return;
  
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_URL}/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      alert('Error deleting category');
      return;
    }

    alert('Category deleted successfully!');
    loadCategories();
  } catch (error) {
    console.error('Error deleting category:', error);
  }
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// Close modals when clicking outside
window.onclick = function(event) {
  const editModal = document.getElementById('editProductModal');
  const orderModal = document.getElementById('orderDetailsModal');

  if (event.target === editModal) {
    closeEditModal();
  }
  if (event.target === orderModal) {
    closeOrderModal();
  }
};

// ─── OFFER BANNER FUNCTIONS ──────────────────────────────────────────────────

// Live preview update
function updateBannerPreview() {
  const text     = document.getElementById('bannerText').value     || 'Your banner text here';
  const subText  = document.getElementById('bannerSubText').value  || '';
  const emoji    = document.getElementById('bannerEmoji').value    || '🎉';
  const bgColor  = document.getElementById('bannerBgColor').value  || '#f97316';
  const txtColor = document.getElementById('bannerTextColor').value || '#ffffff';

  const preview = document.getElementById('bannerPreview');
  preview.style.background = bgColor;
  preview.style.color = txtColor;
  preview.innerHTML = `
    <span style="font-size:1.5rem;">${emoji}</span>
    <strong style="font-size:1.1rem;margin-left:0.5rem;">${text}</strong>
    ${subText ? `<p style="margin:0.25rem 0 0;font-size:0.85rem;opacity:0.9;">${subText}</p>` : ''}
  `;
}

// Create banner
async function handleAddBanner(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');

  const text     = document.getElementById('bannerText').value.trim();
  const subText  = document.getElementById('bannerSubText').value.trim();
  const emoji    = document.getElementById('bannerEmoji').value.trim() || '🎉';
  const bgColor  = document.getElementById('bannerBgColor').value;
  const txtColor = document.getElementById('bannerTextColor').value;

  if (!text) {
    document.getElementById('bannerFormError').textContent = 'Banner text is required';
    return;
  }

  const formData = new FormData();
  formData.append('text',      text);
  formData.append('subText',   subText);
  formData.append('emoji',     emoji);
  formData.append('bgColor',   bgColor);
  formData.append('textColor', txtColor);
  formData.append('isActive',  'true');

  const imageFile = document.getElementById('bannerImage').files[0];
  if (imageFile) formData.append('bannerImage', imageFile);

  try {
    const response = await fetch(`${API_URL}/offer-banners`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      document.getElementById('bannerFormError').textContent = data.message || 'Error creating banner';
      return;
    }

    alert('✓ Banner published!');
    document.getElementById('addBannerForm').reset();
    document.getElementById('bannerBgColor').value   = '#f97316';
    document.getElementById('bannerTextColor').value = '#ffffff';
    document.getElementById('bannerFormError').textContent = '';
    updateBannerPreview();
    loadBannersList();
  } catch (error) {
    document.getElementById('bannerFormError').textContent = 'Error: ' + error.message;
  }
}

// Load banners list
async function loadBannersList() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_URL}/offer-banners/admin/all`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const banners = await response.json();
    displayBannersList(banners);
  } catch (error) {
    console.error('Error loading banners:', error);
  }
}

// Display banners list
function displayBannersList(banners) {
  const container = document.getElementById('bannersList');
  if (!banners.length) {
    container.innerHTML = '<p style="color:#64748b;">No banners yet. Create one above!</p>';
    return;
  }

  container.innerHTML = banners.map(b => `
    <div style="
      display:flex;align-items:center;gap:1rem;flex-wrap:wrap;
      background:white;border:1px solid #e2e8f0;border-radius:0.75rem;
      padding:1rem;margin-bottom:0.75rem;box-shadow:0 2px 8px rgba(0,0,0,0.05);
    ">
      <!-- Banner preview with image -->
      <div style="
        flex:1;min-width:220px;border-radius:0.75rem;padding:0.9rem 1.1rem;
        background:${b.bgColor};color:${b.textColor};
        display:flex;align-items:center;gap:0.75rem;overflow:hidden;
      ">
        ${b.image
          ? `<img src="${b.image}" style="width:60px;height:60px;object-fit:cover;border-radius:0.5rem;flex-shrink:0;border:2px solid rgba(255,255,255,0.3);" onerror="this.style.display='none'">`
          : `<span style="font-size:1.6rem;flex-shrink:0;">${b.emoji || '🎉'}</span>`
        }
        <div>
          <strong style="font-size:0.95rem;">${b.text}</strong>
          ${b.subText ? `<p style="margin:0.2rem 0 0;font-size:0.8rem;opacity:0.9;">${b.subText}</p>` : ''}
        </div>
      </div>
      <!-- Status & actions -->
      <div style="display:flex;gap:0.5rem;align-items:center;flex-shrink:0;flex-wrap:wrap;">
        <span style="
          padding:0.3rem 0.75rem;border-radius:999px;font-size:0.8rem;font-weight:700;
          background:${b.isActive ? '#dcfce7' : '#f1f5f9'};
          color:${b.isActive ? '#16a34a' : '#64748b'};
        ">${b.isActive ? '● Active' : '○ Inactive'}</span>
        <button onclick="toggleBanner('${b._id}')" style="
          padding:0.4rem 0.9rem;border-radius:0.5rem;border:none;cursor:pointer;font-weight:600;font-size:0.85rem;
          background:${b.isActive ? '#fef3c7' : '#dcfce7'};
          color:${b.isActive ? '#d97706' : '#16a34a'};
        ">${b.isActive ? '⏸ Pause' : '▶ Activate'}</button>
        <button onclick="deleteBanner('${b._id}')" style="
          padding:0.4rem 0.9rem;border-radius:0.5rem;border:none;cursor:pointer;font-weight:600;font-size:0.85rem;
          background:#fee2e2;color:#dc2626;
        ">🗑 Delete</button>
      </div>
    </div>
  `).join('');
}

// Toggle banner active state
async function toggleBanner(bannerId) {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_URL}/offer-banners/${bannerId}/toggle`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) { alert('Error toggling banner'); return; }
    loadBannersList();
  } catch (error) {
    console.error('Error toggling banner:', error);
  }
}

// Delete banner
async function deleteBanner(bannerId) {
  if (!confirm('Delete this banner?')) return;
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_URL}/offer-banners/${bannerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) { alert('Error deleting banner'); return; }
    loadBannersList();
  } catch (error) {
    console.error('Error deleting banner:', error);
  }
}

// ─── BROADCAST OFFER EMAIL ───────────────────────────────────────────────────
async function handleBroadcast(e) {
  e.preventDefault();
  const token   = localStorage.getItem('token');
  const title   = document.getElementById('broadcastTitle').value.trim();
  const body    = document.getElementById('broadcastBody').value.trim();
  const msgEl   = document.getElementById('broadcastMsg');
  const btn     = e.target.querySelector('button[type="submit"]');

  if (!title || !body) { msgEl.textContent = 'Please fill all fields.'; return; }

  btn.disabled = true;
  btn.textContent = '⏳ Sending...';
  msgEl.style.color = '#64748b';
  msgEl.textContent = 'Sending emails, please wait...';

  try {
    const response = await fetch(`${API_URL}/emails/broadcast-offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ offerTitle: title, offerBody: body })
    });
    const data = await response.json();

    if (!response.ok) {
      msgEl.style.color = '#dc2626';
      msgEl.textContent = data.message || 'Error sending emails';
    } else {
      msgEl.style.color = '#16a34a';
      msgEl.textContent = `✓ ${data.message}`;
      document.getElementById('broadcastForm').reset();
    }
  } catch (error) {
    msgEl.style.color = '#dc2626';
    msgEl.textContent = 'Error: ' + error.message;
  } finally {
    btn.disabled = false;
    btn.textContent = '📤 Send to All Customers';
  }
}
