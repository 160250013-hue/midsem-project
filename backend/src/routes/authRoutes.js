import { Router } from "express";
import passport from "passport";
import { HttpError } from "../utils/httpError.js";
import { isGoogleOAuthConfigured } from "../config/passport.js";
import {
	login,
	loginValidation,
	logout,
	logoutValidation,
	me,
	refresh,
	refreshValidation,
	register,
	registerValidation,
	sendOTP,
	sendOTPValidation,
	verifyOTP,
	verifyOTPValidation,
	forgotPassword,
	forgotPasswordValidation,
	resetPassword,
	resetPasswordValidation,
	googleAuth,
	googleAuthCallback
} from "../controllers/authController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { loginRateLimiter, registerRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const requireGoogleOAuthConfig = (_req, _res, next) => {
	if (!isGoogleOAuthConfigured()) {
		next(
			new HttpError(
				503,
				"Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in backend .env"
			)
		);
		return;
	}

	next();
};

// Standard Auth
router.post("/register", registerRateLimiter, validate(registerValidation), register);
router.post("/login", loginRateLimiter, validate(loginValidation), login);
router.post("/refresh", validate(refreshValidation), refresh);
router.post("/logout", validate(logoutValidation), logout);
router.get("/me", authenticateUser, me);

// Email Verification
router.post("/send-otp", validate(sendOTPValidation), sendOTP);
router.post("/verify-otp", validate(verifyOTPValidation), verifyOTP);

// Password Reset
router.post("/forgot-password", validate(forgotPasswordValidation), forgotPassword);
router.post("/reset-password", validate(resetPasswordValidation), resetPassword);

// Google OAuth
router.get(
	"/google",
	requireGoogleOAuthConfig,
	passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
	"/google/callback",
	requireGoogleOAuthConfig,
	passport.authenticate("google", { session: false }),
	googleAuthCallback
);

export default router;
