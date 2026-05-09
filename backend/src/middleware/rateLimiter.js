import rateLimit from "express-rate-limit";

const createAuthRateLimiter = () =>
  rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many authentication attempts. Please try again in one minute."
    }
  });

export const loginRateLimiter = createAuthRateLimiter();
export const registerRateLimiter = createAuthRateLimiter();
