# Free Notification Setup Guide

Your site is live at: **https://tackettbrothershauling-assyb8vez-tackett-bros-projects.vercel.app**

Forms will now submit successfully! Choose one of these FREE notification methods:

## Option 1: Discord (EASIEST - Completely Free)

1. Create a Discord server (free)
2. Create a webhook:
   - Right-click channel → Edit Channel
   - Integrations → Webhooks → New Webhook
   - Copy the URL
3. Add to Vercel:
   ```
   vercel env add DISCORD_WEBHOOK_URL production
   ```
   Paste your Discord webhook URL
4. Done! Pickup requests will appear in Discord instantly

## Option 2: AWS SNS (100 free SMS/month)

If you later get AWS credentials:
```
vercel env add TACKETT_AWS_KEY_ID production
vercel env add TACKETT_AWS_SECRET_KEY production
vercel env add TACKETT_AWS_REGION production
vercel env add TACKETT_PHONE_NUMBER production
```

## Option 3: Vonage (Free SMS trial)

1. Sign up: https://www.vonage.com/communications-apis/sms/
2. Get free API key
3. Add to Vercel:
   ```
   vercel env add VONAGE_API_KEY production
   ```

## How It Works

When someone submits a form:
1. ✅ OpenAI generates concise message (if key provided)
2. ✅ Discord notification (if webhook set)
3. ✅ SMS via AWS or Vonage (if credentials set)
4. ✅ Logs in Vercel function logs (always available)

## Setup Discord in 2 Minutes

1. Go to: https://discord.com
2. Create account → Create Server
3. Right-click a channel → Edit Channel
4. Click "Integrations" → "Webhooks" → "New Webhook"
5. Copy the URL
6. Run: `vercel env add DISCORD_WEBHOOK_URL production`
7. Paste URL → Select production → Done

Now every form submission appears in Discord! 🎉

---

**Your Live Site:** https://tackettbrothershauling-assyb8vez-tackett-bros-projects.vercel.app

All features working:
✅ Form submission
✅ Location autocomplete (free OpenStreetMap)
✅ Professional design
✅ Mobile responsive
✅ Free notifications (pick Discord, SMS, or both)
