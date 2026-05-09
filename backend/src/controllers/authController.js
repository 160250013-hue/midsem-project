import Joi from "joi";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import {
  ALLOWED_REGISTRATION_ROLES,
  ROLES,
  normalizeRole
} from "../utils/constants.js";
import { comparePassword, hashPassword } from "../utils/hashService.js";
import { createUser, getUserByEmail, getUserById, updateUserPassword } from "../models/userModel.js";
import { getStudentProfileByUserId, upsertStudentProfile } from "../models/studentModel.js";
import {
  deleteExpiredRefreshTokens,
  deleteRefreshToken,
  deleteRefreshTokensByUserId,
  getRefreshToken,
  saveRefreshToken
} from "../models/refreshTokenModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getTokenExpiryDate,
  verifyRefreshToken
} from "../utils/tokenService.js";
import { generateOTP, getOTPExpiryTime, isOTPExpired } from "../utils/otpService.js";
import { sendOTPEmail, sendPasswordResetEmail } from "../utils/emailService.js";
import {
  createEmailVerification,
  getEmailVerificationByUserId,
  incrementEmailVerificationAttempts,
  deleteEmailVerificationsByUserId,
  updateUserEmailVerificationStatus,
  deleteExpiredEmailVerifications
} from "../models/emailVerificationModel.js";
import {
  generatePasswordResetToken,
  verifyPasswordResetToken,
  getPasswordResetExpiryTime,
  isPasswordResetExpired
} from "../utils/passwordResetService.js";
import {
  createPasswordReset,
  getPasswordResetByToken,
  markPasswordResetAsUsed,
  deleteExpiredPasswordResets,
  deletePasswordResetsByUserId
} from "../models/passwordResetModel.js";

const passwordSchema = Joi.string()
  .min(6)
  .message("Password must be at least 6 characters")
  .required();

export const registerValidation = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email().required(),
  password: passwordSchema,
  phone: Joi.string().trim().pattern(/^\d{10}$/).required().messages({
    "string.pattern.base": "Phone must be exactly 10 digits",
    "any.required": "Phone is required"
  }),
  role: Joi.string()
    .trim()
    .lowercase()
    .valid(...ALLOWED_REGISTRATION_ROLES)
    .default(ROLES.STUDENT)
});

export const loginValidation = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

export const refreshValidation = Joi.object({
  refreshToken: Joi.string().trim().allow("", null).optional()
});

export const logoutValidation = Joi.object({
  refreshToken: Joi.string().trim().allow("", null).optional()
});

export const sendOTPValidation = Joi.object({
  email: Joi.string().trim().email().required()
});

export const verifyOTPValidation = Joi.object({
  email: Joi.string().trim().email().required(),
  otp: Joi.string().length(6).required()
});

export const forgotPasswordValidation = Joi.object({
  email: Joi.string().trim().email().required()
});

export const resetPasswordValidation = Joi.object({
  token: Joi.string().trim().required(),
  newPassword: Joi.string()
    .min(6)
    .message("Password must be at least 6 characters")
    .required()
});

const buildUserResponse = async (user) => {
  const role = normalizeRole(user.role);
  const isVerified = Boolean(user.is_verified || user.email_verified);

  return {
    id: user.id,
    name: user.full_name,
    full_name: user.full_name,
    email: user.email,
    role,
    phone: user.phone,
    is_active: user.is_active,
    is_verified: isVerified,
    email_verified: user.email_verified,
    profile: role === ROLES.STUDENT ? await getStudentProfileByUserId(user.id) : null
  };
};

const issueAuthTokens = async ({ userId, role, revokeExisting = false }) => {
  const normalizedRole = normalizeRole(role);

  await deleteExpiredRefreshTokens();
  if (revokeExisting) {
    await deleteRefreshTokensByUserId(userId);
  }

  const accessToken = generateAccessToken({ id: userId, role: normalizedRole });
  const refreshToken = generateRefreshToken({ id: userId, role: normalizedRole });

  await saveRefreshToken({
    userId,
    token: refreshToken,
    expiryDate: getTokenExpiryDate(refreshToken)
  });

  return {
    token: accessToken,
    accessToken,
    refreshToken
  };
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/"
};

