import { TrendingUp, TrendingDown } from 'lucide-react'

export default function MetricCard({ title, value, icon: Icon, trend }) {
  const isPositive = trend?.startsWith('+')
  
  return (
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[20px] p-6 flex flex-col shadow-xl shadow-black/20">
      <div className="flex justify-between items-start mb-12">
        <div className="w-11 h-11 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50 flex items-center justify-center text-white">
          <Icon size={20} strokeWidth={1.5} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-md ${isPositive ? 'text-[#10B981] bg-[#10B981]/10' : 'text-[#EF4444] bg-[#EF4444]/10'}`}>
            {isPositive ? <TrendingUp size={13} strokeWidth={2.5} /> : <TrendingDown size={13} strokeWidth={2.5} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{title}</p>
        <h3 className="text-3xl font-bold text-white tracking-tight leading-none">{value}</h3>
      </div>
    </div>
  )
}
