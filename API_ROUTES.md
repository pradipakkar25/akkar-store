# API Routes Documentation

## Base URL
```
https://akkar-store-production.up.railway.app/api
```

---

## Authentication Routes (`/api/auth`)

### 1. Register User
**POST** `/auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "isAdmin": false
  },
  "token": "jwt_token_here"
}
```

---

### 2. Login User
**POST** `/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "isAdmin": false
  },
  "token": "jwt_token_here"
}
```

---

## Products Routes (`/api/products`)

### 1. Get All Products
**GET** `/products`

**Response:**
```json
[
  {
    "_id": "product_id",
    "name": "Bangles Set",
    "price": 299,
    "originalPrice": 499,
    "discountPercent": 40,
    "offerLabel": "Diwali Sale",
    "description": "Beautiful bangles set",
    "image": "https://cloudinary.com/...",
    "category": "Bangles",
    "stock": 50,
    "createdAt": "2026-05-03T...",
    "updatedAt": "2026-05-03T..."
  }
]
```

---

### 2. Get Single Product
**GET** `/products/:id`

**Response:**
```json
{
  "_id": "product_id",
  "name": "Bangles Set",
  "price": 299,
  "description": "Beautiful bangles set",
  "image": "https://cloudinary.com/...",
  "category": "Bangles",
  "stock": 50
}
```

---

### 3. Add Product (Admin Only)
**POST** `/products`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
```
name: "Bangles Set"
price: 299
originalPrice: 499
discountPercent: 40
offerLabel: "Diwali Sale"
description: "Beautiful bangles set"
category: "Bangles"
stock: 50
image: [file]
```

**Response:**
```json
{
  "message": "Product added successfully",
  "product": {
    "_id": "product_id",
    "name": "Bangles Set",
    "price": 299,
    "image": "https://cloudinary.com/..."
  }
}
```

---

### 4. Update Product (Admin Only)
**PUT** `/products/:id`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:** (same as add product, all optional)

**Response:**
```json
{
  "message": "Product updated successfully",
  "product": { ... }
}
```

---

### 5. Delete Product (Admin Only)
**DELETE** `/products/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Product deleted successfully"
}
```

---

## Categories Routes (`/api/categories`)

### 1. Get All Categories
**GET** `/categories`

**Response:**
```json
[
  {
    "_id": "category_id",
    "name": "Bangles",
    "icon": "💍",
    "description": "All types of bangles"
  }
]
```

---

### 2. Add Category (Admin Only)
**POST** `/categories`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Bangles",
  "icon": "💍",
  "description": "All types of bangles"
}
```

**Response:**
```json
{
  "message": "Category added successfully",
  "category": { ... }
}
```

---

### 3. Delete Category (Admin Only)
**DELETE** `/categories/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Category deleted successfully"
}
```

---

## Orders Routes (`/api/orders`)

### 1. Create Order
**POST** `/orders`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "name": "Bangles Set",
      "price": 299,
      "quantity": 2
    }
  ],
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "address": "123 Main St, City"
  },
  "totalPrice": 598,
  "paymentMethod": "upi_link"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "_id": "order_id",
    "orderNumber": "ORD-001",
    "orderStatus": "pending",
    "paymentStatus": "pending"
  },
  "paymentInstructions": {
    "upiLink": "upi://pay?...",
    "upiId": "prakash.akkar@ybl"
  }
}
```

---

### 2. Create Order with Payment Screenshot
**POST** `/orders/payment-request`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
```
items: [{"productId": "...", "quantity": 2}]
customerDetails: {"name": "...", "email": "...", "phone": "...", "address": "..."}
totalPrice: 598
paymentMethod: "upi_link"
screenshot: [file]
```

**Response:**
```json
{
  "message": "Order created successfully after payment proof upload",
  "order": { ... }
}
```

---

### 3. Get User Orders
**GET** `/orders/user/my-orders`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "_id": "order_id",
    "orderNumber": "ORD-001",
    "totalPrice": 598,
    "orderStatus": "pending",
    "paymentStatus": "pending",
    "items": [ ... ]
  }
]
```

---

### 4. Get All Orders (Admin Only)
**GET** `/orders/admin/all-orders?status=pending&paymentStatus=completed`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status`: pending, processing, shipped, delivered, cancelled
- `paymentStatus`: pending, completed, failed

**Response:**
```json
[
  {
    "_id": "order_id",
    "orderNumber": "ORD-001",
    "customerDetails": { ... },
    "items": [ ... ],
    "totalPrice": 598,
    "orderStatus": "pending",
    "paymentStatus": "pending",
    "paymentScreenshot": "https://cloudinary.com/..."
  }
]
```

---

