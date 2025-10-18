import crypto from 'crypto';

/**
 * AES-256-GCM encrypt/decrypt helpers.
 *
 * Requirements:
 * - Set ENCRYPTION_KEY env var to a base64-encoded 32-byte key (AES-256).
 *
 * Format:
 * - encryptString returns a base64 string containing: iv(12 bytes) || authTag(16 bytes) || ciphertext
 * - decryptString expects the same format (base64).
 *
 * Notes:
 * - IV is 12 bytes (recommended for GCM)
 * - Auth tag is 16 bytes
 * - This implementation throws when ENCRYPTION_KEY is not configured or has invalid length.
 */

/** Length constants */
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Reads and validates the encryption key from env.
 * The key must be base64 encoded and decode to 32 bytes.
 */
function getKey(): Buffer {
  const keyB64 = process.env.ENCRYPTION_KEY;
  if (!keyB64) {
    throw new Error('Missing ENCRYPTION_KEY environment variable. Set ENCRYPTION_KEY to a base64-encoded 32-byte key.');
  }

  const key = Buffer.from(keyB64, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error('ENCRYPTION_KEY must be base64-encoded 32 bytes (AES-256).');
  }

  return key;
}

/**
 * Encrypt a UTF-8 string using AES-256-GCM.
 * Returns base64(iv + authTag + ciphertext).
 */
export function encryptString(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, authTag, ciphertext]);
  return payload.toString('base64');
}

/**
 * Decrypt a base64 payload produced by `encryptString`.
 * Expects base64(iv + authTag + ciphertext).
 */
export function decryptString(payloadB64: string): string {
  if (!payloadB64) {
    throw new Error('Empty payload provided to decryptString.');
  }

  const key = getKey();
  let payload: Buffer;
  try {
    payload = Buffer.from(payloadB64, 'base64');
  } catch (_err) {
    throw new Error('Invalid base64 payload provided to decryptString.');
  }

  if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error('Invalid encrypted payload length.');
  }

  const iv = payload.slice(0, IV_LENGTH);
  const authTag = payload.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = payload.slice(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Utility to check whether a string looks like an encrypted payload produced by encryptString.
 * This is a heuristic: checks for valid base64 decode and minimum length.
 */
export function looksLikeEncryptedPayload(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return false;
  try {
    const b = Buffer.from(value, 'base64');
    return b.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1;
  } catch {
    return false;
  }
}
