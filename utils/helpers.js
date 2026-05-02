// Generate UPI payment link
const generateUPILink = (amount, orderId, upiId = 'admin@okhdfcbank') => {
  const encodedAmount = encodeURIComponent(amount);
  const encodedOrderId = encodeURIComponent(`Order ${orderId}`);
  return `upi://pay?pa=${upiId}&pn=AkkarGeneralStore&am=${encodedAmount}&tn=${encodedOrderId}`;
};

// Format currency
const formatCurrency = (amount) => {
  return `₹${amount.toFixed(2)}`;
};

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-IN');
};

// Validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

// Generate order ID
const generateOrderId = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Calculate total price
const calculateTotal = (items) => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Truncate text
const truncateText = (text, length = 100) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

module.exports = {
  generateUPILink,
  formatCurrency,
  formatDate,
  formatTime,
  validateEmail,
  validatePhone,
  generateOrderId,
  calculateTotal,
  truncateText
};
