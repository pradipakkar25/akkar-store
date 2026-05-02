# Admin Login Troubleshooting Guide

## Current Status ✅

- **Server**: Running on port 5000 ✓
- **Database**: MongoDB connected ✓
- **Admin User**: Created and verified in database ✓
- **Login Endpoint**: Tested and working ✓

## Admin Credentials

```
Email: pradipakkar557@gmail.com
Password: pradip25082008
```

## How to Login as Admin

1. **Open the website**: http://localhost:5000/
2. **Click "Sign In"** button in the top navigation
3. **Enter credentials**:
   - Email: `pradipakkar557@gmail.com`
   - Password: `pradip25082008`
4. **Click "Sign In"** button
5. **You should see**: "Login successful!" alert
6. **Auto-redirect**: You'll be automatically redirected to `/admin` panel

## If Login is Not Working

### Step 1: Check Browser Console
1. Open your browser (Chrome, Firefox, Edge)
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Try logging in again
5. Look for any error messages in the console

### Step 2: Check Network Tab
1. In Developer Tools, go to **Network** tab
2. Try logging in again
3. Look for a request to `http://localhost:5000/api/auth/login`
4. Click on it and check:
   - **Status**: Should be `200`
   - **Response**: Should contain `token` and `user` object with `isAdmin: true`

### Step 3: Check LocalStorage
1. In Developer Tools, go to **Application** tab
2. Click on **Local Storage** → `http://localhost:5000`
3. After successful login, you should see:
   - `token`: JWT token (long string)
   - `user`: JSON object with `isAdmin: true`

### Step 4: Manual Test
Open this URL in your browser to test login:
```
http://localhost:5000/test-login.html
```

This page allows you to test the login endpoint directly.

## Debugging Information

### What Happens During Login

1. **Frontend** sends email and password to `/api/auth/login`
2. **Backend** finds user in MongoDB
3. **Backend** compares password using bcrypt
4. **Backend** generates JWT token
5. **Backend** returns token and user object with `isAdmin: true`
6. **Frontend** stores token and user in localStorage
7. **Frontend** checks if `user.isAdmin === true`
8. **Frontend** redirects to `/admin` if admin

### Console Logs Added

The following console logs have been added for debugging:

**In app.js (handleLogin function)**:
- `Attempting login with: [email]`
- `Login response: [response data]`
- `Login failed: [error message]`
- `Stored user: [user object]`
- `Is admin: [true/false]`
- `Admin user detected, redirecting to /admin`

**In admin.js (checkAdminAuth function)**:
- `Admin auth check:`
- `Token exists: [true/false]`
- `User string: [user JSON]`
- `User object: [parsed user]`
- `Is admin: [true/false]`
- `Admin access denied - redirecting to home`
- `Admin access granted`

### How to View Logs

1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Try logging in
4. You'll see all the debug messages

## Common Issues and Solutions

### Issue: "Invalid credentials" error

**Possible causes**:
- Wrong email or password
- Admin user not created in database

**Solution**:
1. Verify credentials are exactly: `pradipakkar557@gmail.com` / `pradip25082008`
2. Run the admin creation script:
   ```bash
   node scripts/createAdmin.js
   ```

### Issue: Login works but doesn't redirect to admin panel

**Possible causes**:
- `isAdmin` flag not set to `true` in database
- localStorage not storing user data correctly

**Solution**:
1. Check browser console for logs
2. Check Application tab → LocalStorage
3. Verify `user.isAdmin` is `true`

### Issue: Admin panel shows "Admin access required" alert

**Possible causes**:
- Token not stored in localStorage
- User object not stored correctly
- `isAdmin` flag is `false`

**Solution**:
1. Check browser console logs
2. Check Application tab → LocalStorage
3. Verify both `token` and `user` are present
4. Verify `user.isAdmin` is `true`

## Recreate Admin User

If you're still having issues, recreate the admin user:

```bash
node scripts/createAdmin.js
```

Expected output:
```
Connected to MongoDB
Cleared existing admin user
✓ Admin user created successfully!
Email: pradipakkar557@gmail.com
Password: pradip25082008
```

## Test the Login Endpoint Directly

You can test the login endpoint without the UI:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pradipakkar557@gmail.com","password":"pradip25082008"}'
```

Expected response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Admin",
    "email": "pradipakkar557@gmail.com",
    "isAdmin": true
  }
}
```

## Next Steps

1. **Try logging in** with the credentials provided
2. **Check browser console** (F12) for any error messages
3. **Check Network tab** to see the API response
4. **Check LocalStorage** to verify data is stored
5. **Share console logs** if you're still having issues

## Files Modified for Debugging

- `public/app.js` - Added console logs to handleLogin()
- `public/admin.js` - Added console logs to checkAdminAuth()
- `public/test-login.html` - Test page for manual login testing

## Support

If you're still having issues:
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Try logging in
4. Copy all console messages
5. Share them for debugging
