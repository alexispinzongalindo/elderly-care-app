# 🔍 How to See Network Requests - Step by Step

## ⚠️ IMPORTANT: Use Network Tab, NOT Console Tab

Network requests appear in the **Network** tab, not the Console tab.

---

## 📋 Step-by-Step Instructions

### Step 1: Open Developer Tools
- **Mac**: Press `Cmd + Option + I`
- **Or**: Right-click page → "Inspect" or "Inspect Element"

### Step 2: Click the "Network" Tab
- Look for tabs at the top: Elements, **Console**, **Network**, Sources, etc.
- **Click "Network"** (NOT Console)

### Step 3: Make Sure Recording is ON
- Look for a **red circle** button at the top of Network tab
- If it's gray, **click it** to turn it red (start recording)

### Step 4: Clear Existing Requests (Optional)
- Click the **🚫 (clear)** button to clear old requests
- This makes it easier to see new ones

### Step 5: Interact with the App
**You need to DO something to trigger requests:**

1. **Login** (if not logged in)
   - Enter username/password
   - Click "Login"
   - You should see `/api/auth/login` request

2. **Select a Resident**
   - Choose from dropdown
   - Click "Continue"
   - You should see requests

3. **Navigate to a Page**
   - Click "Residents" in navigation
   - Click "Medications"
   - Click "Appointments"
   - Each will trigger API requests

4. **Load Data**
   - Go to Residents page → See `/api/residents` request
   - Go to Medications → See `/api/medications` request
   - Go to Appointments → See `/api/appointments` request

### Step 6: View Requests
- Requests will appear in real-time as you interact
- Each request shows:
  - **Status**: 200 (green), 404 (red), etc.
  - **Method**: GET, POST, PUT, DELETE
  - **URL**: `/api/residents`, `/api/medications`, etc.
  - **Type**: xhr or fetch
  - **Time**: How long it took

### Step 7: Click on a Request for Details
- **Click any request** to see:
  - **Headers**: Request and response headers
  - **Payload**: Request body (for POST/PUT)
  - **Response**: Server response data
  - **Preview**: Formatted JSON view

---

## 🎯 Quick Test

1. Open Developer Tools → **Network tab**
2. Make sure red circle is ON
3. **Refresh the page** (`Cmd + R`)
4. You should see requests like:
   - `index.html`
   - `style.css`
   - `script.js`
   - `/api/auth/login` (if checking auth)
   - `/api/residents` (if logged in)

---

## 🔧 Network Tab Settings

### Enable "Preserve Log"
- **Check the box** "Preserve log" at the top
- **Why**: Keeps requests visible after page navigation

### Filter Requests
- **Type `/api/`** in the filter box → See only API calls
- **Click "XHR"** or "Fetch" → See only API requests
- **Click "All"** → See everything

---

## 📊 What You Should See

### After Login:
```
GET /api/residents?active_only=true
Status: 200 OK
Type: fetch
```

### When Loading Medications:
```
GET /api/medications?resident_id=1
Status: 200 OK
Type: fetch
```

### When Editing:
```
GET /api/medications/123
Status: 200 OK
Type: fetch
```

---

## ❌ If You Still See Nothing

### Check 1: Are you on the Network tab?
- **NOT Console tab** - that's for JavaScript logs
- **Network tab** - that's for HTTP requests

### Check 2: Is recording ON?
- Red circle should be **active/red**
- If gray, click it

### Check 3: Did you interact with the app?
- Requests only appear when you:
  - Login
  - Navigate pages
  - Click buttons
  - Load data

### Check 4: Is the page loaded?
- Make sure the page fully loaded
- Try refreshing (`Cmd + R`)

### Check 5: Check filter
- Make sure filter is set to "All" or "XHR/Fetch"
- Clear any text filters

### Check 6: Wait for deployment
- If you just pushed changes, wait 2-5 minutes
- Hard refresh: `Cmd + Shift + R`

---

## 🖥️ Console Tab (Different Purpose)

The **Console tab** shows:
- JavaScript logs (console.log)
- Errors
- Warnings

The **Network tab** shows:
- HTTP requests
- API calls
- File downloads

**You need BOTH tabs for full visibility!**

---

## ✅ Summary

1. **Open DevTools**: `Cmd + Option + I`
2. **Click "Network" tab** (NOT Console)
3. **Make sure red circle is ON**
4. **Interact with app** (login, navigate, click)
5. **See requests appear in real-time**

---

**The Network tab is where all HTTP requests appear!** 🎯

