import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const defaultLoginState = {
  email: "",
  password: ""
};

const defaultRegisterState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  role: "student"
};

const oauthBaseUrl =
  import.meta.env.VITE_BACKEND_ORIGIN ||
  (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export default function AuthPage({ initialMode = "login" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState(defaultLoginState);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState(location.state?.message || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showNotRegisteredError, setShowNotRegisteredError] = useState(false);

  useEffect(() => {
    if (location.state?.email) {
      setFormData((prev) => ({ ...prev, email: location.state.email }));
    }
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Validation functions
  const validateLoginForm = () => {
    const newErrors = {};
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password?.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    return newErrors;
  };

  const validateRegisterForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password?.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.confirmPassword?.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Phone must be exactly 10 digits";
    }
    return newErrors;
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setErrors({});
    setServerError("");
    setSuccessMessage("");
    setShowNotRegisteredError(false);
    if (newMode === "login") {
      setFormData(defaultLoginState);
    } else {
      setFormData(defaultRegisterState);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    setShowNotRegisteredError(false);

    // Client-side validation
    const newErrors = mode === "login" ? validateLoginForm() : validateRegisterForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        await login({ email: formData.email, password: formData.password });
        navigate("/");
      } else {
        const response = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone.trim(),
          role: formData.role
        });
        setSuccessMessage(response?.message || "Registration successful. Please verify your email.");
        navigate("/verify-otp", {
          replace: true,
          state: {
            email: formData.email,
            message: response?.message || "Registration successful. Please verify your email."
          }
        });
      }
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message || "Server error";
      if (message.includes("not registered")) {
        setShowNotRegisteredError(true);
      } else {
        setServerError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isRegisterMode = mode === "register";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-2">
        {/* Left side - Branding */}
        <div className="hidden bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-teal-300">Campus Placements</p>
            <h1 className="mt-6 text-4xl font-bold leading-tight">
              Centralize internships, approvals, and offers.
            </h1>
            <p className="mt-6 text-sm text-slate-300">
              Built for students, recruiters, faculty mentors, and placement officers with one workflow from opportunity posting to final offer release.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            <p>📌 First time? Register to create your account.</p>
            <p>🔐 Secure authentication with JWT tokens</p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex flex-col justify-center p-8 lg:p-12">
          {/* Tab Navigation */}
          <div className="mb-8 flex gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => handleModeSwitch("login")}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "border-b-2 border-teal-600 text-teal-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch("register")}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "register"
                  ? "border-b-2 border-teal-600 text-teal-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === "login"
                ? "Login to access your portal"
                : "Register to start your journey"}
            </p>

            {/* Not Registered Error with Register Button */}
            {showNotRegisteredError && (
              <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                <p className="text-sm font-semibold text-amber-900">
                  ⚠️ You are not registered
                </p>
                <p className="text-sm text-amber-800 mt-1">
                  Please create an account first to access the portal.
                </p>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("register")}
                  className="mt-3 w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
                >
                  👉 Go to Register
                </button>
              </div>
            )}

            {/* Server Error */}
            {serverError && !showNotRegisteredError && (
              <div className="rounded-lg bg-rose-50 p-4 border border-rose-200">
                <p className="text-sm text-rose-700">{serverError}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                <p className="text-sm font-semibold text-emerald-800">{successMessage}</p>
              </div>
            )}

            {/* Register Fields */}
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg border px-4 py-2 text-sm transition-colors ${
                      errors.name
                        ? "border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        : "border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    }`}
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-rose-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                  >
                    <option value="student">Student</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="faculty">Faculty Mentor</option>
                    <option value="admin">Placement Officer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="9999999999"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 ${
                      errors.phone ? "border-rose-500 focus:ring-rose-200" : "border-slate-300 focus:ring-teal-200"
                    }`}
                    required
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>
                  )}
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full rounded-lg border px-4 py-2 text-sm transition-colors ${
                  errors.email
                    ? "border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    : "border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full rounded-lg border px-4 py-2 text-sm transition-colors ${
                  errors.password
                    ? "border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    : "border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200"
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
              )}
              {isRegisterMode && !errors.password && (
                <p className="mt-1 text-xs text-slate-500">
                  Min 6 characters
                </p>
              )}
            </div>

            {/* Confirm Password Field (Register Only) */}
            {isRegisterMode && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border px-4 py-2 text-sm transition-colors ${
                    errors.confirmPassword
                      ? "border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                      : "border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors mt-6"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Processing...
                </span>
              ) : mode === "login" ? (
                "Login"
              ) : (
                "Create Account"
              )}
            </button>

            {/* Google Login Button (Login Mode Only) */}
            {mode === "login" && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-slate-500">Or</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `${oauthBaseUrl}/api/auth/google`;
                  }}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

            {/* Forgot Password Link (Login Mode Only) */}
            {mode === "login" && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-slate-600 hover:text-teal-600 font-medium"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Switch Mode Link */}
            <div className="text-center text-sm text-slate-600 mt-6">
              {mode === "login" ? (
                <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => handleModeSwitch("register")}
                      className="font-semibold text-teal-600 hover:text-teal-700"
                    >
                      Register here
                    </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("login")}
                    className="font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Login here
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
