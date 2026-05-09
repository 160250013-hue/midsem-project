import { Router } from "express";
import {
	createJobHandler,
	createJobValidation,
	getCandidatesForJob,
	getJobHandler,
	getMatchedJobsForStudent,
	listJobsHandler
} from "../controllers/jobController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.get("/", authenticateUser, listJobsHandler);
router.get(
	"/match/:studentId",
	authenticateUser,
	authorizeRoles(ROLES.STUDENT, ROLES.RECRUITER, ROLES.FACULTY, ROLES.TPO),
	getMatchedJobsForStudent
);
router.get("/:id", authenticateUser, getJobHandler);
router.get(
	"/:id/candidates",
	authenticateUser,
	authorizeRoles(ROLES.RECRUITER, ROLES.TPO),
	getCandidatesForJob
);
router.post(
	"/",
	authenticateUser,
	authorizeRoles(ROLES.RECRUITER, ROLES.TPO),
	createJobValidation,
	validate,
	createJobHandler
);

export default router;
