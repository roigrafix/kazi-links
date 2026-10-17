/**
 * PIN Generator utility for booking verification
 */

export function generateBookingPIN(): string {
  // Generate a 6-digit PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  return pin;
}

export function formatPINDisplay(pin: string): string {
  // Format PIN as XXX-XXX for better readability
  if (pin.length !== 6) return pin;
  return `${pin.slice(0, 3)}-${pin.slice(3)}`;
}

export function validatePIN(pin: string): boolean {
  // Validate that PIN is exactly 6 digits
  return /^\d{6}$/.test(pin);
}
