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
    <div className="bg-[#111827] border border-white/5 rounded-xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">

      {/* Header */}
      <div className="mb-5">
        <h3 className="text-[18px] font-semibold text-white">
          Portfolio Performance
        </h3>
        <p className="text-[13px] text-[#9CA3AF] mt-1">
          Last 24 hours
        </p>
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>

            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255,255,255,0.08)"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              domain={['dataMin - 1000', 'dataMax + 1000']}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              dx={-10}
            />

            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '10px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
              }}
              labelStyle={{ color: '#9CA3AF', fontSize: '12px' }}
              itemStyle={{ color: '#FFFFFF', fontWeight: 600 }}
              formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#A78BFA"
              strokeWidth={2.5}
              fill="url(#colorValue)"
              activeDot={{ r: 4, fill: '#A78BFA' }}
            />

          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}