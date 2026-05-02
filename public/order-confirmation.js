const API_URL = '/api';
const UPI_ID = '9923554590@postbank';
const STORE_NAME = 'AB%20Stores';

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadOrderConfirmation();
  setupUploadProofForm();
  setupPaymentQueryForm();
});

function checkAuth() {
  if (!localStorage.getItem('token')) {
    alert('Please login first');
    window.location.href = '/';
  }
}

// ─── Main loader ────────────────────────────────────────────────────────────
async function loadOrderConfirmation() {
  const checkoutRequest = JSON.parse(sessionStorage.getItem('checkoutRequest') || '{}');
  const storedOrder    = JSON.parse(sessionStorage.getItem('orderData')      || '{}');

  // Nothing to show
  if (!checkoutRequest.items?.length && !storedOrder._id) {
    alert('No order found. Please start from the store.');
    window.location.href = '/';
    return;
  }

  // If order already created, fetch fresh data
  if (storedOrder._id) {
    const order = await fetchOrder(storedOrder._id);
    renderConfirmedOrder(order);
    return;
  }

  // Order not yet created — show payment + upload flow
  renderPendingPayment(checkoutRequest);
}

// ─── Render: payment pending (no order yet) ─────────────────────────────────
function renderPendingPayment(data) {
  const total = data.totalPrice; // already discounted total

  // Fill summary with discount breakdown
  fillSummary(data.items, total, data.customerDetails);

  // Payment section — use discounted total for UPI amount
  document.getElementById('payAmount').textContent   = total;
  document.getElementById('payAmountQr').textContent = total;

  // UPI link encodes the exact discounted amount customer must pay
  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${STORE_NAME}&am=${total}&tn=Order%20Payment`;

  if (data.paymentMethod === 'upi_qr') {
    document.getElementById('upiLinkSection').style.display = 'none';
    document.getElementById('upiQrSection').style.display   = 'block';
    generateQRCode(upiLink);
  } else {
    document.getElementById('upiLinkSection').style.display = 'block';
    document.getElementById('upiQrSection').style.display   = 'none';
    document.getElementById('upiLink').href = upiLink;
  }

  document.getElementById('stepPay').classList.add('active');
  document.getElementById('uploadSection').style.display  = 'block';
  document.getElementById('paymentSection').style.display = 'block';
}

// ─── Render: order already created ──────────────────────────────────────────
function renderConfirmedOrder(order) {
  fillSummary(order.items, order.totalPrice, order.customerDetails);

  // Show order ID
  document.getElementById('orderId').textContent = order._id;
  document.getElementById('orderIdSection').style.display = 'block';

  const banner = document.getElementById('statusBanner');
  banner.style.display = 'block';

  if (order.paymentStatus === 'completed' || order.paymentVerificationStatus === 'verified') {
    // Fully confirmed
    banner.innerHTML = `
      <div class="order-confirmed-banner">
        <h2>🎉 Order Confirmed!</h2>
        <p>Payment verified. We'll deliver your order soon.</p>
      </div>`;
    document.getElementById('paymentSection').style.display = 'none';
    document.getElementById('uploadSection').style.display  = 'none';
    setStepDone('stepPay');
    setStepDone('stepUpload');
    setStepDone('stepConfirm');

  } else if (order.paymentVerificationStatus === 'pending') {
    // Screenshot uploaded, waiting for admin
    banner.innerHTML = `
      <div class="pending-banner">
        ⏳ Payment screenshot received. Waiting for admin verification.
      </div>`;
    document.getElementById('paymentSection').style.display = 'none';
    document.getElementById('uploadSection').style.display  = 'none';
    setStepDone('stepPay');
    setStepDone('stepUpload');

  } else if (order.paymentVerificationStatus === 'rejected') {
    // Rejected — let them re-upload
    banner.innerHTML = `
      <div style="background:#fef2f2;border:2px solid #ef4444;border-radius:1rem;padding:1rem;text-align:center;color:#dc2626;font-weight:600;margin:1rem 0;">
        ❌ Payment proof was rejected. Please upload a valid screenshot.
      </div>`;
    document.getElementById('paymentSection').style.display = 'block';
    document.getElementById('uploadSection').style.display  = 'block';
    // Re-attach upload to existing order
    setupUploadProofForm(order._id);
  } else {
    // Order created but no screenshot yet
    document.getElementById('paymentSection').style.display = 'block';
    document.getElementById('uploadSection').style.display  = 'block';
    setupUploadProofForm(order._id);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fillSummary(items, total, details) {
  // Customer details
  document.getElementById('confirmationName').textContent    = details.name;
  document.getElementById('confirmationEmail').textContent   = details.email;
  document.getElementById('confirmationPhone').textContent   = details.phone;
  document.getElementById('confirmationAddress').textContent = details.address;

  // Items table with per-item discount
  document.getElementById('confirmationItems').innerHTML = items.map(item => {
    const orig = (item.originalPrice && item.originalPrice > item.price) ? item.originalPrice : null;
    return `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>
          ₹${item.price * item.quantity}
          ${orig ? `<br><small style="text-decoration:line-through;color:#94a3b8;">₹${orig * item.quantity}</small>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  // Discount breakdown
  const mrpTotal = items.reduce((sum, item) => {
    const orig = (item.originalPrice && item.originalPrice > item.price) ? item.originalPrice : item.price;
    return sum + (orig * item.quantity);
  }, 0);
  const discount = mrpTotal - total;

  // Build total section
  let totalHtml = '';
  if (discount > 0) {
    totalHtml = `
      <tr style="color:#64748b;">
        <td colspan="2" style="padding:0.4rem 0.75rem;text-align:right;">Subtotal (MRP)</td>
        <td style="padding:0.4rem 0.75rem;">₹${mrpTotal}</td>
      </tr>
      <tr style="color:#16a34a;font-weight:700;">
        <td colspan="2" style="padding:0.4rem 0.75rem;text-align:right;">🏷️ Discount</td>
        <td style="padding:0.4rem 0.75rem;">− ₹${discount.toFixed(0)}</td>
      </tr>
    `;
  }
  totalHtml += `
    <tr style="font-weight:900;font-size:1.1rem;background:#fff7ed;">
      <td colspan="2" style="padding:0.6rem 0.75rem;text-align:right;color:#ea580c;">You Pay</td>
      <td style="padding:0.6rem 0.75rem;color:#f97316;">₹${total}</td>
    </tr>
  `;

  // Append total rows to the items table
  document.getElementById('confirmationItems').innerHTML += totalHtml;
  document.getElementById('confirmationTotal').textContent = total;
}

function setStepDone(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('active'); el.classList.add('done'); }
}

async function fetchOrder(orderId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('fetch failed');
    return await res.json();
  } catch {
    return JSON.parse(sessionStorage.getItem('orderData') || '{}');
  }
}

function generateQRCode(upiLink) {
  const div = document.getElementById('qrCode');
  div.innerHTML = '';
  new QRCode(div, {
    text: upiLink, width: 200, height: 200,
    colorDark: '#000000', colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

// ─── Upload proof form ────────────────────────────────────────────────────────
function setupUploadProofForm(existingOrderId = null) {
  const form = document.getElementById('uploadProofForm');
  if (!form) return;
  // Remove old listener by cloning
  const fresh = form.cloneNode(true);
  form.parentNode.replaceChild(fresh, form);
  fresh.addEventListener('submit', (e) => handleUploadProof(e, existingOrderId));
}

async function handleUploadProof(e, existingOrderId) {
  e.preventDefault();

  const submitBtn    = e.target.querySelector('button[type="submit"]');
  const fileInput    = document.getElementById('paymentScreenshot');
  const msgEl        = document.getElementById('uploadProofMessage');
  const errEl        = document.getElementById('uploadProofError');

  msgEl.textContent = '';
  errEl.textContent = '';

  if (!fileInput.files.length) {
    errEl.textContent = 'Please select your payment screenshot.';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Uploading...';

  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('screenshot', fileInput.files[0]);

  try {
    let response, data;

    if (existingOrderId) {
      // Re-upload for existing order
      response = await fetch(`${API_URL}/orders/${existingOrderId}/upload-proof`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
    } else {
      // New order — create it with the screenshot
      const checkoutRequest = JSON.parse(sessionStorage.getItem('checkoutRequest') || '{}');
      if (!checkoutRequest.items?.length) {
        errEl.textContent = 'Session expired. Please go back to the store and try again.';
        submitBtn.disabled = false;
        submitBtn.textContent = '✅ Submit Payment Proof & Place Order';
        return;
      }
      formData.append('items',           JSON.stringify(checkoutRequest.items));
      formData.append('customerDetails', JSON.stringify(checkoutRequest.customerDetails));
      formData.append('totalPrice',      checkoutRequest.totalPrice);
      formData.append('paymentMethod',   checkoutRequest.paymentMethod);

      response = await fetch(`${API_URL}/orders/payment-request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
    }

    data = await response.json();

    if (!response.ok) {
      errEl.textContent = data.message || 'Upload failed. Please try again.';
      submitBtn.disabled = false;
      submitBtn.textContent = '✅ Submit Payment Proof & Place Order';
      return;
    }

    // Save order to session and clear checkout request
    sessionStorage.setItem('orderData', JSON.stringify(data.order));
    sessionStorage.removeItem('checkoutRequest');

    // Clear cart
    localStorage.removeItem('cart');

    msgEl.textContent = '✓ Payment screenshot uploaded! Your order has been placed.';
    submitBtn.textContent = '✓ Done';

    // Re-render as confirmed order
    setTimeout(() => renderConfirmedOrder(data.order), 1000);

  } catch (error) {
    errEl.textContent = 'Upload error: ' + error.message;
    submitBtn.disabled = false;
    submitBtn.textContent = '✅ Submit Payment Proof & Place Order';
  }
}

