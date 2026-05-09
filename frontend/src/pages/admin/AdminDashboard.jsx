import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api from "../../services/api";
import PipelineChart from "../../components/dashboard/PipelineChart";
import SectionCard from "../../components/common/SectionCard";
import StatCard from "../../components/common/StatCard";

export default function AdminDashboard({ view }) {
  const [overview, setOverview] = useState(null);
  const [advanced, setAdvanced] = useState({
    applicationsOverTime: [],
    topRecruiters: [],
    skillsDemand: [],
    placementByMonth: []
  });
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    description: "",
    requirements: "",
    minCgpa: 7,
    location: "",
    employmentType: "internship",
    deadline: ""
  });

  const loadData = async () => {
    const [overviewRes, advancedRes, jobsRes, usersRes] = await Promise.all([
      api.get("/analytics/overview"),
      api.get("/analytics/advanced"),
      api.get("/jobs"),
      api.get("/users")
    ]);
    setOverview(overviewRes.data.data);
    setAdvanced(advancedRes.data.data || {});
    setJobs(jobsRes.data.data || []);
    setUsers(usersRes.data.data || []);
  };

  useEffect(() => {
    loadData();
  }, [view]);

  const createJob = async (event) => {
    event.preventDefault();
    await api.post("/jobs", {
      ...jobForm,
      requirements: jobForm.requirements.split(",").map((item) => item.trim()).filter(Boolean),
      minCgpa: Number(jobForm.minCgpa)
    });
    setJobForm({
      title: "",
      company: "",
      description: "",
      requirements: "",
      minCgpa: 7,
      location: "",
      employmentType: "internship",
      deadline: ""
    });
    loadData();
  };

  const toggleStatus = async (userId, isActive) => {
    await api.patch(`/users/${userId}/status`, { isActive: !isActive });
    loadData();
  };

  if (view === "jobs") {
    return (
      <div className="space-y-6">
        <SectionCard title="Post Verified Opportunity">
          <form onSubmit={createJob} className="grid gap-4 md:grid-cols-2">
            <input className="input" placeholder="Job title" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} />
            <input className="input" placeholder="Company" value={jobForm.company} onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })} />
            <textarea className="input md:col-span-2" placeholder="Description" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} />
            <input className="input" placeholder="Required skills" value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} />
            <input className="input" placeholder="Minimum CGPA" value={jobForm.minCgpa} onChange={(e) => setJobForm({ ...jobForm, minCgpa: e.target.value })} />
            <input className="input" placeholder="Location" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} />
            <input className="input" placeholder="Type" value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })} />
            <input className="input md:col-span-2" type="date" value={jobForm.deadline} onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })} />
            <button className="button-primary md:col-span-2" type="submit">Post Verified Job</button>
          </form>
        </SectionCard>

        <SectionCard title="Active Verified Jobs">
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-200 p-4">
                <h4 className="font-semibold text-slate-900">{job.title}</h4>
                <p className="text-sm text-slate-500">{job.company} � {job.location} � {job.verified ? "Verified" : "Pending verification"}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  }

  if (view === "users") {
    return (
      <SectionCard title="User Management">
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
              <div>
                <h4 className="font-semibold text-slate-900">{user.full_name}</h4>
                <p className="text-sm text-slate-500">{user.email} � {user.role}</p>
              </div>
              <button type="button" className="button-secondary" onClick={() => toggleStatus(user.id, user.is_active)}>
                {user.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Applications" value={overview?.total_applications || 0} subtitle="All student submissions" />
        <StatCard title="Selected" value={overview?.selected_students || 0} subtitle="Selected or offer released" />
        <StatCard title="Placement %" value={overview?.placement_percentage || 0} subtitle="Selection rate against students" />
        <StatCard title="Active Jobs" value={overview?.active_jobs || 0} subtitle="Verified campus opportunities" />
      </div>
      <PipelineChart data={overview?.pipeline || []} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Applications Over Time">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={advanced.applicationsOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke="#0f766e" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Placement Trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advanced.placementByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="placed" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Top Recruiters">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={advanced.topRecruiters || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="company" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="hires" fill="#0b5f59" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Skills Demand Graph">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={advanced.skillsDemand || []}
                  dataKey="demand"
                  nameKey="skill"
                  outerRadius={110}
                  fill="#0f766e"
                  label
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
