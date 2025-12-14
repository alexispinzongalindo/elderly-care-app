# 🔄 How to Trigger Network Requests

## ⚠️ The Network Tab Only Shows Requests That Happen AFTER You Open It

The Network tab is currently empty because **no requests have been made yet**. You need to **DO something** to trigger API calls.

---

## 🎯 Actions That Will Show Network Requests

### 1. **Refresh the Page** (Easiest)
- With Network tab open, press `Cmd + R` (or `F5`)
- You'll see requests for:
  - `index.html`
  - `style.css`
  - `script.js`
  - `/api/auth/login` (if checking auth)
  - `/api/residents` (if logged in)

### 2. **Navigate to a Page**
- Click **"Residents"** in navigation → See `/api/residents` request
- Click **"Medications"** → See `/api/medications` request
- Click **"Appointments"** → See `/api/appointments` request
- Click **"Vital Signs"** → See `/api/vital-signs` request

### 3. **Save the Form** (You're on Edit Resident)
- Make a change to the form
- Click **"Save"** button
- You'll see:
  - `PUT /api/residents/123` (to update)
  - `GET /api/residents` (to reload list)

### 4. **Click "Cancel" or Close Form**
- This might trigger a reload of the residents list
- You'll see `GET /api/residents` request

### 5. **Search**
- Type in the search box
- You'll see `/api/residents` and other search requests

### 6. **Add New Item**
- Click "+ Add New Resident"
- Fill form and save
- You'll see `POST /api/residents` request

---

## 📋 Step-by-Step Test

### Test 1: See Requests on Page Load
1. **Open Network tab** (you already have it open)
2. **Enable "Preserve log"** checkbox (top of Network tab)
3. **Refresh page**: `Cmd + R`
4. **You should see**:
   - HTML, CSS, JS files loading
   - API requests if you're logged in

### Test 2: See Requests When Navigating
1. **Keep Network tab open**
2. **Click "Residents"** in navigation
3. **You should see**: `GET /api/residents?active_only=true`

### Test 3: See Requests When Editing
1. **Keep Network tab open**
2. **You're already on Edit Resident form**
3. **Change something** (e.g., change first name)
4. **Click "Save"** button
5. **You should see**:
   - `PUT /api/residents/[id]` (to save)
   - `GET /api/residents` (to reload list)

### Test 4: See Requests When Loading Data
1. **Click "Medications"** in navigation
2. **You should see**: `GET /api/medications?resident_id=[id]`
3. **Click "Appointments"**
4. **You should see**: `GET /api/appointments?resident_id=[id]`

---

## 🔧 Network Tab Settings

### Enable "Preserve Log"
- **Check the box** at the top of Network tab
- **Why**: Keeps requests visible even after page navigation
- **Location**: Top left of Network tab

### Filter to See Only API Calls
- **Type `/api/`** in the filter box
- **Or click "XHR" or "Fetch"** filter
- This hides HTML/CSS/JS files and shows only API requests

---

## ✅ What You Should See

### After Refreshing Page:
```
Name                    Type      Status
index.html              document  200
style.css               stylesheet 200
script.js               script    200
/api/residents          fetch     200
```

### After Clicking "Residents":
```
GET /api/residents?active_only=true
Status: 200 OK
Type: fetch
Time: ~50ms
```

### After Saving Edit:
```
PUT /api/residents/123
Status: 200 OK
Type: fetch
Time: ~100ms

GET /api/residents?active_only=true
Status: 200 OK
Type: fetch
Time: ~50ms
```

---

## 🎯 Quick Action Right Now

**Since you're on the Edit Resident form:**

1. **Keep Network tab open**
2. **Enable "Preserve log"** checkbox
3. **Click "Save"** button (even without changes)
4. **You should see**:
   - `PUT /api/residents/[id]` request
   - Response with status 200

**OR:**

1. **Click "Cancel"** or close the form
2. **You should see**:
   - `GET /api/residents` request (to reload list)

---

## ❌ If Still Nothing Shows

### Check 1: Is recording ON?
- Look for a **red circle** button
- If gray, click it to turn it red

### Check 2: Did you actually perform an action?
- Network tab only shows requests that happen
- You must click, navigate, or refresh to see requests

### Check 3: Clear and try again
- Click the **trash icon** to clear
- Refresh page or navigate
- Requests should appear

### Check 4: Check filter
- Make sure filter is set to "All"
- Remove any text from filter box

---

## 🚀 Try This Now

1. **Enable "Preserve log"** (checkbox at top)
2. **Click "Residents"** in navigation
3. **You WILL see** `/api/residents` request appear!

---

**The Network tab shows requests in REAL-TIME as they happen. You need to DO something to trigger them!** 🎯

