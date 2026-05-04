import CryptoJS from 'crypto-js';

// Robustly handle environment variables for Vite/ESM environments
const getMasterKey = (): string => {
  try {
    // Try Vite's import.meta.env
    const viteKey = (import.meta as any).env?.VITE_ENCRYPTION_KEY;
    if (viteKey) return viteKey;
    
    // Try process.env for Node/CommonJS environments if any
    const processKey = typeof process !== 'undefined' ? process.env?.VITE_ENCRYPTION_KEY : null;
    if (processKey) return processKey;
  } catch (e) {
    // Fallback if import.meta or process access fails
  }
  return 'heritage-explorer-fallback-key-2024';
};

const MASTER_KEY = getMasterKey();

/**
 * AES-256 Encryption Utility
 */
export const encryptData = (data: string, secretKey: string = MASTER_KEY): string => {
  if (!data) return '';
  try {
    return CryptoJS.AES.encrypt(data, secretKey).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return data;
  }
};

/**
 * AES-256 Decryption Utility
 */
export const decryptData = (ciphertext: string, secretKey: string = MASTER_KEY): string => {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || ciphertext;
  } catch (error) {
    console.error('Decryption failed:', error);
    return ciphertext;
  }
};

/**
 * Derive a user-specific key based on UID
 * This provides another layer of security
 */
export const getUserKey = (uid: string): string => {
  if (!uid) return MASTER_KEY;
  return CryptoJS.SHA256(uid + MASTER_KEY).toString();
};

/**
 * Check if data is likely encrypted
 */
export const isEncrypted = (data: string): boolean => {
  return typeof data === 'string' && data.startsWith('U2FsdGVkX1');
};
