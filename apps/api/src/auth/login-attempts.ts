import { Injectable } from '@nestjs/common';
import { LOGIN_FAILURE_WINDOW_MINUTES, MAX_FAILED_LOGINS } from './auth.constants';

/**
 * Counts failed logins per (IP address, email) pair. Keying on both means an
 * attacker can slow down their own guesses but can never lock a real user out
 * of their account from elsewhere. Kept in memory: the API runs as a single
 * process, and a restart only resets the counters.
 */
@Injectable()
export class LoginAttempts {
  private readonly failures = new Map<string, { count: number; since: number }>();
  private readonly windowMs = LOGIN_FAILURE_WINDOW_MINUTES * 60_000;

  private key(ip: string, email: string) {
    return `${ip}|${email.toLowerCase().trim()}`;
  }

  isBlocked(ip: string, email: string) {
    const entry = this.failures.get(this.key(ip, email));
    if (!entry) return false;
    if (Date.now() - entry.since > this.windowMs) {
      this.failures.delete(this.key(ip, email));
      return false;
    }
    return entry.count >= MAX_FAILED_LOGINS;
  }

  recordFailure(ip: string, email: string) {
    const key = this.key(ip, email);
    const entry = this.failures.get(key);
    if (!entry || Date.now() - entry.since > this.windowMs) {
      this.failures.set(key, { count: 1, since: Date.now() });
    } else {
      entry.count += 1;
    }
    if (this.failures.size > 10_000) this.prune();
  }

  clear(ip: string, email: string) {
    this.failures.delete(this.key(ip, email));
  }

  private prune() {
    const cutoff = Date.now() - this.windowMs;
    for (const [key, entry] of this.failures) {
      if (entry.since < cutoff) this.failures.delete(key);
    }
  }
}
