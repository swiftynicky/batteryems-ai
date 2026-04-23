'use client';

import { motion } from 'framer-motion';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export default function SocChart() {
  const result = useAnalysisStore((s) => s.result);
  if (!result) return null;

  const batteryCapacity = result.recommendation.battery_kwh;
  if (batteryCapacity <= 0) return null;

  const minSoc = batteryCapacity * 0.1;
  const maxSoc = batteryCapacity * 0.9;

  const data = result.hourly_series.map((h) => ({
    hour_label: `${h.hour.toString().padStart(2, '0')}:00`,
    soc_kwh: h.soc_kwh,
    soc_pct: ((h.soc_kwh / batteryCapacity) * 100).toFixed(0),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="chart-panel"
    >
      <div className="chart-panel-header">
        <div>
          <div className="chart-title">Battery State of Charge</div>
          <div className="chart-subtitle">{batteryCapacity} kWh — 10–90% SOC window</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={195}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -8 }}>
          <defs>
            <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--teal)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis
            dataKey="hour_label"
            tick={{ fill: '#999', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            domain={[0, batteryCapacity]}
            tick={{ fill: '#999', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'kWh',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#999', fontSize: 10 },
              offset: 8,
            }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.[0]) return null;
              return (
                <div className="chart-tooltip">
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-quiet)', marginBottom: 6 }}>
                    {label}
                  </p>
                  <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--teal)', fontVariantNumeric: 'tabular-nums' }}>
                    {Number(payload[0].value).toFixed(1)} kWh
                    <span style={{ fontSize: 11, color: 'var(--text-quiet)', marginLeft: 6 }}>
                      ({((Number(payload[0].value) / batteryCapacity) * 100).toFixed(0)}%)
                    </span>
                  </p>
                </div>
              );
            }}
          />

          {/* SOC limits */}
          <ReferenceLine
            y={minSoc}
            stroke="var(--red)"
            strokeDasharray="5 4"
            strokeWidth={1}
            label={{ value: 'Min 10%', position: 'left', fill: 'var(--red)', fontSize: 9 }}
          />
          <ReferenceLine
            y={maxSoc}
            stroke="var(--green)"
            strokeDasharray="5 4"
            strokeWidth={1}
            label={{ value: 'Max 90%', position: 'left', fill: 'var(--green)', fontSize: 9 }}
          />

          <Area
            type="monotone"
            dataKey="soc_kwh"
            stroke="var(--teal)"
            strokeWidth={2}
            fill="url(#socGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
