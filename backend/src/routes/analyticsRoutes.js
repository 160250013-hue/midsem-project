import { Router } from "express";
import { 
	getAdvancedAnalytics, 
	getOverview,
	getMatchScoreAnalysis,
	getCGPAPlacementCorrelation,
	getSkillAnalysis
} from "../controllers/analyticsController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.get("/overview", authenticateUser, authorizeRoles(ROLES.TPO), getOverview);
router.get("/advanced", authenticateUser, authorizeRoles(ROLES.TPO), getAdvancedAnalytics);
router.get("/match-score", authenticateUser, authorizeRoles(ROLES.TPO, ROLES.FACULTY), getMatchScoreAnalysis);
router.get("/cgpa-placement", authenticateUser, authorizeRoles(ROLES.TPO, ROLES.FACULTY), getCGPAPlacementCorrelation);
router.get("/skills", authenticateUser, authorizeRoles(ROLES.TPO, ROLES.FACULTY), getSkillAnalysis);

export default router;