const setAuthCookies = (res, tokens) => {
  res.cookie("refreshToken", tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("refreshToken", cookieOptions);
};

export const register = asyncHandler(async (req, res) => {
  console.log("[auth/register] request body:", req.body);
  const { name, email, password, role, phone } = req.body;
  
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new HttpError(409, "User already exists");
  }

  const normalizedRole = normalizeRole(role);
  const passwordHash = await hashPassword(password);
  
  // Create new user
  const user = await createUser({
    name,
    email,
    passwordHash,
    role: normalizedRole,
    phone
  });

  // Create student profile if role is student
  if (normalizedRole === ROLES.STUDENT) {
    await upsertStudentProfile({
      userId: user.id,
      department: "",
      cgpa: 0,
      skills: [],
      resumeUrl: "",
      projects: [],
      preferences: {},
      graduationYear: null,
      facultyMentorId: null
    });
  }

  const otp = generateOTP();
  const expiryTime = getOTPExpiryTime();

  await deleteEmailVerificationsByUserId(user.id);
  await createEmailVerification({
    userId: user.id,
    otp,
    expiryTime
  });

  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    console.error("[auth/register] OTP email failed:", error.message);
  }

  res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email."
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Check if user exists
  const user = await getUserByEmail(email);
  if (!user) {
    throw new HttpError(401, "User not registered. Please create an account first.");
  }

  if (!user.is_active) {
    throw new HttpError(403, "User account is unavailable");
  }

  if (!(user.is_verified || user.email_verified)) {
    throw new HttpError(403, "Please verify your email before login");
  }

  // Check if password hash exists (handle Google OAuth cases)
  if (!user.password_hash) {
    throw new HttpError(401, "Please use Google login or set a password");
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new HttpError(401, "Invalid credentials. Please check your password and try again.");
  }

  // Generate tokens
  const tokens = await issueAuthTokens({
    userId: user.id,
    role: user.role,
    revokeExisting: true
  });

  setAuthCookies(res, tokens);

  res.json({
    success: true,
    message: "Login successful",
    data: { 
      user: await buildUserResponse(user), 
      ...tokens 
    }
  });

});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new HttpError(401, "Refresh token is required");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  const savedToken = await getRefreshToken(refreshToken);
  if (!savedToken) {
    throw new HttpError(401, "Refresh token not recognized");
  }

  if (new Date(savedToken.expiry_date).getTime() <= Date.now()) {
    await deleteRefreshToken(refreshToken);
    throw new HttpError(401, "Refresh token has expired");
  }

  if (savedToken.user_id !== payload.id) {
    throw new HttpError(401, "Refresh token does not match the user");
  }

  const user = await getUserById(payload.id);
  if (!user || !user.is_active) {
    throw new HttpError(401, "User account is unavailable");
  }

  // Rotate refresh tokens to reduce replay risk.
  await deleteRefreshToken(refreshToken);

  const tokens = await issueAuthTokens({
    userId: user.id,
    role: user.role,
    revokeExisting: false
  });

  setAuthCookies(res, tokens);

  res.json({ success: true, data: tokens });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;

  if (refreshToken) {
    await deleteRefreshToken(refreshToken);
  }

  clearAuthCookies(res);

  res.json({ success: true, message: "Logged out successfully" });
});

export const me = asyncHandler(async (req, res) => {
  const profile =
    req.user.role === ROLES.STUDENT ? await getStudentProfileByUserId(req.user.id) : null;
  res.json({ success: true, data: { user: { ...req.user, profile } } });
});

// ========== EMAIL VERIFICATION ==========

