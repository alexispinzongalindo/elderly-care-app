# 🚀 Quick Testing Scripts

Two scripts to make testing your app easier:

## 📋 Script 1: `quick-test.sh` (Full Version)
**Complete testing script with deployment check**

```bash
./quick-test.sh
```

**What it does:**
1. ✅ Checks if you have uncommitted changes
2. ✅ Shows latest commit status
3. ✅ Checks if app is online
4. ✅ Clears Safari cache
5. ✅ Opens app in Safari with Web Inspector
6. ✅ Optional: Opens in Chrome with DevTools

---

## 📋 Script 2: `test-app.sh` (Simple Version)
**Quick one-click test - Just opens app with Web Inspector**

```bash
./test-app.sh
```

**What it does:**
1. ✅ Clears Safari cache
2. ✅ Opens app with cache-busting timestamp
3. ✅ Tries to open Web Inspector automatically

---

## 🎯 Usage

### Option A: Run from Terminal
```bash
cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
./test-app.sh
```

### Option B: Double-click to Run
1. Right-click on `test-app.sh`
2. Select "Open With" > "Terminal"
3. Or make it executable and double-click (you may need to allow it in System Preferences)

---

## 🔧 Manual Web Inspector Shortcuts

If the script doesn't open Web Inspector automatically:

**Safari:**
- `Cmd + Option + I` - Open Web Inspector
- `Cmd + Option + E` - Empty Caches
- `Cmd + Shift + R` - Hard Refresh (bypass cache)

**Enable Develop Menu (First Time Only):**
1. Safari > Preferences > Advanced
2. Check "Show Develop menu in menu bar"

**Chrome/Edge:**
- `Cmd + Option + I` - Open DevTools
- `Cmd + Shift + Delete` - Clear browsing data
- `Cmd + Shift + R` - Hard Refresh

---

## 🧹 Clear Cache Manually

**Safari:**
```
Safari > Preferences > Privacy > Manage Website Data > Remove All
```
or
```
Safari > Develop > Empty Caches
```

**Quick Terminal Command:**
```bash
rm -rf ~/Library/Caches/com.apple.Safari/*
```

---

## 📝 Notes

- The scripts add `?nocache=timestamp` to the URL to force a fresh load
- Web Inspector might require you to enable the Develop menu first
- If scripts don't work, you may need to allow them in System Preferences > Security & Privacy

---

## ⚡ Pro Tip

Create a keyboard shortcut or launcher for even faster access!

















































