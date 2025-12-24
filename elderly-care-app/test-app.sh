#!/bin/bash

# Simplified Test Script - One Button Click
# Just clears cache and opens app with Web Inspector

APP_URL="https://elderly-care-app-t8dz.onrender.com"

echo "🚀 Quick Test - Opening App with Web Inspector..."

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
    delay 1.5
    
    -- Try keyboard shortcut for Web Inspector (Cmd+Option+I)
    tell application "System Events"
        tell process "Safari"
            try
                keystroke "i" using {option down, command down}
            end try
        end tell
    end tell
end tell

display notification "App opened! Press Cmd+Option+I for Web Inspector" with title "Ready to Test"
EOF

echo ""
echo "✅ App opened!"
echo ""
echo "📋 If Web Inspector didn't open:"
echo "   1. Press: Cmd + Option + I"
echo "   2. Or: Develop menu > Show Web Inspector"
echo ""
echo "🧹 To hard refresh: Cmd + Shift + R"

















































