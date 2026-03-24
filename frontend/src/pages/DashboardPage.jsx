import { Bot, Activity, TrendingUp, DollarSign, Bell, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import PortfolioPerformanceCard from '../components/PortfolioPerformanceCard'

export default function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        
        <div>
          <h1 className="text-[28px] font-semibold text-white">
            Trading Dashboard
          </h1>
          <p className="text-[13px] text-[#9CA3AF] mt-1">
            Welcome back! Here's your real-time overview.
          </p>
        </div>

        <div className="flex items-center gap-4">

          {/* Search */}
          <div className="relative">
            <svg className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2">
              <path stroke="currentColor" strokeWidth="2" fill="none" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>

            <input
              type="text"
              placeholder="Search..."
              className="h-10 pl-9 pr-3 text-[13px] bg-[#111827] border border-white/10 rounded-[10px] text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] w-56"
            />
          </div>

          {/* Button */}
          <button
            onClick={() => navigate('/bots')}
            className="h-10 px-4 flex items-center gap-2 text-[13px] font-medium text-white bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] rounded-[10px] hover:brightness-110 transition"
          >
            <Plus size={16} />
            Create Bot
          </button>

          {/* Notification */}
          <button className="h-10 w-10 flex items-center justify-center rounded-[10px] bg-[#111827] border border-white/10 text-[#9CA3AF] hover:text-white relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full"></span>
          </button>

        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Active Bots" value="7" icon={Bot} trend="+1" />
        <MetricCard title="Total Trades" value="342" icon={Activity} trend="+342" />
        <MetricCard title="Win Rate" value="73.4%" icon={TrendingUp} trend="+2.1%" />
        <MetricCard title="Avg Return" value="2.8%" icon={DollarSign} trend="+2.1%" />
      </div>

      {/* Chart */}
      <PortfolioPerformanceCard />

    </div>
  )
}