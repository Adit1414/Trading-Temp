import { useParams, useNavigate } from 'react-router-dom'
import { useBacktestDetail } from '../api/backtests'
import { useState } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export default function BacktestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useBacktestDetail(id)
  const [activeTab, setActiveTab] = useState('Overview')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading backtest details…</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl max-w-2xl mx-auto mt-10">
        <p className="text-[var(--color-danger)] font-medium">Failed to load backtest.</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">{error?.message}</p>
        <button onClick={() => navigate('/backtests')} className="mt-6 px-4 py-2 bg-[var(--color-surface-overlay)] text-white rounded-lg hover:bg-opacity-80 transition-all text-sm font-medium">
          ← Back to Backtests
        </button>
      </div>
    )
  }

  if (!data) return null

  const metrics = data.metrics || {}
  const parameters = data.parameters || {}
  
  const status = data.status || 'COMPLETED'
  const isCompleted = status === 'COMPLETED'

  const handleExport = () => {
    const htmlContent = data.chart_html || metrics.chart_html;
    if (!htmlContent) return;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_${data.strategy_id}_${data.symbol}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/backtests')}
            className="p-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white transition-colors h-[42px] mt-1"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] tracking-tight">
                {data.name || `${data.strategy_id} Run`}
              </h1>
              <div className={`px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase rounded ${
                  isCompleted ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                  status === 'RUNNING' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                  'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                {status}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mt-2">
              <span className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2.5 py-1 rounded text-xs font-medium">
                {data.strategy_id.replace('_', ' ')}
              </span>
              <span className="text-[var(--color-surface-overlay)]">•</span>
              <span className="font-medium text-[var(--color-text)]">{data.symbol}</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleExport}
          disabled={!data.chart_html && !metrics.chart_html}
          className={`flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] rounded-xl transition-all text-sm font-medium whitespace-nowrap ${
            (data.chart_html || metrics.chart_html) 
              ? 'hover:text-[var(--color-primary-light)] hover:border-[var(--color-primary)]/50 cursor-pointer' 
              : 'opacity-50 cursor-not-allowed'
          }`}>
          <ExternalLink size={16} />
          Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[var(--color-border)]/50 pb-4 overflow-x-auto">
        {['Overview', 'Parameters', 'Statistics'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-[var(--color-surface-overlay)] text-white shadow-sm' 
                : 'text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-surface-overlay)]/30'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            {/* Chart */}
            {(data.chart_html || metrics.chart_html) ? (
              <div className="bg-[var(--color-surface-raised)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-lg shadow-black/10">
                <div className="px-6 py-5 border-b border-[var(--color-border)]">
                  <h3 className="text-xl font-bold text-[var(--color-text)] tracking-tight">Portfolio Performance</h3>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">Interactive simulation equity curve</p>
                </div>
                <div className="p-2">
                  <iframe
                    srcDoc={data.chart_html || metrics.chart_html}
                    sandbox="allow-scripts allow-popups"
                    className="w-full h-[600px] rounded-xl border-0"
                    title="Backtest Chart"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-[var(--color-surface-raised)] rounded-2xl border border-[var(--color-border)] p-12 text-center shadow-lg">
                <p className="text-[var(--color-text-muted)]">No chart data available for this run.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Parameters' && (
          <div className="bg-[var(--color-surface-raised)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-lg shadow-black/10">
            <div className="px-6 py-5 border-b border-[var(--color-border)]">
              <h3 className="text-xl font-bold text-[var(--color-text)] tracking-tight">Simulation Parameters</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Object.keys(parameters).length > 0 ? (
                Object.entries(parameters).map(([key, val]) => (
                  <div key={key} className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
                    <p className="text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider font-semibold">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--color-text-muted)] col-span-full">No parameters recorded.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Statistics' && (
          <div className="bg-[var(--color-surface-raised)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-lg shadow-black/10">
            <div className="px-6 py-5 border-b border-[var(--color-border)]">
              <h3 className="text-xl font-bold text-[var(--color-text)] tracking-tight">Performance Statistics</h3>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Object.keys(metrics).length > 0 ? (
                Object.entries(metrics).map(([key, val]) => (
                  <div key={key} className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
                    <p className="text-[10px] text-[var(--color-text-muted)] mb-1.5 uppercase tracking-wider font-semibold">{key.replace(/_/g, ' ')}</p>
                    <p className={`text-sm font-medium ${
                      key.includes('return_pct') || key.includes('win_rate') || key.includes('profit_factor') ? 
                        (val > 0 ? 'text-emerald-500' : val < 0 ? 'text-red-500' : 'text-[var(--color-text)]') 
                        : 'text-[var(--color-text)]'
                    }`}>
                      {val !== null && val !== undefined ? String(val) : '—'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--color-text-muted)] col-span-full">No statistics recorded.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
