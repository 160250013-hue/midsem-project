import { pool } from "../config/db.js";
import { hashPassword } from "../utils/hashService.js";

const seed = async () => {
  const passwordHash = await hashPassword("Password123");

  await pool.query("DELETE FROM offers");
  await pool.query("DELETE FROM interviews");
  await pool.query("DELETE FROM approvals");
  await pool.query("DELETE FROM applications");
  await pool.query("DELETE FROM jobs");
  await pool.query("DELETE FROM students");
  await pool.query("DELETE FROM password_resets");
  await pool.query("DELETE FROM email_verifications");
  await pool.query("DELETE FROM refresh_tokens");
  await pool.query("DELETE FROM users");

  const users = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, phone, email_verified, is_verified)
     VALUES
      ('Aarav Student', 'student@campus.edu', $1, 'student', '9999999991', TRUE, TRUE),
      ('Riya Recruiter', 'recruiter@company.com', $1, 'recruiter', '9999999992', TRUE, TRUE),
      ('Dr. Mehta', 'faculty@campus.edu', $1, 'faculty', '9999999993', TRUE, TRUE),
      ('Placement Admin', 'admin@campus.edu', $1, 'admin', '9999999994', TRUE, TRUE)
     RETURNING id, role`,
    [passwordHash]
  );

  const ids = Object.fromEntries(users.rows.map((row) => [row.role, row.id]));

  await pool.query(
    `INSERT INTO students (user_id, department, cgpa, skills, resume_url, projects, preferences, graduation_year, faculty_mentor_id)
     VALUES ($1, 'Computer Science', 8.70, ARRAY['react', 'node.js', 'postgresql', 'tailwind css'],
             'https://example.com/resume.pdf',
             '[{"title":"Placement Tracker","tech":["React","Node.js"]}]'::jsonb,
             '{"roles":["frontend","full stack"],"locations":["bangalore","hybrid"]}'::jsonb,
             2026,
             $2)`,
    [ids.student, ids.faculty]
  );

  await pool.query(
    `INSERT INTO jobs (title, company, description, requirements, min_cgpa, location, employment_type, posted_by, verified, deadline, preferences)
     VALUES
      ('Frontend Intern', 'Acme Labs', 'React internship for campus hires', ARRAY['react', 'javascript', 'tailwind css'], 7.5, 'Bangalore', 'internship', $1, TRUE, CURRENT_DATE + INTERVAL '15 days', '{"department":"cs"}'::jsonb),
      ('Full Stack Engineer', 'Nova Systems', 'Placement role for MERN developers', ARRAY['react', 'node.js', 'postgresql'], 8.0, 'Hybrid', 'full-time', $2, TRUE, CURRENT_DATE + INTERVAL '20 days', '{"department":"cs"}'::jsonb)`,
    [ids.recruiter, ids.admin]
  );

  console.log("Database seeded. Default password: Password123");
  await pool.end();
};

seed().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
