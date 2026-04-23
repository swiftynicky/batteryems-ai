'use client';

import { motion } from 'framer-motion';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { formatINR } from '@/lib/format';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const SCENARIO_COLORS = ['#B0B0B0', '#C47A08', '#0D8F83'];
const SCENARIO_LABELS = ['Grid Only', 'Solar Only', 'Solar + Battery'];

export default function ScenarioComparison() {
  const result = useAnalysisStore((s) => s.result);
  if (!result) return null;

  const sc = result.scenario_comparison;
  const data = [
    {
      name: 'Grid Only',
      short: 'Grid',
      annual_bill: sc.grid_only.annual_bill_inr,
      renewable: sc.grid_only.renewable_fraction_pct,
      peak: sc.grid_only.peak_grid_import_kw,
    },
    {
      name: 'Solar Only',
      short: 'Solar',
      annual_bill: sc.solar_only.annual_bill_inr,
      renewable: sc.solar_only.renewable_fraction_pct,
      peak: sc.solar_only.peak_grid_import_kw,
    },
    {
      name: 'Solar + Batt.',
      short: 'S+B',
      annual_bill: sc.solar_battery.annual_bill_inr,
      renewable: sc.solar_battery.renewable_fraction_pct,
      peak: sc.solar_battery.peak_grid_import_kw,
    },
  ];

  const baseline = sc.grid_only.annual_bill_inr;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="chart-panel"
    >
      <div className="chart-panel-header">
        <div>
          <div className="chart-title">Scenario Comparison</div>
          <div className="chart-subtitle">Annual bill — ₹ across 3 configurations</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }} barSize={34}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis
            dataKey="short"
            tick={{ fill: '#999', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#999', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload;
              const savings = baseline - d.annual_bill;
              return (
                <div className="chart-tooltip">
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-loud)', marginBottom: 8 }}>
                    {d.name}
                  </p>
                  <TRow label="Annual Bill" value={`₹${formatINR(d.annual_bill)}`} />
                  {savings > 0 && (
                    <TRow label="vs Grid-Only" value={`−₹${formatINR(savings)}`} color="var(--green)" />
                  )}
                  <TRow label="Renewable" value={`${d.renewable.toFixed(1)}%`} />
                  <TRow label="Peak Import" value={`${d.peak.toFixed(1)} kW`} />
                </div>
              );
            }}
          />
          <Bar dataKey="annual_bill" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={SCENARIO_COLORS[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Savings delta pills */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {data.map((d, i) => {
          const savings = baseline - d.annual_bill;
          return (
            <div key={d.name} style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border-1)',
              background: 'var(--bg-overlay)',
              textAlign: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 2 }}>
                <span style={{
                  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                  background: SCENARIO_COLORS[i],
                }} />
                <span style={{ fontSize: 9, color: 'var(--text-quiet)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  {SCENARIO_LABELS[i]}
                </span>
              </div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13, fontWeight: 700,
                color: savings > 0 ? 'var(--green)' : 'var(--text-quiet)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {savings > 0 ? `−₹${formatINR(savings)}` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function TRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 3 }}>
      <span style={{ fontSize: 11, color: 'var(--text-quiet)' }}>{label}</span>
      <span style={{
        fontSize: 11, fontWeight: 600,
        color: color || 'var(--text-normal)',
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
    </div>
  );
}
