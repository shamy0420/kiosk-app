// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const codeInput = document.getElementById('codeInput');
const verifyBtn = document.getElementById('verifyBtn');
const inputSection = document.getElementById('inputSection');
const successSection = document.getElementById('successSection');
const errorSection = document.getElementById('errorSection');
const loadingSection = document.getElementById('loadingSection');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const bookingDetails = document.getElementById('bookingDetails');

// Event listeners
verifyBtn.addEventListener('click', verifyCode);

// Keypad event listeners
const keypadButtons = document.querySelectorAll('.key-btn');
keypadButtons.forEach(button => {
    button.addEventListener('click', handleKeypadClick);
});

/**
 * Handle keypad button clicks
 */
function handleKeypadClick(e) {
    const key = e.target.dataset.key;
    const currentValue = codeInput.value;
    
    if (key === 'clear') {
        codeInput.value = '';
    } else if (key === 'backspace') {
        codeInput.value = currentValue.slice(0, -1);
    } else if (currentValue.length < 6) {
        codeInput.value = currentValue + key;
    }
    
    // Auto-verify when 6 digits are entered
    if (codeInput.value.length === 6) {
        setTimeout(() => verifyCode(), 300);
    }
}

/**
 * Verify the booking code
 */
async function verifyCode() {
    const code = codeInput.value.trim();

    // Validate code format
    if (!code || code.length !== 6) {
        showError('Please enter a valid 6-digit code');
        return;
    }

    // Show loading state
    showLoading();

    try {
        // Check both 'Bookings' and 'bookings' collections
        let q = query(
            collection(db, 'Bookings'),
            where('verificationCode', '==', code)
        );
        let querySnapshot = await getDocs(q);

        // If not found, try lowercase collection
        if (querySnapshot.empty) {
            q = query(
                collection(db, 'bookings'),
                where('verificationCode', '==', code)
            );
            querySnapshot = await getDocs(q);
        }

        if (!querySnapshot.empty) {
            const bookingDoc = querySnapshot.docs[0];
            const booking = {
                id: bookingDoc.id,
                ...bookingDoc.data()
            };

            // Check if already verified
            if (booking.verified) {
                showError('This code has already been used');
                return;
            }

            // Determine which collection to update
            const collectionName = bookingDoc.ref.parent.id;

            // Update the booking to mark it as verified
            await updateDoc(doc(db, collectionName, booking.id), {
                verified: true,
                verifiedAt: new Date().toISOString()
            });

            // Show success with booking details
            showSuccess(booking);
        } else {
            showError('Invalid code. Please check and try again.');
        }
    } catch (error) {
        console.error('Error verifying code:', error);
        showError('An error occurred. Please try again.');
    }
}

/**
 * Show loading state
 */
function showLoading() {
    inputSection.classList.add('hidden');
    successSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    verifyBtn.disabled = true;
}

/**
 * Show success message with booking details
 */
function showSuccess(booking) {
    loadingSection.classList.add('hidden');
    successSection.classList.remove('hidden');

    // Format booking details
    const details = `
        <div class="detail-row">
            <span class="label">Guest Name:</span>
            <span class="value">${booking.guestName || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="label">Room Type:</span>
            <span class="value">${booking.roomTypeName || booking.roomName || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="label">Check-in:</span>
            <span class="value">${formatDate(booking.checkIn)}</span>
        </div>
        <div class="detail-row">
            <span class="label">Check-out:</span>
            <span class="value">${formatDate(booking.checkOut)}</span>
        </div>
    `;

    bookingDetails.innerHTML = details;
    successMessage.textContent = `Welcome, ${booking.guestName || 'Guest'}!`;

    // Auto-reset after 10 seconds
    setTimeout(() => {
        resetKiosk();
    }, 10000);
}

/**
 * Show error message
 */
function showError(message) {
    loadingSection.classList.add('hidden');
    errorSection.classList.remove('hidden');
    errorMessage.textContent = message;

    // Auto-reset after 5 seconds
    setTimeout(() => {
        resetKiosk();
    }, 5000);
}

/**
 * Reset kiosk to initial state
 */
window.resetKiosk = function() {
    inputSection.classList.remove('hidden');
    successSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    codeInput.value = '';
    verifyBtn.disabled = false;
    codeInput.focus();
}

/**
 * Format date string
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// Initialize
console.log('Kiosk app initialized');
codeInput.focus();
