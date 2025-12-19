# How to Control Your Mac from iPad (Same WiFi)

## Quick Setup Guide

### ✅ **Option 1: Microsoft Remote Desktop (Easiest - FREE)**

#### On Your Mac:
1. Open **System Settings** (or System Preferences)
2. Go to **General → Sharing**
3. Enable **Remote Management** (checkbox)
4. Click **Options...** and check **"VNC viewers may control screen with password"**
5. Set a password (remember this!)
6. Note your Mac's **IP address** (shown in Sharing settings, or run `ifconfig | grep "inet "` in Terminal)

#### On Your iPad:
1. Install **Microsoft Remote Desktop** from App Store (free)
2. Open the app → tap **"+" → Add PC**
3. Enter:
   - **PC name**: Your Mac's IP address (e.g., `192.168.1.100`)
   - **User account**: Your Mac username
   - **Password**: The VNC password you set
4. Save and tap to connect

---

### ✅ **Option 2: Jump Desktop (Best Performance - $14.99 one-time)**

#### On Your Mac:
1. Same setup as Option 1 (enable Remote Management + VNC)
2. Get your Mac's IP address

#### On Your iPad:
1. Install **Jump Desktop** from App Store ($14.99)
2. Add connection → enter Mac IP + credentials
3. **Better performance** than free options, excellent for coding

---

### ✅ **Option 3: Built-in Screen Sharing (Free but Limited)**

#### On Your Mac:
1. System Settings → General → Sharing
2. Enable **Screen Sharing**
3. Note the connection address (e.g., `vnc://192.168.1.100`)

#### On Your iPad:
1. Install **VNC Viewer** from App Store (free)
2. Enter your Mac's IP address
3. Connect with Mac username + password

---

## 🔍 Finding Your Mac's IP Address

**Method 1 (GUI):**
- System Settings → Network → Select WiFi → Click "Details" → See IP address

**Method 2 (Terminal):**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Look for something like `192.168.1.XXX` or `10.0.0.XXX`

---

## 📌 Important Notes:

1. **Both devices MUST be on the same WiFi network** ✅
2. **Mac must be awake** (or enable "Wake for network access" in Energy Saver)
3. **Firewall**: If connection fails, temporarily disable Mac firewall to test
4. **IP Address Changes**: If your Mac's IP changes, you'll need to update the connection

---

## 🚀 Recommended: Microsoft Remote Desktop
- **Free**
- Works great on iPad
- Touch gestures work well
- Perfect for coding/development work

---

## 🐛 Troubleshooting:

**Can't connect?**
- Verify both devices are on same WiFi
- Check Mac firewall settings
- Try disabling firewall temporarily
- Verify IP address is correct
- Ensure Remote Management is enabled (not just Screen Sharing)

**Performance issues?**
- Use Jump Desktop for better performance
- Close unnecessary apps on Mac
- Ensure strong WiFi signal











































