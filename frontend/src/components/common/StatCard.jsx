export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-semibold text-slate-900">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
