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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="chart-panel"
    >
      <div className="chart-panel-header">
        <div>
          <div className="chart-title">24-Hour Energy Profile</div>
          <div className="chart-subtitle">Representative {result.representative_day_type.replace('_', ' ')}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -8 }}>
          <defs>
            <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--amber)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--amber-bright)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--amber-bright)" stopOpacity={0.02} />
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
            tick={{ fill: '#999', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'kW',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#999', fontSize: 10 },
              offset: 8,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: '11px', color: '#999', paddingTop: '10px' }}
          />

          {/* Load area */}
          <Area
            type="monotone"
            dataKey="load_kw"
            name="Load"
            stroke="var(--amber)"
            strokeWidth={2}
            fill="url(#loadGrad)"
          />

          {/* Solar area */}
          <Area
            type="monotone"
            dataKey="solar_kw"
            name="Solar"
            stroke="var(--amber-bright)"
            strokeWidth={2}
            fill="url(#solarGrad)"
          />

          {/* Battery bars */}
          <Bar
            dataKey="battery_net_kw"
            name="Battery (net)"
            fill="var(--teal)"
            opacity={0.75}
            radius={[2, 2, 0, 0]}
            barSize={10}
          />

          {/* Grid import line */}
          <Line
            type="monotone"
            dataKey="grid_import_kw"
            name="Grid Import"
            stroke="#AAA"
            strokeWidth={1.5}
            dot={false}
          />

          {/* Baseline (grid-only) dashed line */}
          <Line
            type="monotone"
            dataKey="baseline_grid_kw"
            name="Baseline (Grid-Only)"
            stroke="#999"
            strokeWidth={1.5}
            strokeDasharray="5 4"
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
    <div className="chart-tooltip">
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-quiet)', marginBottom: 8 }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 14,
            padding: '2px 0',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-quiet)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
            {p.name}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-normal)', fontVariantNumeric: 'tabular-nums' }}>
            {p.value.toFixed(1)} kW
          </span>
        </div>
      ))}
    </div>
  );
}
