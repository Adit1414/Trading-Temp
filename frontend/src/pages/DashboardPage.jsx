import { Bot, Activity, TrendingUp, DollarSign, Bell, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import PortfolioPerformanceCard from '../components/PortfolioPerformanceCard'

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-[32px] font-bold text-[var(--color-text)] tracking-tight leading-tight">Trading Dashboard</h1>
          <p className="text-base text-[var(--color-text-muted)] mt-1.5">Welcome back! Here's your real-time overview.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <svg className="w-[18px] h-[18px] text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="pl-10 pr-4 py-2.5 text-[15px] bg-[var(--color-surface-overlay)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] w-full sm:w-64 transition-all shadow-sm shadow-black/10"
            />
          </div>
          
          <button 
            onClick={() => navigate('/bots')}
            className="flex items-center gap-2 px-5 py-2.5 text-[15px] font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition-all shadow-lg shadow-[var(--color-primary)]/20 whitespace-nowrap active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create Bot
          </button>
          
          <button className="p-2.5 rounded-xl bg-[var(--color-surface-overlay)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white relative transition-colors group shadow-sm shadow-black/10 hover:shadow-md">
            <Bell size={20} strokeWidth={2} className="group-hover:animate-swing" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#EF4444] rounded-full ring-2 ring-[var(--color-surface-overlay)] shadow-sm shadow-red-500/50"></span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Active Bots" 
          value="7" 
          icon={Bot} 
          trend="+1" 
        />
        <MetricCard 
          title="Total Trades" 
          value="342" 
          icon={Activity} 
          trend="+342" 
        />
        <MetricCard 
          title="Win Rate" 
          value="73.4%" 
          icon={TrendingUp} 
          trend="+2.1%" 
        />
        <MetricCard 
          title="Avg Return" 
          value="2.8%" 
          icon={DollarSign} 
          trend="+2.1%" 
        />
      </div>

      {/* Charts */}
      <PortfolioPerformanceCard />
    </div>
  )
}
