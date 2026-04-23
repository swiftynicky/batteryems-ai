'use client';

import { motion } from 'framer-motion';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { formatINR, formatPct } from '@/lib/format';
import { IndianRupee, Clock, Zap, ArrowDownRight, Sun } from 'lucide-react';

const kpiConfig = [
  {
    key: 'annual_savings_inr',
    label: 'Annual Savings',
    icon: IndianRupee,
    color: 'var(--savings-green)',
    glow: 'var(--savings-green-glow)',
    format: (v: number, kpis: Record<string, number>) =>
      `₹${formatINR(v)}`,
    sub: (kpis: Record<string, number>) => formatPct(kpis.savings_pct),
  },
  {
    key: 'simple_payback_years',
    label: 'Payback Period',
    icon: Clock,
    color: 'var(--solar-amber)',
    glow: 'var(--solar-amber-glow)',
    format: (v: number) => `${v.toFixed(1)} yrs`,
    sub: () => 'Simple payback',
  },
  {
    key: 'peak_demand_reduction_pct',
    label: 'Peak Reduction',
    icon: Zap,
    color: 'var(--battery-teal)',
    glow: 'var(--battery-teal-glow)',
    format: (v: number) => formatPct(v),
    sub: () => 'Peak demand cut',
  },
  {
    key: 'grid_import_reduction_pct',
    label: 'Grid Import ↓',
    icon: ArrowDownRight,
    color: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.12)',
    format: (v: number) => formatPct(v),
    sub: () => 'Annual grid reduction',
  },
  {
    key: 'solar_self_consumption_pct',
    label: 'Self-Consumption',
    icon: Sun,
    color: 'var(--solar-amber)',
    glow: 'var(--solar-amber-glow)',
    format: (v: number) => formatPct(v),
    sub: () => 'Solar used on-site',
  },
];

export default function KPICards() {
  const result = useAnalysisStore((s) => s.result);
  if (!result) return null;

  const kpis = result.kpis as unknown as Record<string, number>;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '14px',
      }}
    >
      {kpiConfig.map((kpi, i) => {
        const Icon = kpi.icon;
        const value = kpis[kpi.key];
        return (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="glass-card"
            style={{
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle corner glow */}
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${kpi.glow} 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: kpi.glow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={15} color={kpi.color} />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {kpi.label}
              </span>
            </div>

            <div>
              <p
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: kpi.color,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {kpi.format(value, kpis)}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {kpi.sub(kpis)}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
