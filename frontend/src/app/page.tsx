'use client';

import { useAnalysisStore } from '@/store/useAnalysisStore';
import AnalysisForm from '@/components/inputs/AnalysisForm';
import RecommendationCard from '@/components/results/RecommendationCard';
import KPICards from '@/components/results/KPICards';
import DailyEnergyChart from '@/components/charts/DailyEnergyChart';
import SocChart from '@/components/charts/SocChart';
import ScenarioComparison from '@/components/results/ScenarioComparison';
import ExplanationPanel from '@/components/results/ExplanationPanel';
import SensitivityTable from '@/components/results/SensitivityTable';
import { Zap, Sun, Battery, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const result = useAnalysisStore((s) => s.result);
  const loading = useAnalysisStore((s) => s.loading);
  const error = useAnalysisStore((s) => s.error);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Left Panel — Input Form */}
      <AnalysisForm />

      {/* Right Panel — Results Dashboard */}
      <main
        style={{
          flex: 1,
          padding: '28px 32px',
          overflowY: 'auto',
          minHeight: '100vh',
        }}
      >
        {/* Error Toast */}
        {error && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'var(--danger-red-glow)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--danger-red)',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Zap size={16} />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !result && <LoadingSkeleton />}

        {/* Empty State — Before Analysis */}
        {!result && !loading && !error && <EmptyState />}

        {/* Results Dashboard */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>
            <RecommendationCard />
            <KPICards />

            {/* Charts Grid — Side by Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <DailyEnergyChart />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <SocChart />
                <ScenarioComparison />
              </div>
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <ExplanationPanel />
              <SensitivityTable />
            </div>

            {/* Footer Badge */}
            <div
              style={{
                textAlign: 'center',
                padding: '20px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: '10px',
              }}
            >
              BatteryEMS AI · EE3094E B.Tech Minor Project · Solar + Battery Planning Advisor
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Empty State ─── */

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        textAlign: 'center',
        padding: '40px',
      }}
    >
      {/* Animated icon cluster */}
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--solar-amber-glow) 0%, transparent 70%)',
            animation: 'pulse-glow 3s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(20, 184, 166, 0.15))',
            border: '1px solid var(--border-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={32} color="var(--solar-amber)" />
        </div>
        <Sun
          size={20}
          color="var(--solar-amber)"
          style={{ position: 'absolute', top: '8px', right: '8px', opacity: 0.5 }}
        />
        <Battery
          size={20}
          color="var(--battery-teal)"
          style={{ position: 'absolute', bottom: '8px', left: '8px', opacity: 0.5 }}
        />
      </div>

      <h2
        style={{
          fontSize: '26px',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          marginBottom: '10px',
          background: 'linear-gradient(135deg, var(--solar-amber), var(--battery-teal))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Configure Your Building
      </h2>
      <p
        style={{
          fontSize: '15px',
          color: 'var(--text-secondary)',
          maxWidth: '420px',
          lineHeight: 1.6,
          marginBottom: '24px',
        }}
      >
        Select a building preset, adjust system parameters, and click{' '}
        <strong style={{ color: 'var(--solar-amber)' }}>Run Analysis</strong> to get AI-powered
        sizing recommendations with detailed savings projections.
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          borderRadius: '10px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          color: 'var(--solar-amber)',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <ArrowRight size={16} />
        Start by selecting a building type on the left
      </div>
    </div>
  );
}

/* ─── Loading Skeleton ─── */

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>
      {/* Recommendation skeleton */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div className="skeleton" style={{ width: '200px', height: '14px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ width: '350px', height: '24px', marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="skeleton" style={{ width: '120px', height: '32px', borderRadius: '16px' }} />
          <div className="skeleton" style={{ width: '160px', height: '32px', borderRadius: '16px' }} />
          <div className="skeleton" style={{ width: '140px', height: '32px', borderRadius: '16px' }} />
        </div>
      </div>

      {/* KPI skeletons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass-card" style={{ padding: '18px 16px' }}>
            <div className="skeleton" style={{ width: '100px', height: '12px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ width: '80px', height: '28px', marginBottom: '6px' }} />
            <div className="skeleton" style={{ width: '60px', height: '10px' }} />
          </div>
        ))}
      </div>

      {/* Chart skeletons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="skeleton" style={{ width: '180px', height: '14px', marginBottom: '16px' }} />
          <div className="skeleton" style={{ height: '300px' }} />
        </div>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="skeleton" style={{ width: '180px', height: '14px', marginBottom: '16px' }} />
          <div className="skeleton" style={{ height: '300px' }} />
        </div>
      </div>
    </div>
  );
}
