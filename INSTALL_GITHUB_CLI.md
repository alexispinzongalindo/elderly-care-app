# 🚀 Install GitHub CLI - Step by Step

## Step 1: Install Homebrew (Package Manager)

**Open Terminal** and run this command:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**What will happen:**
- It will ask for your **Mac password** (type it and press Enter)
- It will download and install Homebrew (takes 2-5 minutes)
- You might see some messages - that's normal!

**After installation, you might see:**
```
==> Next steps:
- Run these two commands in your terminal to add Homebrew to your PATH:
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  eval "$(/opt/homebrew/bin/brew shellenv)"
```

**If you see that, run those two commands!**

---

## Step 2: Install GitHub CLI

After Homebrew is installed, run:

```bash
brew install gh
```

This will install GitHub CLI (takes 1-2 minutes).

---

## Step 3: Login to GitHub

Run:

```bash
gh auth login
```

**Follow the prompts:**

1. **"What account do you want to log into?"**
   - Select: **"GitHub.com"** (press Enter)

2. **"What is your preferred protocol for Git operations?"**
   - Select: **"HTTPS"** (press Enter)

3. **"How would you like to authenticate GitHub CLI?"**
   - Select: **"Login with a web browser"** (press Enter)

4. **"Paste your one-time code:"**
   - You'll see a code like: `XXXX-XXXX`
   - **Copy this code**
   - Press Enter

5. **Browser will open automatically:**
   - Paste the code
   - Click "Authorize"
   - You're done!

---

## Step 4: Push Your Code

Now you can push easily:

```bash
cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"
git push origin main --force-with-lease
```

**That's it!** No more token issues! 🎉

---

## ✅ Verify It Worked

Check GitHub:
- https://github.com/alexispinzongalindo/elderly-care-app

You should see your commits!

---

## 🆘 Troubleshooting

**If Homebrew installation fails:**
- Make sure you have administrator access
- Try running the command again
- Check: https://brew.sh for latest instructions

**If `gh auth login` fails:**
- Make sure you're connected to the internet
- Try again - sometimes it takes a couple tries

---

**Ready?** Start with Step 1! 🚀















