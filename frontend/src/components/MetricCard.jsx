import { TrendingUp, TrendingDown } from 'lucide-react'

export default function MetricCard({ title, value, icon: Icon, trend }) {
  const isPositive = trend?.startsWith('+')

  return (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:translate-y-[-2px] transition-all duration-200">

      {/* Top */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-[13px] text-[#9CA3AF]">{title}</p>
        <Icon size={20} className="text-[#9CA3AF]" />
      </div>

      {/* Value + Trend */}
      <div className="flex justify-between items-end">
        <h3 className="text-[28px] font-bold text-white leading-none">
          {value}
        </h3>

        {trend && (
          <div className={`flex items-center gap-1 text-[13px] font-medium ${
            isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'
          }`}>
            {isPositive ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            {trend}
          </div>
        )}
      </div>

    </div>
  )
}