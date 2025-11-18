# Google Places API Setup for Location Autocomplete

## Quick Setup (5 minutes)

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com

2. **Create a new project:**
   - Click "Select a Project" at the top
   - Click "New Project"
   - Name: "Tackett Hauling"
   - Click "Create"

3. **Enable APIs:**
   - Search for "Places API" in the search bar
   - Click on "Places API"
   - Click "Enable"
   - Also search for and enable "Maps JavaScript API"

4. **Create API Key:**
   - Go to "Credentials" in the left menu
   - Click "Create Credentials" → "API Key"
   - Copy your API key

5. **Add to Netlify:**
   - Go to: https://app.netlify.com/sites/tackettbrothershauling/settings/build#environment
   - Add environment variable:
     - Key: `GOOGLE_PLACES_API_KEY`
     - Value: (paste your API key)
   - Click "Save"

6. **Update pickup.html:**
   - Replace this line in pickup.html:
     ```html
     <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA_YOUR_API_KEY_HERE&libraries=places"></script>
     ```
   - With your actual key:
     ```html
     <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_KEY_HERE&libraries=places"></script>
     ```

7. **Restrict your key (security):**
   - In Google Cloud Console, go to Credentials
   - Click your API key
   - Under "Application restrictions", select "HTTP referrers"
   - Add:
     ```
     tackettbroshauling.pro/*
     *.netlify.app/*
     ```
   - Under "API restrictions", select "Places API" and "Maps JavaScript API"
   - Click "Save"

## Features Enabled

✅ Real-time address autocomplete (as user types)
✅ Biased to Columbus, Ohio area (50km radius)
✅ Shows main text + secondary text (address)
✅ Debounced API calls (every 300ms) to save quota
✅ Session tokens for billing optimization
✅ Handles zero results gracefully

## Free Tier Limits

- First $200/month free
- ~25,000 requests free per month
- Perfect for small business

## Troubleshooting

If autocomplete doesn't work:
1. Check browser console for errors (F12)
2. Verify API key is correct in HTML
3. Ensure APIs are enabled in Google Cloud
4. Check your monthly quota at: https://console.cloud.google.com/billing/quotas
