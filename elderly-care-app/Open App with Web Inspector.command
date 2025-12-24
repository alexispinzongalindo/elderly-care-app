#!/bin/bash

# Double-clickable version - Test App with Web Inspector

APP_URL="https://elderly-care-app-t8dz.onrender.com"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Opening App with Web Inspector..."
echo ""

# Open Safari and clear cache, then open app
osascript <<EOF
tell application "Safari"
    activate
    
    -- Clear Safari cache
    try
        do shell script "rm -rf ~/Library/Caches/com.apple.Safari/* 2>/dev/null"
    end try
    
    -- Open app with timestamp to bypass cache
    set appURL to "$APP_URL?nocache=" & (do shell script "date +%s")
    
    -- Create new window or use existing
    if (count of windows) is 0 then
        make new window
    end if
    
    tell window 1
        set current tab to (make new tab with properties {URL:appURL})
    end tell
    
    -- Wait a moment then try to open Web Inspector
    delay 2
    
    -- Try keyboard shortcut for Web Inspector (Cmd+Option+I)
    tell application "System Events"
        tell process "Safari"
            try
                keystroke "i" using {option down, command down}
            end try
        end tell
    end tell
end tell

display notification "App opened! Press Cmd+Option+I if Web Inspector didn't open" with title "Ready to Test"
EOF

echo "✅ Done! App should be opening now."
echo ""
echo "💡 If Web Inspector didn't open:"
echo "   Press: Cmd + Option + I"
echo ""
echo "🧹 Hard refresh: Cmd + Shift + R"
echo ""
read -p "Press Enter to close this window..."

















































