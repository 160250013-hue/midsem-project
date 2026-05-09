import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const RecommendedJobsComponent = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyMessage, setApplyMessage] = useState("");
  const [applyingJobId, setApplyingJobId] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await api.get("/matching/recommendations");
        setRecommendations(response.data?.data?.recommendations || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to fetch recommendations");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "student") {
      fetchRecommendations();
    }
  }, [user]);

  const getTagColor = (tag) => {
    const colorMap = {
      green: "bg-emerald-100 text-emerald-800",
      blue: "bg-blue-100 text-blue-800",
      purple: "bg-purple-100 text-purple-800",
      orange: "bg-orange-100 text-orange-800"
    };
    return colorMap[tag.color] || "bg-gray-100 text-gray-800";
  };

  const applyToJob = async (jobId) => {
    try {
      setApplyingJobId(jobId);
      setApplyMessage("");
      await api.post("/applications", { jobId });
      setApplyMessage("Application submitted for faculty approval");
    } catch (err) {
      setApplyMessage(err.response?.data?.message || err.message || "Unable to apply right now");
    } finally {
      setApplyingJobId(null);
    }
  };

  if (user?.role !== "student") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin">⏳ Loading recommendations...</div>
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

  if (recommendations.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-700">
          Complete your profile and upload your resume to see personalized job recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">
          🎯 Recommended Jobs For You
        </h2>
        <span className="text-sm bg-teal-100 text-teal-800 px-3 py-1 rounded-full">
          {recommendations.length} matches
        </span>
      </div>

      <div className="grid gap-4">
        {recommendations.map((job) => (
          <div
            key={job.id}
            className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            {/* Header with Match Score */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                <p className="text-slate-600">{job.company}</p>
              </div>

              {/* Match Score Badge */}
              <div className="ml-4 text-right">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-white font-bold text-lg ${
                    job.matchScore >= 80
                      ? "bg-emerald-500"
                      : job.matchScore >= 70
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  }`}
                >
                  {job.matchScore}%
                </div>
                <p className="text-xs text-slate-500 mt-2">Match Score</p>
              </div>
            </div>

            {/* Location and Type */}
            <div className="flex gap-4 mb-4 text-sm text-slate-600">
              <span>📍 {job.location || "Not specified"}</span>
              <span>• {job.employmentType || "Full-time"}</span>
            </div>

            {/* Recommendation Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {job.recommendationTags?.map((tag, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getTagColor(tag)}`}
                >
                  {tag.tag}
                </span>
              ))}
            </div>

            {/* Score Breakdown */}
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">Score Breakdown:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-600">Skills Match: </span>
                  <span className="font-semibold text-slate-900">
                    {Math.round(job.scoreDetails.skillScore / 50 * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">CGPA: </span>
                  <span className="font-semibold text-slate-900">
                    {Math.round(job.scoreDetails.cgpaScore / 20 * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Experience: </span>
                  <span className="font-semibold text-slate-900">
                    {Math.round(job.scoreDetails.experienceScore / 20 * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Preferences: </span>
                  <span className="font-semibold text-slate-900">
                    {Math.round(job.scoreDetails.preferenceScore / 10 * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Why Recommended */}
            <div className="bg-teal-50 rounded-lg p-4 mb-4 border-l-4 border-teal-500">
              <p className="text-sm text-teal-900">
                💡 {job.whyRecommended}
              </p>
            </div>

            {/* Action Button */}
            <button
              className="w-full bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              type="button"
              onClick={() => applyToJob(job.id)}
              disabled={applyingJobId === job.id}
            >
              {applyingJobId === job.id ? "Applying..." : "View Full Details & Apply"}
            </button>
          </div>
        ))}
      </div>
      {applyMessage && <p className="text-sm text-teal-700">{applyMessage}</p>}
    </div>
  );
};

export default RecommendedJobsComponent;
