import { query } from "../config/db.js";

export const upsertStudentProfile = async ({
  userId,
  department,
  cgpa,
  skills,
  resumeUrl,
  projects,
  preferences,
  graduationYear,
  facultyMentorId
}) => {
  const result = await query(
    `INSERT INTO students
      (user_id, department, cgpa, skills, resume_url, projects, preferences, graduation_year, faculty_mentor_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id) DO UPDATE SET
      department = EXCLUDED.department,
      cgpa = EXCLUDED.cgpa,
      skills = EXCLUDED.skills,
      resume_url = EXCLUDED.resume_url,
      projects = EXCLUDED.projects,
      preferences = EXCLUDED.preferences,
      graduation_year = EXCLUDED.graduation_year,
      faculty_mentor_id = EXCLUDED.faculty_mentor_id,
      updated_at = NOW()
     RETURNING *`,
    [
      userId,
      department,
      cgpa,
      skills,
      resumeUrl,
      JSON.stringify(projects || []),
      JSON.stringify(preferences || {}),
      graduationYear,
      facultyMentorId || null
    ]
  );
  return mapStudent(result.rows[0]);
};

export const getStudentProfileByUserId = async (userId) => {
  const result = await query(
    `SELECT s.*, u.full_name, u.email, u.phone
     FROM students s
     JOIN users u ON u.id = s.user_id
     WHERE s.user_id = $1`,
    [userId]
  );
  return result.rows[0] ? mapStudent(result.rows[0]) : null;
};

export const listStudentsForJob = async (jobId, revealSensitive) => {
  const result = await query(
    `SELECT a.id AS application_id, a.status, a.match_score, u.id AS user_id, u.full_name, u.email,
            s.department, s.cgpa, s.skills, s.resume_url, s.projects
     FROM applications a
     JOIN students s ON s.user_id = a.student_id
     JOIN users u ON u.id = s.user_id
     WHERE a.job_id = $1
     ORDER BY a.match_score DESC NULLS LAST, a.created_at ASC`,
    [jobId]
  );

  return result.rows.map((row) => ({
    applicationId: row.application_id,
    status: row.status,
    matchScore: row.match_score,
    student: {
      userId: row.user_id,
      fullName: revealSensitive || ["shortlisted", "interview_scheduled", "selected", "offer_released"].includes(row.status)
        ? row.full_name
        : maskValue(row.full_name),
      email: revealSensitive || ["shortlisted", "interview_scheduled", "selected", "offer_released"].includes(row.status)
        ? row.email
        : maskValue(row.email),
      department: row.department,
      cgpa: row.cgpa,
      skills: row.skills,
      resumeUrl: revealSensitive ? row.resume_url : null,
      projects: row.projects || []
    }
  }));
};

const maskValue = (value) => {
  if (!value) return value;
  if (value.includes("@")) {
    const [name, domain] = value.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return `${value.slice(0, 2)}***`;
};

const mapStudent = (row) => ({
  ...row,
  projects: row.projects || [],
  preferences: row.preferences || {},
  skills: row.skills || []
});
