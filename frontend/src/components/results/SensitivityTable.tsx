'use client';

import { motion } from 'framer-motion';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { formatINR, formatPct } from '@/lib/format';

export default function SensitivityTable() {
  const result = useAnalysisStore((s) => s.result);
  if (!result || !result.sensitivity || result.sensitivity.length === 0) return null;

  const maxSavings = Math.max(...result.sensitivity.map((r) => r.annual_savings_inr));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="card"
      style={{ padding: '20px 22px' }}
    >
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--text-silent)',
          marginBottom: 4,
        }}>
          Sensitivity Analysis
        </div>
        <h3 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14, fontWeight: 600,
          color: 'var(--text-loud)',
          letterSpacing: '-0.01em',
        }}>
          Savings across irradiance + tariff scenarios
        </h3>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {['Scenario', 'Annual Bill', 'Savings', 'Savings %', 'Payback'].map((h) => (
                <th
                  key={h}
                  style={{ textAlign: h === 'Scenario' ? 'left' : 'right' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.sensitivity.map((row, i) => {
              const barWidth = maxSavings > 0
                ? Math.round((row.annual_savings_inr / maxSavings) * 100)
                : 0;

              return (
                <tr key={i}>
                  <td style={{ color: 'var(--text-normal)', fontWeight: 500 }}>
                    {row.label}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-quiet)' }}>
                    ₹{formatINR(row.annual_bill_inr)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 12px' }}>
                    {/* Inline bar chart */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      justifyContent: 'flex-end',
                    }}>
                      <span style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        color: 'var(--green)', fontWeight: 600, fontSize: 12,
                        fontVariantNumeric: 'tabular-nums',
                        minWidth: 70, textAlign: 'right',
                      }}>
                        ₹{formatINR(row.annual_savings_inr)}
                      </span>
                      <div style={{
                        width: 48, height: 4,
                        borderRadius: 2,
                        background: 'var(--bg-overlay)',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}>
                        <div style={{
                          width: `${barWidth}%`, height: '100%',
                          background: 'var(--green)',
                          borderRadius: 2,
                        }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-normal)' }}>
                    {formatPct(row.savings_pct)}
                  </td>
                  <td style={{
                    textAlign: 'right',
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: 'var(--amber)', fontWeight: 600, fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {row.simple_payback_years === null ? 'N/A' : `${row.simple_payback_years.toFixed(1)} yrs`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
