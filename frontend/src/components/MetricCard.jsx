import { TrendingUp, TrendingDown } from 'lucide-react'

export default function MetricCard({ title, value, icon: Icon, trend }) {
  const isPositive = trend?.startsWith('+')
  
  return (
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-5 flex flex-col shadow-lg shadow-black/10">
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-overlay)]/50 flex items-center justify-center text-[var(--color-text-muted)]">
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-full ${isPositive ? 'text-[var(--color-success)] bg-[var(--color-success)]/10' : 'text-[var(--color-danger)] bg-[var(--color-danger)]/10'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-[var(--color-text-muted)] mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">{value}</h3>
      </div>
    </div>
  )
}
