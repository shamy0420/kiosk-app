/**
 * Sends the room passcode (PIN) email to the guest via EmailJS.
 * Uses env: VITE_EMAILJS_PUBLIC_KEY (required), VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID.
 */

import emailjs from '@emailjs/browser';

// Room passcode email: service_8gcm5jp, template_ewopm33 (override via env if needed)
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_8gcm5jp';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_ewopm33';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

/**
 * Format a date for display in the email (e.g. "February 4, 2026").
 * @param {string|object} dateValue - Firestore timestamp or ISO string
 * @returns {string}
 */
function formatDateForEmail(dateValue) {
  if (!dateValue) return 'N/A';
  try {
    const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return String(dateValue);
  }
}

/**
 * Send room passcode email to the guest.
 * @param {{
 *   to_name?: string;
 *   to_email?: string;
 *   email?: string;
 *   room_passcode: string;
 *   room_type: string;
 *   check_in: string|object;
 *   check_out: string|object;
 * }} params - Template variables. Sends both to_email and email so template "To" works with {{email}} or {{to_email}}
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
export async function sendRoomPasscodeEmail(params) {
  if (!PUBLIC_KEY) {
    console.error('EmailJS: VITE_EMAILJS_PUBLIC_KEY is not set');
    return { success: false, error: 'Email not configured (missing public key)' };
  }

  const checkInFormatted = formatDateForEmail(params.check_in);
  const checkOutFormatted = formatDateForEmail(params.check_out);

  const recipientEmail = String(params.to_email || params.email || '').trim();
  if (!recipientEmail) {
    return { success: false, error: 'Missing recipient email' };
  }

  // EmailJS "To" field often uses {{email}} or {{to_email}} – send both so the template works either way
  const templateParams = {
    to_name: String(params.to_name || 'Guest'),
    to_email: recipientEmail,
    email: recipientEmail,
    room_passcode: String(params.room_passcode || ''),
    room_type: String(params.room_type || 'N/A'),
    check_in: String(checkInFormatted),
    check_out: String(checkOutFormatted),
    subject: `Your Room Passcode: ${params.room_passcode || ''}`
  };

  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      { publicKey: PUBLIC_KEY }
    );
    if (response?.status === 200) {
      return { success: true };
    }
    return { success: false, error: response?.text || 'Unknown error' };
  } catch (err) {
    // err.status === 422 usually means template params don't match the template in EmailJS dashboard
    const message = err?.text || err?.message || String(err);
    console.error('EmailJS sendRoomPasscodeEmail error:', err?.status, message);
    return { success: false, error: message };
  }
}
