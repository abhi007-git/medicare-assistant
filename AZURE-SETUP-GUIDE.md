# 🔷 Azure Vision API Setup for Sign Reader

## Quick Setup Guide (5 Minutes)

### Step 1: Get Azure Account
1. Go to: **https://portal.azure.com/**
2. Click "Start free" or "Sign in"
3. Sign up (requires email verification)
4. **Free tier includes 5,000 OCR calls/month** 🆓

---

### Step 2: Create Computer Vision Resource

1. **In Azure Portal**, click **"Create a resource"**

2. Search for **"Computer Vision"** and click it

3. Click **"Create"**

4. Fill in the form:
   - **Subscription**: Choose your subscription
   - **Resource group**: Create new (e.g., "medicare-app")
   - **Region**: Choose closest to you (e.g., "East US")
   - **Name**: Enter a name (e.g., "medicare-ocr")
   - **Pricing tier**: Select **"Free F0" (5,000 calls/month)**

5. Click **"Review + Create"** then **"Create"**

6. Wait 1-2 minutes for deployment

---

### Step 3: Get Your API Credentials

1. After deployment, click **"Go to resource"**

2. In left menu, click **"Keys and Endpoint"**

3. You'll see:
   ```
   KEY 1: abc123def456... (copy this)
   KEY 2: xyz789... (backup)
   ENDPOINT: https://yourresource.cognitiveservices.azure.com/
   ```

4. **Copy KEY 1** and **ENDPOINT URL**

---

### Step 4: Add to Your App

#### Method 1: Direct in App (Recommended) ✅

1. Open your app: **https://abhi007-git.github.io/medicare-assistant/mobile-app.html**

2. Tap **☰ Menu** → **⚙️ Settings**

3. Scroll to **"Azure Vision API (Sign Reader)"** section

4. Enter your credentials:
   - **API Key**: Paste your KEY 1
   - **Endpoint URL**: Paste your endpoint (with trailing /)
     ```
     Example: https://medicare-ocr.cognitiveservices.azure.com/
     ```

5. Click **"Test Connection"** button

6. If successful ✅, click **"Save Settings"**

7. Done! Your Sign Reader now uses Azure! 🎉

---

#### Method 2: Via config.js File

1. Open file: `C:\Users\psabh\OneDrive\Desktop\dtl\config.js`

2. Find the Azure section (around line 33):
   ```javascript
   AZURE_VISION: {
       API_KEY: 'YOUR_AZURE_KEY_HERE',
       ENDPOINT: 'https://YOUR_RESOURCE_NAME.cognitiveservices.azure.com/',
       URL_SUFFIX: '/vision/v3.2/ocr'
   }
   ```

3. Replace with your values:
   ```javascript
   AZURE_VISION: {
       API_KEY: 'abc123def456...',  // Your KEY 1
       ENDPOINT: 'https://medicare-ocr.cognitiveservices.azure.com/',  // Your endpoint
       URL_SUFFIX: '/vision/v3.2/ocr'
   }
   ```

4. Make sure OCR_SERVICE is set to 'azure' (line 5):
   ```javascript
   OCR_SERVICE: 'azure',
   ```

5. Save the file

6. Deploy changes:
   ```bash
   git add .
   git commit -m "Add Azure API credentials"
   git push origin main
   ```

7. Wait 1-2 minutes, then refresh your app

---

### Step 5: Test Sign Reader

1. Open the app

2. Go to **"Sign Reader"** section

3. Click **"Start Scanning"**

4. Point camera at any text/sign

5. Azure will read it aloud! 🎤

---

## 🎯 Example Configuration

### Your Details Will Look Like:

**API Key (KEY 1):**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Endpoint URL:**
```
https://medicare-ocr.cognitiveservices.azure.com/
```

### In config.js:
```javascript
const API_CONFIG = {
    OCR_SERVICE: 'azure',  // ← Using Azure
    
    AZURE_VISION: {
        API_KEY: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',  // ← Your KEY 1
        ENDPOINT: 'https://medicare-ocr.cognitiveservices.azure.com/',  // ← Your endpoint
        URL_SUFFIX: '/vision/v3.2/ocr'
    }
};
```

---

## ✅ Settings in the App

The app now has a dedicated **Azure Settings** section in Settings:

```
☰ Menu → ⚙️ Settings → Azure Vision API
```

### Features:
- ✅ **API Key** input field (password protected)
- ✅ **Endpoint URL** input field
- ✅ **Test Connection** button (validates your credentials)
- ✅ **Auto-save** after successful test
- ✅ **Stored locally** (no need to re-enter)
- ✅ **Helpful links** to Azure Portal

---

## 🔍 Troubleshooting

### "Connection Failed"
- ✅ Check API key is copied correctly (no extra spaces)
- ✅ Endpoint must end with `/`
- ✅ Resource is active in Azure Portal
- ✅ Free tier limit not exceeded (5,000/month)

### "Invalid Subscription Key"
- ❌ Wrong API key
- ✅ Copy KEY 1 again from Azure Portal
- ✅ Make sure no spaces before/after

### "NotFound" or 404 Error
- ❌ Wrong endpoint URL
- ✅ Must be from "Keys and Endpoint" page
- ✅ Format: `https://yourname.cognitiveservices.azure.com/`

### Still Not Working?
1. Test Connection button in app will show exact error
2. Check browser console (F12) for details
3. Verify resource is not paused/stopped in Azure

---

## 💰 Pricing Reminder

| Tier | Calls/Month | Cost |
|------|-------------|------|
| **Free F0** | 5,000 | **FREE** 🆓 |
| Standard S1 | Unlimited | $1 per 1,000 |

**Recommendation**: Start with Free tier. 5,000 calls = enough for daily use!

---

## 📱 Where to Find Settings in App

1. Open app: https://abhi007-git.github.io/medicare-assistant/mobile-app.html
2. Tap **☰** (hamburger menu, top-left)
3. Tap **"Settings"** (⚙️ icon)
4. Scroll down to **"Azure Vision API (Sign Reader)"**
5. Enter API Key and Endpoint
6. Click **"Test Connection"**
7. Click **"Save Settings"**

**That's it!** Your Sign Reader is now powered by Azure! 🚀

---

## 🎉 You're All Set!

After setup:
- ✅ Sign Reader uses Azure Computer Vision
- ✅ 5,000 free OCR calls per month
- ✅ High accuracy text recognition
- ✅ Automatic hospital sign filtering
- ✅ Voice output for all detected text

**Go to Sign Reader and start scanning hospital signs!** 🏥
