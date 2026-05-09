import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";

export default function AppShell({ role, activeView, onChange, onLogout, header, children }) {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("portal_dark_mode") === "true"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("portal_dark_mode", String(darkMode));
  }, [darkMode]);

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[288px_1fr]">
        <Sidebar role={role} activeView={activeView} onChange={onChange} onLogout={onLogout} />
        <main className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl bg-gradient-to-r from-brand-500 via-brand-600 to-slate-900 px-6 py-8 text-white shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-teal-100">Operational Dashboard</p>
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                className="rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30"
              >
                {darkMode ? "Light Mode" : "Dark Mode"}
              </button>
            </div>
            <h2 className="mt-2 text-3xl font-semibold">{header.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-100">{header.description}</p>
          </motion.div>
          {children}
        </main>
      </div>
    </div>
  );
}
