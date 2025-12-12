# Fix iPhone Safari HTTPS-Only Error

## Problem
Safari shows: "Navigation failed because the request was for an HTTP URL with HTTPS-Only enabled"

## Solution 1: Disable HTTPS-Only Mode (Easiest)

### On your iPhone:
1. Open **Settings** app
2. Go to **Safari**
3. Scroll down to **Advanced**
4. Turn OFF **"Prevent Cross-Site Tracking"** (if needed)
5. Look for **"HTTPS-Only Mode"** or **"Require Secure Connection"**
6. Turn it **OFF**

### Alternative Settings Path:
1. Settings → Safari
2. Scroll to **Privacy & Security**
3. Find **"HTTPS-Only Mode"** or similar
4. Disable it

## Solution 2: Use Chrome or Firefox (Alternative Browser)

If you can't find the setting:
1. Download **Chrome** or **Firefox** from App Store
2. Open the browser
3. Go to: `http://192.168.0.13:5001`
4. It should work without HTTPS-only restrictions

## Solution 3: Use IP Address Directly

Sometimes Safari blocks it if you type it in the address bar. Try:
1. Open Safari
2. Type: `192.168.0.13:5001` (without http://)
3. Press Go

## Solution 4: Add Exception (If Available)

Some iOS versions allow exceptions:
1. When you see the error, tap **"Details"** or **"Settings"**
2. Look for option to **"Allow HTTP for this site"**
3. Enable it

## Quick Test

After disabling HTTPS-Only mode:
1. Open Safari
2. Go to: `http://192.168.0.13:5001`
3. Should work now!

## Note

This is safe for local network use. You're only accessing your own computer on your home network, so HTTP is fine for development/testing.




