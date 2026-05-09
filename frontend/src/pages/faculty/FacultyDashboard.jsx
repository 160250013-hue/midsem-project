import { useEffect, useState } from "react";
import api from "../../services/api";
import SectionCard from "../../components/common/SectionCard";
import StatCard from "../../components/common/StatCard";

export default function FacultyDashboard({ view }) {
  const [approvals, setApprovals] = useState([]);

  const loadApprovals = async () => {
    const response = await api.get("/approvals/pending");
    setApprovals(response.data.data || []);
  };

  useEffect(() => {
    loadApprovals();
  }, [view]);

  const decide = async (id, decision) => {
    await api.patch(`/approvals/${id}`, { decision, remarks: `${decision} by mentor` });
    loadApprovals();
  };

  if (view === "approvals") {
    return (
      <SectionCard title="Pending NOC Approvals">
        <div className="space-y-3">
          {approvals.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-900">{item.student_name}</h4>
              <p className="text-sm text-slate-500">{item.title} • {item.company}</p>
              <div className="mt-3 flex gap-2">
                <button className="button-primary" type="button" onClick={() => decide(item.id, "approved")}>Approve NOC</button>
                <button className="button-secondary" type="button" onClick={() => decide(item.id, "rejected")}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StatCard title="Pending Approvals" value={approvals.length} subtitle="Student applications awaiting NOC" />
      <StatCard title="Mentorship Load" value={approvals.length} subtitle="Current active approvals queue" />
    </div>
  );
}
