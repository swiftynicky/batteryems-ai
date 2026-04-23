'use client';

import { motion } from 'framer-motion';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { formatINR, formatPct } from '@/lib/format';

export default function SensitivityTable() {
  const result = useAnalysisStore((s) => s.result);
  if (!result || !result.sensitivity || result.sensitivity.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="glass-card"
      style={{ padding: '24px' }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Sensitivity Analysis
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          How savings vary across irradiance and tariff scenarios
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
          }}
        >
          <thead>
            <tr>
              {['Scenario', 'Annual Bill', 'Savings', 'Savings %', 'Payback'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: h === 'Scenario' ? 'left' : 'right',
                    padding: '10px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.sensitivity.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: i < result.sensitivity.length - 1 ? '1px solid rgba(71, 85, 105, 0.15)' : 'none',
                }}
              >
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {row.label}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                  ₹{formatINR(row.annual_bill_inr)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--savings-green)', fontWeight: 600 }}>
                  ₹{formatINR(row.annual_savings_inr)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                  {formatPct(row.savings_pct)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--solar-amber)', fontWeight: 600 }}>
                  {row.simple_payback_years.toFixed(1)} yrs
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
