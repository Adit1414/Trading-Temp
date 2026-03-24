import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '00:00', value: 124500 },
  { time: '02:00', value: 125500 },
  { time: '04:00', value: 127500 },
  { time: '06:00', value: 126000 },
  { time: '08:00', value: 124000 },
  { time: '10:00', value: 123500 },
  { time: '12:00', value: 125000 },
  { time: '14:00', value: 126500 },
  { time: '16:00', value: 126800 },
  { time: '18:00', value: 125000 },
  { time: '20:00', value: 123600 },
  { time: '22:00', value: 124800 },
];

export default function PortfolioPerformanceCard() {
  return (
    <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-6 shadow-lg shadow-black/10 mt-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text)]">Portfolio Performance (24h)</h3>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Real-time portfolio value tracking</p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.4} />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              domain={['dataMin - 1000', 'dataMax + 1000']}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              dx={-10}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155', 
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}
              itemStyle={{ color: '#f1f5f9' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              formatter={(value) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#818cf8" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
