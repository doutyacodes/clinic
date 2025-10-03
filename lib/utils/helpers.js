// lib/utils/helpers.js - Utility Helper Functions

/**
 * Calculate age from date of birth
 * @param {string} dateOfBirth - Date string in YYYY-MM-DD format
 * @returns {number} Age in years
 */
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format date to readable string
 * @param {string} dateString - Date string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return 'N/A';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return new Date(dateString).toLocaleDateString('en-US', defaultOptions);
}

/**
 * Format time string to readable format
 * @param {string} timeString - Time string in HH:MM format
 * @returns {string} Formatted time
 */
export function formatTime(timeString) {
  if (!timeString) return 'Not specified';

  try {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return timeString;
  }
}

/**
 * Format currency to INR
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted currency
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get relative time string (e.g., "2 days ago")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  if (!date) return '';

  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const count = Math.floor(diffInSeconds / secondsInUnit);

    if (count >= 1) {
      return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate initials from name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Initials
 */
export function getInitials(firstName, lastName) {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone
 */
export function isValidPhone(phone) {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone?.replace(/\s+/g, ''));
}

/**
 * Get blood group emoji
 * @param {string} bloodGroup - Blood group
 * @returns {string} Emoji representation
 */
export function getBloodGroupEmoji(bloodGroup) {
  return '🩸';
}

/**
 * Get gender emoji
 * @param {string} gender - Gender
 * @returns {string} Emoji representation
 */
export function getGenderEmoji(gender) {
  if (!gender) return '👤';

  const genderLower = gender.toLowerCase();
  if (genderLower === 'male') return '👨';
  if (genderLower === 'female') return '👩';
  return '👤';
}

/**
 * Calculate BMI
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {number} BMI value
 */
export function calculateBMI(weight, height) {
  if (!weight || !height) return null;

  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);

  return Math.round(bmi * 10) / 10;
}

/**
 * Get BMI category
 * @param {number} bmi - BMI value
 * @returns {string} BMI category
 */
export function getBMICategory(bmi) {
  if (!bmi) return 'Unknown';

  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Generate random ID
 * @param {number} length - Length of ID
 * @returns {string} Random ID
 */
export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
