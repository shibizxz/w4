function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <article className="glass-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-3 font-display text-3xl text-white">{value}</p>
          {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
        </div>

        {Icon ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
            <Icon size={20} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default StatCard;
