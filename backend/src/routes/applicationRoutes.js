import { Router } from "express";
import { applyToJob, applyValidation, listMyApplications, statusValidation, updateStatus } from "../controllers/applicationController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.post(
	"/",
	authenticateUser,
	authorizeRoles(ROLES.STUDENT),
	applyValidation,
	validate,
	applyToJob
);
router.get("/my", authenticateUser, authorizeRoles(ROLES.STUDENT), listMyApplications);
router.patch(
	"/:id/status",
	authenticateUser,
	authorizeRoles(ROLES.RECRUITER, ROLES.TPO),
	statusValidation,
	validate,
	updateStatus
);

export default router;
