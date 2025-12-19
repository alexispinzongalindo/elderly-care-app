# Quick Guide: Install Extensions in Cursor

## Step-by-Step Instructions

### 1. Open Extensions Panel
- **Mac**: Press `Cmd + Shift + X`
- **Windows/Linux**: Press `Ctrl + Shift + X`
- Or click the Extensions icon (looks like 4 squares) in the left sidebar

### 2. Install These Extensions (search and install one by one):

#### ESLint
1. Search for: `ESLint`
2. Author: **dbaeumer** (Microsoft)
3. Click **Install**
4. Extension ID: `dbaeumer.vscode-eslint`

#### Prettier
1. Search for: `Prettier - Code formatter`
2. Author: **Prettier**
3. Click **Install**
4. Extension ID: `esbenp.prettier-vscode`

#### Python (usually already installed, but check)
1. Search for: `Python`
2. Author: **Microsoft**
3. If not installed, click **Install**

### 3. Reload Cursor
- Press `Cmd + R` (Mac) or `Ctrl + R` (Windows/Linux)
- Or: Command Palette (`Cmd + Shift + P`) → "Developer: Reload Window"

### 4. Verify It's Working
1. Open any `.js` file (like `script.js`)
2. Make a small typo or formatting mistake
3. You should see:
   - **Red underlines** for errors (ESLint)
   - **Auto-formatting** when you save (Prettier)

## ✅ That's It!

Your code will now:
- ✅ Show errors with red underlines as you type
- ✅ Auto-format when you save (makes code look nice)
- ✅ Catch bugs before you run the code

## Troubleshooting

**Extensions not working?**
1. Make sure you reloaded Cursor (`Cmd + R`)
2. Check that extensions show as "Enabled" (not "Disabled")
3. Try restarting Cursor completely

**No red underlines?**
- Open a JavaScript file and check if ESLint extension is active
- Look for ESLint icon in bottom-right status bar

**Not auto-formatting?**
- Try saving a file (`Cmd + S`)
- Check bottom-right status bar - should show "Prettier" when formatting

## What's Already Configured

The `.vscode/settings.json` file is already set up, so:
- ✅ Format on save is enabled
- ✅ ESLint auto-fix is enabled
- ✅ File formatting rules are configured

You just need to install the extensions!

