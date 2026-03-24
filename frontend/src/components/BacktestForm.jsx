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

  // ── Form state ──────────────────────────────────────────────────
  const [selectedStrategyId, setSelectedStrategyId] = useState('')
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [contractType, setContractType] = useState('SPOT')
  const [interval, setInterval_] = useState('1d')
  const [initialCash, setInitialCash] = useState(10000)
  const [commission, setCommission] = useState(0.001)
  const [slippage, setSlippage] = useState(0.0005)
  const [orderSizeMode, setOrderSizeMode] = useState('PCT_EQUITY')
  const [orderSizePct, setOrderSizePct] = useState(100)
  const [orderSizeUsdt, setOrderSizeUsdt] = useState(100)
  const [intraday, setIntraday] = useState(false)
  const [startDate, setStartDate] = useState('2024-01-01')
  const [endDate, setEndDate] = useState('2024-06-30')
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
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1 capitalize">
            {label}
          </label>
          <select
            value={value}
            onChange={(e) => updateConfigField(key, e.target.value, 'string')}
            className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
          >
            {prop.enum.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {prop.description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{prop.description}</p>}
        </div>
      )
    }

    // Number / integer → number input
    if (prop.type === 'number' || prop.type === 'integer') {
      return (
        <div key={key}>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1 capitalize">
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
            className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
          />
          {prop.description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{prop.description}</p>}
        </div>
      )
    }

    // Fallback: text input
    return (
      <div key={key}>
        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1 capitalize">
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => updateConfigField(key, e.target.value, 'string')}
          className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
        />
        {prop.description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{prop.description}</p>}
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
      trading_market: 'BINANCE',
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

  const inputClass =
    'w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50'
  const labelClass = 'block text-xs font-medium text-[var(--color-text-muted)] mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-surface-raised)] rounded-2xl border border-[var(--color-border)] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]/50 sticky top-0 bg-[var(--color-surface-raised)] z-10 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">New Backtest</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ── Strategy Selection ─────────────────────────────── */}
          <div>
            <label className={labelClass}>Strategy *</label>
            {strategiesLoading ? (
              <div className="text-sm text-[var(--color-text-muted)]">Loading strategies…</div>
            ) : (
              <select
                value={selectedStrategyId}
                onChange={(e) => handleStrategyChange(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select a strategy…</option>
                {strategies?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type_code})
                  </option>
                ))}
              </select>
            )}
            {selectedStrategy?.description && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{selectedStrategy.description}</p>
            )}
          </div>

          {/* ── Strategy Config (dynamic from parameter_schema) ─ */}
          {selectedStrategy && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--color-text)] border-b border-[var(--color-border)] pb-2">
                Strategy Parameters
              </h3>
              {Object.keys(resolvedProps).length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(resolvedProps)
                    .filter(([key]) => key !== 'title' && key !== 'type')
                    .map(([key, prop]) => renderSchemaField(key, prop))}
                </div>
              ) : (
                <div>
                  <label className={labelClass}>Strategy Config (JSON)</label>
                  <textarea
                    value={strategyConfigJson}
                    onChange={(e) => setStrategyConfigJson(e.target.value)}
                    rows={5}
                    className={inputClass + ' font-mono text-xs'}
                    placeholder='{"fast_period": 12, "slow_period": 26}'
                  />
                </div>
              )}
            </div>
          )}

          {/* ── General Settings ───────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--color-text)] border-b border-[var(--color-border)] pb-2">
              General Settings
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>Backtest Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. EMA Test Run 1" required />
              </div>

              <div>
                <label className={labelClass}>Symbol *</label>
                <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} className={inputClass} placeholder="BTCUSDT" required />
              </div>

              <div>
                <label className={labelClass}>Contract Type</label>
                <select value={contractType} onChange={(e) => setContractType(e.target.value)} className={inputClass}>
                  <option value="SPOT">Spot</option>
                  <option value="FUTURE">Futures</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Interval</label>
                <select value={interval} onChange={(e) => setInterval_(e.target.value)} className={inputClass}>
                  {intervals.map((i) => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Initial Cash (USDT)</label>
                <input type="number" value={initialCash} onChange={(e) => setInitialCash(e.target.value)} min={1} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Commission (0.001 = 0.1%)</label>
                <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} min={0} max={0.1} step={0.0001} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Slippage</label>
                <input type="number" value={slippage} onChange={(e) => setSlippage(e.target.value)} min={0} max={0.05} step={0.0001} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Order Size Mode</label>
                <select value={orderSizeMode} onChange={(e) => setOrderSizeMode(e.target.value)} className={inputClass}>
                  <option value="PCT_EQUITY">% of Equity</option>
                  <option value="FIXED_USDT">Fixed USDT</option>
                </select>
              </div>

              {orderSizeMode === 'PCT_EQUITY' ? (
                <div>
                  <label className={labelClass}>Order Size (%)</label>
                  <input type="number" value={orderSizePct} onChange={(e) => setOrderSizePct(e.target.value)} min={1} max={100} className={inputClass} />
                </div>
              ) : (
                <div>
                  <label className={labelClass}>Order Size (USDT)</label>
                  <input type="number" value={orderSizeUsdt} onChange={(e) => setOrderSizeUsdt(e.target.value)} min={1} className={inputClass} />
                </div>
              )}

              <div>
                <label className={labelClass}>Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} required />
              </div>

              <div>
                <label className={labelClass}>End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} required />
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="intraday"
                  checked={intraday}
                  onChange={(e) => setIntraday(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <label htmlFor="intraday" className="text-sm text-[var(--color-text)]">
                  Intraday (close positions at end of day)
                </label>
              </div>
            </div>
          </div>

          {/* ── Submit ──────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] bg-[var(--color-surface-overlay)]/50 rounded-xl hover:bg-[var(--color-surface-overlay)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={runBacktest.isPending}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--color-primary)]/20"
            >
              {runBacktest.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running…
                </span>
              ) : (
                'Run Backtest'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
