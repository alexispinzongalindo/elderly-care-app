# 🐛 Debug Network Requests - Step by Step

## ✅ Enhanced Logging Added

I've added **IMPOSSIBLE-TO-MISS** console logging. You'll see big, colored messages for every request.

---

## 🔍 Step-by-Step Debugging

### Step 1: Open Console Tab (NOT Network Tab First)
1. Open Developer Tools: `Cmd + Option + I`
2. **Click "Console" tab**
3. **Clear the console** (trash icon or `Cmd + K`)

### Step 2: Navigate to a Page
1. **Click "Medications"** in navigation
2. **Look at Console** - You should see:
   ```
   🌐🌐🌐 NETWORK REQUEST 🌐🌐🌐
   GET /api/medications?resident_id=1
   Time: [timestamp]
   Cache: no-store
   ```
3. **Then you should see**:
   ```
   ✅✅✅ NETWORK RESPONSE ✅✅✅
   GET /api/medications?resident_id=1
   Status: 200 OK
   ```

### Step 3: Check if Requests Are Happening
**In Console, type:**
```javascript
window.networkRequests
```
**Press Enter**

You should see an array of all requests that have happened.

---

## 🎯 What You Should See in Console

### When You Click "Medications":
```
🌐🌐🌐 NETWORK REQUEST 🌐🌐🌐
GET /api/medications?resident_id=1
Time: 2024-01-15T10:30:00.000Z
Cache: no-store

✅✅✅ NETWORK RESPONSE ✅✅✅
GET /api/medications?resident_id=1
Status: 200 OK
Time: 2024-01-15T10:30:00.150Z

📦 Response data: [{id: 1, name: "..."}, ...]
```

---

## 🔧 If You DON'T See Console Logs

### Check 1: Is Console Tab Open?
- Make sure you're on **Console tab**, not Network tab
- Console shows JavaScript logs
- Network shows HTTP requests

### Check 2: Is Console Filtered?
- Check filter dropdown - should be set to "All"
- Uncheck "Errors", "Warnings" if they're hiding logs
- Clear any text in search box

### Check 3: Did You Navigate?
- Console only shows logs for actions you take
- You must click/navigate to trigger requests
- Try clicking "Medications" again

### Check 4: Check window.networkRequests
- Type in Console: `window.networkRequests`
- If it shows `undefined`, requests aren't happening
- If it shows an array, requests ARE happening (just not in Network tab)

---

## 📊 Now Check Network Tab

### Step 1: Switch to Network Tab
1. **Click "Network" tab** in Developer Tools
2. **Enable "Preserve log"** checkbox
3. **Enable "Disable cache"** checkbox (if available)

### Step 2: Clear Network Tab
1. Click the **trash icon** to clear
2. This ensures you see fresh requests

### Step 3: Navigate Again
1. **Click "Medications"** in navigation
2. **Look at Network tab**
3. **Filter by `/api/`** (type in filter box)

### Step 4: Check Request Details
1. **Click on the request** in Network tab
2. **Check these tabs**:
   - **Headers**: Should show request/response headers
   - **Payload**: Request body (for POST/PUT)
   - **Response**: Server response
   - **Preview**: Formatted JSON

---

## 🎯 Quick Test Commands

### In Console Tab, Type These:

**1. See all network requests:**
```javascript
window.networkRequests
```

**2. Count requests:**
```javascript
window.networkRequests?.length || 0
```

**3. See last request:**
```javascript
window.networkRequests?.[window.networkRequests.length - 1]
```

**4. Filter by method:**
```javascript
window.networkRequests?.filter(r => r.method === 'GET')
```

**5. Filter by status:**
```javascript
window.networkRequests?.filter(r => r.status === 200)
```

---

## ✅ Verification Checklist

- [ ] Console shows big colored request logs
- [ ] Console shows big colored response logs
- [ ] `window.networkRequests` shows an array
- [ ] Network tab shows requests (after enabling settings)
- [ ] Requests have status 200 (green)
- [ ] Requests show in filter when typing `/api/`

---

## 🆘 If Still Nothing Shows

### Test 1: Force a Request
In Console, type:
```javascript
fetch('/api/residents?active_only=true', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
        'Content-Type': 'application/json'
    },
    cache: 'no-store'
}).then(r => r.json()).then(console.log)
```

**This should:**
- Show in Console (request/response logs)
- Show in Network tab
- Return data

### Test 2: Check if fetch is overridden
In Console, type:
```javascript
window.fetch.toString()
```

**Should show** our custom fetch function (not native fetch)

### Test 3: Check browser
- Try a different browser (Chrome, Firefox, Safari)
- Rule out browser-specific issues

---

## 📋 Summary

1. **Check Console FIRST** - You'll see big colored logs
2. **Check `window.networkRequests`** - Verifies requests are happening
3. **Then check Network tab** - With proper settings enabled
4. **Use test commands** - To debug further

---

**The Console will show IMPOSSIBLE-TO-MISS logs. Check there first!** 🎯

