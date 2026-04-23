'use client';

import { motion } from 'framer-motion';
import { useAnalysisStore } from '@/store/useAnalysisStore';

export default function ExplanationPanel() {
  const result = useAnalysisStore((s) => s.result);
  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
          Analysis Insights
        </div>
        <h3 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14, fontWeight: 600,
          color: 'var(--text-loud)',
          letterSpacing: '-0.01em',
        }}>
          Key findings from the optimizer
        </h3>
      </div>

      {/* Insights list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {result.explanations.map((text, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.07 }}
            style={{
              display: 'flex',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 'var(--r-sm)',
              background: 'var(--bg-overlay)',
              borderLeft: '2px solid var(--amber-border)',
              alignItems: 'flex-start',
            }}
          >
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 11, fontWeight: 700,
              color: 'var(--amber)',
              minWidth: 16, paddingTop: 1,
            }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <p style={{
              fontSize: 12.5,
              color: 'var(--text-normal)',
              lineHeight: 1.6,
              flex: 1,
            }}>
              {text}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Assumptions */}
      {result.assumptions && result.assumptions.length > 0 && (
        <div style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: '1px solid var(--border-0)',
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--text-silent)',
            marginBottom: 8,
          }}>
            Assumptions & Limitations
          </div>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {result.assumptions.map((a, i) => (
              <li key={i} style={{
                fontSize: 11, color: 'var(--text-quiet)',
                lineHeight: 1.5,
                display: 'flex', gap: 7, alignItems: 'baseline',
              }}>
                <span style={{ color: 'var(--text-silent)', flexShrink: 0, fontSize: 9 }}>◆</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
