import { AUTH_ERRORS } from './config.js';

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic Indian phone number validation)
 */
export function validatePhone(phone) {
  const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate signup data
 */
export function validateSignupData(data) {
  const errors = {};

  // Required fields
  const requiredFields = ['firstName', 'lastName', 'email', 'password', 'phone', 'dateOfBirth', 'gender', 'address', 'city', 'state', 'zipCode'];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors[field] = 'This field is required';
    }
  }

  // Email validation
  if (data.email && !validateEmail(data.email)) {
    errors.email = AUTH_ERRORS.INVALID_EMAIL;
  }

  // Password validation
  if (data.password) {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0]; // Just show the first error
    }
  }

  // Phone validation
  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = 'Please provide a valid phone number';
  }

  // Name length validation
  if (data.firstName && data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters long';
  }

  if (data.lastName && data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters long';
  }

  // Gender validation
  if (data.gender && !['male', 'female', 'other'].includes(data.gender.toLowerCase())) {
    errors.gender = 'Gender must be male, female, or other';
  }

  // Date of birth validation (basic check for reasonable age)
  if (data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    
    if (age < 0 || age > 120) {
      errors.dateOfBirth = 'Please provide a valid date of birth';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate login data
 */
export function validateLoginData(data) {
  const errors = {};

  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = AUTH_ERRORS.INVALID_EMAIL;
  }

  if (!data.password || data.password.trim() === '') {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}