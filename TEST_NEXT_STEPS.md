# What to Do Next - Testing Checklist

## ✅ Step 1: Verify Extensions Are Working

1. **Open `script.js`** in Cursor
2. **Look for these signs:**
   - Red underlines on any errors
   - Code formatting looks clean
   - Save the file (`Cmd + S`) - it should auto-format

3. **Quick test**: Add a typo like `const test = undefinedVar;` - you should see a red underline!

## ✅ Step 2: Test the Carrier Field Saving Issue

We added logging to debug why the carrier wasn't saving. Now let's test it:

1. **Open your app** in the browser
2. **Open Developer Console**:
   - Mac: `Cmd + Option + I`
   - Or right-click → "Inspect" → "Console" tab

3. **Edit Resident ID 9:**
   - Go to Residents page
   - Click "Edit" on resident ID 9 (JOSE PEREZ)
   - Select a carrier from the dropdown (e.g., "Claro")
   - Click "Save"

4. **Check the Console Logs:**
   Look for these messages:
   ```
   🔍 Carrier element: <select>...
   🔍 Carrier value: "claro"
   🔍 Carrier element found: true
   ```

5. **Check Backend Logs:**
   - Look at your terminal/server logs
   - You should see:
   ```
   📱 [UPDATE] Emergency contact carrier value: 'claro' (type: str) for resident ID: 9
   ```

6. **Verify It Saved:**
   - Edit the resident again
   - The carrier dropdown should show "Claro" (not "-- Select Carrier --")

7. **Test SMS:**
   - Create an incident for this resident
   - Check server logs - should show:
   ```
   📱 [Background] Emergency contact carrier from DB: 'claro' (will use: claro)
   ```

## ✅ Step 3: If Carrier Still Not Saving

If the carrier dropdown resets to "-- Select Carrier --" after saving:

1. **Check Console:**
   - Look for any JavaScript errors (red text)
   - Check the "Resident data to save:" log - does it show `emergency_contact_carrier: "claro"`?

2. **Check Network Tab:**
   - Open DevTools → Network tab
   - Save the resident
   - Click on the PUT request to `/api/residents/9`
   - Check "Payload" or "Request" tab
   - Does it include `"emergency_contact_carrier": "claro"`?

3. **Check Server Response:**
   - In Network tab, check the Response
   - Does it show the carrier was saved?

## 🎯 Expected Results

### ✅ Success:
- Carrier dropdown shows selected carrier after saving
- Console logs show carrier value correctly
- Server logs show carrier saved to database
- SMS uses correct carrier gateway (e.g., @vtexto.com for Claro)

### ❌ If Still Not Working:
- Share the console logs
- Share the Network request/response
- Share the server logs

## 🚀 Bonus: Use ESLint to Catch Future Errors

Now that ESLint is installed:
- **Red underlines** = potential bugs (fix these!)
- **Yellow underlines** = warnings (good to fix)
- **Auto-format on save** = cleaner code

## 📝 Quick Reference

**Files to check:**
- `script.js` - Frontend code (carrier field handling)
- `server.py` - Backend code (carrier saving logic)
- Browser Console - Frontend logs
- Server Terminal - Backend logs

**Key Functions:**
- `saveNewResident()` - Saves resident data (script.js line ~1486)
- `resident_detail()` PUT - Updates resident (server.py line ~741)

