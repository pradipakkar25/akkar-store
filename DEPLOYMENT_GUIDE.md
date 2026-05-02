# Deployment Guide — Akkar General & Bangles Store

## Recommended: Railway (Easiest + Free SSL + MongoDB included)

Railway is the simplest way to deploy this app. It handles Node.js and MongoDB together,
gives you a free HTTPS domain, and deploys automatically from GitHub.

---

## Step 1 — Push code to GitHub

1. Go to https://github.com and create a new repository (e.g. `akkar-store`)
2. Open a terminal in your project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/akkar-store.git
git push -u origin main
```

> Make sure `.env` is in `.gitignore` (it already is) — never push your secrets.

---

## Step 2 — Create MongoDB Atlas database (free)

1. Go to https://cloud.mongodb.com and sign up free
2. Create a new **Free Cluster** (M0 tier)
3. Under **Database Access** → Add a user with username + password
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all — Railway needs this)
5. Click **Connect** → **Connect your application** → copy the connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/akkar-store
   ```
   Replace `USERNAME` and `PASSWORD` with what you set in step 3.

---

## Step 3 — Deploy on Railway

1. Go to https://railway.app and sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `akkar-store` repository
4. Railway auto-detects Node.js and starts deploying

### Set Environment Variables on Railway

In your Railway project → **Variables** tab, add these one by one:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string from Step 2 |
| `JWT_SECRET` | Any long random string (e.g. `akkar2024xK9mP3qR7vL2nW8`) |
| `EMAIL_USER` | `akkargeneralstore@gmail.com` |
| `EMAIL_PASSWORD` | `pmmi dhst wmzr zqdi` |
| `ADMIN_EMAIL` | `pradipakkar25@gmail.com` |
| `ADMIN_PASSWORD` | `pradip25082008` |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `STORE_URL` | Your Railway URL (e.g. `https://akkar-store.up.railway.app`) |

5. Railway will redeploy automatically after you save variables
6. Click **Settings** → **Domains** → **Generate Domain** to get your free HTTPS URL

---

## Step 4 — Create admin user on production

After deployment, run this once to create your admin account:

In Railway → your service → **Shell** tab, run:
```bash
node scripts/createAdmin.js
```

Or add it as a one-time command in Railway's deploy settings.

---

## Step 5 — Update STORE_URL

Once you have your Railway URL (e.g. `https://akkar-store.up.railway.app`):
1. Go to Railway → Variables
2. Update `STORE_URL` to your actual URL
3. Railway redeploys automatically

---

## Your site is live!

- **Store**: `https://your-app.up.railway.app`
- **Admin**: `https://your-app.up.railway.app/admin`

---

## Alternative Options

### Option B — Render (also free, similar to Railway)
1. Go to https://render.com → New Web Service → Connect GitHub
2. Build command: `npm install`
3. Start command: `node server.js`
4. Add same environment variables
5. Add a separate **MongoDB** service or use MongoDB Atlas

### Option C — VPS (DigitalOcean / Hostinger) — More control
Best if you want full control and already have a domain name.

1. Get a VPS (DigitalOcean Droplet ~$6/month or Hostinger VPS)
2. SSH into your server
3. Install Node.js, MongoDB, and Nginx:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
sudo apt-get install -y mongodb

# Install PM2 (keeps your app running)
sudo npm install -g pm2

# Install Nginx (reverse proxy + SSL)
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

4. Clone your repo and set up:
```bash
git clone https://github.com/YOUR_USERNAME/akkar-store.git
cd akkar-store
npm install
cp .env.example .env
nano .env   # fill in your values
```

5. Start with PM2:
```bash
pm2 start server.js --name akkar-store
pm2 startup
pm2 save
```

6. Set up Nginx + free SSL:
```bash
# /etc/nginx/sites-available/akkar-store
server {
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable SSL
sudo certbot --nginx -d yourdomain.com
```

---

## Security Checklist Before Going Live

- [x] `.env` is in `.gitignore` — secrets never pushed to GitHub
- [x] All API URLs use relative paths (`/api`) — no hardcoded localhost
- [x] JWT tokens expire in 7 days
- [x] Passwords hashed with bcrypt
- [x] File uploads validated (type + size limits)
- [x] Admin routes protected with `isAdmin` middleware
- [ ] Change `JWT_SECRET` to a long random string in production
- [ ] Change MongoDB password from default
- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas (not localhost) in production

---

## Recommended: Railway (summary)

| Feature | Railway |
|---|---|
| Cost | Free tier (500 hours/month) |
| Setup time | ~10 minutes |
| SSL/HTTPS | Automatic, free |
| MongoDB | Use MongoDB Atlas (free 512MB) |
| Custom domain | Yes (free) |
| Auto-deploy | Yes (on every git push) |
| Difficulty | ⭐ Very Easy |
