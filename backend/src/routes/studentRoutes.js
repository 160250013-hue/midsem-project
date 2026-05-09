import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
	getMatches,
	getProfile,
	studentProfileValidation,
	uploadResume,
	upsertProfile
} from "../controllers/studentController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { ROLES } from "../utils/constants.js";

const router = Router();
const uploadDir = path.resolve(process.cwd(), "uploads/resumes");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, uploadDir),
	filename: (req, file, cb) => {
		const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
		cb(null, `${req.user?.id || "student"}-${Date.now()}-${safeName}`);
	}
});

const resumeUpload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (file.mimetype !== "application/pdf") {
			cb(new Error("Only PDF resumes are allowed"));
			return;
		}
		cb(null, true);
	}
});

router.use(authenticateUser, authorizeRoles(ROLES.STUDENT));
router.get("/profile", getProfile);
router.put("/profile", studentProfileValidation, validate, upsertProfile);
router.get("/matches", getMatches);
router.post("/upload-resume", resumeUpload.single("resume"), uploadResume);

export default router;
