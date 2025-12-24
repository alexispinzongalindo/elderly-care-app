# How to Set VNC Password on Mac Pro M3

## Step-by-Step Instructions

### Step 1: Open System Settings
1. Click the **Apple menu** (🍎) in the top-left corner
2. Click **System Settings** (or **System Preferences** on older macOS)

### Step 2: Go to Sharing Settings
1. In the left sidebar, click **General**
2. Scroll down and click **Sharing** (or look for it in the main settings list)

**Alternative path**: 
- Click **Sharing** directly in the left sidebar (if visible)

### Step 3: Enable Screen Sharing
1. In the Sharing window, find **Screen Sharing** in the list on the left
2. Toggle the switch next to **Screen Sharing** to **ON** (green/blue)

### Step 4: Set VNC Password
1. With **Screen Sharing** selected, look at the right side of the window
2. Click the **"Computer Settings..."** button (or "Options..." button)
3. A pop-up window will appear
4. Check the box: **"VNC viewers may control screen with password:"**
5. Enter a password in the password field
   - This can be any password you want (doesn't have to be your Mac password)
   - You'll need this password to connect from your iPad
   - Example: `mypassword123` or `iPadRemote2024`
6. Click **OK** to save

### Step 5: Verify User Access
1. Still in the Screen Sharing settings
2. Under "Allow access for:", make sure either:
   - **"All users"** is selected, OR
   - Your specific user account is listed and checked
3. If you need to add a user, click the **"+"** button and add your account

### Step 6: Note Your Computer Name
1. At the top of the Screen Sharing settings, you'll see:
   - **"On"** status
   - **Computer Name**: (e.g., "Alexis's MacBook Pro" or similar)
2. Write down this computer name - you might need it for connection

## Visual Guide

```
System Settings
└── General (or Sharing directly)
    └── Sharing
        └── Screen Sharing [ON]
            ├── Computer Settings...
            │   └── ☑ VNC viewers may control screen with password:
            │       └── [Enter Password: _____________]
            └── Allow access for: All users (or your username)
```

## Quick Terminal Method (Alternative)

If you prefer using Terminal, you can also set it with this command:
(You'll need to enter your Mac password when prompted)

```bash
sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart -configure -clientopts -setvnclegacy -vnclegacy yes -setvncpw -vncpw YOUR_PASSWORD_HERE -restart -agent
```

Replace `YOUR_PASSWORD_HERE` with your desired VNC password.

## What You Need for iPad Connection

After setting up, you'll need:
- **IP Address**: `192.168.0.13` (already found)
- **Port**: `5900` (default VNC port)
- **Username**: Your Mac username
- **Password**: The VNC password you just set

## Test the Connection

On your iPad, in Microsoft Remote Desktop:
- **PC Name**: `192.168.0.13`
- **User Account**: Your Mac username
- **Password**: The VNC password you just set

## Troubleshooting

**If you can't find "Computer Settings" button:**
- Make sure Screen Sharing is turned ON first
- Look for "Options..." or "Advanced..." button instead
- On newer macOS, it might say "Show Password Options" or similar

**If the password field is grayed out:**
- Make sure you've checked the box first: "VNC viewers may control screen with password:"
- Try clicking the lock icon 🔒 at the bottom of System Settings and entering your Mac password

**If Screen Sharing is grayed out:**
- You might need administrator privileges
- Click the lock icon 🔒 and enter your Mac password to unlock settings







































