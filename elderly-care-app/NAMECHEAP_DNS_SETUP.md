# Namecheap DNS Setup for Resend Domain Verification

## Step-by-Step Guide for Namecheap Users

### Step 1: Add Domain in Resend (2 minutes)

1. Go to https://resend.com/domains
2. Log into your Resend account
3. Click **"Add Domain"** button
4. Enter: `elderlycare.tech`
5. Click **"Add"**

### Step 2: Get DNS Records from Resend (1 minute)

After adding the domain, Resend will show you DNS records you need to add. They'll look something like this:

**TXT Record for Verification:**
```
Type: TXT
Host: @
Value: resend-domain-verification=abc123xyz...
```

**MX Record (for receiving replies):**
```
Type: MX
Host: @
Priority: 10
Value: feedback-smtp.resend.com
```

**DKIM Records (usually 3 TXT records):**
```
Type: TXT
Host: resend._domainkey
Value: p=... (long string)
```

**SPF Record (if provided):**
```
Type: TXT
Host: @
Value: v=spf1 include:_spf.resend.com ~all
```

**Copy all these values** - you'll need them in the next step!

---

### Step 3: Add DNS Records in Namecheap (5-10 minutes)

1. **Log into Namecheap:**
   - Go to https://www.namecheap.com
   - Click **"Sign In"** (top right)
   - Enter your credentials

2. **Go to Domain List:**
   - Click **"Domain List"** from the left sidebar
   - OR go to https://ap.www.namecheap.com/domains/list/

3. **Access DNS Settings:**
   - Find `elderlycare.tech` in your domain list
   - Click **"Manage"** button next to it
   - Click on **"Advanced DNS"** tab (at the top)

4. **Add TXT Record for Domain Verification:**
   - Scroll down to **"Host Records"** section
   - Click **"Add New Record"** button
   - Select **"TXT Record"** from the Type dropdown
   - For **Host**: Enter `@` (or leave blank/select `@` from dropdown)
   - For **Value**: Paste the verification value from Resend (e.g., `resend-domain-verification=abc123...`)
   - Click the **green checkmark** (✓) to save
   - ⏰ **Wait 1-2 minutes** for it to save

5. **Add MX Record:**
   - Click **"Add New Record"** again
   - Select **"MX Record"** from Type dropdown
   - For **Host**: Enter `@`
   - For **Value**: Enter `feedback-smtp.resend.com`
   - For **Priority**: Enter `10`
   - Click the **green checkmark** (✓) to save

6. **Add DKIM Records (usually 3 records):**
   - Click **"Add New Record"**
   - Select **"TXT Record"**
   - For **Host**: Enter `resend._domainkey`
   - For **Value**: Paste the DKIM value from Resend
   - Click the **green checkmark** (✓) to save
   - Repeat for each DKIM record Resend provides

7. **Add SPF Record (if Resend provided one):**
   - Click **"Add New Record"**
   - Select **"TXT Record"**
   - For **Host**: Enter `@`
   - For **Value**: Paste SPF value (e.g., `v=spf1 include:_spf.resend.com ~all`)
   - Click the **green checkmark** (✓) to save

---

### Step 4: Verify Domain in Resend (5-60 minutes)

1. **Go back to Resend:**
   - Return to https://resend.com/domains
   - Find `elderlycare.tech` in your domain list
   - Click **"Verify"** or wait for automatic verification

2. **Wait for DNS Propagation:**
   - DNS changes can take **5 minutes to 1 hour** to propagate
   - Sometimes up to 24-48 hours (but usually much faster)
   - Resend will automatically check periodically

3. **Check Status:**
   - Status will show: **"Pending"** → **"Verified"** ✅
   - Once verified, you'll see a green checkmark

---

### Step 5: Update Render Environment Variable (1 minute)

Once verified in Resend:

1. **Go to Render Dashboard:**
   - https://dashboard.render.com
   - Click on your service

2. **Update Environment Variables:**
   - Click **"Environment"** tab
   - Find `RESEND_FROM_EMAIL`
   - Change value from `onboarding@resend.dev` to:
     ```
     notifications@elderlycare.tech
     ```
   - Click **"Save Changes"**

3. **Render will automatically redeploy** - wait 1-2 minutes

---

## ⚠️ Important Notes for Namecheap Users

### Host Field in Namecheap:
- **`@`** = root domain (elderlycare.tech)
- **Blank/empty** = also means root domain (some users report this works)
- **Subdomain** = e.g., `mail` would create mail.elderlycare.tech

### If Records Don't Save:
- Make sure you click the **green checkmark** (✓) after each record
- Wait a few seconds between adding records
- Refresh the page if records don't appear

### TTL (Time To Live):
- Namecheap usually sets TTL automatically (often 3600 seconds = 1 hour)
- This is fine - don't change it unless Resend specifically asks

### Existing Records:
- **DON'T delete existing records** unless you know what they're for
- Just **ADD** the new Resend records
- You can have multiple TXT records with `@` as host

---

## ✅ Verification Checklist

Before clicking "Verify" in Resend, make sure:

- [ ] TXT record with verification value added
- [ ] MX record pointing to feedback-smtp.resend.com added
- [ ] All DKIM records added
- [ ] SPF record added (if provided)
- [ ] All records saved in Namecheap (green checkmarks visible)
- [ ] Waited at least 5 minutes after adding records

---

## 🆘 Troubleshooting

### "Domain not verified" after 1 hour:
1. **Check records in Namecheap:**
   - Go back to Advanced DNS
   - Verify all records are there and saved
   - Check for typos in values

2. **Check DNS propagation:**
   - Visit: https://www.whatsmydns.net
   - Enter `elderlycare.tech`
   - Select "TXT" record type
   - See if your TXT records appear globally (may take time)

3. **Common mistakes:**
   - Forgot to click green checkmark (record not saved)
   - Typo in value (copy-paste from Resend)
   - Wrong host value (should be `@` for root domain)

### Need Help?
- Resend Support: https://resend.com/support
- Namecheap Support: https://www.namecheap.com/support/

---

## 🎉 Once Verified

After verification, your emails will:
- ✅ Send to ANY recipient (not just your own email)
- ✅ Come from `notifications@elderlycare.tech` (or any email @elderlycare.tech)
- ✅ Have better deliverability
- ✅ Work permanently (no time limits)

**Test it by creating a "Critical" incident in your app!**

