# 📖 OCR Sign Reader Setup Guide

## Overview
The Sign Reader feature can read hospital signs and text using OCR (Optical Character Recognition). You have 4 options to choose from:

---

## ✅ OPTION 1: TESSERACT.JS (RECOMMENDED - FREE & EASY)

### ✨ Advantages:
- ✅ **Completely FREE** - No API key needed
- ✅ **Works offline** - Runs in the browser
- ✅ **Already installed** - No setup required
- ✅ **Privacy-friendly** - No data sent to servers

### 📝 How to Use:
**It's already working!** Just use the app. No configuration needed.

The default setting in `config.js` is:
```javascript
OCR_SERVICE: 'tesseract'
```

### ⚡ Usage:
1. Open the app
2. Go to "Sign Reader" section
3. Click "Start Scanning"
4. Point camera at hospital signs
5. The text will be read aloud automatically!

---

## 💰 OPTION 2: OCR.SPACE (FREE TIER AVAILABLE)

### ✨ Advantages:
- 🆓 **25,000 free requests/month**
- ⚡ **Fast and accurate**
- 🌍 **Supports 30+ languages**
- 📱 **Good for mobile**

### 📝 Setup Steps:

1. **Get Free API Key:**
   - Visit: https://ocr.space/ocrapi
   - Click "Register" (free)
   - Check your email for the API key

2. **Add API Key:**
   Open `config.js` and update:
   ```javascript
   OCR_SERVICE: 'ocrspace',  // Change from 'tesseract' to 'ocrspace'
   
   OCR_SPACE: {
       API_KEY: 'YOUR_API_KEY_HERE',  // Paste your API key here
       URL: 'https://api.ocr.space/parse/image'
   }
   ```

3. **Example:**
   ```javascript
   OCR_SERVICE: 'ocrspace',
   
   OCR_SPACE: {
       API_KEY: 'K87654321',  // Your actual key
       URL: 'https://api.ocr.space/parse/image'
   }
   ```

4. **Save and deploy:**
   ```bash
   git add .
   git commit -m "Add OCR.space API key"
   git push origin main
   ```

---

## 🏢 OPTION 3: GOOGLE CLOUD VISION API

### ✨ Advantages:
- 🎯 **Very accurate** - Best-in-class OCR
- 📊 **1000 free requests/month**
- 🌐 **Supports 50+ languages**

### 💵 Pricing:
- First 1000 requests/month: **FREE**
- After that: **$1.50 per 1000 requests**

### 📝 Setup Steps:

1. **Create Google Cloud Account:**
   - Visit: https://console.cloud.google.com/
   - Sign up (credit card required, but won't be charged for free tier)

2. **Enable Vision API:**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "Cloud Vision API"
   - Click "Enable"

3. **Get API Key:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy the API key

4. **Add API Key:**
   Open `config.js` and update:
   ```javascript
   OCR_SERVICE: 'google',  // Change to 'google'
   
   GOOGLE_VISION: {
       API_KEY: 'AIzaSyABC123...',  // Paste your API key
       URL: 'https://vision.googleapis.com/v1/images:annotate'
   }
   ```

5. **Save and deploy:**
   ```bash
   git add .
   git commit -m "Add Google Vision API key"
   git push origin main
   ```

---

## 🔷 OPTION 4: MICROSOFT AZURE COMPUTER VISION

### ✨ Advantages:
- 🆓 **5,000 free transactions/month**
- 🎯 **Highly accurate**
- 🌍 **Good language support**

### 💵 Pricing:
- First 5000 requests/month: **FREE**
- After that: **$1 per 1000 requests**

### 📝 Setup Steps:

1. **Create Azure Account:**
   - Visit: https://portal.azure.com/
   - Sign up (credit card required for verification)

2. **Create Computer Vision Resource:**
   - Click "Create a resource"
   - Search for "Computer Vision"
   - Click "Create"
   - Choose "Free F0" tier
   - Create the resource

3. **Get API Key and Endpoint:**
   - Go to your Computer Vision resource
   - Click "Keys and Endpoint"
   - Copy "Key 1" and "Endpoint"

4. **Add API Key:**
   Open `config.js` and update:
   ```javascript
   OCR_SERVICE: 'azure',  // Change to 'azure'
   
   AZURE_VISION: {
       API_KEY: 'abc123...',  // Paste Key 1
       ENDPOINT: 'https://yourresource.cognitiveservices.azure.com/',  // Your endpoint
       URL_SUFFIX: '/vision/v3.2/ocr'
   }
   ```

5. **Save and deploy:**
   ```bash
   git add .
   git commit -m "Add Azure Vision API key"
   git push origin main
   ```

---

## 📂 File Locations

### Where to Add API Keys:
Open file: `c:\Users\psabh\OneDrive\Desktop\dtl\config.js`

The file looks like this:
```javascript
const API_CONFIG = {
    OCR_SERVICE: 'tesseract',  // ← Change this line to switch services
    
    OCR_SPACE: {
        API_KEY: '',  // ← Add your OCR.space key here
        URL: 'https://api.ocr.space/parse/image'
    },
    
    GOOGLE_VISION: {
        API_KEY: '',  // ← Add your Google key here
        URL: 'https://vision.googleapis.com/v1/images:annotate'
    },
    
    AZURE_VISION: {
        API_KEY: '',  // ← Add your Azure key here
        ENDPOINT: '',  // ← Add your Azure endpoint here
        URL_SUFFIX: '/vision/v3.2/ocr'
    }
};
```

---

## 🚀 How to Deploy After Adding API Key

```bash
# 1. Open PowerShell in your project folder
cd C:\Users\psabh\OneDrive\Desktop\dtl

# 2. Add your changes
git add .

# 3. Commit with a message
git commit -m "Add OCR API key"

# 4. Push to GitHub
git push origin main

# 5. Wait 1-2 minutes, then refresh your app URL
```

**Your app URL:** https://abhi007-git.github.io/medicare-assistant/mobile-app.html

---

## 🎯 Quick Comparison

| Feature | Tesseract.js | OCR.space | Google Vision | Azure Vision |
|---------|-------------|-----------|---------------|--------------|
| **Free Tier** | Unlimited | 25K/month | 1K/month | 5K/month |
| **Setup Time** | 0 minutes | 2 minutes | 5 minutes | 5 minutes |
| **Accuracy** | Good | Very Good | Excellent | Excellent |
| **API Key?** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Offline?** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Best For** | Privacy | Free users | High accuracy | Enterprise |

---

## ✅ My Recommendation

**Start with Tesseract.js** (already working, no setup needed!)

If you need better accuracy later:
1. Try **OCR.space** (easiest to set up)
2. Upgrade to **Google Vision** if you need the best accuracy

---

## 🆘 Troubleshooting

### "API key not configured" message:
1. Open `config.js`
2. Make sure you pasted the API key inside the quotes
3. Save the file
4. Run: `git add . && git commit -m "Add API key" && git push`

### OCR not working:
1. Make sure you're using HTTPS (GitHub Pages URL)
2. Check camera permission is granted
3. Point camera clearly at text
4. Ensure good lighting

### Still not working?
Switch back to Tesseract.js:
```javascript
OCR_SERVICE: 'tesseract'
```

---

## 📝 Summary

**Right now:** Tesseract.js is working with **NO setup needed!**

**To use API services:**
1. Choose a service (OCR.space, Google, or Azure)
2. Get the API key from their website
3. Open `config.js` file
4. Add your API key
5. Change `OCR_SERVICE` to match your choice
6. Save, commit, and push to GitHub
7. Refresh your app!

**That's it!** 🎉
