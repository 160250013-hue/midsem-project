export const ROLES = {
  STUDENT: "student",
  RECRUITER: "recruiter",
  FACULTY: "faculty",
  ADMIN: "admin",
  // Backward-compatible alias used by existing route/controller code.
  TPO: "admin"
};

export const ALLOWED_REGISTRATION_ROLES = [
  ROLES.STUDENT,
  ROLES.RECRUITER,
  ROLES.FACULTY,
  ROLES.ADMIN
];

export const normalizeRole = (role) => (role === "tpo" ? ROLES.ADMIN : role);

export const APPLICATION_STATUS = {
  DRAFT: "draft",
  PENDING_FACULTY: "pending_faculty",
  FACULTY_REJECTED: "faculty_rejected",
  SUBMITTED: "submitted",
  SHORTLISTED: "shortlisted",
  INTERVIEW_SCHEDULED: "interview_scheduled",
  SELECTED: "selected",
  REJECTED: "rejected",
  OFFER_RELEASED: "offer_released"
};

export const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected"
};
