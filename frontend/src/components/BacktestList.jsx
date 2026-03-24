import { useNavigate } from 'react-router-dom'
import { useBacktests } from '../api/backtests'
import { useState } from 'react'
import { CheckCircle2, Clock, AlertTriangle, Eye, Trash2, Activity } from 'lucide-react'

// Basic relative time formatter
function timeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return `Just now`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 172800) return `Yesterday`
  return `${Math.floor(diffInSeconds / 86400)} days ago`
}

export default function BacktestList({ searchQuery }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const limit = 20
  const offset = page * limit

  const { data: backtests, isLoading, isError, error } = useBacktests(limit, offset)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading simulation runs…</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-20 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl">
        <p className="text-[var(--color-danger)] text-sm">Failed to load backtests.</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">{error?.message}</p>
      </div>
    )
  }

  if (!backtests || backtests.length === 0) {
    return (
      <div className="text-center py-20 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl">
        <svg className="w-12 h-12 mx-auto text-[var(--color-surface-overlay)] mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <p className="text-[var(--color-text-muted)] text-sm">No simulations found.</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">Run your first simulation to see results here.</p>
      </div>
    )
  }

  const filteredBacktests = backtests.filter(bt => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameStr = (bt.name || `${bt.strategy_id} Run`).toLowerCase();
    return (bt.symbol && bt.symbol.toLowerCase().includes(q)) ||
           (bt.strategy_id && bt.strategy_id.toLowerCase().includes(q)) ||
           (nameStr.includes(q))
  });

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBacktests.map((bt) => {
          const returnPct = bt.total_return_pct
          const isPositive = returnPct !== null && returnPct > 0
          const isNegative = returnPct !== null && returnPct < 0
          
          let statusConfig = { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
          const status = bt.status || 'COMPLETED'
          if (status === 'RUNNING') statusConfig = { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
          if (status === 'ERROR') statusConfig = { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' }

          return (
            <div
              key={bt.id}
              className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-6 hover:border-[var(--color-primary)]/50 transition-colors shadow-lg shadow-black/10"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                     <statusConfig.icon size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-[var(--color-text)] font-semibold truncate max-w-[150px]">{bt.name || `${bt.strategy_id} Run`}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5 whitespace-nowrap">
                      <Clock size={12} />
                      {timeAgo(bt.created_at)}
                    </p>
                  </div>
                </div>
                <div className={`px-2.5 py-1.5 rounded-md bg-[var(--color-surface-overlay)] text-[10px] font-bold tracking-widest uppercase ${statusConfig.color}`}>
                  {status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-1 uppercase tracking-wider font-semibold">Strategy</p>
                  <p className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1.5">
                    <Activity size={14} className="text-[var(--color-primary)]" />
                    <span className="truncate">{bt.strategy_id.replace('_', ' ')}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-1 uppercase tracking-wider font-semibold">Market</p>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {bt.symbol}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 mt-2 border-t border-[var(--color-border)]/50">
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-1 uppercase tracking-wider font-semibold">Total Return</p>
                  <p className={`text-xl font-bold ${isPositive ? 'text-emerald-500' : isNegative ? 'text-red-500' : 'text-[var(--color-text)]'}`}>
                    {returnPct !== null ? `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%` : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => navigate(`/backtests/${bt.id}`)} className="p-2 text-[var(--color-text-muted)] hover:text-white rounded-lg hover:bg-[var(--color-surface-overlay)] transition-colors">
                    <Eye size={18} />
                  </button>
                  <button className="p-2 text-[var(--color-text-muted)] hover:text-red-500 rounded-lg hover:bg-[var(--color-surface-overlay)] transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {filteredBacktests.length > 0 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)]">
            Showing {offset + 1}–{offset + filteredBacktests.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-overlay)]/50 rounded-lg hover:bg-[var(--color-surface-overlay)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={backtests?.length < limit}
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-overlay)]/50 rounded-lg hover:bg-[var(--color-surface-overlay)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
