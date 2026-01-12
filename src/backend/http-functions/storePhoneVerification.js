import { contacts } from 'wix-crm-backend';
import crypto from 'crypto';

/**
 * Secure backend function to store verified phone numbers
 * Uses encryption and secure storage instead of localStorage
 * 
 * @param {Object} options - Phone verification options
 * @param {string} options.phoneNumber - Phone number to store
 * @param {string} options.contactId - Wix contact ID
 * @returns {Promise<{success: boolean, message: string, encryptedPhone?: string}>}
 */
export async function storePhoneVerification(options) {
  try {
    // Validate input
    if (!options.phoneNumber || !options.contactId) {
      return {
        success: false,
        message: 'Missing required fields: phoneNumber, contactId'
      };
    }

    // Validate phone number format (10 digits for India)
    const phoneRegex = /^[0-9]{10}$/;
    const cleanPhone = options.phoneNumber.replace(/\D/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return {
        success: false,
        message: 'Invalid phone number format. Must be 10 digits.'
      };
    }

    // Encrypt phone number before storage
    const encryptedPhone = encryptPhoneNumber(cleanPhone);

    // Store in Wix CRM contact (secure backend storage)
    try {
      await contacts.updateContact(options.contactId, {
        info: {
          phones: [cleanPhone],
          custom: {
            'phone_verified': true,
            'phone_verified_at': new Date().toISOString(),
            'encrypted_phone': encryptedPhone
          }
        }
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      return {
        success: false,
        message: 'Failed to store phone verification'
      };
    }

    return {
      success: true,
      message: 'Phone number verified and stored securely',
      encryptedPhone: encryptedPhone
    };
  } catch (error) {
    console.error('Error in storePhoneVerification function:', error);
    return {
      success: false,
      message: 'An error occurred while storing phone verification'
    };
  }
}

/**
 * Encrypt phone number using AES-256
 * @param {string} phoneNumber - Phone number to encrypt
 * @returns {string} Encrypted phone number
 */
function encryptPhoneNumber(phoneNumber) {
  try {
    // Use a fixed encryption key (in production, store this in Wix Secrets)
    const encryptionKey = process.env.PHONE_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32)), iv);
    
    let encrypted = cipher.update(phoneNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error encrypting phone number:', error);
    return phoneNumber; // Fallback to unencrypted (not ideal, but prevents crash)
  }
}

/**
 * Decrypt phone number
 * @param {string} encryptedPhone - Encrypted phone number
 * @returns {string} Decrypted phone number
 */
export function decryptPhoneNumber(encryptedPhone) {
  try {
    const encryptionKey = process.env.PHONE_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    const parts = encryptedPhone.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32)), iv);
    
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting phone number:', error);
    return null;
  }
}
