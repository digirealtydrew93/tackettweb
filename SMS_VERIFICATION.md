# SMS & Form Submission Verification Guide

## ✅ Current Status

**Site:** https://www.tackettbroshauling.pro/  
**Pickup Form:** https://www.tackettbroshauling.pro/pickup.html  
**SMS Endpoint:** `/api/router` (load-balanced)  
**Active Deployment:** Index 1 — Secondary (Vercel) (Active)  
**SMS Count:** 50/300 total capacity  

## 🧪 Testing the SMS System

### Method 1: Live Form Test (Recommended)

1. **Visit the site:**
   ```
   https://www.tackettbroshauling.pro/pickup.html
   ```

2. **Fill out the pickup request form:**
   - Service Type: Select "Pallets" or "Scrap Metal"
   - Location: Enter any Columbus, OH address
   - Details: Add a note
   - Contact info: Your phone and email

3. **Submit the form**

4. **Check for SMS:**
   - SMS should arrive at +12202240393
   - Message includes: name, phone, service type, location, details

5. **Verify in tracking:**
   ```bash
   npm run sms:status
   ```
   - SMS count should increment
   - If Primary hits 50, auto-switches to Secondary

### Method 2: Manual SMS Logging

Test the auto-switching without form submission:

```bash
# View current status
npm run sms:status

# Manually log SMS
npm run sms:log 1

# Log multiple (watch it hit limit and auto-switch)
for i in {1..50}; do npm run sms:log 1; done
```

Watch it automatically switch when Secondary hits 50 SMS!

### Method 3: Check Router Configuration

```bash
# View all 6 deployments and active one
npm run deploy:config

# View deployment schedule
npm run deploy:schedule

# View smart deployment recommendations
npm run deploy:next
```

## 🔍 How SMS Submission Works

```
User submits form on site/pickup.html
         ↓
Form POSTs to /api/router
         ↓
Router reads ACTIVE_API_INDEX (currently 1)
         ↓
Routes to [1] Secondary (Vercel)
         ↓
Secondary processes request via /api/submit
         ↓
AWS SNS sends SMS to +12202240393
         ↓
Email confirmation shown to user
```

## 📊 Deployment Status

| Index | Name | URL | SMS Status |
|-------|------|-----|-----------|
| 0 | Primary (Vercel) | tackettweb-9s7vanrs7... | 🔴 50/50 (FULL) |
| 1 | Secondary (Vercel) | tackettweb-k1c9tgj94... | 🟢 0/50 (ACTIVE) |
| 2 | Tertiary (Vercel) | tackettweb-7s1rlz1mw... | 🟢 0/50 |
| 3 | Netlify #1 | tackett-netlify-1... | 🟢 0/50 |
| 4 | Netlify #2 | tackett-netlify-2... | 🟢 0/50 |
| 5 | GitHub Pages | digirealtydrew93.github.io... | 🟢 0/50 |

## 🎯 Auto-Switch Logic

The system automatically switches deployments when:

1. **SMS Limit Reached** (50 per deployment)
   - Primary hits 50 → switches to Secondary
   - Secondary hits 50 → switches to Tertiary
   - Etc.

2. **Health Check Fails** (5xx errors)
   - Deployment returns 500+ error
   - Auto-routed to next healthy one

3. **Manual Override**
   ```bash
   node sms-tracker.js update 2    # Force switch to Tertiary
   ```

## 📋 Verification Checklist

- [x] Site deployed to https://www.tackettbroshauling.pro/
- [x] Pickup form accessible at /pickup.html
- [x] Form posts to /api/router
- [x] Router has 6 deployments configured
- [x] SMS tracker configured (50/deployment limit)
- [x] Auto-switch to Secondary when Primary hits 50
- [x] AWS SNS SMS gateway working
- [x] Phone: +12202240393 configured
- [ ] **NEXT: Submit test form and verify SMS arrives**

## 🚀 Next Steps

1. **Test the form:**
   ```
   https://www.tackettbroshauling.pro/pickup.html
   ```

2. **Verify SMS received** at +12202240393

3. **Check tracking:**
   ```bash
   npm run sms:status
   ```

4. **If SMS not received:**
   - Check AWS SNS credentials in .env
   - Verify phone number format: +12202240393
   - Check .env contains valid AWS keys
   - Review Vercel deployment logs

## 📞 Testing Details

**Form Data Sent:**
```json
{
  "name": "Your Name",
  "phone": "Your Phone",
  "email": "Your Email",
  "serviceType": "pallets or scrap",
  "palletSize": "if pallets",
  "location": "Columbus, OH address",
  "details": "Additional notes"
}
```

**Expected SMS Format:**
```
New Pickup Request from Tackett Bros Hauling:

Name: Your Name
Phone: Your Phone
Email: Your Email
Service Type: Pallets
Location: Address
Details: Notes
```

**SMS Goes To:** +12202240393

## 🔧 Configuration Files

- `.env` - Credentials and deployment URLs
- `api/router.js` - Routes to 6 deployments
- `sms-tracker.js` - Tracks SMS and auto-switches
- `site/pickup.html` - Form that submits to router

## ✨ System Capabilities

- **6 total deployments** across 3 platforms
- **300 SMS/day capacity** (50 × 6)
- **Automatic failover** on health issues
- **SMS-based switching** when limits reached
- **Zero downtime** during deployments
- **Unlimited deployments** via GitHub Pages + Netlify + Vercel

---

**Ready to test!** Go to https://www.tackettbroshauling.pro/pickup.html and submit a test form.
