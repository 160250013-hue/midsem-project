import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { getUserById } from "../models/userModel.js";
import { normalizeRole } from "../utils/constants.js";
import { verifyAccessToken } from "../utils/tokenService.js";

export const authenticateUser = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Authorization token is required");
  }

  const token = authHeader.split(" ")[1];
  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }

  const user = await getUserById(payload.id);
  if (!user || !user.is_active) {
    throw new HttpError(401, "User account is unavailable");
  }

  req.user = {
    ...user,
    role: normalizeRole(user.role)
  };
  next();
});

// Backward-compatible alias for existing middleware usage.
export const protect = authenticateUser;
