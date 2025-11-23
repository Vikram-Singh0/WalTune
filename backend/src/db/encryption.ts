import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes for AES
const SALT_LENGTH = 64; // 64 bytes for salt
const TAG_LENGTH = 16; // 16 bytes for GCM tag
const KEY_LENGTH = 32; // 32 bytes for AES-256

/**
 * Get encryption key from environment variable
 * Falls back to a default key if not set (for development only)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    console.warn(
      "⚠️ ENCRYPTION_KEY not set. Using default key (NOT SECURE FOR PRODUCTION!)"
    );
    // Default key for development - MUST be changed in production
    return crypto.scryptSync("default-key-change-in-production", "salt", KEY_LENGTH);
  }

  // If key is base64 encoded, decode it
  if (key.length === 44 && key.endsWith("=")) {
    // Likely base64 encoded
    try {
      return Buffer.from(key, "base64");
    } catch {
      // Not base64, use as-is
    }
  }

  // Derive key from string using scrypt
  return crypto.scryptSync(key, "waltune-salt", KEY_LENGTH);
}

/**
 * Encrypt data using AES-256-GCM
 * Returns base64 encoded string: salt:iv:tag:encryptedData
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from master key and salt
  const derivedKey = crypto.scryptSync(key, salt, KEY_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const tag = cipher.getAuthTag();

  // Combine salt:iv:tag:encryptedData
  return `${salt.toString("base64")}:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt data encrypted with encrypt()
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(":");

  if (parts.length !== 4) {
    throw new Error("Invalid encrypted data format");
  }

  const [saltBase64, ivBase64, tagBase64, encrypted] = parts;

  const salt = Buffer.from(saltBase64, "base64");
  const iv = Buffer.from(ivBase64, "base64");
  const tag = Buffer.from(tagBase64, "base64");

  // Derive key from master key and salt
  const derivedKey = crypto.scryptSync(key, salt, KEY_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generate a secure encryption key (for setup)
 * Run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("base64");
}

