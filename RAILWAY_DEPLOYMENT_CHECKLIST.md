# Railway Deployment Checklist - Akkar Store

## Pre-Deployment Setup

### 1. Generate Secure JWT Secret
```bash
# On your local machine, run:
openssl rand -base64 32
# Copy the output - you'll need this for Railway
```

### 2. Prepare Environment Variables
Collect these values:
- **JWT_SECRET**: Generated above (min 32 chars)
- **ADMIN_EMAIL**: Your admin email (e.g., pradipakkar25@gmail.com)
- **RESEND_API_KEY**: From https://resend.com (free tier available)
- **MONGODB_URI**: From MongoDB Atlas (free tier available)
- **STORE_URL**: Your Railway domain (e.g., https://akkar-store.up.railway.app)

### 3. Set Up Resend Email Service
1. Go to https://resend.com
2. Sign up (free tier: 100 emails/day)
3. Create API key
4. Verify your domain or use default `onboarding@resend.dev`

### 4. Set Up MongoDB Atlas
1. Go to https://mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/akkar-store`

---

## Railway Deployment Steps

### Step 1: Connect Repository
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account
5. Select this repository

### Step 2: Add Environment Variables
In Railway dashboard → Variables:

```
JWT_SECRET=<your_generated_secret>
ADMIN_EMAIL=<your_admin_email>
RESEND_API_KEY=<your_resend_api_key>
MONGODB_URI=<your_mongodb_connection_string>
STORE_URL=https://<your-railway-domain>.up.railway.app
NODE_ENV=production
PORT=5000
```

### Step 3: Deploy
1. Railway auto-deploys on push to main
2. Or manually trigger: Railway dashboard → Deploy

### Step 4: Verify Deployment
Check Railway logs for:
```
✓ Email service configured
✓ Admin email set
✓ Database connected
✓ Default admin created
```

---

## Post-Deployment Testing

### Test 1: Admin Login
1. Go to `https://your-domain.up.railway.app/admin`
2. Login with:
   - Email: `<ADMIN_EMAIL>`
   - Password: `<ADMIN_PASSWORD>` (from .env)
3. Should see admin dashboard

### Test 2: User Registration
1. Go to `https://your-domain.up.railway.app`
2. Register new account
3. Check email for welcome email (may take 30 seconds)

### Test 3: Place Order
1. Add product to cart
2. Go to checkout
3. Place order with payment screenshot
4. Check:
   - Admin receives order notification email
   - Customer receives order confirmation email
   - Stock decreases in admin panel

### Test 4: Payment Query
1. Go to order confirmation page
2. Send payment query
3. Check admin email for query notification

---

## Troubleshooting

### Admin Login Not Working
- Check: Is `ADMIN_EMAIL` set in Railway variables?
- Check: Is `JWT_SECRET` set?
- Check Railway logs for errors

### Emails Not Sending
- Check: Is `RESEND_API_KEY` set?
- Check: Is `ADMIN_EMAIL` set?
- Check Railway logs: Look for "Email sent" or error messages
- Resend free tier: 100 emails/day limit

### Stock Not Decreasing
- Check: Is order being created?
- Check: Is MongoDB connected?
- Check Railway logs for database errors

### Database Connection Failed
- Check: Is `MONGODB_URI` correct?
- Check: Is IP whitelisted in MongoDB Atlas?
- MongoDB Atlas → Network Access → Add 0.0.0.0/0 (allow all)

---

## Important Notes

⚠️ **Security**:
- Never commit `.env` file
- Use strong JWT_SECRET (min 32 chars)
- Rotate secrets regularly in production

⚠️ **Email Limits**:
- Resend free tier: 100 emails/day
- Upgrade if needed: https://resend.com/pricing

⚠️ **Database**:
- MongoDB Atlas free tier: 512MB storage
- Monitor usage in Atlas dashboard

⚠️ **Admin Account**:
- Default admin created on first startup
- Email: `<ADMIN_EMAIL>`
- Password: `<ADMIN_PASSWORD>` (from .env)
- Change password after first login

---

## Rollback Plan

If deployment fails:
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure MongoDB connection string is correct
4. Ensure Resend API key is valid
5. Redeploy: Push to main branch again

---

## Support

For issues:
1. Check Railway logs: Railway dashboard → Logs
2. Check MongoDB Atlas status
3. Check Resend API status
4. Review FIXES_APPLIED.md for recent changes

---

## Quick Reference

| Component | Status | Action |
|-----------|--------|--------|
| Admin Login | ✅ Fixed | Use `/admin-login` endpoint |
| Email Service | ✅ Fixed | Set RESEND_API_KEY |
| Stock Management | ✅ Fixed | Automatically deducted |
| Order Notifications | ✅ Fixed | Set ADMIN_EMAIL |
| JWT Security | ✅ Fixed | Set JWT_SECRET |

All systems ready for production deployment! 🚀
