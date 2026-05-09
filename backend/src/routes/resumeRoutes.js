/**
 * Resume Routes
 * API endpoints for resume upload, parsing, and analysis
 */

import { Router } from "express";
import multer from "multer";
import path from "path";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { ROLES } from "../utils/constants.js";
import {
  uploadResume,
  getResumeAnalysis,
  getSkillRecommendationsController,
  deleteResume
} from "../controllers/resumeController.js";

const router = Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads/resumes"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Routes
router.post(
  "/upload",
  authenticateUser,
  authorizeRoles(ROLES.STUDENT),
  upload.single("resume"),
  uploadResume
);

router.get(
  "/analysis",
  authenticateUser,
  authorizeRoles(ROLES.STUDENT),
  getResumeAnalysis
);

router.get(
  "/recommendations",
  authenticateUser,
  authorizeRoles(ROLES.STUDENT),
  getSkillRecommendationsController
);

router.delete(
  "/",
  authenticateUser,
  authorizeRoles(ROLES.STUDENT),
  deleteResume
);

export default router;
