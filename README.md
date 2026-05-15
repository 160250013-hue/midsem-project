# Campus-Centric Internship & Placement Opportunity Portal

Production-oriented full-stack web application for centralized campus internships and placements with RBAC, matching, workflow tracking, analytics, and faculty approval.

## Stack

- Frontend: React + Tailwind CSS + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: JWT + RBAC

## Key Capabilities

- Student profile management with skills, CGPA, preferences, resume, and projects
- Weighted AI matching based on skills (50%), CGPA (20%), experience (20%), and preferences (10%)
- Opportunity posting for recruiters and TPO with verified job flow
- NOC approval workflow for faculty mentors
- Application, interview, selection, and offer lifecycle tracking
- Placement analytics dashboard for the placement cell
- Masked candidate data before shortlist
- OTP email verification and Google OAuth sign-in
- Forgot/reset password with 15-minute expiry token
- Resume PDF upload and automatic skill extraction
- Email notifications for OTP, password reset, and application status updates

## Project Structure

```text
backend/
  src/
    controllers/
    middleware/
    models/
    routes/
    services/
    db/
frontend/
  src/
    components/
    context/
    pages/
    services/
postman/
```

## Setup

1. Copy env templates.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Start PostgreSQL locally or with Docker Compose.

3. Install dependencies.

```bash
cd backend && npm install
cd ../frontend && npm install
```

4. Initialize schema and seed sample data.

```bash
cd backend
npm run db:init
npm run db:seed
```

5. Start the apps.

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

## Default Seed Accounts

- Student: `student@campus.edu` / `Password123`
- Recruiter: `recruiter@company.com` / `Password123`
- Faculty: `faculty@campus.edu` / `Password123`
- TPO: `tpo@campus.edu` / `Password123`

## Core Workflow

1. TPO or recruiter posts an opportunity.
2. Student completes profile and assigns a faculty mentor.
3. System ranks jobs by weighted matching.
4. Student applies.
5. Faculty mentor approves or rejects NOC.
6. Recruiter shortlists and schedules interview.
7. Recruiter or TPO marks final outcome.
8. Offer letter and certificate are released.

## Matching Logic

Weighted score out of 100.

- Skill overlap: 50
- CGPA fit: 20
- Experience fit: 20
- Preference alignment: 10

Implemented in [matchingService.js](/d:/new%20download/ggimidsem/backend/src/services/matchingService.js).

## API Notes

- All protected endpoints require `Authorization: Bearer <token>`
- Refresh token is also issued as an HttpOnly cookie
- Postman collection is available at [Campus-Portal.postman_collection.json](/d:/new%20download/ggimidsem/postman/Campus-Portal.postman_collection.json)
- Schema file is at [schema.sql](/d:/new%20download/ggimidsem/backend/src/db/schema.sql)

### New/Upgraded Endpoints

- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `POST /api/students/upload-resume`
- `POST /api/student/upload-resume`
- `GET /api/jobs/match/:studentId`
- `GET /api/analytics/advanced`

## Deployment

- `docker-compose.yml` provisions PostgreSQL, backend, and frontend containers
- Backend includes a production Dockerfile
- Frontend is Vite-based and can be deployed as a static build behind Nginx or any CDN

### Cloud Deployment (Recommended)

1. Backend on Render or Railway:
Set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, and `GOOGLE_*`.

2. Frontend on Vercel:
Set `VITE_API_URL` to backend API URL.

3. Database on Supabase or Railway Postgres:
Run `npm run db:init` and `node src/db/migrate.js` in backend.

4. CORS and cookies:
Set backend `FRONTEND_URL` to deployed frontend domain.

5. Health check:
Use `/api/health` for uptime probes.
