import { RatelimitError } from "../utils/Errors.js";

class RateLimiter {
  constructor() {
    this.attempts = {}; // Fixed spelling typo here from "attemps"
    this.cleanup();
  }

  getAttempts(key) {
    return this.attempts[key] || [];
  }

  recordAttempt(key) {
    const now = Date.now();
    if (!this.attempts[key]) {
      this.attempts[key] = [];
    }
    this.attempts[key].push(now);
  }

  // 1. Fixed isLimited to actually check against MAX_ATTEMPTS
  isLimited(key, maxAttempts, windowMs) {
    const now = Date.now();
    const timestamps = this.attempts[key] || [];

    // Filter to only count attempts within the current time window
    const recentAttempts = timestamps.filter(timestamp => now - timestamp < windowMs);
    
    // Update the array with only active window timestamps
    this.attempts[key] = recentAttempts;

    return recentAttempts.length >= maxAttempts;
  }

  // 2. Added the missing getRetryAfter method your middleware was crying for!
  getRetryAfter(key, maxAttempts, windowMs) {
    const now = Date.now();
    const timestamps = this.attempts[key] || [];

    if (timestamps.length === 0) return 0;

    // Find the oldest attempt in the active window
    const oldestAttemptInWindow = timestamps.find(timestamp => now - timestamp < windowMs);

    if (!oldestAttemptInWindow) return 0;

    const timeUntilExpiry = windowMs - (now - oldestAttemptInWindow);
    return Math.ceil(timeUntilExpiry / 1000); // Return seconds remaining
  }

  cleanup() {
    const interval = 60 * 1000;
    const maxAge = 24 * 60 * 60 * 1000;

    setInterval(() => {
      const now = Date.now();

      Object.keys(this.attempts).forEach((key) => {
        this.attempts[key] = this.attempts[key].filter(
          (timestamp) => now - timestamp < maxAge,
        );

        if (this.attempts[key].length === 0) {
          delete this.attempts[key];
        }
      });
    }, interval);
  }
}

const rateLimiter = new RateLimiter();

export const loginRateLimit = (req, res, next) => {
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 60 * 1000;
  const key = `login_${req.ip}`;

  if (rateLimiter.isLimited(key, MAX_ATTEMPTS, WINDOW_MS)) {
    const retryAfter = rateLimiter.getRetryAfter(key, MAX_ATTEMPTS, WINDOW_MS);
    res.set("Retry-After", retryAfter);

    return next(new RatelimitError(
      `too many requests. plz try again in ${retryAfter} seconds`,
      retryAfter,
    ));
  }

  rateLimiter.recordAttempt(key);
  next();
};

export const signUpRateLimit = (req, res, next) => {
  const MAX_ATTEMPTS = 3;
  const WINDOW_MS = 60 * 1000;
  const key = `sign_${req.ip}`;

  if (rateLimiter.isLimited(key, MAX_ATTEMPTS, WINDOW_MS)) {
    const retryAfter = rateLimiter.getRetryAfter(key, MAX_ATTEMPTS, WINDOW_MS);
    res.set("Retry-After", retryAfter);

    return next(new RatelimitError(
      `Too many attempts, plz try again ${retryAfter} seconds`,
      retryAfter,
    ));
  }
  rateLimiter.recordAttempt(key);
  next();
};

export const refreshRateLimit = (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return next();
  }
  const MAX_ATTEMPTS = 6;
  const WINDOW_MS = 60 * 60 * 1000;
  const key = `refresh_${req.ip}`;

  if (rateLimiter.isLimited(key, MAX_ATTEMPTS, WINDOW_MS)) {
    const retryAfter = rateLimiter.getRetryAfter(key, MAX_ATTEMPTS, WINDOW_MS);
    res.set("Retry-After", retryAfter);
    
    return next(new RatelimitError(
      `too many request plz try after ${retryAfter}`,
      retryAfter,
    ));
  }
  rateLimiter.recordAttempt(key);
  next();
};

export const apiRateLimit = (req, res, next) => {
  const MAX_ATTEMPTS = 100;
  const WINDOW_MS = 60 * 1000;
  const key = `api_${req.ip}`;

  if (rateLimiter.isLimited(key, MAX_ATTEMPTS, WINDOW_MS)) {
    const retryAfter = rateLimiter.getRetryAfter(key, MAX_ATTEMPTS, WINDOW_MS);
    res.set("Retry-After", retryAfter);

    throw new RatelimitError(
      `too many requests plz Retry after ${retryAfter} seconds`,
      retryAfter,
    );
  }

  rateLimiter.recordAttempt(key);
  next();
};

export const resetRateLimit = (key) => {
  if (key) {
    delete rateLimiter.attempts[key];
  } else {
    rateLimiter.attempts = {};
  }
};

export const getRateLimitStatus = (key) => {
  const attempts = rateLimiter.getAttempts(key);
  const now = Date.now();

  return {
    key,
    totalAttempts: attempts.length,
    recentAttempts: attempts.filter((t) => now - t < 15 * 60 * 1000).length, // Fixed "Date - t" bug
    timestamp: new Date().toISOString(),
  };
};

export default {
  loginRateLimit,
  signUpRateLimit,
  refreshRateLimit,
  apiRateLimit,
  resetRateLimit,
  getRateLimitStatus,
};