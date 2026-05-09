import { body } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listUsers, updateUserStatus } from "../models/userModel.js";
import { HttpError } from "../utils/httpError.js";

export const userStatusValidation = [
  body("isActive").isBoolean().withMessage("isActive must be boolean")
];

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await listUsers();
  res.json({ success: true, data: users });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await updateUserStatus(req.params.id, req.body.isActive);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  res.json({ success: true, data: user });
});
