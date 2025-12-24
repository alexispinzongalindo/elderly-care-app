#!/bin/bash

# Quick Test Script for Elder Care App
# This script checks deployment status, clears cache, and opens app with Web Inspector

APP_URL="https://elderly-care-app-t8dz.onrender.com"
PROJECT_DIR="/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"

echo "🚀 Elder Care App - Quick Test Script"
echo "======================================"
echo ""

# Change to project directory
cd "$PROJECT_DIR"

# 1. CHECK DEPLOYMENT STATUS
echo "📦 Step 1: Checking Deployment Status..."
echo "----------------------------------------"

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  WARNING: You have uncommitted changes!"
    git status --short
    echo ""
    read -p "Do you want to commit and push these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "Auto-commit before testing"
        git push
        echo "✅ Changes pushed! Waiting 5 seconds for deployment to start..."
        sleep 5
    fi
else
    echo "✅ No uncommitted changes"
fi

# Get latest commit info
LATEST_COMMIT=$(git log -1 --oneline)
echo "📝 Latest commit: $LATEST_COMMIT"
echo ""

# Check if we can reach the app
echo "🌐 Checking if app is accessible..."
if curl -s --head --request GET "$APP_URL" | grep -q "200 OK"; then
    echo "✅ App is online at: $APP_URL"
else
    echo "⚠️  App might be deploying or offline"
fi
echo ""

# 2. CLEAR CACHE AND OPEN WITH WEB INSPECTOR
echo "🧹 Step 2: Clearing Browser Data..."
echo "-------------------------------------"

# Create a temporary HTML file that clears cache and opens the app
CLEAR_CACHE_HTML="/tmp/clear-cache-and-open.html"

cat > "$CLEAR_CACHE_HTML" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Clear Cache & Open App</title>
</head>
<body>
    <h1>Clearing cache and opening app...</h1>
    <script>
        // Clear all storage
        try {
            localStorage.clear();
            sessionStorage.clear();
            console.log('✅ Cleared localStorage and sessionStorage');
        } catch(e) {
            console.log('⚠️ Could not clear storage:', e);
        }
        
        // Open the app in a new window with developer tools
        const appUrl = 'https://elderly-care-app-t8dz.onrender.com';
        window.location.href = appUrl + '?nocache=' + Date.now();
        
        // Auto-close this page after 2 seconds
        setTimeout(() => {
            window.close();
        }, 2000);
    </script>
</body>
</html>
EOF

echo "✅ Created cache-clearing page"

# 3. OPEN SAFARI WITH WEB INSPECTOR
echo ""
echo "🌐 Step 3: Opening App with Web Inspector..."
echo "---------------------------------------------"

# Method 1: Open Safari and enable Web Inspector via AppleScript
osascript <<EOF
tell application "Safari"
    activate
    
    -- Clear Safari cache (requires user permission)
    try
        do shell script "rm -rf ~/Library/Caches/com.apple.Safari/*"
        display notification "Safari cache cleared" with title "Cache Cleared"
    on error
        display notification "Could not clear cache automatically. Please clear manually: Safari > Preferences > Advanced > Show Develop menu" with title "Cache Clear"
    end try
    
    -- Open new window with the app
    tell window 1
        set current tab to (make new tab with properties {URL:"$APP_URL?nocache=" & (current date as string)})
    end tell
    
    -- Enable Web Inspector (requires Develop menu to be enabled)
    delay 1
    tell application "System Events"
        tell process "Safari"
            -- Try to open Web Inspector via menu
            try
                keystroke "i" using {option down, command down}
            end try
        end tell
    end tell
    
    display notification "App opened with Web Inspector" with title "Ready!"
end tell
EOF

echo ""
echo "✅ Safari should be opening with the app"
echo ""
echo "📋 Manual Steps (if needed):"
echo "   1. In Safari, go to: Safari > Preferences > Advanced"
echo "   2. Check 'Show Develop menu in menu bar'"
echo "   3. Then go to: Develop > Show Web Inspector (or press Cmd+Option+I)"
echo ""
echo "🧹 To clear cache manually:"
echo "   - Safari > Develop > Empty Caches (Cmd+Option+E)"
echo "   - Or: Safari > Preferences > Privacy > Manage Website Data > Remove All"
echo ""

# Alternative: Open in Chrome/Edge with DevTools
echo "💡 Alternative: Would you like to open in Chrome with DevTools? (y/n)"
read -p "   " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Try to open Chrome
    if command -v /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome &> /dev/null; then
        /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --auto-open-devtools-for-tabs "$APP_URL?nocache=$(date +%s)" &
        echo "✅ Opening Chrome with DevTools..."
    else
        echo "⚠️  Chrome not found. Install Chrome or use Safari."
    fi
fi

echo ""
echo "✨ Done! The app should be opening now."
echo "   URL: $APP_URL"
echo ""

















































