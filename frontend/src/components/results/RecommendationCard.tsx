'use client';

import { motion } from 'framer-motion';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { formatINR } from '@/lib/format';
import { Award, TrendingDown, TrendingUp, Sun, Battery, Sparkles } from 'lucide-react';

export default function RecommendationCard() {
  const result = useAnalysisStore((s) => s.result);
  if (!result) return null;

  const { recommendation, best_by_payback, best_by_savings } = result;
  const sameAsSavings =
    recommendation.solar_kw === best_by_savings.solar_kw &&
    recommendation.battery_kwh === best_by_savings.battery_kwh;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card-glow"
      style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--solar-amber), #D97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={18} color="#0B1120" />
        </div>
        <div>
          <p style={{ fontSize: '11px', color: 'var(--solar-amber)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            AI Recommendation
          </p>
          <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '-2px' }}>
            <span style={{ color: 'var(--solar-amber)' }}>{recommendation.solar_kw} kW</span>
            {' Solar'}
            {recommendation.battery_kwh > 0 && (
              <>
                {' + '}
                <span style={{ color: 'var(--battery-teal)' }}>{recommendation.battery_kwh} kWh</span>
                {' Battery'}
              </>
            )}
          </h2>
        </div>
      </div>

      {/* Score + Key Metrics */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <ScoreBadge score={recommendation.score} />
        <MetricChip
          icon={<TrendingUp size={13} />}
          label="Annual Savings"
          value={`₹${formatINR(recommendation.annual_savings_inr)}`}
          color="var(--savings-green)"
        />
        <MetricChip
          icon={<TrendingDown size={13} />}
          label="Payback"
          value={`${recommendation.simple_payback_years.toFixed(1)} yrs`}
          color="var(--solar-amber)"
        />
      </div>

      {/* Alternatives */}
      <div
        style={{
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <AltBadge
          icon={<TrendingDown size={13} />}
          title="Best Payback"
          solar={best_by_payback.solar_kw}
          battery={best_by_payback.battery_kwh}
          detail={`${best_by_payback.simple_payback_years.toFixed(1)} yrs`}
        />
        {!sameAsSavings && (
          <AltBadge
            icon={<Award size={13} />}
            title="Max Savings"
            solar={best_by_savings.solar_kw}
            battery={best_by_savings.battery_kwh}
            detail={`₹${formatINR(best_by_savings.annual_savings_inr)}`}
          />
        )}
      </div>
    </motion.div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const hue = score > 0.7 ? 142 : score > 0.4 ? 45 : 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '20px',
        background: `hsla(${hue}, 70%, 50%, 0.12)`,
        border: `1px solid hsla(${hue}, 70%, 50%, 0.25)`,
      }}
    >
      <Award size={14} style={{ color: `hsl(${hue}, 70%, 60%)` }} />
      <span style={{ fontSize: '13px', fontWeight: 700, color: `hsl(${hue}, 70%, 65%)` }}>
        Score: {pct}/100
      </span>
    </div>
  );
}

function MetricChip({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function AltBadge({
  icon,
  title,
  solar,
  battery,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  solar: number;
  battery: number;
  detail: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 180px',
        padding: '10px 14px',
        borderRadius: '10px',
        background: 'rgba(30, 41, 59, 0.4)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          <Sun size={12} style={{ display: 'inline', marginRight: '3px', color: 'var(--solar-amber)' }} />
          {solar} kW
          {battery > 0 && (
            <>
              {' + '}
              <Battery size={12} style={{ display: 'inline', marginRight: '3px', color: 'var(--battery-teal)' }} />
              {battery} kWh
            </>
          )}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          {detail}
        </span>
      </div>
    </div>
  );
}
