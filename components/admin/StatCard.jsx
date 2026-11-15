export default function StatCard({ label, value, sub, icon: Icon, trend, tone = "brand" }) {
  const tones = {
    brand: "from-brand-600 to-indigo-700",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    rose: "from-rose-500 to-pink-600",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {trend && <p className={`mt-3 text-xs font-semibold ${trend.startsWith("+") ? "text-emerald-500" : "text-rose-500"}`}>{trend}</p>}
    </div>
  );
}