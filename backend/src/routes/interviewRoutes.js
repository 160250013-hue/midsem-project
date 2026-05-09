import { Router } from "express";
import { createInterview, interviewValidation, listInterviews } from "../controllers/interviewController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.get(
	"/",
	authenticateUser,
	authorizeRoles(ROLES.STUDENT, ROLES.RECRUITER),
	listInterviews
);
router.post(
	"/",
	authenticateUser,
	authorizeRoles(ROLES.RECRUITER),
	interviewValidation,
	validate,
	createInterview
);

export default router;
