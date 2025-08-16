import bcrypt from 'bcryptjs';
import { AUTH_CONFIG } from './config.js';

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(AUTH_CONFIG.BCRYPT_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare password with hash
 */
export async function comparePasswords(password, hashedPassword) {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    throw new Error('Failed to compare passwords');
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  const errors = [];

  if (password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters long`);
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

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a random password
 */
export function generatePassword(length = 12) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*(),.?":{}|<>';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}