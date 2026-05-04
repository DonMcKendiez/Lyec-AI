import CryptoJS from 'crypto-js';

// In a real app, this key would be derived from a password or stored in a secure hardware vault/keychain
// For this app, we'll use a persistent key that acts as the "biometric-derived" key
const SESSION_KEY_NAME = 'acholi_bio_vault_key';

export function getVaultKey(): string | null {
  return sessionStorage.getItem(SESSION_KEY_NAME);
}

export function setVaultKey(key: string) {
  sessionStorage.setItem(SESSION_KEY_NAME, key);
}

export function clearVaultKey() {
  sessionStorage.removeItem(SESSION_KEY_NAME);
}

/**
 * Encrypts data using AES-256
 */
export function encryptData(data: string, secretKey: string): string {
  try {
    return CryptoJS.AES.encrypt(data, secretKey).toString();
  } catch (error) {
    console.error('Encryption failed', error);
    return data;
  }
}

/**
 * Decrypts data using AES-256
 */
export function decryptData(encryptedData: string, secretKey: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Decryption resulted in empty string (wrong key?)');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed', error);
    return '[ENCRYPTED DATA - UNLOCK VAULT TO VIEW]';
  }
}

/**
 * Check if data is likely encrypted
 */
export function isEncrypted(data: string): boolean {
  // Simple heuristic for CryptoJS AES output (usually starts with U2FsdGVkX1)
  return data.startsWith('U2FsdGVkX1');
}
