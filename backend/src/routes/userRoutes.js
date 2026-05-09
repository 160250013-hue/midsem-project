import { Router } from "express";
import { getUsers, toggleUserStatus, userStatusValidation } from "../controllers/userController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { ROLES } from "../utils/constants.js";

const router = Router();

router.use(authenticateUser, authorizeRoles(ROLES.TPO));
router.get("/", getUsers);
router.patch("/:id/status", userStatusValidation, validate, toggleUserStatus);

export default router;
