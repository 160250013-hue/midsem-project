import { useEffect, useState } from "react";
import api from "../../services/api";
import StatCard from "../../components/common/StatCard";
import SectionCard from "../../components/common/SectionCard";

export default function StudentDashboard({ view }) {
  const [profile, setProfile] = useState({
    department: "",
    cgpa: "",
    skills: [],
    resume_url: "",
    projects: [],
    preferences: { roles: [], locations: [] },
    graduation_year: "",
    faculty_mentor_id: ""
  });
  const [matches, setMatches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [offers, setOffers] = useState([]);
  const [message, setMessage] = useState("");
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  const getApiErrorMessage = (error) =>
    error.response?.data?.message || error.response?.data?.error || error.message || "Something went wrong";

  const loadData = async () => {
    const [profileRes, matchesRes, appsRes, offersRes] = await Promise.all([
      api.get("/students/profile").catch(() => ({ data: { data: null } })),
      api.get("/students/matches").catch(() => ({ data: { data: [] } })),
      api.get("/applications/my").catch(() => ({ data: { data: [] } })),
      api.get("/offers/my").catch(() => ({ data: { data: [] } }))
    ]);

    if (profileRes.data.data) setProfile(profileRes.data.data);
    setMatches(matchesRes.data.data || []);
    setApplications(appsRes.data.data || []);
    setOffers(offersRes.data.data || []);
  };

  useEffect(() => {
    loadData();
  }, [view]);

  const saveProfile = async (event) => {
    event.preventDefault();
    await api.put("/students/profile", {
      ...profile,
      cgpa: Number(profile.cgpa),
      skills: Array.isArray(profile.skills) ? profile.skills : profile.skills.split(",").map((item) => item.trim()).filter(Boolean),
      projects: Array.isArray(profile.projects) ? profile.projects : [],
      preferences: {
        roles: Array.isArray(profile.preferences?.roles)
          ? profile.preferences.roles
          : (profile.preferences?.roles || "").split(",").map((item) => item.trim()).filter(Boolean),
        locations: Array.isArray(profile.preferences?.locations)
          ? profile.preferences.locations
          : (profile.preferences?.locations || "").split(",").map((item) => item.trim()).filter(Boolean)
      }
    });
    setMessage("Profile updated");
    loadData();
  };

  const apply = async (jobId) => {
    try {
      setApplyingJobId(jobId);
      setMessage("");
      await api.post("/applications", { jobId });
      setMessage("Application submitted for faculty approval");
      await loadData();
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setApplyingJobId(null);
    }
  };

  const uploadResume = async (event) => {
    event.preventDefault();
    if (!resumeFile) {
      setMessage("Select a PDF resume first");
      return;
    }

    const form = new FormData();
    form.append("resume", resumeFile);

    await api.post("/student/upload-resume", form, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    setMessage("Resume uploaded and skills parsed successfully");
    setResumeFile(null);
    loadData();
  };

  if (view === "profile") {
    return (
      <SectionCard title="Student Profile">
        <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
          <input className="input" placeholder="Department" value={profile.department || ""} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
          <input className="input" placeholder="CGPA" value={profile.cgpa || ""} onChange={(e) => setProfile({ ...profile, cgpa: e.target.value })} />
          <input className="input" placeholder="Skills (comma separated)" value={Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills || ""} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} />
          <input className="input" placeholder="Resume URL" value={profile.resume_url || ""} onChange={(e) => setProfile({ ...profile, resume_url: e.target.value })} />
          <input className="input" placeholder="Preferred roles" value={Array.isArray(profile.preferences?.roles) ? profile.preferences.roles.join(", ") : profile.preferences?.roles || ""} onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, roles: e.target.value } })} />
          <input className="input" placeholder="Preferred locations" value={Array.isArray(profile.preferences?.locations) ? profile.preferences.locations.join(", ") : profile.preferences?.locations || ""} onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, locations: e.target.value } })} />
          <button className="button-primary md:col-span-2" type="submit">Save Profile</button>
          {message && <p className="text-sm text-brand-600 md:col-span-2">{message}</p>}
        </form>

        <form onSubmit={uploadResume} className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className="input"
            type="file"
            accept="application/pdf"
            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
          />
          <button className="button-secondary" type="submit">Upload Resume PDF</button>
        </form>
      </SectionCard>
    );
  }

  if (view === "applications") {
    return (
      <SectionCard title="Application Tracker">
        <div className="space-y-3">
          {applications.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{item.title}</h4>
                  <p className="text-sm text-slate-500">{item.company} � {item.location}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase">{item.status.replaceAll("_", " ")}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  if (view === "offers") {
    return (
      <SectionCard title="Offers & Certificates">
        <div className="space-y-3">
          {offers.map((offer) => (
            <div key={offer.id} className="rounded-2xl border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-900">{offer.title} � {offer.company}</h4>
              <div className="mt-2 flex gap-3 text-sm">
                <a className="text-brand-600" href={offer.offer_letter_url} target="_blank" rel="noreferrer">Offer Letter</a>
                {offer.certificate_url && <a className="text-brand-600" href={offer.certificate_url} target="_blank" rel="noreferrer">Certificate</a>}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Applications" value={applications.length} subtitle="Total job applications" />
        <StatCard title="Matched Jobs" value={matches.length} subtitle="Ranked by skills and CGPA" />
        <StatCard title="Offers" value={offers.length} subtitle="Released after final selection" />
      </div>

      <SectionCard title="Recommended Opportunities">
        <div className="space-y-3">
          {matches.map((job) => (
            <div key={job.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{job.title}</h4>
                  <p className="text-sm text-slate-500">{job.company} � {job.location}</p>
                  <p className="mt-2 text-sm text-slate-600">{job.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-600">Match {job.matchScore}%</p>
                  <button
                    type="button"
                    className="button-primary mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => apply(job.id)}
                    disabled={applyingJobId === job.id}
                  >
                    {applyingJobId === job.id ? "Applying..." : "One-click Apply"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {message && <p className="mt-4 text-sm text-brand-600">{message}</p>}
      </SectionCard>
    </div>
  );
}
