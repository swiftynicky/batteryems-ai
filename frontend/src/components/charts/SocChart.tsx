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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card"
      style={{ padding: '24px' }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Battery State of Charge
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {batteryCapacity} kWh battery — 10-90% SOC window
        </p>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 105, 0.15)" />
          <XAxis
            dataKey="hour_label"
            tick={{ fill: '#64748B', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(71, 85, 105, 0.3)' }}
            interval={2}
          />
          <YAxis
            domain={[0, batteryCapacity]}
            tick={{ fill: '#64748B', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'kWh',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#64748B', fontSize: 11 },
            }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.[0]) return null;
              return (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {label}
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--battery-teal)' }}>
                    {Number(payload[0].value).toFixed(1)} kWh
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
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
            stroke="#EF4444"
            strokeDasharray="6 4"
            strokeWidth={1}
            label={{ value: 'Min 10%', position: 'left', fill: '#EF4444', fontSize: 10 }}
          />
          <ReferenceLine
            y={maxSoc}
            stroke="#10B981"
            strokeDasharray="6 4"
            strokeWidth={1}
            label={{ value: 'Max 90%', position: 'left', fill: '#10B981', fontSize: 10 }}
          />

          <Area
            type="monotone"
            dataKey="soc_kwh"
            stroke="#14B8A6"
            strokeWidth={2.5}
            fill="url(#socGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
