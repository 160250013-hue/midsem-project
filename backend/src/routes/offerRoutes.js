import { Router } from "express";
import { getMyOffers, issueOffer, offerValidation } from "../controllers/offerController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.get("/my", authenticateUser, authorizeRoles(ROLES.STUDENT), getMyOffers);
router.post(
	"/",
	authenticateUser,
	authorizeRoles(ROLES.RECRUITER, ROLES.TPO),
	offerValidation,
	validate,
	issueOffer
);

export default router;
