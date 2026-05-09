import { HttpError } from "../utils/httpError.js";
import { normalizeRole } from "../utils/constants.js";

export const authorizeRoles = (...roles) => {
  const allowedRoles = new Set(roles.map((role) => normalizeRole(role)));

  return (req, _res, next) => {
    if (!req.user) {
      return next(new HttpError(401, "Authentication is required"));
    }

    const userRole = normalizeRole(req.user.role);
    if (!allowedRoles.has(userRole)) {
      return next(new HttpError(403, "Insufficient permissions"));
    }

    next();
  };
};

// Backward-compatible alias for existing route imports.
export const authorize = authorizeRoles;
