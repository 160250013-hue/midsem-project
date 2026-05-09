import { Router } from "express";
import { approvalValidation, decideApproval, getPendingApprovals } from "../controllers/approvalController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.use(authenticateUser, authorizeRoles(ROLES.FACULTY));
router.get("/pending", getPendingApprovals);
router.patch("/:id", approvalValidation, validate, decideApproval);

export default router;
