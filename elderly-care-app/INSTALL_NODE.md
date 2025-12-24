# Installing Node.js for Development Tools

## Option 1: Install Node.js (Recommended if you want command-line tools)

### macOS (using Homebrew - if you have it):
```bash
brew install node
```

### macOS (using official installer):
1. Go to https://nodejs.org/
2. Download the LTS version
3. Run the installer
4. Restart your terminal/Cursor

### Verify installation:
```bash
node --version
npm --version
```

Then run:
```bash
npm install
```

## Option 2: Use VS Code/Cursor Extensions Only (Easier!)

**Good news:** You don't need Node.js installed if you only want the editor features!

1. **Install these extensions in Cursor/VS Code:**
   - ESLint (dbaeumer.vscode-eslint)
   - Prettier (esbenp.prettier-vscode)

2. **The `.vscode/settings.json` is already configured!**
   - Code will auto-format on save
   - ESLint errors will show as red underlines
   - No command-line needed!

## Option 3: Skip for Now

The tools are **optional**. Your app works fine without them. They just make development easier by catching errors earlier.

## What Each Option Gives You:

### Option 1 (Full Install):
- ✅ Command-line: `npm run lint`, `npm run format`
- ✅ Editor integration (red underlines, auto-format)
- ✅ Can run checks before committing code

### Option 2 (Extensions Only):
- ✅ Editor integration (red underlines, auto-format)
- ❌ No command-line tools
- ✅ **This is usually enough!**

### Option 3 (Skip):
- ❌ No tools
- ✅ App still works perfectly
- ✅ Can add tools later

## Recommendation

**Start with Option 2** (extensions only) - it's the easiest and gives you 90% of the benefits without installing anything extra!

