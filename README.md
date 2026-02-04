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
├── index.html              # Vite entry HTML
├── .env.example            # Example env (copy to .env, add VITE_EMAILJS_PUBLIC_KEY)
├── src/
│   ├── App.vue             # Kiosk UI and verification + room passcode email
│   ├── main.js             # App bootstrap
│   ├── styles.css          # Styling
│   └── services/
│       └── emailService.js # EmailJS room passcode email
├── firebase-config.js      # Firebase configuration
└── README.md               # This file
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

### EmailJS (room passcode email)
The kiosk sends the room passcode (PIN) to the guest’s email after verification. Configure EmailJS:

1. Copy `.env.example` to `.env`.
2. Get your **Public Key** from [EmailJS Dashboard](https://dashboard.emailjs.com/admin) and set:
   ```bash
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```
3. Optional: set `VITE_EMAILJS_SERVICE_ID` and `VITE_EMAILJS_TEMPLATE_ID` if you use different IDs. Defaults: `service_8gcm5jp`, `template_ewopm33`. Your EmailJS template should use variables: `to_name`, `to_email`, `room_passcode`, `room_type`, `check_in`, `check_out`, and optionally `subject`.

Without `VITE_EMAILJS_PUBLIC_KEY`, the kiosk still verifies the code but will not send the room passcode email (and will log a configuration error).

### Firestore Security Rules
This repo includes **`firestore.rules`** so the kiosk can read and update bookings. Deploy them with:

```bash
# From the kiosk-app directory; use your Firebase project
firebase use clixsys-smart-mirror   # or your project ID
firebase deploy --only firestore
```

The rules allow:
- **Bookings** and **bookings**: `read`, `create`, `update` (no `delete`).  
  The kiosk needs **read** (to find by `verificationCode`) and **update** (to set `verified`, `verifiedAt`, `roomPasscode`, `roomPasscodeEmailSent`, `roomPasscodeSentAt`).  
  Your main booking app needs **create** (and read/update) on the same collections.

To tighten later (e.g. only allow updates from your app’s domain or with App Check), edit `firestore.rules` and redeploy.

## How It Works

1. **User enters code:** The user types their 6-digit verification code
2. **Code validation:** The app checks if the code is 6 digits
3. **Firebase query:** Searches for the code in **Bookings**, then **bookings** if not found.
4. **Verification:**
   - If found and not used: Updates the booking with `verified: true` and `verifiedAt` (timestamp), then shows success
   - If already used: Shows error message
   - If not found: Shows invalid code error
5. **Room PIN email:** Right after verification, the kiosk sends one email to the guest’s `email` with the room passcode and stay details (via EmailJS). It sets `roomPasscodeEmailSent: true` and `roomPasscodeSentAt` on the booking so the email is not sent twice. If the booking has no `roomPasscode`, the kiosk generates a 6-digit one and saves it first.
6. **Auto-reset:** After 10 seconds (success) or 5 seconds (error), the kiosk resets

---

## Kiosk verification → Room PIN email

This kiosk **sends the room passcode email itself** (using EmailJS). It does not rely on another app or a Cloud Function.

### What this kiosk does

- Finds the booking in Firestore **Bookings** (or **bookings**) by `verificationCode`
- Updates that document with `verified: true` and `verifiedAt`
- If the booking has no `roomPasscode`, generates a 6-digit one and saves it
- If the guest has an `email` and `roomPasscodeEmailSent` is not yet true: sends one email with room passcode and stay details (subject: “Your Room Passcode: {code}”), then sets `roomPasscodeEmailSent: true` and `roomPasscodeSentAt`
- On email failure: logs the error and can set `roomPasscodeEmailError` on the booking; verification is not undone

### Avoiding duplicate emails

If your self-check-in app also has a Cloud Function that sends the room passcode on verification, either:

- **Recommended:** Disable or remove that function in the self-check-in project (e.g. `sendRoomPasscodeOnVerification`), or  
- Leave it deployed: it will only send when `roomPasscodeEmailSent` is not true. Because this kiosk sets `roomPasscodeEmailSent: true` after sending, the function will skip sending.

### Summary

| Step | Who | Action |
|------|-----|--------|
| 1 | Guest | Books on web → gets verification code by email. |
| 2 | Guest | Goes to kiosk and enters verification code. |
| 3 | **This kiosk** | Finds booking, sets `verified: true` and `verifiedAt`, then sends room passcode email and sets `roomPasscodeEmailSent` / `roomPasscodeSentAt`. |

## Customization

### Change Auto-Reset Timer
In `src/App.vue`, modify the setTimeout values in `showSuccess` and `showError`:
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

### EmailJS 422 (room passcode email fails):
A 422 from EmailJS usually means the template expects different variable names. In the [EmailJS template](https://dashboard.emailjs.com) for **template_ewopm33** (service **service_8gcm5jp**), ensure:
- **To** field uses `{{to_email}}`
- Template body can use: `{{to_name}}`, `{{room_passcode}}`, `{{room_type}}`, `{{check_in}}`, `{{check_out}}`, `{{subject}}`
- Variable names must match exactly (lowercase with underscores). Check the console for the full error message (`err.text`).

### Firestore "Missing or insufficient permissions":
If the kiosk can verify but cannot update the booking (e.g. to set `roomPasscodeEmailSent`), update your Firestore rules to allow **update** on the Bookings (and bookings) documents. The kiosk only needs to write `verified`, `verifiedAt`, `roomPasscode` (if missing), `roomPasscodeEmailSent`, and `roomPasscodeSentAt`.

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
