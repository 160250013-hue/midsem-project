import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const message = location.state?.message || "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Email Verification Disabled</h1>
          <p className="mt-2 text-sm text-slate-600">
            {email ? (
              <>
                The account for <span className="font-semibold">{email}</span> is ready to use.
              </>
            ) : (
              "Your account is ready to use."
            )}
          </p>
          {message && <p className="mt-3 text-sm font-medium text-teal-700">{message}</p>}
        </div>

        <div className="mt-8 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
          OTP verification has been turned off temporarily. You can login directly.
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Continue to Login
          </button>
        </div>
      </div>
    </div>
  );
}
