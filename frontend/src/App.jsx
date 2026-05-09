import { lazy, Suspense, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/auth/AuthPage";
import AuthCallback from "./pages/auth/AuthCallback";
import Register from "./pages/auth/Register";
import VerifyOTP from "./pages/auth/VerifyOTP";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AppShell from "./components/layout/AppShell";

const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const RecruiterDashboard = lazy(() => import("./pages/recruiter/RecruiterDashboard"));
const FacultyDashboard = lazy(() => import("./pages/faculty/FacultyDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

const headers = {
  student: {
    title: "Student Opportunity Workspace",
    description: "Maintain a strong profile, review AI-ranked openings, apply quickly, and track your journey from NOC approval to final offer."
  },
  recruiter: {
    title: "Recruitment Operations Hub",
    description: "Publish hiring opportunities, shortlist candidates from a structured funnel, and move interviews and final decisions in one place."
  },
  faculty: {
    title: "Faculty Approval Desk",
    description: "Review NOC requests, clear or reject student applications, and monitor mentorship responsibilities."
  },
  tpo: {
    title: "Placement Command Center",
    description: "Operate verified openings, monitor institutional placement analytics, and manage portal access across roles."
  }
};

function DashboardRouter() {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState("dashboard");

  const role = user?.role;
  const currentHeader = useMemo(() => headers[role] || headers.student, [role]);

  const content = {
    student: <StudentDashboard view={activeView} />,
    recruiter: <RecruiterDashboard view={activeView} />,
    faculty: <FacultyDashboard view={activeView} />,
    tpo: <AdminDashboard view={activeView} />
  }[role];

  return (
    <AppShell
      role={role}
      activeView={activeView}
      onChange={setActiveView}
      onLogout={logout}
      header={currentHeader}
    >
      <Suspense fallback={<div className="card p-5 text-slate-500">Loading dashboard...</div>}>
        {content}
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  const { user, loading, sessionNotice, setSessionNotice } = useAuth();
  const token = localStorage.getItem("portal_token");

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading portal...</div>;
  }

  return (
    <>
      {sessionNotice && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-amber-900">{sessionNotice}</p>
            <button
              type="button"
              onClick={() => setSessionNotice("")}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage initialMode="login" />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/" element={token ? <DashboardRouter /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
      </Routes>
    </>
  );
}