### 5. Get Single Order
**GET** `/orders/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "_id": "order_id",
  "orderNumber": "ORD-001",
  "customerDetails": { ... },
  "items": [ ... ],
  "totalPrice": 598,
  "orderStatus": "pending",
  "paymentStatus": "pending",
  "paymentScreenshot": "https://cloudinary.com/..."
}
```

---

### 6. Upload Payment Screenshot
**POST** `/orders/:id/upload-proof`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
```
screenshot: [file]
```

**Response:**
```json
{
  "message": "Payment screenshot uploaded successfully. Awaiting admin verification.",
  "order": { ... }
}
```

---

### 7. Update Order Status (Admin Only)
**PUT** `/orders/:id/status`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "orderStatus": "processing",
  "paymentStatus": "completed",
  "paymentVerificationStatus": "verified"
}
```

**Response:**
```json
{
  "message": "Order status updated",
  "order": { ... }
}
```

---

### 8. Cancel Order
**PUT** `/orders/:id/cancel`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Order cancelled successfully",
  "order": { ... }
}
```

---

## Email Routes (`/api/emails`)

### 1. Broadcast Offer Email (Admin Only)
**POST** `/emails/broadcast-offer`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "offerTitle": "🔥 Flat 40% OFF on all Bangles",
  "offerBody": "Limited time offer. Valid till Sunday.",
  "offerImage": "https://cloudinary.com/..."
}
```

**Response:**
```json
{
  "message": "Sending offer to 25 users...",
  "total": 25,
  "sent": 25
}
```

---

### 2. Payment Query (Customer)
**POST** `/emails/payment-query`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "orderId": "order_id",
  "queryMessage": "I sent the payment but haven't received confirmation"
}
```

**Response:**
```json
{
  "message": "Your query has been sent. We will reply within 24 hours."
}
```

---

## Offer Banners Routes (`/api/offer-banners`)

### 1. Get All Active Banners
**GET** `/offer-banners`

**Response:**
```json
[
  {
    "_id": "banner_id",
    "text": "🔥 Flat 30% OFF",
    "subText": "Limited time offer",
    "emoji": "🔥",
    "bgColor": "#f97316",
    "textColor": "#ffffff",
    "image": "https://cloudinary.com/...",
    "isActive": true
  }
]
```

---

### 2. Get All Banners (Admin Only)
**GET** `/offer-banners/admin/all`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "_id": "banner_id",
    "text": "🔥 Flat 30% OFF",
    "isActive": true
  }
]
```

---

### 3. Create Banner (Admin Only)
**POST** `/offer-banners`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
```
text: "🔥 Flat 30% OFF"
subText: "Limited time offer"
emoji: "🔥"
bgColor: "#f97316"
textColor: "#ffffff"
isActive: true
bannerImage: [file]
```

**Response:**
```json
{
  "message": "Banner created successfully",
  "banner": { ... }
}
```

---

### 4. Toggle Banner Active Status (Admin Only)
**PUT** `/offer-banners/:id/toggle`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Banner toggled",
  "banner": { ... }
}
```

---

### 5. Delete Banner (Admin Only)
**DELETE** `/offer-banners/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Banner deleted successfully"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Common Status Codes:
- `200` — Success
- `201` — Created
- `400` — Bad Request
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (not admin)
- `404` — Not Found
- `500` — Server Error

---

## Authentication

Most endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer {token}
```

Get a token by logging in or registering.

---

## File Upload Limits

- **Product Images**: Max 5MB (JPG, PNG, GIF, WebP)
- **Payment Screenshots**: Max 5MB (JPG, PNG, GIF, WebP, PDF)
- **Banner Images**: Max 5MB (JPG, PNG, GIF, WebP)

Files are stored on **Cloudinary** in production.

---

## Environment Variables Required

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
ADMIN_EMAIL=admin@example.com
RESEND_API_KEY=re_your_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STORE_URL=https://your-domain.com
NODE_ENV=production
PORT=5000
```

---

## Example Usage (JavaScript/Fetch)

### Register User
```javascript
const response = await fetch('https://akkar-store-production.up.railway.app/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  })
});
const data = await response.json();
console.log(data.token); // Save this token
```

### Get All Products
```javascript
const response = await fetch('https://akkar-store-production.up.railway.app/api/products');
const products = await response.json();
console.log(products);
```

### Create Order (with token)
```javascript
const token = localStorage.getItem('token');
const response = await fetch('https://akkar-store-production.up.railway.app/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    items: [{ productId: '...', quantity: 2 }],
    customerDetails: { name: '...', email: '...', phone: '...', address: '...' },
    totalPrice: 598,
    paymentMethod: 'upi_link'
  })
});
const order = await response.json();
console.log(order);
```

---

## Support

For issues or questions, contact: akkargeneralstore@gmail.com
