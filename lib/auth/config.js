export const AUTH_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  JWT_EXPIRES_IN: '7d',
  COOKIE_NAME: 'healthcares-token',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  },
  PASSWORD_MIN_LENGTH: 8,
  BCRYPT_SALT_ROUNDS: 12,
};

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'An account with this email already exists',
  EMAIL_NOT_FOUND: 'No account found with this email',
  INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'You must be logged in to access this resource',
  WEAK_PASSWORD: 'Password must be at least 8 characters long with uppercase, lowercase, and number',
  INVALID_EMAIL: 'Please provide a valid email address',
  REQUIRED_FIELDS: 'All required fields must be provided',
};