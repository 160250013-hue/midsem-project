import { body } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { listPendingApprovals, updateApproval } from "../models/approvalModel.js";
import {
  getApplicationById,
  getApplicationNotificationDetails,
  updateApplicationStatus
} from "../models/applicationModel.js";
import { APPLICATION_STATUS, APPROVAL_STATUS } from "../utils/constants.js";
import { sendApplicationStatusUpdateEmail } from "../utils/emailService.js";

export const approvalValidation = [
  body("decision").isIn([APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED]).withMessage("Decision must be approved or rejected"),
  body("remarks").optional().isString()
];

export const getPendingApprovals = asyncHandler(async (req, res) => {
  const approvals = await listPendingApprovals(req.user.id);
  res.json({ success: true, data: approvals });
});

export const decideApproval = asyncHandler(async (req, res) => {
  const approval = await updateApproval({
    id: req.params.id,
    decision: req.body.decision,
    remarks: req.body.remarks
  });

  if (!approval) {
    throw new HttpError(404, "Approval not found");
  }

  const application = await getApplicationById(approval.application_id);
  if (!application) {
    throw new HttpError(404, "Application not found");
  }

  const status =
    req.body.decision === APPROVAL_STATUS.APPROVED
      ? APPLICATION_STATUS.SUBMITTED
      : APPLICATION_STATUS.FACULTY_REJECTED;

  const updatedApplication = await updateApplicationStatus(application.id, status);

  const notification = await getApplicationNotificationDetails(application.id);
  if (notification?.email) {
    await sendApplicationStatusUpdateEmail({
      email: notification.email,
      studentName: notification.student_name,
      company: notification.company,
      jobTitle: notification.job_title,
      status: updatedApplication.status
    });
  }

  res.json({ success: true, data: approval });
});
