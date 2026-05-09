import { Briefcase, ClipboardList, GraduationCap, LayoutDashboard } from "lucide-react";

export const roleLabels = {
  student: "Student",
  recruiter: "Recruiter",
  faculty: "Faculty Mentor",
  tpo: "Placement Cell"
};

export const navByRole = {
  student: [
    { label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
    { label: "Profile", icon: GraduationCap, key: "profile" },
    { label: "Applications", icon: ClipboardList, key: "applications" },
    { label: "Offers", icon: Briefcase, key: "offers" }
  ],
  recruiter: [
    { label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
    { label: "Jobs", icon: Briefcase, key: "jobs" },
    { label: "Interviews", icon: ClipboardList, key: "interviews" }
  ],
  faculty: [
    { label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
    { label: "Approvals", icon: ClipboardList, key: "approvals" }
  ],
  tpo: [
    { label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
    { label: "Jobs", icon: Briefcase, key: "jobs" },
    { label: "Users", icon: GraduationCap, key: "users" }
  ]
};
