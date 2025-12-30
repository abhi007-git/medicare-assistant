// ============================================================================
// API CONFIGURATION FILE
// ============================================================================

const API_CONFIG = {
    // OCR SERVICE CONFIGURATION
    // Choose one: 'tesseract' (free, client-side), 'google', 'azure', 'ocrspace'
    OCR_SERVICE: 'tesseract', // Using Tesseract.js - Works immediately, no API key needed!
    
    // ==========================================================================
    // OPTION 1: TESSERACT.JS (Client-side, FREE, NO API KEY NEEDED)
    // ==========================================================================
    // Tesseract.js runs in the browser, no server needed
    // Already included in mobile-app.html
    // Just set OCR_SERVICE: 'tesseract' and it works!
    
    // ==========================================================================
    // OPTION 2: OCR.SPACE API (FREE TIER AVAILABLE)
    // ==========================================================================
    // Get free API key from: https://ocr.space/ocrapi
    // Free tier: 25,000 requests/month
    OCR_SPACE: {
        API_KEY: '', // ADD YOUR API KEY HERE like: 'K12345678901234'
        URL: 'https://api.ocr.space/parse/image'
    },
    
    // ==========================================================================
    // OPTION 3: GOOGLE CLOUD VISION API
    // ==========================================================================
    // Get API key from: https://console.cloud.google.com/
    // Enable "Cloud Vision API" in your project
    // Pricing: 1000 free requests/month, then $1.50 per 1000 requests
    GOOGLE_VISION: {
        API_KEY: '', // ADD YOUR API KEY HERE like: 'AIzaSyABC123...'
        URL: 'https://vision.googleapis.com/v1/images:annotate'
    },
    
    // ==========================================================================
    // OPTION 4: MICROSOFT AZURE COMPUTER VISION (ACTIVE)
    // ==========================================================================
    // SETUP INSTRUCTIONS:
    // 1. Go to https://portal.azure.com/
    // 2. Create "Computer Vision" resource (Free F0 tier available)
    // 3. After creation, go to "Keys and Endpoint"
    // 4. Copy "KEY 1" and paste below (replace YOUR_AZURE_KEY_HERE)
    // 5. Copy "Endpoint" URL and paste below (replace YOUR_RESOURCE_NAME)
    // 6. Save this file, commit and push to GitHub
    //
    // Example values:
    // API_KEY: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p'
    // ENDPOINT: 'https://myresource.cognitiveservices.azure.com/'
    //
    AZURE_VISION: {
        API_KEY: 'YOUR_AZURE_KEY_HERE', // REPLACE with your actual Azure key
        ENDPOINT: 'https://YOUR_RESOURCE_NAME.cognitiveservices.azure.com/', // REPLACE with your endpoint
        URL_SUFFIX: '/vision/v3.2/ocr'
    }
};

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
