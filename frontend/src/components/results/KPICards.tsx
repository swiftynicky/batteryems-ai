'use client';

import { motion } from 'framer-motion';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { formatINR, formatPct } from '@/lib/format';
import { IndianRupee, Clock, Zap, ArrowDownRight, Sun } from 'lucide-react';

type KpiValue = number | null;

const kpiConfig = [
  {
    key: 'annual_savings_inr',
    label: 'Annual Savings',
    icon: IndianRupee,
    color: 'var(--green)',
    accent: '#22A86E',
    format: (v: KpiValue) => `₹${formatINR(v ?? 0)}`,
    sub: (kpis: Record<string, KpiValue>) => `${formatPct(kpis.savings_pct ?? 0)} reduction`,
  },
  {
    key: 'simple_payback_years',
    label: 'Payback Period',
    icon: Clock,
    color: 'var(--amber)',
    accent: '#E8940A',
    format: (v: KpiValue) => v === null ? 'N/A' : `${v.toFixed(1)} yrs`,
    sub: () => 'Simple payback',
  },
  {
    key: 'peak_demand_reduction_pct',
    label: 'Peak Reduction',
    icon: Zap,
    color: 'var(--teal)',
    accent: '#0FA89A',
    format: (v: KpiValue) => formatPct(v ?? 0),
    sub: () => 'Peak demand cut',
  },
  {
    key: 'grid_import_reduction_pct',
    label: 'Grid Import ↓',
    icon: ArrowDownRight,
    color: 'var(--violet)',
    accent: '#7C6AF5',
    format: (v: KpiValue) => formatPct(v ?? 0),
    sub: () => 'Annual reduction',
  },
  {
    key: 'solar_self_consumption_pct',
    label: 'Self-Consumption',
    icon: Sun,
    color: 'var(--amber-bright)',
    accent: '#F5A623',
    format: (v: KpiValue) => formatPct(v ?? 0),
    sub: () => 'Solar used on-site',
  },
];

export default function KPICards() {
  const result = useAnalysisStore((s) => s.result);
  if (!result) return null;

  const kpis = result.kpis as unknown as Record<string, KpiValue>;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 12,
    }}>
      {kpiConfig.map((kpi, i) => {
        const Icon = kpi.icon;
        const value = kpis[kpi.key];
        return (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="kpi-card"
            style={{ '--kpi-accent': kpi.accent } as React.CSSProperties}
          >
            {/* Label row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon size={13} color={kpi.color} />
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: 'var(--text-silent)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {kpi.label}
              </span>
            </div>

            {/* Value */}
            <div>
              <div className="kpi-value" style={{ color: kpi.color }}>
                {kpi.format(value)}
              </div>
              <div style={{
                fontSize: 10, color: 'var(--text-quiet)',
                marginTop: 4,
              }}>
                {kpi.sub(kpis)}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
