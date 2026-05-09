import { navByRole, roleLabels } from "../../utils/roleConfig";

export default function Sidebar({ role, activeView, onChange, onLogout }) {
  const navItems = navByRole[role] || [];

  return (
    <aside className="w-full rounded-3xl bg-slate-900 p-5 text-white lg:w-72">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Campus Portal</p>
        <h1 className="mt-3 text-2xl font-semibold">{roleLabels[role]}</h1>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
              activeView === item.key ? "bg-white text-slate-900" : "hover:bg-slate-800"
            }`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button type="button" onClick={onLogout} className="button-secondary mt-8 w-full bg-white text-slate-900">
        Logout
      </button>
    </aside>
  );
}
