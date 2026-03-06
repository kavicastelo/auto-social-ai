import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { env } from '../config/index.js';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = env.JWT_SECRET.padEnd(32, '0').slice(0, 32);

/**
 * Encrypt a string using AES-256-CBC
 */
export function encryptToken(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string using AES-256-CBC
 */
export function decryptToken(encryptedText: string): string {
    const [ivHex, encryptedHex] = encryptedText.split(':');
    if (!ivHex || !encryptedHex) throw new Error('Invalid encrypted token format');

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
