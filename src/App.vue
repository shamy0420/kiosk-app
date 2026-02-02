<template>
  <div class="kiosk-container">
    <div class="kiosk-header">
      <img src="/logo.png" alt="CLIXSYS" class="logo" />
      <h1>Welcome</h1>
      <p>Please enter your verification code</p>
    </div>

    <div class="kiosk-content">
      <div id="inputSection" class="input-section" v-show="showInput">
        <input
          ref="codeInputRef"
          type="text"
          id="codeInput"
          class="code-input"
          placeholder="Enter 6-digit code"
          maxlength="6"
          autocomplete="off"
          readonly
          v-model="code"
        />
        <div class="keypad">
          <button class="key-btn" @click="handleKeypadClick('1')">1</button>
          <button class="key-btn" @click="handleKeypadClick('2')">2</button>
          <button class="key-btn" @click="handleKeypadClick('3')">3</button>
          <button class="key-btn" @click="handleKeypadClick('4')">4</button>
          <button class="key-btn" @click="handleKeypadClick('5')">5</button>
          <button class="key-btn" @click="handleKeypadClick('6')">6</button>
          <button class="key-btn" @click="handleKeypadClick('7')">7</button>
          <button class="key-btn" @click="handleKeypadClick('8')">8</button>
          <button class="key-btn" @click="handleKeypadClick('9')">9</button>
          <button class="key-btn clear-btn" @click="handleKeypadClick('clear')">Clear</button>
          <button class="key-btn" @click="handleKeypadClick('0')">0</button>
          <button class="key-btn backspace-btn" @click="handleKeypadClick('backspace')">⌫</button>
        </div>
        <button id="verifyBtn" class="verify-btn" :disabled="isLoading" @click="verifyCode">
          Verify Code
        </button>
        <p class="help-text">Enter the code you received via email</p>
      </div>

      <div id="successSection" class="result-section success-section" v-show="isSuccess">
        <div class="icon-container">
          <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2>Success!</h2>
        <p id="successMessage">{{ successMessage }}</p>
        <div id="bookingDetails" class="booking-details">
          <div class="detail-row">
            <span class="label">Guest Name:</span>
            <span class="value">{{ booking?.guestName || 'N/A' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Room Type:</span>
            <span class="value">{{ booking?.roomTypeName || booking?.roomName || 'N/A' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Check-in:</span>
            <span class="value">{{ formatDate(booking?.checkIn) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Check-out:</span>
            <span class="value">{{ formatDate(booking?.checkOut) }}</span>
          </div>
        </div>
        <button class="reset-btn" @click="resetKiosk">Check Another Code</button>
      </div>

      <div id="errorSection" class="result-section error-section" v-show="isError">
        <div class="icon-container">
          <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h2>Invalid Code</h2>
        <p id="errorMessage">{{ errorMessage }}</p>
        <button class="reset-btn" @click="resetKiosk">Try Again</button>
      </div>

      <div id="loadingSection" class="loading-section" v-show="isLoading">
        <div class="spinner"></div>
        <p>Verifying code...</p>
      </div>
    </div>

    <div class="kiosk-footer">
      <p>Need help? Contact the front desk</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const code = ref('');
const isLoading = ref(false);
const isSuccess = ref(false);
const isError = ref(false);
const successMessage = ref('Your code is valid');
const errorMessage = ref('The code you entered is incorrect');
const booking = ref(null);
const codeInputRef = ref(null);

const showInput = computed(() => !isLoading.value && !isSuccess.value && !isError.value);

function handleKeypadClick(key) {
  const currentValue = code.value;

  if (key === 'clear') {
    code.value = '';
  } else if (key === 'backspace') {
    code.value = currentValue.slice(0, -1);
  } else if (currentValue.length < 6) {
    code.value = currentValue + key;
  }

  if (code.value.length === 6) {
    setTimeout(() => verifyCode(), 300);
  }
}

async function verifyCode() {
  const trimmedCode = code.value.trim();

  if (!trimmedCode || trimmedCode.length !== 6) {
    showError('Please enter a valid 6-digit code');
    return;
  }

  showLoading();

  try {
    let q = query(collection(db, 'Bookings'), where('verificationCode', '==', trimmedCode));
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      q = query(collection(db, 'bookings'), where('verificationCode', '==', trimmedCode));
      querySnapshot = await getDocs(q);
    }

    if (!querySnapshot.empty) {
      const bookingDoc = querySnapshot.docs[0];
      const data = {
        id: bookingDoc.id,
        ...bookingDoc.data()
      };

      if (data.verified) {
        showError('This code has already been used');
        return;
      }

      const collectionName = bookingDoc.ref.parent.id;

      await updateDoc(doc(db, collectionName, data.id), {
        verified: true,
        verifiedAt: new Date().toISOString()
      });

      showSuccess(data);
    } else {
      showError('Invalid code. Please check and try again.');
    }
  } catch (error) {
    console.error('Error verifying code:', error);
    showError('An error occurred. Please try again.');
  }
}

function showLoading() {
  isLoading.value = true;
  isSuccess.value = false;
  isError.value = false;
}

function showSuccess(bookingData) {
  isLoading.value = false;
  isSuccess.value = true;
  isError.value = false;
  booking.value = bookingData;
  successMessage.value = `Welcome, ${bookingData.guestName || 'Guest'}!`;

  setTimeout(() => {
    resetKiosk();
  }, 10000);
}

function showError(message) {
  isLoading.value = false;
  isSuccess.value = false;
  isError.value = true;
  errorMessage.value = message;

  setTimeout(() => {
    resetKiosk();
  }, 5000);
}

function resetKiosk() {
  isLoading.value = false;
  isSuccess.value = false;
  isError.value = false;
  code.value = '';
  booking.value = null;
  nextTick(() => {
    codeInputRef.value?.focus();
  });
}

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

watch(code, (value) => {
  if (value.length > 6) {
    code.value = value.slice(0, 6);
  }
});

onMounted(() => {
  console.log('Kiosk app initialized');
  codeInputRef.value?.focus();
});
</script>
