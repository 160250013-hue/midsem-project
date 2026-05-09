import { useState, useRef } from "react";

const ResumeUploadComponent = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setResumeFile(file);
    setError("");
  };

  const handleUpload = async () => {
    if (!resumeFile) {
      setError("Please select a file first");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("resume", resumeFile);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/resume/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setUploadResult(data.data);
      setResumeFile(null);
      setShowAnalysis(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getQualityBadge = (score) => {
    if (score >= 80) return { color: "bg-emerald-100 text-emerald-800", text: "Excellent" };
    if (score >= 60) return { color: "bg-amber-100 text-amber-800", text: "Good" };
    return { color: "bg-rose-100 text-rose-800", text: "Needs Improvement" };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">📄 Resume Upload & Analysis</h2>

        {/* File Upload Area */}
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf"
            className="hidden"
          />

          <div className="text-4xl mb-2">📎</div>
          {resumeFile ? (
            <div>
              <p className="font-semibold text-slate-900">{resumeFile.name}</p>
              <p className="text-sm text-slate-600">
                {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-slate-900">Click to upload or drag and drop</p>
              <p className="text-sm text-slate-600">PDF files only, max 5MB</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-4">
            <p className="text-rose-700">{error}</p>
          </div>
        )}

        {/* Upload Button */}
        {resumeFile && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="flex-1 bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 disabled:bg-slate-400 transition-colors"
            >
              {loading ? "Uploading..." : "Upload & Analyze"}
            </button>
            <button
              onClick={() => {
                setResumeFile(null);
                setError("");
              }}
              className="bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {showAnalysis && uploadResult && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
          <h3 className="text-xl font-bold text-slate-900">✨ Analysis Results</h3>

          {/* Resume Quality Score */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-slate-900">Resume Quality</h4>
              <span
                className={`px-3 py-1 rounded-full font-semibold text-sm ${getQualityBadge(uploadResult.resumeQuality.score).color}`}
              >
                {getQualityBadge(uploadResult.resumeQuality.score).text}
              </span>
            </div>

            <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all"
                style={{ width: `${uploadResult.resumeQuality.score}%` }}
              />
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {uploadResult.resumeQuality.score}/100
            </p>

            {uploadResult.resumeQuality.feedback.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadResult.resumeQuality.feedback.map((feedback, idx) => (
                  <p key={idx} className="text-sm text-slate-700">
                    💡 {feedback}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Extracted Skills */}
          <div>
            <h4 className="text-lg font-bold text-slate-900 mb-3">
              🎯 Extracted Skills ({uploadResult.extractedSkills.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {uploadResult.extractedSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Skills by Category */}
          {Object.keys(uploadResult.skillsByCategory).length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-3">📚 Skills by Category</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(uploadResult.skillsByCategory).map(([category, skills]) => (
                  <div key={category} className="bg-slate-50 rounded-lg p-4">
                    <p className="font-semibold text-slate-900 mb-2 capitalize">
                      {category.replace(/_/g, " ")}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill Recommendations */}
          {uploadResult.skillRecommendations && uploadResult.skillRecommendations.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 mb-2">💪 Recommended Skills to Learn</h4>
              <div className="flex flex-wrap gap-2">
                {uploadResult.skillRecommendations.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <p className="text-sm text-amber-800 mt-3">
                Learning these skills could improve your job match scores by up to 20%!
              </p>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={() => setShowAnalysis(false)}
            className="w-full bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Close Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default ResumeUploadComponent;
