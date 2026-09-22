import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * Handles the phpass algorithm used by WordPress ($P$ hashes).
 * On successful phpass verification, the password is re-hashed
 * using bcrypt (modern, secure) and the result is returned
 * so the caller can update the DB record.
 */
@Injectable()
export class PasswordService {
  private readonly ITOA64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  private readonly BCRYPT_ROUNDS = 12;

  /**
   * Verify a password against a stored hash.
   * Supports both bcrypt ($2b$) and phpass ($P$) hashes.
   */
  async verify(plainPassword: string, storedHash: string): Promise<boolean> {
    if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$') || storedHash.startsWith('$2y$')) {
      return bcrypt.compare(plainPassword, storedHash);
    }

    if (storedHash.startsWith('$P$') || storedHash.startsWith('$H$')) {
      return this.verifyPhpass(plainPassword, storedHash);
    }

    return false;
  }

  /**
   * Hash a password using bcrypt (modern standard).
   */
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.BCRYPT_ROUNDS);
  }

  /**
   * Check if a stored hash is a legacy phpass hash that should be upgraded.
   */
  isLegacyHash(hash: string): boolean {
    return hash.startsWith('$P$') || hash.startsWith('$H$');
  }

  // ─── phpass implementation ────────────────────────────────────────────────

  private verifyPhpass(password: string, hash: string): boolean {
    try {
      const computed = this.cryptPrivate(password, hash);
      return computed === hash;
    } catch {
      return false;
    }
  }

  private cryptPrivate(password: string, setting: string): string {
    const output = '*0';

    if (setting.substring(0, 2) === output) {
      return '*1';
    }

    const id = setting.substring(0, 3);
    if (id !== '$P$' && id !== '$H$') {
      return output;
    }

    const countLog2 = this.ITOA64.indexOf(setting[3]);
    if (countLog2 < 7 || countLog2 > 30) {
      return output;
    }

    let count = 1 << countLog2;
    const salt = setting.substring(4, 12);

    if (salt.length !== 8) {
      return output;
    }

    const crypto = require('crypto');
    let hash = crypto.createHash('md5').update(salt + password, 'binary').digest('binary');

    do {
      hash = crypto.createHash('md5').update(hash + password, 'binary').digest('binary');
      count--;
    } while (count > 0);

    return setting.substring(0, 12) + this.encode64(hash, 16);
  }

  private encode64(input: string, count: number): string {
    let output = '';
    let i = 0;

    do {
      let value = input.charCodeAt(i++);
      output += this.ITOA64[value & 0x3f];

      if (i < count) {
        value |= input.charCodeAt(i) << 8;
      }

      output += this.ITOA64[(value >> 6) & 0x3f];

      if (i++ >= count) break;

      if (i < count) {
        value |= input.charCodeAt(i) << 16;
      }

      output += this.ITOA64[(value >> 12) & 0x3f];

      if (i++ >= count) break;

      output += this.ITOA64[(value >> 18) & 0x3f];
    } while (i < count);

    return output;
  }
}
