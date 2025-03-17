import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ENCRYPTION_KEY, ENCRYPTION_IV } from '$env/static/private';

if (!ENCRYPTION_KEY || !ENCRYPTION_IV) {
  throw new Error('Missing encryption configuration');
}

const algorithm = 'aes-256-cbc';
const key = Buffer.from(ENCRYPTION_KEY, 'hex');
const iv = Buffer.from(ENCRYPTION_IV, 'hex');

export function encrypt(data: any): string {
  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decrypt(encrypted: string): any {
  const decipher = createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}
