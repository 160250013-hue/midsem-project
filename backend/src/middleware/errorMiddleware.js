export const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, req, res, _next) => {
  const isProduction = process.env.NODE_ENV === "production";
  const isDatabaseUnavailable =
    error.code === "ECONNREFUSED" ||
    error.code === "ENOTFOUND" ||
    error.name === "AggregateError";

  console.error(`[${req.method} ${req.originalUrl}]`, error.message);

  let statusCode = error.statusCode || (isDatabaseUnavailable ? 503 : 500);
  let message =
    error.message ||
    (isDatabaseUnavailable
      ? "Database unavailable. Start PostgreSQL on localhost:5432 and initialize the campus_portal database."
      : "Internal server error");

  if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  if (error.code === "23505") {
    statusCode = 409;
    message = "A record with the same unique value already exists";
  }

  if (error.code === "23503") {
    statusCode = 400;
    message = "Operation violates a related data constraint";
  }

  if (error.message?.startsWith("Origin not allowed by CORS")) {
    statusCode = 403;
  }

  const payload = {
    success: false,
    message
  };

  if (!isProduction && error.stack) {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};
