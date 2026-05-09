import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [cgpaData, setCGPAData] = useState(null);
  const [skillData, setSkillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");

        const [overviewRes, cgpaRes, skillRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/analytics/overview`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_URL}/analytics/cgpa-placement`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_URL}/analytics/skills`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!overviewRes.ok || !cgpaRes.ok || !skillRes.ok) {
          throw new Error("Failed to fetch analytics data");
        }

        const overviewData = await overviewRes.json();
        const cgpaAnalysis = await cgpaRes.json();
        const skills = await skillRes.json();

        setData(overviewData.data);
        setCGPAData(cgpaAnalysis.data);
        setSkillData(skills.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "tpo" || user?.role === "faculty") {
      fetchAnalytics();
    }
  }, [user]);

  if (user?.role !== "tpo" && user?.role !== "faculty") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin">⏳ Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
        <p className="text-rose-700">Error: {error}</p>
      </div>
    );
  }

  const StatCard = ({ label, value, color = "blue" }) => {
    const colorClass = {
      blue: "bg-blue-50 border-blue-200 text-blue-900",
      green: "bg-emerald-50 border-emerald-200 text-emerald-900",
      purple: "bg-purple-50 border-purple-200 text-purple-900",
      orange: "bg-orange-50 border-orange-200 text-orange-900"
    }[color];

    return (
      <div className={`border rounded-lg p-4 ${colorClass}`}>
        <p className="text-sm font-semibold opacity-75">{label}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">📊 Analytics Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === "overview"
                ? "bg-teal-600 text-white"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === "analysis"
                ? "bg-teal-600 text-white"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            Analysis
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && data && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Applications"
              value={data.total_applications || 0}
              color="blue"
            />
            <StatCard
              label="Selected Students"
              value={data.selected_students || 0}
              color="green"
            />
            <StatCard
              label="Active Jobs"
              value={data.active_jobs || 0}
              color="purple"
            />
            <StatCard
              label="Placement %"
              value={`${data.placement_percentage || 0}%`}
              color="orange"
            />
          </div>

          {/* Application Pipeline */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Application Pipeline</h2>
            <div className="space-y-3">
              {data.pipeline?.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 capitalize">
                    {item.status.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full"
                        style={{
                          width: `${
                            data.total_applications > 0
                              ? (item.count / data.total_applications) * 100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                    <span className="font-bold text-slate-900 min-w-[50px]">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Match Score Distribution */}
          {data.matchScoreDistribution && (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Match Score Distribution</h2>
              <div className="space-y-3">
                {Object.entries(data.matchScoreDistribution).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{range}</span>
                    <span className="font-bold text-slate-900">{count} applications</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Jobs */}
          {data.trendingJobs && data.trendingJobs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">🔥 Trending Jobs</h2>
              <div className="space-y-3">
                {data.trendingJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-600">{job.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-teal-600">{job.recent_applications} applications</p>
                      <p className="text-sm text-slate-600">Avg match: {job.avg_match_score?.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === "analysis" && (
        <div className="space-y-6">
          {/* CGPA vs Placement */}
          {cgpaData && cgpaData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">CGPA vs Placement Analysis</h2>
              <div className="space-y-4">
                {cgpaData.map((item) => (
                  <div key={item.cgpa_range} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900">CGPA: {item.cgpa_range}</span>
                      <span className="text-sm font-bold text-teal-600">
                        {item.placement_rate}% placed
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-slate-600">
                      <span>👥 {item.total_students} students</span>
                      <span>✅ {item.placed_students} placed</span>
                      <span>📊 Avg match: {item.avg_match_score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Analysis */}
          {skillData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jobs Skill Demand */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Top In-Demand Skills</h3>
                <div className="space-y-2">
                  {skillData.jobsDemand?.slice(0, 8).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-slate-700">{item.skill}</span>
                      <span className="font-bold text-blue-600">{item.job_demand} jobs</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Skills Distribution */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Student Skills Distribution</h3>
                <div className="space-y-2">
                  {skillData.studentSkills?.slice(0, 8).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-slate-700">{item.skill}</span>
                      <span className="font-bold text-emerald-600">{item.student_count} students</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
