'use client';

import { motion } from 'framer-motion';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { formatINR } from '@/lib/format';
import { Sun, Battery, TrendingDown, TrendingUp, Award, CheckCircle2 } from 'lucide-react';

export default function RecommendationCard() {
  const result = useAnalysisStore((s) => s.result);
  if (!result) return null;

  const { recommendation, best_by_payback, best_by_savings } = result;
  const sameAsSavings =
    recommendation.solar_kw === best_by_savings.solar_kw &&
    recommendation.battery_kwh === best_by_savings.battery_kwh;

  const pct = Math.round(recommendation.score * 100);
  const scoreHue = recommendation.score > 0.7 ? 142 : recommendation.score > 0.4 ? 45 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-amber)',
        borderRadius: 'var(--r-lg)',
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Left amber accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 3, height: '100%',
        background: 'linear-gradient(180deg, var(--amber) 0%, var(--teal) 100%)',
        borderRadius: 'var(--r-lg) 0 0 var(--r-lg)',
      }} />

      <div style={{ paddingLeft: 16 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--amber)',
              marginBottom: 5,
            }}>
              AI Recommendation
            </div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 24, fontWeight: 700,
              letterSpacing: '-0.03em', lineHeight: 1.1,
              color: 'var(--text-loud)',
            }}>
              <span style={{ color: 'var(--amber)' }}>{recommendation.solar_kw} kW</span>
              {' Solar'}
              {recommendation.battery_kwh > 0 && (
                <>
                  {' + '}
                  <span style={{ color: 'var(--teal)' }}>{recommendation.battery_kwh} kWh</span>
                  {' Battery'}
                </>
              )}
            </h2>
          </div>

          {/* Score badge */}
          <div style={{
            padding: '8px 16px',
            borderRadius: 'var(--r-md)',
            background: `hsla(${scoreHue}, 60%, 50%, 0.1)`,
            border: `1px solid hsla(${scoreHue}, 60%, 50%, 0.2)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 26, fontWeight: 700,
              color: `hsl(${scoreHue}, 65%, 58%)`,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {pct}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-quiet)', marginTop: 2 }}>
              / 100 SCORE
            </div>
          </div>
        </div>

        {/* Metric chips */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <MetricChip
            icon={<TrendingUp size={12} />}
            label="Annual Savings"
            value={`₹${formatINR(recommendation.annual_savings_inr)}`}
            color="var(--green)"
          />
          <MetricChip
            icon={<TrendingDown size={12} />}
            label="Simple Payback"
            value={`${recommendation.simple_payback_years.toFixed(1)} yrs`}
            color="var(--amber)"
          />
        </div>

        {/* Alternatives row */}
        <div style={{
          paddingTop: 14,
          borderTop: '1px solid var(--border-0)',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 10, color: 'var(--text-silent)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            display: 'flex', alignItems: 'center', marginRight: 4 }}>
            Alternatives
          </span>
          <AltBadge
            icon={<TrendingDown size={11} />}
            title="Best Payback"
            solar={best_by_payback.solar_kw}
            battery={best_by_payback.battery_kwh}
            detail={`${best_by_payback.simple_payback_years.toFixed(1)} yrs`}
          />
          {!sameAsSavings && (
            <AltBadge
              icon={<Award size={11} />}
              title="Max Savings"
              solar={best_by_savings.solar_kw}
              battery={best_by_savings.battery_kwh}
              detail={`₹${formatINR(best_by_savings.annual_savings_inr)}`}
            />
          )}
          {sameAsSavings && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, color: 'var(--green)',
            }}>
              <CheckCircle2 size={13} />
              <span>Recommendation is optimal across all criteria</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MetricChip({
  icon, label, value, color,
}: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '6px 12px',
      borderRadius: 'var(--r-sm)',
      background: 'var(--bg-overlay)',
      border: '1px solid var(--border-1)',
    }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-quiet)' }}>{label}</span>
      <span style={{
        fontSize: 14, fontWeight: 700, color,
        fontFamily: "'Space Grotesk', sans-serif",
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
    </div>
  );
}

function AltBadge({
  icon, title, solar, battery, detail,
}: {
  icon: React.ReactNode; title: string; solar: number; battery: number; detail: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 12px',
      borderRadius: 'var(--r-sm)',
      border: '1px solid var(--border-1)',
      background: 'var(--bg-overlay)',
    }}>
      <span style={{ color: 'var(--text-quiet)' }}>{icon}</span>
      <span style={{ fontSize: 10, color: 'var(--text-quiet)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </span>
      <span style={{ width: 1, height: 12, background: 'var(--border-1)' }} />
      <span style={{ fontSize: 12, color: 'var(--text-normal)', fontVariantNumeric: 'tabular-nums' }}>
        <Sun size={10} style={{ display: 'inline', marginRight: 3, color: 'var(--amber)' }} />
        {solar} kW
        {battery > 0 && (
          <>
            {' + '}
            <Battery size={10} style={{ display: 'inline', marginRight: 3, color: 'var(--teal)' }} />
            {battery} kWh
          </>
        )}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-quiet)' }}>{detail}</span>
    </div>
  );
}
