import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import passport from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import matchingRoutes from "./routes/matchingRoutes.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.disable("x-powered-by");
const defaultFrontendOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173"
];
const configuredFrontendOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultFrontendOrigins, ...configuredFrontendOrigins])];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true
  })
);
app.use(
  helmet({
    // Keep COEP relaxed for local development toolchains like Vite.
    crossOriginEmbedderPolicy: false
  })
);
app.use((_req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
  })
);
app.use(morgan("dev"));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Initialize Passport
app.use(passport.initialize());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Campus portal API is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/matching", matchingRoutes);

// Serve frontend static files (React SPA)
const frontendBuildPath = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(frontendBuildPath));

// SPA fallback - serve index.html for all non-API routes
app.get("*", (_req, res) => {
  const indexPath = path.join(frontendBuildPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).json({ error: "Could not load application" });
    }
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
