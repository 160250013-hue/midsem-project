import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const message = location.state?.message || "";

  const [otp, setOTP] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (!email) {
      setError("Email not found. Please register again.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/verify-otp", {
        email,
        otp
      });
      setSuccess("Email verified successfully!");
      setTimeout(() => {
        navigate("/login", { state: { email, message: "Email verified successfully. Please login." } });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await api.post("/auth/send-otp", { email });
      setSuccess("OTP sent to your email");
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Verify Email</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter the 6-digit code sent to<br />
            <span className="font-semibold">{email || "your email"}</span>
          </p>
          {message && <p className="mt-3 text-sm font-medium text-teal-700">{message}</p>}
        </div>

        <form onSubmit={handleVerifyOTP} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-rose-50 p-4 border border-rose-200">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              OTP Code
            </label>
            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOTP(val);
              }}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
            <p className="mt-2 text-xs text-slate-500">
              Enter the 6-digit code from your email
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full rounded-lg bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm text-slate-600 mb-3">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResendOTP}
            disabled={resendCooldown > 0 || isLoading}
            className="text-teal-600 font-semibold hover:text-teal-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {resendCooldown > 0
              ? `Resend OTP in ${resendCooldown}s`
              : "Resend OTP"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
