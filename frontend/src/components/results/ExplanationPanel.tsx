'use client';

import { motion } from 'framer-motion';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { Lightbulb } from 'lucide-react';

export default function ExplanationPanel() {
  const result = useAnalysisStore((s) => s.result);
  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card"
      style={{ padding: '24px' }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>
          AI Analysis Insights
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Key findings from the optimization engine
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {result.explanations.map((text, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.35 + i * 0.08 }}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '10px',
              background: 'rgba(30, 41, 59, 0.3)',
              border: '1px solid var(--border-subtle)',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                minWidth: '28px',
                height: '28px',
                borderRadius: '7px',
                background: 'var(--solar-amber-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '1px',
              }}
            >
              <Lightbulb size={14} color="var(--solar-amber)" />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
              {text}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Assumptions */}
      {result.assumptions && result.assumptions.length > 0 && (
        <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Assumptions & Limitations
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {result.assumptions.map((a, i) => (
              <li
                key={i}
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  paddingLeft: '12px',
                  position: 'relative',
                }}
              >
                <span style={{ position: 'absolute', left: 0, color: 'var(--text-muted)' }}>•</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
