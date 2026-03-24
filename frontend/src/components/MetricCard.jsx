import { TrendingUp, TrendingDown } from 'lucide-react'

export default function MetricCard({ title, value, icon: Icon, trend }) {
  const isPositive = trend?.startsWith('+')
  
  return (
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col shadow-lg shadow-black/10 hover:shadow-xl hover:bg-[var(--color-surface-overlay)] hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-overlay)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] shadow-sm shadow-black/20 group-hover:scale-105 transition-transform">
          <Icon size={22} strokeWidth={2} className="text-[var(--color-primary-light)]" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${isPositive ? 'text-[#10B981] bg-[#10B981]/5 border-[#10B981]/20' : 'text-[#EF4444] bg-[#EF4444]/5 border-[#EF4444]/20'}`}>
            {isPositive ? <TrendingUp size={14} strokeWidth={3} /> : <TrendingDown size={14} strokeWidth={3} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-[14px] font-medium text-[var(--color-text-muted)] mb-2 tracking-wide">{title}</p>
        <h3 className="text-[34px] font-bold text-white tracking-tighter leading-none">{value}</h3>
      </div>
    </div>
  )
}
