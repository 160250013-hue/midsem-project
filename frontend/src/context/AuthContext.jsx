import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState("");

  useEffect(() => {
    const handleSessionExpired = (event) => {
      setUser(null);
      setSessionNotice(event.detail?.message || "Your session expired. Please login again.");
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  useEffect(() => {
    const bootstrapSession = async () => {
      const token = localStorage.getItem("portal_token");

      if (token) {
        try {
          const meResponse = await api.get("/auth/me");
          setUser(meResponse.data.data.user);
          return;
        } catch {
          localStorage.removeItem("portal_token");
        }
      }

      // Attempt silent refresh via HttpOnly cookie.
      try {
        const refreshResponse = await api.post("/auth/refresh", {});
        const newToken = refreshResponse.data?.data?.token || refreshResponse.data?.data?.accessToken;

        if (!newToken) {
          throw new Error("Missing access token in refresh response");
        }

        localStorage.setItem("portal_token", newToken);
        const meResponse = await api.get("/auth/me");
        setUser(meResponse.data.data.user);
      } catch {
        localStorage.removeItem("portal_token");
        setUser(null);
      }
    };

    bootstrapSession().finally(() => setLoading(false));
  }, []);

  const login = async (payload) => {
    const response = await api.post("/auth/login", payload);
    localStorage.setItem("portal_token", response.data.data.token);
    setUser(response.data.data.user);
    return response.data.data.user;
  };

  const register = async (payload) => {
    const response = await api.post("/auth/register", payload);
    return response.data;
  };

  const logout = () => {
    api.post("/auth/logout", {}).catch(() => undefined);
    localStorage.removeItem("portal_token");
    setUser(null);
    setSessionNotice("");
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, register, logout, loading, sessionNotice, setSessionNotice }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
