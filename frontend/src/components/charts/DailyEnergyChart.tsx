'use client';

import { motion } from 'framer-motion';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function DailyEnergyChart() {
  const result = useAnalysisStore((s) => s.result);
  if (!result) return null;

  const data = result.hourly_series.map((h) => ({
    ...h,
    battery_net_kw: h.battery_discharge_kw > 0
      ? h.battery_discharge_kw
      : -h.battery_charge_kw,
    hour_label: `${h.hour.toString().padStart(2, '0')}:00`,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass-card"
      style={{ padding: '24px' }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
          24-Hour Energy Profile
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Representative {result.representative_day_type.replace('_', ' ')}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.02} />
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
            tick={{ fill: '#64748B', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'kW',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#64748B', fontSize: 11 },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: '#94A3B8', paddingTop: '8px' }}
          />

          {/* Load area */}
          <Area
            type="monotone"
            dataKey="load_kw"
            name="Load"
            stroke="#F59E0B"
            strokeWidth={2}
            fill="url(#loadGrad)"
          />

          {/* Solar area */}
          <Area
            type="monotone"
            dataKey="solar_kw"
            name="Solar"
            stroke="#FBBF24"
            strokeWidth={2}
            fill="url(#solarGrad)"
          />

          {/* Battery bars */}
          <Bar
            dataKey="battery_net_kw"
            name="Battery (net)"
            fill="#14B8A6"
            opacity={0.7}
            radius={[2, 2, 0, 0]}
            barSize={12}
          />

          {/* Grid import line */}
          <Line
            type="monotone"
            dataKey="grid_import_kw"
            name="Grid Import"
            stroke="#6B7280"
            strokeWidth={2}
            dot={false}
          />

          {/* Baseline (grid-only) dashed line */}
          <Line
            type="monotone"
            dataKey="baseline_grid_kw"
            name="Baseline (Grid-Only)"
            stroke="#94A3B8"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '12px 14px',
        backdropFilter: 'blur(12px)',
        minWidth: '160px',
      }}
    >
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            padding: '2px 0',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: p.color,
                display: 'inline-block',
              }}
            />
            {p.name}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {p.value.toFixed(1)} kW
          </span>
        </div>
      ))}
    </div>
  );
}
