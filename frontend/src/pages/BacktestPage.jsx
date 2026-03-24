import { useState } from 'react'
import BacktestList from '../components/BacktestList'
import BacktestForm from '../components/BacktestForm'
import { Plus, Search, Filter } from 'lucide-react'

export default function BacktestPage() {
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">Backtest Results</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage and analyze your strategy simulations.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl transition-all shadow-lg shadow-[var(--color-primary)]/20 whitespace-nowrap"
        >
          <Plus size={16} strokeWidth={2.5} />
          New Simulation
        </button>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search by name, symbol, or strategy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--color-surface-overlay)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface-overlay)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-muted)] hover:text-white transition-colors">
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Grid */}
      <BacktestList searchQuery={searchQuery} />

      {/* Modal */}
      {showForm && <BacktestForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
