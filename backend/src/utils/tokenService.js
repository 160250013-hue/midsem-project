import crypto from "crypto";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const assertSecret = (secretName, secretValue) => {
  if (!secretValue) {
    throw new Error(`${secretName} is not configured`);
  }
};

const signToken = (payload, secret, expiresIn) => {
  assertSecret("JWT secret", secret);

  return jwt.sign(payload, secret, { expiresIn });
};

export const generateAccessToken = ({ id, role }) =>
  signToken({ id, role, tokenType: "access" }, getAccessSecret(), ACCESS_TOKEN_EXPIRES_IN);

export const generateRefreshToken = ({ id, role }) =>
  signToken({ id, role, tokenType: "refresh" }, getRefreshSecret(), REFRESH_TOKEN_EXPIRES_IN);

const verifyToken = (token, secret, tokenType) => {
  assertSecret("JWT secret", secret);

  const payload = jwt.verify(token, secret);
  if (payload.tokenType !== tokenType) {
    throw new Error("Invalid token type");
  }

  return payload;
};

export const verifyAccessToken = (token) => verifyToken(token, getAccessSecret(), "access");

export const verifyRefreshToken = (token) => verifyToken(token, getRefreshSecret(), "refresh");

export const getTokenExpiryDate = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) {
    throw new Error("Token does not have an expiry");
  }

  return new Date(decoded.exp * 1000);
};

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
