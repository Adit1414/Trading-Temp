import { useState, useMemo } from 'react'
import { useStrategies } from '../api/strategies'
import { useRunBacktest } from '../api/backtests'
import toast from 'react-hot-toast'

/**
 * Dynamic backtest form that:
 * 1. Fetches strategies from GET /strategies
 * 2. Renders parameter fields from strategy.parameter_schema (JSON Schema)
 * 3. Submits to POST /backtest/run with exact API contract
 */
export default function BacktestForm({ onClose }) {
  const { data: strategies, isLoading: strategiesLoading } = useStrategies()
  const runBacktest = useRunBacktest()

  const inputClass =
    'w-full px-4 py-3 bg-[#0B0E14] border border-[var(--color-border)] rounded-xl text-sm font-medium text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-all'
  const labelClass = 'block text-[11px] font-medium text-[var(--color-text-muted)] mb-2 tracking-wider'

  // ── Form state ──────────────────────────────────────────────────
  const [selectedStrategyId, setSelectedStrategyId] = useState('')
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [contractType, setContractType] = useState('SPOT')
  const [interval, setInterval_] = useState('1d')
  const [initialCash, setInitialCash] = useState(100000)
  const [commission, setCommission] = useState(0.001)
  const [slippage, setSlippage] = useState(0.0005)
  const [orderSizeMode, setOrderSizeMode] = useState('FIXED_USDT')
  const [orderSizePct, setOrderSizePct] = useState(100)
  const [orderSizeUsdt, setOrderSizeUsdt] = useState(10)
  const [intraday, setIntraday] = useState(false)
  const [startDate, setStartDate] = useState('2024-01-01')
  const [endDate, setEndDate] = useState('2024-06-30')
  const [tradingMarket, setTradingMarket] = useState('NSE')
  const [strategyConfigJson, setStrategyConfigJson] = useState('{}')
  const [strategyConfigValues, setStrategyConfigValues] = useState({})

  // ── Derived: selected strategy & its parameter schema ──────────
  const selectedStrategy = useMemo(
    () => strategies?.find((s) => s.id === selectedStrategyId),
    [strategies, selectedStrategyId]
  )

  const parameterSchema = selectedStrategy?.parameter_schema
  const schemaProperties = parameterSchema?.properties || {}
  const hasValidSchema = Object.keys(schemaProperties).length > 0

  // ── When strategy changes, reset config to defaults ────────────
  const handleStrategyChange = (id) => {
    setSelectedStrategyId(id)
    const strat = strategies?.find((s) => s.id === id)
    if (strat?.parameter_schema?.properties) {
      const defaults = {}
      for (const [key, prop] of Object.entries(strat.parameter_schema.properties)) {
        if (prop.default !== undefined) defaults[key] = prop.default
      }
      setStrategyConfigValues(defaults)
      setStrategyConfigJson(JSON.stringify(defaults, null, 2))
    } else {
      setStrategyConfigValues({})
      setStrategyConfigJson('{}')
    }
  }

  // ── Update a single strategy config field ──────────────────────
  const updateConfigField = (key, value, type) => {
    setStrategyConfigValues((prev) => {
      const updated = { ...prev }
      if (type === 'number' || type === 'integer') {
        updated[key] = value === '' ? '' : Number(value)
      } else {
        updated[key] = value
      }
      return updated
    })
  }

  // ── Render a single field from JSON Schema ─────────────────────
  const renderSchemaField = (key, prop) => {
    const value = strategyConfigValues[key] ?? prop.default ?? ''
    const label = prop.title || key.replace(/_/g, ' ')

    // Enum → select dropdown
    if (prop.enum) {
      return (
        <div key={key}>
          <label className={labelClass + " uppercase"}>
            {label}
          </label>
          <select
            value={value}
            onChange={(e) => updateConfigField(key, e.target.value, 'string')}
            className={inputClass}
          >
            {prop.enum.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {prop.description && <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{prop.description}</p>}
        </div>
      )
    }

    // Number / integer → number input
    if (prop.type === 'number' || prop.type === 'integer') {
      return (
        <div key={key}>
          <label className={labelClass + " uppercase"}>
            {label}
            {prop.minimum !== undefined && prop.maximum !== undefined && (
              <span className="text-[var(--color-text-muted)]/60 ml-1">
                ({prop.minimum}–{prop.maximum})
              </span>
            )}
          </label>
          <input
            type="number"
            value={value}
            min={prop.minimum}
            max={prop.maximum}
            step={prop.type === 'integer' ? 1 : 'any'}
            onChange={(e) => updateConfigField(key, e.target.value, prop.type)}
            className={inputClass}
          />
          {prop.description && <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{prop.description}</p>}
        </div>
      )
    }

    // Fallback: text input
    return (
      <div key={key}>
        <label className={labelClass + " uppercase"}>
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => updateConfigField(key, e.target.value, 'string')}
          className={inputClass}
        />
        {prop.description && <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{prop.description}</p>}
      </div>
    )
  }

  // Also handle allOf/$ref patterns - try to flatten
  const resolveSchemaProps = (schema) => {
    if (!schema) return {}
    // Direct properties
    if (schema.properties) return schema.properties
    // allOf pattern (common in Pydantic JSON Schema)
    if (schema.allOf) {
      let merged = {}
      for (const sub of schema.allOf) {
        if (sub.properties) merged = { ...merged, ...sub.properties }
      }
      return merged
    }
    return {}
  }

  const resolvedProps = resolveSchemaProps(parameterSchema)

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!selectedStrategy) {
      toast.error('Please select a strategy.')
      return
    }
    if (!name.trim()) {
      toast.error('Please enter a backtest name.')
      return
    }

    // Build strategy_config — use typed values or fallback parse JSON
    let configToSend = {}
    if (hasValidSchema || Object.keys(resolvedProps).length > 0) {
      configToSend = { ...strategyConfigValues }
    } else {
      try {
        configToSend = JSON.parse(strategyConfigJson)
      } catch {
        toast.error('Invalid JSON in strategy config.')
        return
      }
    }

    // Build payload matching BacktestRunRequest EXACTLY
    const payload = {
      strategy: selectedStrategy.type_code,  // type_code, NOT UUID
      strategy_config: configToSend,
      name: name.trim(),
      symbol: symbol.toUpperCase(),
      contract_type: contractType,
      trading_market: 'BINANCE', // Backend ONLY accepts 'BINANCE' per Enum
      interval: interval,
      initial_cash: Number(initialCash),
      commission: Number(commission),
      slippage: Number(slippage),
      order_size_mode: orderSizeMode,
      order_size_pct: Number(orderSizePct),
      intraday,
      start_date: startDate,
      end_date: endDate,
    }

    // If FIXED_USDT, include order_size_usdt; if PCT_EQUITY, omit it
    if (orderSizeMode === 'FIXED_USDT') {
      payload.order_size_usdt = Number(orderSizeUsdt)
    }

    console.log('[BacktestForm] Submitting payload:', payload)

    runBacktest.mutate(payload, {
      onSuccess: (data) => {
        toast.success(`Backtest "${data.name}" completed!`)
        onClose?.()
      },
      onError: (err) => {
        console.error('[BacktestForm] Error:', err)
        // Toast already handled by axios interceptor
      },
    })
  }

  const intervals = [
    { value: '1m', label: '1 min' },
    { value: '3m', label: '3 min' },
    { value: '5m', label: '5 min' },
    { value: '15m', label: '15 min' },
    { value: '30m', label: '30 min' },
    { value: '1h', label: '1 hour' },
    { value: '2h', label: '2 hours' },
    { value: '4h', label: '4 hours' },
    { value: '6h', label: '6 hours' },
    { value: '8h', label: '8 hours' },
    { value: '12h', label: '12 hours' },
    { value: '1d', label: '1 day' },
    { value: '3d', label: '3 days' },
    { value: '1w', label: '1 week' },
    { value: '1M', label: '1 month' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-[var(--color-surface-raised)] rounded-[20px] border border-[var(--color-border)] w-full max-w-[800px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]/50 sticky top-0 bg-[var(--color-surface-raised)] z-10 rounded-t-[20px]">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-white tracking-tight">Start New Backtest</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Row 1 */}
            <div>
              <label className={labelClass}>
                Strategy <span className="text-[#10B981] ml-2 font-bold">{strategies?.length || 0} AVAILABLE</span>
              </label>
              {strategiesLoading ? (
                <div className="text-sm text-[var(--color-text-muted)] px-4 py-3 bg-[#0B0E14] rounded-xl">Loading strategies…</div>
              ) : (
                <select
                  value={selectedStrategyId}
                  onChange={(e) => handleStrategyChange(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Select strategy</option>
                  {strategies?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className={labelClass}>Strategy Configuration</label>
              <select className={inputClass}>
                <option value="">Select configuration</option>
                <option value="custom">Custom (Below)</option>
              </select>
            </div>

            {selectedStrategy && (
              <div className="col-span-2 p-5 rounded-xl border border-[var(--color-border)] bg-[#0B0E14]/50">
                <h3 className="text-sm font-semibold text-white mb-4">Parameters for {selectedStrategy.name}</h3>
                {Object.keys(resolvedProps).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(resolvedProps)
                      .filter(([key]) => key !== 'title' && key !== 'type')
                      .map(([key, prop]) => renderSchemaField(key, prop))}
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={strategyConfigJson}
                      onChange={(e) => setStrategyConfigJson(e.target.value)}
                      rows={3}
                      className={inputClass + ' font-mono text-xs'}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Row 2 */}
            <div>
              <label className={labelClass}>Backtest Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Test Run 1" required />
            </div>
            <div>
              <label className={labelClass}>Symbol</label>
              <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} className={inputClass} placeholder="RELIANCE" required />
            </div>

            {/* Row 3 */}
            <div>
              <label className={labelClass}>Contract Type</label>
              <select value={contractType} onChange={(e) => setContractType(e.target.value)} className={inputClass}>
                <option value="SPOT">SPOT</option>
                <option value="FUTURE">FUTURE</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Trading Market</label>
              <input type="text" value={tradingMarket} onChange={(e) => setTradingMarket(e.target.value)} className={inputClass} placeholder="NSE" required />
            </div>
          </div>

          {/* Row 4 (4 columns) */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>INITIAL CASH</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">$</span>
                <input type="number" value={initialCash} onChange={(e) => setInitialCash(e.target.value)} className={inputClass + " pl-8"} />
              </div>
            </div>
            <div>
              <label className={labelClass}>COMMISSION</label>
              <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} step={0.0001} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>QUANTITY ({orderSizeMode === 'PCT_EQUITY' ? '%' : 'USDT'})</label>
              <input type="number" value={orderSizeMode === 'PCT_EQUITY' ? orderSizePct : orderSizeUsdt} 
                     onChange={(e) => orderSizeMode === 'PCT_EQUITY' ? setOrderSizePct(e.target.value) : setOrderSizeUsdt(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>SPREAD</label>
              <input type="number" value={slippage} onChange={(e) => setSlippage(e.target.value)} step={0.0001} className={inputClass} />
            </div>
          </div>

          {/* Additional essential fields */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>ORDER MODE</label>
              <select value={orderSizeMode} onChange={(e) => setOrderSizeMode(e.target.value)} className={inputClass}>
                <option value="FIXED_USDT">Fixed Size</option>
                <option value="PCT_EQUITY">% of Equity</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>INTERVAL</label>
              <select value={interval} onChange={(e) => setInterval_(e.target.value)} className={inputClass}>
                {intervals.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>START DATE</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>END DATE</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Row 5: Intraday Toggle */}
          <div className="flex items-center justify-between p-5 bg-[var(--color-surface-overlay)] rounded-xl border border-[var(--color-border)] shadow-inner cursor-pointer" onClick={() => setIntraday(!intraday)}>
            <div>
              <h3 className="text-sm font-bold text-white mb-0.5">Intraday Trading</h3>
              <p className="text-[11px] text-[var(--color-text-muted)]">Enable for same-day trading only</p>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors duration-300 ${intraday ? 'bg-[var(--color-primary)]' : 'bg-[#334155]'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${intraday ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end items-center gap-4 pt-4 border-t border-[var(--color-border)]/50">
            <button
              type="button"
              onClick={onClose}
              className="font-semibold text-[13px] text-[var(--color-text-muted)] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={runBacktest.isPending}
              className="px-6 py-3 text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
            >
              {runBacktest.isPending ? 'Running...' : 'Start Simulation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
