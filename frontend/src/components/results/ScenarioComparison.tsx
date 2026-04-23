'use client';

import { motion } from 'framer-motion';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { formatINR } from '@/lib/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const scenarioColors = ['#6B7280', '#F59E0B', '#14B8A6'];
const scenarioLabels = ['Grid Only', 'Solar Only', 'Solar + Battery'];

export default function ScenarioComparison() {
  const result = useAnalysisStore((s) => s.result);
  if (!result) return null;

  const sc = result.scenario_comparison;
  const data = [
    {
      name: 'Grid Only',
      annual_bill: sc.grid_only.annual_bill_inr,
      renewable: sc.grid_only.renewable_fraction_pct,
      peak: sc.grid_only.peak_grid_import_kw,
    },
    {
      name: 'Solar Only',
      annual_bill: sc.solar_only.annual_bill_inr,
      renewable: sc.solar_only.renewable_fraction_pct,
      peak: sc.solar_only.peak_grid_import_kw,
    },
    {
      name: 'Solar + Battery',
      annual_bill: sc.solar_battery.annual_bill_inr,
      renewable: sc.solar_battery.renewable_fraction_pct,
      peak: sc.solar_battery.peak_grid_import_kw,
    },
  ];

  const maxBill = sc.grid_only.annual_bill_inr;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="glass-card"
      style={{ padding: '24px' }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Scenario Comparison
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Annual electricity bill across configurations
        </p>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }} barSize={48}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(71, 85, 105, 0.15)" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(71, 85, 105, 0.3)' }}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload;
              const savings = maxBill - d.annual_bill;
              return (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    backdropFilter: 'blur(12px)',
                    minWidth: '180px',
                  }}
                >
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {d.name}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Row label="Annual Bill" value={`₹${formatINR(d.annual_bill)}`} />
                    {savings > 0 && (
                      <Row label="Savings" value={`₹${formatINR(savings)}`} color="var(--savings-green)" />
                    )}
                    <Row label="Renewable" value={`${d.renewable.toFixed(1)}%`} />
                    <Row label="Peak Import" value={`${d.peak.toFixed(1)} kW`} />
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="annual_bill" name="Annual Bill" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={scenarioColors[i]} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Savings deltas */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '14px',
          justifyContent: 'center',
        }}
      >
        {data.map((d, i) => {
          const savings = maxBill - d.annual_bill;
          return (
            <div
              key={d.name}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid var(--border-subtle)',
                textAlign: 'center',
                flex: 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: scenarioColors[i], display: 'inline-block' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{scenarioLabels[i]}</span>
              </div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: savings > 0 ? 'var(--savings-green)' : 'var(--text-secondary)' }}>
                {savings > 0 ? `−₹${formatINR(savings)}` : '₹0'}
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 600, color: color || 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );
}
