# Akkar General Store - E-Commerce Application

A full-stack e-commerce web application built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

### User Features
- **User Authentication**: Secure registration and login with JWT
- **Product Browsing**: View all products with images, prices, and descriptions
- **Shopping Cart**: Add/remove products, update quantities
- **Checkout**: Provide delivery details and select payment method
- **Payment Options**: UPI Payment Link or UPI QR Code
- **Order Confirmation**: View order details and download receipt
- **Order History**: Track user orders

### Admin Features
- **Admin Dashboard**: View statistics (total products, orders, pending orders)
- **Product Management**: Add, edit, delete products
- **Order Management**: View all orders, update order status and payment status
- **Email Notifications**: Automatic emails to admin and customer on order placement

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer (Gmail SMTP)
- **QR Code**: QRCode.js library

## Project Structure

```
akkar-general-store/
├── models/
│   ├── User.js
│   ├── Product.js
│   └── Order.js
├── routes/
│   ├── auth.js
│   ├── products.js
│   └── orders.js
├── middleware/
│   └── auth.js
├── services/
│   └── emailService.js
├── public/
│   ├── index.html
│   ├── checkout.html
│   ├── order-confirmation.html
│   ├── admin.html
│   ├── styles.css
│   ├── app.js
│   ├── checkout.js
│   ├── order-confirmation.js
│   └── admin.js
├── server.js
├── package.json
├── .env.example
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud - MongoDB Atlas)
- Gmail account (for email notifications)

### Step 1: Clone/Download the Project
```bash
cd akkar-general-store
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/akkar-general-store
JWT_SECRET=your_secure_jwt_secret_key_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
ADMIN_EMAIL=admin@akkarstore.com
PORT=5000
NODE_ENV=development
```

### Step 4: Setup MongoDB
- **Local MongoDB**: Make sure MongoDB is running on your system
- **MongoDB Atlas**: Use your connection string in MONGODB_URI

### Step 5: Setup Gmail for Email Notifications
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated password
3. Use this password in `.env` as `EMAIL_PASSWORD`

### Step 6: Create Admin User (Optional)
You can create an admin user by modifying the User model or using MongoDB directly:
```javascript
// In MongoDB
db.users.insertOne({
  name: "Admin",
  email: "admin@akkarstore.com",
  password: "hashed_password",
  isAdmin: true
})
```

Or register normally and update `isAdmin` to `true` in MongoDB.

### Step 7: Start the Server
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## Usage

### Customer Flow
1. **Homepage** (`http://localhost:5000/`)
   - Browse products
   - Register/Login
   - Add products to cart

2. **Cart** 
   - View cart items
   - Update quantities
   - Proceed to checkout

3. **Checkout** (`http://localhost:5000/checkout`)
   - Enter delivery details
   - Select payment method
   - Place order

4. **Order Confirmation** (`http://localhost:5000/order-confirmation`)
   - View order details
   - See payment instructions
   - Download receipt

### Admin Flow
1. **Admin Login** (`http://localhost:5000/admin`)
   - Login with admin credentials

2. **Dashboard**
   - View statistics

3. **Products Management**
   - Add new products
   - Edit existing products
   - Delete products

4. **Orders Management**
   - View all orders
   - Update order status
   - Update payment status

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Add product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/user/my-orders` - Get user orders
- `GET /api/orders/admin/all-orders` - Get all orders (admin only)
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status (admin only)

## Payment Integration

### UPI Payment Link
- Format: `upi://pay?pa=admin@okhdfcbank&pn=AkkarGeneralStore&am={amount}&tn=Order%20{orderId}`
- Users can click the link to pay via any UPI app

### UPI QR Code
- Generated using QRCode.js library
- Users can scan with their phone to pay

## Email Notifications

### Admin Email
- Receives order details when customer places an order
- Includes: Order ID, Customer details, Product list, Total price

### Customer Email
- Receives order confirmation
- Includes: Order ID, Product list, Total price

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Admin-only routes protected with middleware
- Input validation with express-validator
- CORS enabled for API security

## Deployment

### Deploy to Heroku
1. Create Heroku account and install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create akkar-general-store`
4. Set environment variables: `heroku config:set KEY=VALUE`
5. Deploy: `git push heroku main`

### Deploy to AWS/DigitalOcean
1. Set up server with Node.js
2. Install MongoDB
3. Clone repository
4. Install dependencies
5. Configure environment variables
6. Use PM2 for process management
7. Setup Nginx as reverse proxy

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify network access if using MongoDB Atlas

### Email Not Sending
- Verify Gmail credentials
- Check if 2FA is enabled
- Verify App Password is correct
- Check ADMIN_EMAIL is valid

### CORS Errors
- Ensure frontend and backend URLs match
- Check CORS configuration in server.js

### Port Already in Use
- Change PORT in .env
- Or kill process using the port

## Future Enhancements

- Payment gateway integration (Razorpay, Stripe)
- Product categories and filters
- User reviews and ratings
- Wishlist feature
- Inventory management
- SMS notifications
- Advanced analytics dashboard
- Multi-language support
- Mobile app

## License

MIT License

## Support

For issues or questions, please contact: support@akkarstore.com

---

**Akkar General Store** - Your one-stop shop for quality products!
