/**
 * Comprehensive Input Validation Utilities
 * Validates and sanitizes all user inputs to prevent injection attacks
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Email validation
 * @param {string} email - Email to validate
 * @returns {ValidationResult} Validation result
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();
  
  // RFC 5322 simplified email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  return { isValid: true, sanitized: trimmed.toLowerCase() };
}

/**
 * Phone number validation (India format)
 * @param {string} phone - Phone number to validate
 * @returns {ValidationResult} Validation result
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  const cleaned = phone.replace(/\D/g, '');

  // Indian phone numbers are 10 digits
  if (!/^\d{10}$/.test(cleaned)) {
    return { isValid: false, error: 'Phone number must be 10 digits' };
  }

  return { isValid: true, sanitized: cleaned };
}

/**
 * Name validation
 * @param {string} name - Name to validate
 * @param {number} minLength - Minimum length (default: 2)
 * @param {number} maxLength - Maximum length (default: 100)
 * @returns {ValidationResult} Validation result
 */
export function validateName(name: string, minLength = 2, maxLength = 100): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < minLength) {
    return { isValid: false, error: `Name must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Name must not exceed ${maxLength} characters` };
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Address validation
 * @param {string} address - Address to validate
 * @param {number} minLength - Minimum length (default: 10)
 * @param {number} maxLength - Maximum length (default: 500)
 * @returns {ValidationResult} Validation result
 */
export function validateAddress(address: string, minLength = 10, maxLength = 500): ValidationResult {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Address is required' };
  }

  const trimmed = address.trim();

  if (trimmed.length < minLength) {
    return { isValid: false, error: `Address must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Address must not exceed ${maxLength} characters` };
  }

  // Allow alphanumeric, spaces, commas, periods, hyphens, and numbers
  if (!/^[a-zA-Z0-9\s,.\-#/]+$/.test(trimmed)) {
    return { isValid: false, error: 'Address contains invalid characters' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Postal code validation (India format)
 * @param {string} postalCode - Postal code to validate
 * @returns {ValidationResult} Validation result
 */
export function validatePostalCode(postalCode: string): ValidationResult {
  if (!postalCode || typeof postalCode !== 'string') {
    return { isValid: false, error: 'Postal code is required' };
  }

  const cleaned = postalCode.replace(/\D/g, '');

  // Indian postal codes are 6 digits
  if (!/^\d{6}$/.test(cleaned)) {
    return { isValid: false, error: 'Postal code must be 6 digits' };
  }

  return { isValid: true, sanitized: cleaned };
}

/**
 * Text validation (general purpose)
 * @param {string} text - Text to validate
 * @param {number} minLength - Minimum length (default: 1)
 * @param {number} maxLength - Maximum length (default: 5000)
 * @returns {ValidationResult} Validation result
 */
export function validateText(text: string, minLength = 1, maxLength = 5000): ValidationResult {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Text is required' };
  }

  const trimmed = text.trim();

  if (trimmed.length < minLength) {
    return { isValid: false, error: `Text must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { isValid: false, error: `Text must not exceed ${maxLength} characters` };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Number validation
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value (optional)
 * @param {number} max - Maximum value (optional)
 * @returns {ValidationResult} Validation result
 */
export function validateNumber(value: any, min?: number, max?: number): ValidationResult {
  const num = Number(value);

  if (isNaN(num)) {
    return { isValid: false, error: 'Must be a valid number' };
  }

  if (min !== undefined && num < min) {
    return { isValid: false, error: `Number must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, error: `Number must not exceed ${max}` };
  }

  return { isValid: true, sanitized: num.toString() };
}

/**
 * Date validation
 * @param {string | Date} date - Date to validate
 * @param {Date} minDate - Minimum date (optional)
 * @param {Date} maxDate - Maximum date (optional)
 * @returns {ValidationResult} Validation result
 */
export function validateDate(date: string | Date, minDate?: Date, maxDate?: Date): ValidationResult {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  if (minDate && dateObj < minDate) {
    return { isValid: false, error: `Date must be after ${minDate.toLocaleDateString()}` };
  }

  if (maxDate && dateObj > maxDate) {
    return { isValid: false, error: `Date must be before ${maxDate.toLocaleDateString()}` };
  }

  return { isValid: true, sanitized: dateObj.toISOString() };
}

/**
 * URL validation
 * @param {string} url - URL to validate
 * @returns {ValidationResult} Validation result
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    new URL(url);
    return { isValid: true, sanitized: url };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - HTML to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validate booking form data
 * @param {any} formData - Form data to validate
 * @returns {Object} Validation results for each field
 */
export function validateBookingForm(formData: any): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  // Validate client name
  results.clientName = validateName(formData.clientName);

  // Validate email
  results.clientEmail = validateEmail(formData.clientEmail);

  // Validate phone
  results.clientPhone = validatePhoneNumber(formData.clientPhone);

  // Validate address
  if (formData.serviceLocationType === 'client') {
    results.serviceAddress = validateAddress(formData.serviceAddress);
    results.postalCode = validatePostalCode(formData.postalCode);
  }

  // Validate date
  if (formData.bookingDate) {
    results.bookingDate = validateDate(formData.bookingDate, new Date());
  }

  // Validate time
  if (formData.bookingTime) {
    results.bookingTime = validateText(formData.bookingTime, 5, 5); // HH:MM format
  }

  return results;
}

/**
 * Check if all validation results are valid
 * @param {Record<string, ValidationResult>} results - Validation results
 * @returns {boolean} True if all validations passed
 */
export function isAllValid(results: Record<string, ValidationResult>): boolean {
  return Object.values(results).every(result => result.isValid);
}

/**
 * Get all validation errors
 * @param {Record<string, ValidationResult>} results - Validation results
 * @returns {string[]} Array of error messages
 */
export function getValidationErrors(results: Record<string, ValidationResult>): string[] {
  return Object.entries(results)
    .filter(([, result]) => !result.isValid && result.error)
    .map(([field, result]) => `${field}: ${result.error}`);
}