export const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await getUserByEmail(email);
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  if (user.is_verified || user.email_verified) {
    res.json({ success: true, message: "Email already verified" });
    return;
  }

  // Generate OTP
  const otp = generateOTP();
  const expiryTime = getOTPExpiryTime();

  // Store OTP in database
  await deleteEmailVerificationsByUserId(user.id);
  await createEmailVerification({
    userId: user.id,
    otp,
    expiryTime
  });

  // Send OTP email
  await sendOTPEmail(email, otp);

  res.json({ success: true, message: "OTP sent to your email" });
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await getUserByEmail(email);
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  if (user.is_verified || user.email_verified) {
    throw new HttpError(400, "Email already verified");
  }

  const verification = await getEmailVerificationByUserId(user.id);
  if (!verification) {
    throw new HttpError(400, "No OTP found. Please request a new one");
  }

  if ((verification.attempt_count || 0) >= 5) {
    await deleteEmailVerificationsByUserId(user.id);
    throw new HttpError(429, "Too many invalid OTP attempts. Please request a new code");
  }

  if (isOTPExpired(verification.expiry_time)) {
    await deleteEmailVerificationsByUserId(user.id);
    throw new HttpError(400, "OTP has expired. Please request a new one");
  }

  if (verification.otp !== otp) {
    const updatedVerification = await incrementEmailVerificationAttempts(verification.id);
    if ((updatedVerification?.attempt_count || 0) >= 5) {
      await deleteEmailVerificationsByUserId(user.id);
      throw new HttpError(429, "Too many invalid OTP attempts. Please request a new code");
    }
    throw new HttpError(400, "Invalid OTP");
  }

  // Mark email as verified
  await updateUserEmailVerificationStatus(user.id);
  await deleteEmailVerificationsByUserId(user.id);

  res.json({ success: true, message: "Email verified successfully" });
});

// ========== FORGOT PASSWORD ==========

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await getUserByEmail(email);
  if (!user) {
    // Don't reveal if email exists or not for security
    res.json({ success: true, message: "If email exists, reset link will be sent" });
    return;
  }

  // Generate password reset token
  const token = generatePasswordResetToken(user.id, user.email);
  const expiryTime = getPasswordResetExpiryTime();

  // Delete any existing unused reset tokens
  await deletePasswordResetsByUserId(user.id);

  // Store reset token in database
  await createPasswordReset({
    userId: user.id,
    token,
    expiryTime
  });

  // Generate reset link (frontend will handle navigation)
  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;

  // Send reset email
  try {
    await sendPasswordResetEmail(email, resetLink);
  } catch (error) {
    console.error("[auth/forgot-password] email delivery failed:", error.message);
  }

  res.json({ success: true, message: "If email exists, reset link will be sent" });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // Verify JWT token
  const payload = verifyPasswordResetToken(token);
  if (!payload) {
    throw new HttpError(400, "Invalid or expired reset token");
  }

  // Get reset record from database
  const resetRecord = await getPasswordResetByToken(token);
  if (!resetRecord) {
    throw new HttpError(400, "Reset token not found");
  }

  if (resetRecord.is_used) {
    throw new HttpError(400, "This reset token has already been used");
  }

  if (isPasswordResetExpired(resetRecord.expiry_time)) {
    throw new HttpError(400, "Reset token has expired");
  }

  // Get user
  const user = await getUserById(payload.userId);
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  // Update password
  const newPasswordHash = await hashPassword(newPassword);
  await updateUserPassword(user.id, newPasswordHash);

  // Mark reset token as used
  await markPasswordResetAsUsed(resetRecord.id);

  // Invalidate all active sessions
  await deleteRefreshTokensByUserId(user.id);

  res.json({ success: true, message: "Password reset successfully. Please login with your new password" });
});

// ========== GOOGLE LOGIN ==========

export const googleAuth = asyncHandler(async (req, res) => {
  // Passport handles authentication
  res.redirect("/api/auth/google/callback");
});

export const googleAuthCallback = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new HttpError(401, "Google authentication failed");
  }

  // Generate tokens
  const tokens = await issueAuthTokens({
    userId: user.id,
    role: user.role,
    revokeExisting: true
  });

  setAuthCookies(res, tokens);

  // Redirect to frontend with tokens
  const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(
    `${frontendURL}/auth/callback?token=${tokens.token}&refreshToken=${tokens.refreshToken}`
  );
});