// ─── Download receipt ─────────────────────────────────────────────────────────
function downloadReceipt() {
  const order = JSON.parse(
    sessionStorage.getItem('orderData') ||
    sessionStorage.getItem('checkoutRequest') || '{}'
  );

  const content = `
AB STORES
Order Receipt
=====================================
Order ID : ${order._id || order.orderId || 'Pending'}
Date     : ${new Date().toLocaleDateString('en-IN')}

CUSTOMER DETAILS
Name    : ${order.customerDetails?.name || ''}
Email   : ${order.customerDetails?.email || ''}
Phone   : ${order.customerDetails?.phone || ''}
Address : ${order.customerDetails?.address || ''}

ORDER ITEMS
${(order.items || []).map(i => `${i.name} x${i.quantity} = Rs.${i.price * i.quantity}`).join('\n')}

TOTAL : Rs.${order.totalPrice}

PAYMENT
Method : ${order.paymentMethod === 'upi_link' ? 'UPI Link' : 'UPI QR Code'}
UPI ID : ${UPI_ID}

Thank you for shopping at AB Stores!
  `.trim();

  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  a.download = `receipt-${order._id || 'pending'}.txt`;
  a.click();
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('orderData');
  sessionStorage.removeItem('checkoutRequest');
  window.location.href = '/';
}

// ─── Payment Query ────────────────────────────────────────────────────────────
function setupPaymentQueryForm() {
  const form = document.getElementById('paymentQueryForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token   = localStorage.getItem('token');
    const message = document.getElementById('queryMessage').value.trim();
    const order   = JSON.parse(sessionStorage.getItem('orderData') || '{}');
    const successEl = document.getElementById('querySuccess');
    const errorEl   = document.getElementById('queryError');
    const btn       = form.querySelector('button[type="submit"]');

    successEl.style.display = 'none';
    errorEl.style.display   = 'none';

    if (!message) return;

    btn.disabled    = true;
    btn.textContent = '⏳ Sending...';

    try {
      const response = await fetch(`${API_URL}/emails/payment-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orderId: order._id || '', queryMessage: message })
      });
      const data = await response.json();

      if (!response.ok) {
        errorEl.textContent    = data.message || 'Failed to send query';
        errorEl.style.display  = 'block';
      } else {
        successEl.style.display = 'block';
        form.reset();
      }
    } catch (err) {
      errorEl.textContent   = 'Error: ' + err.message;
      errorEl.style.display = 'block';
    } finally {
      btn.disabled    = false;
      btn.textContent = '📤 Send Query';
    }
  });
}
