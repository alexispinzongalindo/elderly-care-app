# Quick Start: Development Tools

## 🚀 Install Tools (One-Time Setup)

```bash
# Install JavaScript tools (ESLint + Prettier)
npm install

# Optional: Install Python formatting (if you want)
pip install black mypy
```

## ✅ Use Tools (Daily)

### Option 1: Automatic (Recommended)
1. Install these VS Code/Cursor extensions:
   - **ESLint** (dbaeumer.vscode-eslint)
   - **Prettier** (esbenp.prettier-vscode)
   - **Python** (ms-python.python) - usually already installed

2. The `.vscode/settings.json` file is already configured!
   - Code will **auto-format on save**
   - ESLint errors will show **red underlines** in your code
   - Fix suggestions appear automatically

### Option 2: Manual Commands
```bash
# Check for JavaScript errors
npm run lint

# Auto-fix JavaScript errors
npm run lint:fix

# Format all code
npm run format

# Check if code needs formatting
npm run format:check
```

## 🎯 What These Tools Do

### ESLint
- ✅ Catches typos in variable names
- ✅ Finds undefined variables before runtime
- ✅ Detects unused code
- ✅ Shows errors with red underlines in your editor

### Prettier
- ✅ Makes code look consistent
- ✅ Formats on save automatically
- ✅ No more style arguments

### Python Type Hints (Already in use)
- ✅ Better autocomplete
- ✅ Catch errors earlier
- ✅ Self-documenting code

## 🔧 If You Get Errors

**"ESLint not found"**
```bash
npm install
```

**"Prettier not found"**
```bash
npm install
```

**VS Code not showing errors?**
1. Install ESLint extension
2. Reload VS Code/Cursor (Cmd+R or Ctrl+R)

## 📝 Example: Before vs After

### Before (Hard to debug):
```javascript
const carrierEl = usePageForm ? document.getElementById('newEmergencyCarrierPage') : document.getElementById('newEmergencyCarrier');
const carrierValue = carrierEl ? carrierEl.value : '';
// What if carrierEl is null? What if value is undefined?
```

### After (ESLint catches it):
```javascript
const carrierEl = usePageForm
  ? document.getElementById('newEmergencyCarrierPage')
  : document.getElementById('newEmergencyCarrier');

// ESLint warns: "carrierEl might be null"
const carrierValue = carrierEl?.value ?? ''; // Better!
```

## 💡 Pro Tips

1. **Before committing code:** Run `npm run lint:fix` and `npm run format`
2. **Red underlines?** Hover to see the error, or run `npm run lint`
3. **Auto-format not working?** Check that Prettier extension is installed

## 🆘 Need Help?

Check `DEVELOPMENT_TOOLS.md` for detailed information about each tool.

