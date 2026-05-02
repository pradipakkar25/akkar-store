# Email Service Fixes

## Issues Fixed

### 1. **Gmail SMTP Timeout**
- **Problem**: Gmail SMTP connections were timing out, causing the server to crash with SIGTERM
- **Solution**: Added connection timeout and socket timeout settings (5 seconds each)
- **Additional**: Added a 10-second overall timeout for email sending

### 2. **Blocking Email Sends**
- **Problem**: Email sending was blocking the main request/response cycle, causing server crashes
- **Solution**: Made all email sends non-blocking using `.catch()` handlers
- **Files Updated**:
  - `routes/auth.js` - Welcome email
  - `routes/orders.js` - Order confirmation and status emails
  - `routes/emails.js` - Broadcast and payment query emails

### 3. **Error Handling**
- **Problem**: Email errors were crashing the server
- **Solution**: All email errors are now caught and logged without affecting the main application flow

## Changes Made

### `services/emailService.js`
```javascript
// Added timeout configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { ... },
  connectionTimeout: 5000,
  socketTimeout: 5000
});

// Added Promise.race with timeout
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Email send timeout')), 10000)
);
await Promise.race([sendPromise, timeoutPromise]);
```

### `routes/auth.js`
```javascript
// Non-blocking email send
sendWelcomeEmail({ name, email })
  .then(ok => { if (!ok) console.warn('Welcome email not sent to:', email); })
  .catch(err => console.error('Welcome email error:', err.message));
```

### `routes/orders.js`
```javascript
// Non-blocking email sends
sendOrderEmailToAdmin(orderDetails)
  .catch(err => console.error('Admin email error:', err.message));
sendOrderConfirmationToCustomer(orderDetails)
  .catch(err => console.error('Customer email error:', err.message));
```

### `routes/emails.js`
```javascript
// Non-blocking broadcast
sendOfferBroadcast({ recipients: users, offerTitle, offerBody, offerImage })
  .then(sent => console.log(`Broadcast sent to ${sent} users`))
  .catch(err => console.error('Broadcast error:', err.message));
```

## Result

✅ Server no longer crashes when email sending times out  
✅ Email failures don't block user operations  
✅ All email errors are logged for debugging  
✅ User registration, order creation, and other operations complete successfully even if email fails

## Testing

To test:
1. Restart the server
2. Register a new user - should complete even if welcome email times out
3. Create an order - should complete even if order emails time out
4. Check console logs for email status messages

## Future Improvements

For production deployment on Railway:
1. Set `RESEND_API_KEY` environment variable to use Resend instead of Gmail
2. Remove the `DISABLE_CLOUDINARY=true` line and provide correct Cloudinary credentials
3. Resend is more reliable than Gmail SMTP for server-side email sending
