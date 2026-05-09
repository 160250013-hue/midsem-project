import { useEffect, useState } from "react";
import api from "../../services/api";
import SectionCard from "../../components/common/SectionCard";
import StatCard from "../../components/common/StatCard";

const initialJob = {
  title: "",
  company: "",
  description: "",
  requirements: "",
  minCgpa: 7,
  location: "",
  employmentType: "internship",
  deadline: ""
};

export default function RecruiterDashboard({ view }) {
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [jobForm, setJobForm] = useState(initialJob);
  const [selectedJob, setSelectedJob] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [interviewForm, setInterviewForm] = useState({ applicationId: "", interviewDate: "", mode: "virtual" });

  const loadData = async () => {
    const [jobsRes, interviewsRes] = await Promise.all([
      api.get("/jobs?mine=true"),
      api.get("/interviews")
    ]);
    setJobs(jobsRes.data.data || []);
    setInterviews(interviewsRes.data.data || []);
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
    setJobForm(initialJob);
    loadData();
  };

  const loadCandidates = async (jobId) => {
    setSelectedJob(jobId);
    const response = await api.get(`/jobs/${jobId}/candidates`);
    setCandidates(response.data.data || []);
  };

  const updateStatus = async (applicationId, status) => {
    await api.patch(`/applications/${applicationId}/status`, { status });
    if (selectedJob) loadCandidates(selectedJob);
    loadData();
  };

  const scheduleInterview = async (event) => {
    event.preventDefault();
    await api.post("/interviews", interviewForm);
    setInterviewForm({ applicationId: "", interviewDate: "", mode: "virtual" });
    loadData();
  };

  if (view === "interviews") {
    return (
      <div className="space-y-6">
        <SectionCard title="Schedule Interview">
          <form onSubmit={scheduleInterview} className="grid gap-4 md:grid-cols-3">
            <input className="input" placeholder="Application ID" value={interviewForm.applicationId} onChange={(e) => setInterviewForm({ ...interviewForm, applicationId: e.target.value })} />
            <input className="input" type="datetime-local" value={interviewForm.interviewDate} onChange={(e) => setInterviewForm({ ...interviewForm, interviewDate: e.target.value })} />
            <input className="input" placeholder="Mode" value={interviewForm.mode} onChange={(e) => setInterviewForm({ ...interviewForm, mode: e.target.value })} />
            <button className="button-primary md:col-span-3" type="submit">Schedule</button>
          </form>
        </SectionCard>

        <SectionCard title="Upcoming Interviews">
          <div className="space-y-3">
            {interviews.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <h4 className="font-semibold text-slate-900">{item.title} • {item.company}</h4>
                <p className="text-sm text-slate-500">{item.student_name} • {new Date(item.interview_date).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  }

  if (view === "jobs") {
    return (
      <div className="space-y-6">
        <SectionCard title="Post Opportunity">
          <form onSubmit={createJob} className="grid gap-4 md:grid-cols-2">
            <input className="input" placeholder="Job title" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} />
            <input className="input" placeholder="Company" value={jobForm.company} onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })} />
            <textarea className="input md:col-span-2" placeholder="Description" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} />
            <input className="input" placeholder="Required skills" value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} />
            <input className="input" placeholder="Minimum CGPA" value={jobForm.minCgpa} onChange={(e) => setJobForm({ ...jobForm, minCgpa: e.target.value })} />
            <input className="input" placeholder="Location" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} />
            <input className="input" placeholder="Type" value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })} />
            <input className="input md:col-span-2" type="date" value={jobForm.deadline} onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })} />
            <button className="button-primary md:col-span-2" type="submit">Post Job</button>
          </form>
        </SectionCard>

        <SectionCard title="Jobs & Candidates">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-3">
              {jobs.map((job) => (
                <button key={job.id} type="button" className={`w-full rounded-2xl border p-4 text-left ${selectedJob === job.id ? "border-brand-500 bg-brand-50" : "border-slate-200"}`} onClick={() => loadCandidates(job.id)}>
                  <h4 className="font-semibold text-slate-900">{job.title}</h4>
                  <p className="text-sm text-slate-500">{job.company}</p>
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <div key={candidate.applicationId} className="rounded-2xl border border-slate-200 p-4">
                  <h4 className="font-semibold text-slate-900">{candidate.student.fullName}</h4>
                  <p className="text-sm text-slate-500">{candidate.student.email}</p>
                  <p className="mt-2 text-sm text-slate-600">CGPA {candidate.student.cgpa} • Match {candidate.matchScore}%</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="button-primary" onClick={() => updateStatus(candidate.applicationId, "shortlisted")}>Shortlist</button>
                    <button type="button" className="button-secondary" onClick={() => updateStatus(candidate.applicationId, "rejected")}>Reject</button>
                    <button type="button" className="button-secondary" onClick={() => updateStatus(candidate.applicationId, "selected")}>Select</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard title="Posted Jobs" value={jobs.length} subtitle="Your current openings" />
      <StatCard title="Interviews" value={interviews.length} subtitle="Scheduled candidate rounds" />
      <StatCard title="Pipeline" value={jobs.reduce((count, job) => count + (job.verified ? 1 : 0), 0)} subtitle="Verified openings live on campus" />
    </div>
  );
}
