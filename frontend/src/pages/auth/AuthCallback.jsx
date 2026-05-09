import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("portal_token", token);
      navigate("/", { replace: true });
      return;
    }

    navigate("/login", {
      replace: true,
      state: { message: "Google login failed. Please try again." }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center text-slate-600">
      Completing Google sign-in...
    </div>
  );
}
