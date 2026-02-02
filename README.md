# Kiosk App - Setup Guide

## Overview
This is a Quasar (Vue 3) kiosk application that connects to your Firebase backend to verify booking codes. Users enter their 6-digit verification code, and the app displays success or error messages accordingly.

## Features
- ✅ Clean, modern kiosk interface
- ✅ 6-digit code verification
- ✅ Real-time Firebase integration
- ✅ Success/Error state displays
- ✅ Auto-reset after verification
- ✅ Booking details display on success
- ✅ Works on tablets, touchscreens, and desktops

## File Structure
```
kiosk-app/
├── index.html          # Vite entry HTML
├── src/
│   ├── App.vue         # Quasar/Vue app
│   ├── main.js         # App bootstrap
│   └── styles.css      # Styling
├── firebase-config.js  # Firebase configuration
└── README.md           # This file
```

## Quick Start

### Option 1: Run Locally (Quasar + Vite)
1. **Install dependencies:**
   ```bash
   cd kiosk-app
   npm install
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   - Vite will print a local URL such as `http://localhost:5173`

2. **Test it:**
   - Enter a 6-digit verification code
   - The app will verify it against your Firebase database
   - See success message with booking details or error message

### Option 2: Deploy to Firebase Hosting

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting:**
   ```bash
   cd kiosk-app
   firebase init hosting
   ```
   - Select your Firebase project: `clixsys-smart-mirror`
   - Public directory: `dist`
   - Configure as single-page app: `No`
   - Don't overwrite index.html: `No`

4. **Deploy:**
   ```bash
   npm run build
   ```
   ```bash
   firebase deploy --only hosting
   ```

5. **Access your kiosk:**
   - Firebase will provide a URL like: `https://clixsys-smart-mirror.web.app`

## Configuration

### Firebase Setup
The app is already configured to connect to your Firebase project. The configuration is in `firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCuwoLX6t-zrstq-FSHdXX87WyQ22ZmlJg",
  authDomain: "clixsys-smart-mirror.firebaseapp.com",
  projectId: "clixsys-smart-mirror",
  // ... other config
};
```

### Firestore Security Rules
Make sure your Firestore rules allow reading and updating bookings:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reading bookings for verification
    match /Bookings/{booking} {
      allow read: if true;
      allow update: if true; // Or add more specific rules
    }
    match /bookings/{booking} {
      allow read: if true;
      allow update: if true;
    }
  }
}
```

## How It Works

1. **User enters code:** The user types their 6-digit verification code
2. **Code validation:** The app checks if the code is 6 digits
3. **Firebase query:** Searches for the code in the Bookings collection
4. **Verification:**
   - If found and not used: Updates the booking as verified and shows success
   - If already used: Shows error message
   - If not found: Shows invalid code error
5. **Auto-reset:** After 10 seconds (success) or 5 seconds (error), the kiosk resets

## Customization

### Change Auto-Reset Timer
In `app.js`, modify the setTimeout values:
```javascript
// Success auto-reset (currently 10 seconds)
setTimeout(() => {
    resetKiosk();
}, 10000); // Change to desired milliseconds

// Error auto-reset (currently 5 seconds)
setTimeout(() => {
    resetKiosk();
}, 5000); // Change to desired milliseconds
```

### Customize Colors
In `styles.css`, change the gradient colors:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Add Your Logo
Add an image in the kiosk header:
```html
<div class="kiosk-header">
    <img src="logo.png" alt="Logo" style="width: 100px; margin-bottom: 20px;">
    <h1>Welcome</h1>
    ...
</div>
```

## Fullscreen Kiosk Mode

### For Chrome/Edge:
Press `F11` or use the browser menu → View → Full Screen

### For Dedicated Kiosk Devices:
Add a manifest.json for PWA support:
```json
{
  "name": "Check-In Kiosk",
  "short_name": "Kiosk",
  "display": "fullscreen",
  "start_url": "/",
  "theme_color": "#667eea"
}
```

### For Tablets (iPad):
Add to `index.html` head:
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

## Troubleshooting

### Code not verifying:
1. Check browser console for errors (F12)
2. Verify Firebase config is correct
3. Check Firestore security rules
4. Ensure booking has `verificationCode` field

### Firebase connection issues:
1. Check internet connection
2. Verify API key is correct
3. Check Firebase project status

### Display issues:
1. Clear browser cache
2. Try a different browser
3. Check responsive design on different screen sizes

## Integration with Main App

This kiosk app connects to the same Firebase database as your main check-in application at:
`/Users/mohamedel-shamy/Documents/Self-checkin/Self-checkin-copilot-build-app-connected-to-firebase/`

When a user creates a booking in the main app:
1. A 6-digit verification code is generated
2. Code is sent to the user via email
3. User comes to the kiosk and enters the code
4. Kiosk verifies the code and displays booking details

## Support

For issues or questions:
- Check the browser console for error messages
- Review Firebase Firestore data structure
- Verify booking codes in the Bookings collection

## License
MIT
