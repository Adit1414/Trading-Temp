import { Bot, Activity, TrendingUp, DollarSign, Bell, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import PortfolioPerformanceCard from '../components/PortfolioPerformanceCard'

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">Trading Dashboard</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Welcome back! Here's your real-time overview.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="pl-9 pr-4 py-2 text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] w-full md:w-64 transition-all"
            />
          </div>
          
          <button 
            onClick={() => navigate('/backtests')}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap"
          >
            <Plus size={16} />
            Create Bot
          </button>
          
          <button className="p-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] relative transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-danger)] rounded-full"></span>
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
