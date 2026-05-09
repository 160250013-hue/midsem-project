import { body } from "express-validator";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import {
  createApplication,
  getApplicationById,
  getApplicationNotificationDetails,
  getApplicationByStudentAndJob,
  listApplicationsForStudent,
  updateApplicationStatus
} from "../models/applicationModel.js";
import { createApproval, getApprovalByApplicationId } from "../models/approvalModel.js";
import { getJobById } from "../models/jobModel.js";
import { getStudentProfileByUserId } from "../models/studentModel.js";
import { calculateMatchScore } from "../services/matchingService.js";
import { APPLICATION_STATUS, APPROVAL_STATUS, ROLES } from "../utils/constants.js";
import { sendApplicationStatusUpdateEmail } from "../utils/emailService.js";

export const applyValidation = [
  body("jobId").isUUID().withMessage("Valid jobId is required")
];

export const statusValidation = [
  body("status").isIn([
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.INTERVIEW_SCHEDULED,
    APPLICATION_STATUS.SELECTED,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.OFFER_RELEASED
  ]).withMessage("Invalid application status transition")
];

export const applyToJob = asyncHandler(async (req, res) => {
  const { jobId } = req.body;
  const existingApplication = await getApplicationByStudentAndJob(req.user.id, jobId);
  if (existingApplication) {
    throw new HttpError(409, "You have already applied to this job");
  }

  const profile = await getStudentProfileByUserId(req.user.id);
  if (!profile) {
    throw new HttpError(400, "Complete your profile before applying");
  }

  if (!profile.faculty_mentor_id) {
    throw new HttpError(400, "Assign a faculty mentor before submitting applications");
  }

  const job = await getJobById(jobId);
  if (!job || !job.verified) {
    throw new HttpError(404, "Verified job not found");
  }

  const application = await createApplication({
    studentId: req.user.id,
    jobId,
    status: APPLICATION_STATUS.PENDING_FACULTY,
    matchScore: calculateMatchScore(profile, job)
  });

  await createApproval({
    applicationId: application.id,
    facultyId: profile.faculty_mentor_id,
    decision: APPROVAL_STATUS.PENDING,
    remarks: ""
  });

  res.status(201).json({ success: true, data: application });
});

export const listMyApplications = asyncHandler(async (req, res) => {
  const applications = await listApplicationsForStudent(req.user.id);
  res.json({ success: true, data: applications });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const application = await getApplicationById(req.params.id);
  if (!application) {
    throw new HttpError(404, "Application not found");
  }

  const job = await getJobById(application.job_id);
  if (!job) {
    throw new HttpError(404, "Associated job not found");
  }

  if (req.user.role === ROLES.RECRUITER && job.posted_by !== req.user.id) {
    throw new HttpError(403, "You can only update applications for your jobs");
  }

  const updated = await updateApplicationStatus(req.params.id, req.body.status);
  const approval = await getApprovalByApplicationId(req.params.id);

  const notification = await getApplicationNotificationDetails(req.params.id);
  if (notification?.email) {
    await sendApplicationStatusUpdateEmail({
      email: notification.email,
      studentName: notification.student_name,
      company: notification.company,
      jobTitle: notification.job_title,
      status: updated.status
    });
  }

  res.json({ success: true, data: { application: updated, approval } });
});
