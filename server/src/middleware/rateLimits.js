import rateLimit from 'express-rate-limit';

const json429 = (req, res) => res.status(429).json({
  success: false,
  data: null,
  message: 'Too many requests. Please try again later.'
});

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json429
});

export const leadsRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json429
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json429
});
