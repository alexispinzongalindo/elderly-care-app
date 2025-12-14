# 🔐 Login Troubleshooting Guide

## ❌ Can't Log In?

Follow these steps to diagnose and fix login issues.

---

## 🔍 Step 1: Check Browser Console

1. **Open Developer Tools**: `Cmd + Option + I` (Mac) or `F12` (Windows)
2. **Click "Console" tab**
3. **Try to log in**
4. **Look for error messages**:
   - Red errors = problem
   - Check what the error says

### Common Console Errors:
- `Failed to fetch` = Server not running or network issue
- `401 Unauthorized` = Wrong username/password
- `400 Bad Request` = Missing username or password
- `500 Internal Server Error` = Server-side problem

---

## 🔍 Step 2: Check Network Tab

1. **Open Developer Tools** → **Network tab**
2. **Enable "Preserve log"** checkbox
3. **Try to log in**
4. **Look for `/api/auth/login` request**:
   - **Status 200** = Success (but might have other issues)
   - **Status 401** = Wrong credentials
   - **Status 400** = Missing data
   - **Status 500** = Server error
   - **No request** = Server not running

---

## 🔍 Step 3: Check Default Credentials

**Default login:**
- **Username**: `admin`
- **Password**: `admin123`

**Try these first!**

---

## 🔍 Step 4: Verify Server is Running

### If using local server:
1. **Check terminal** - should show Flask running
2. **Visit**: `http://127.0.0.1:5001` or `http://localhost:5001`
3. **If page doesn't load** = Server not running

### If using deployed version (elderlycare.tech):
1. **Check Render dashboard**: https://dashboard.render.com
2. **Verify service is "Live"**
3. **Check logs** for errors

---

## 🔧 Step 5: Create Admin User (If Missing)

If default admin doesn't exist, create one:

### Option A: Using Python
```python
python3
>>> from server import init_db, hash_password, get_db
>>> init_db()
>>> conn = get_db()
>>> cursor = conn.cursor()
>>> cursor.execute('''
    INSERT INTO staff (username, password_hash, full_name, role, active)
    VALUES (?, ?, ?, ?, ?)
''', ('admin', hash_password('admin123'), 'Administrator', 'admin', 1))
>>> conn.commit()
>>> conn.close()
>>> exit()
```

### Option B: Using SQLite directly
```bash
sqlite3 elder_care.db
INSERT INTO staff (username, password_hash, full_name, role, active)
VALUES ('admin', 'YOUR_HASHED_PASSWORD', 'Administrator', 'admin', 1);
.exit
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid credentials"
**Solution:**
- Check username/password spelling
- Try default: `admin` / `admin123`
- Check if user exists in database
- Verify user is active (`active = 1`)

### Issue 2: "Failed to fetch" or Network Error
**Solution:**
- Check if server is running
- Check server URL (localhost vs deployed)
- Check browser console for CORS errors
- Try different browser

### Issue 3: "Server error" or 500 Error
**Solution:**
- Check server logs
- Verify database exists
- Check if `init_db()` was run
- Restart server

### Issue 4: Login works but page doesn't change
**Solution:**
- Check browser console for JavaScript errors
- Clear browser cache: `Cmd + Shift + R`
- Check localStorage: `localStorage.getItem('authToken')`
- Verify `checkAuth()` function is working

### Issue 5: "Username and password required"
**Solution:**
- Make sure both fields are filled
- Check for extra spaces (trimmed in code)
- Verify form is submitting correctly

---

## ✅ Quick Test

1. **Open Console** (`Cmd + Option + I`)
2. **Type**: `localStorage.clear()` and press Enter
3. **Refresh page** (`Cmd + R`)
4. **Try login** with `admin` / `admin123`
5. **Check Console** for logs:
   - Should see: `🔐 Attempting login for username: admin`
   - Should see: `✅ Login successful!` or error message

---

## 🔍 Debug Commands

### In Browser Console:

**Check if logged in:**
```javascript
localStorage.getItem('authToken')
localStorage.getItem('currentStaff')
```

**Clear login data:**
```javascript
localStorage.clear()
```

**Test login API directly:**
```javascript
fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
})
.then(r => r.json())
.then(console.log)
```

---

## 📋 Checklist

- [ ] Server is running (check terminal or Render dashboard)
- [ ] Using correct URL (localhost:5001 or elderlycare.tech)
- [ ] Default credentials: `admin` / `admin123`
- [ ] Browser console shows no errors
- [ ] Network tab shows `/api/auth/login` request
- [ ] Request returns status 200 (success) or shows error
- [ ] localStorage has `authToken` after login
- [ ] Page redirects after successful login

---

## 🆘 Still Not Working?

1. **Check server logs** for detailed errors
2. **Try incognito/private window** (rules out cache issues)
3. **Try different browser** (Chrome, Firefox, Safari)
4. **Check database** - verify staff table has users
5. **Restart server** completely

---

**Most common issue: Server not running or wrong credentials!** 🔍

