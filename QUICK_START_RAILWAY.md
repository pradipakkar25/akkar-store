# Quick Start: Deploy Akkar Store to Railway

## 🚀 5-Minute Setup

### Step 1: Generate Secrets (1 min)
```bash
# Generate JWT secret
openssl rand -base64 32
# Copy the output
```

### Step 2: Create Free Accounts (2 min)

**Resend (Email Service)**
- Go to https://resend.com
- Sign up (free tier: 100 emails/day)
- Create API key
- Copy API key

**MongoDB Atlas (Database)**
- Go to https://mongodb.com/cloud/atlas
- Create free cluster
- Create database user
- Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/akkar-store`

### Step 3: Deploy to Railway (2 min)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Connect GitHub and select this repository
4. Add these environment variables:

```
JWT_SECRET=<paste your generated secret>
ADMIN_EMAIL=<your_admin_email@example.com>
RESEND_API_KEY=<paste from Resend>
MONGODB_URI=<paste from MongoDB Atlas>
STORE_URL=https://<your-railway-domain>.up.railway.app
NODE_ENV=production
PORT=5000
```

5. Click "Deploy"
6. Wait 2-3 minutes for deployment

---

## ✅ Verify Deployment

### Check Logs
1. Go to Railway dashboard
2. Click "Logs"
3. Look for:
   - ✓ "Email service configured"
   - ✓ "Admin email set"
   - ✓ "Database connected"

### Test Admin Login
1. Go to `https://your-domain.up.railway.app/admin`
2. Login with:
   - Email: `<ADMIN_EMAIL>`
   - Password: `<ADMIN_PASSWORD>` (from .env)

### Test User Registration
1. Go to `https://your-domain.up.railway.app`
2. Register new account
3. Check email for welcome email

### Test Order Placement
1. Add product to cart
2. Go to checkout
3. Place order
4. Check:
   - Admin receives order email
   - Customer receives confirmation email
   - Stock decreases

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Admin login fails | Check JWT_SECRET and ADMIN_EMAIL are set |
| Emails not sending | Check RESEND_API_KEY is set |
| Database connection error | Check MONGODB_URI is correct |
| Stock not decreasing | Check MongoDB is connected |

---

## 📚 Documentation

- **FIXES_APPLIED.md** - What was fixed
- **RAILWAY_DEPLOYMENT_CHECKLIST.md** - Detailed deployment guide
- **DEPLOYMENT_READY.txt** - Status summary

---

## 🎯 What's Fixed

✅ Admin login now works  
✅ Email service configured  
✅ Stock management working  
✅ Order notifications sent  
✅ Payment queries handled  
✅ Security improved  

---

## 💡 Tips

- **Free tier limits**: Resend (100 emails/day), MongoDB (512MB)
- **Upgrade anytime**: Both services have paid plans
- **Monitor usage**: Check Resend and MongoDB dashboards
- **Change admin password**: After first login

---

## 🆘 Need Help?

1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure MongoDB connection string is correct
4. Check Resend API key is valid
5. Review RAILWAY_DEPLOYMENT_CHECKLIST.md

---

**Status**: ✅ Ready for production deployment!
