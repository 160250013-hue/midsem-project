import { body } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import { scheduleInterview, listInterviewsByUser } from "../models/interviewModel.js";
import { getApplicationById, updateApplicationStatus } from "../models/applicationModel.js";
import { HttpError } from "../utils/httpError.js";
import { APPLICATION_STATUS } from "../utils/constants.js";

export const interviewValidation = [
  body("applicationId").isUUID().withMessage("Valid applicationId is required"),
  body("interviewDate").isISO8601().withMessage("Valid interview date is required"),
  body("mode").trim().notEmpty().withMessage("Interview mode is required")
];

export const createInterview = asyncHandler(async (req, res) => {
  const application = await getApplicationById(req.body.applicationId);
  if (!application) {
    throw new HttpError(404, "Application not found");
  }

  await updateApplicationStatus(application.id, APPLICATION_STATUS.INTERVIEW_SCHEDULED);
  const interview = await scheduleInterview({
    applicationId: req.body.applicationId,
    recruiterId: req.user.id,
    interviewDate: req.body.interviewDate,
    mode: req.body.mode,
    status: "scheduled"
  });

  res.status(201).json({ success: true, data: interview });
});

export const listInterviews = asyncHandler(async (req, res) => {
  const interviews = await listInterviewsByUser({ userId: req.user.id, role: req.user.role });
  res.json({ success: true, data: interviews });
});
