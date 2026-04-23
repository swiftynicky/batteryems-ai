'use client';

import dynamic from 'next/dynamic';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import AnalysisForm from '@/components/inputs/AnalysisForm';
import { Zap, Sun, Battery, ArrowRight } from 'lucide-react';

// ── Lazy-load heavy components (recharts, framer-motion, D3) ──
// Prevents dev server from compiling ~400KB+ of chart deps on cold start
const RecommendationCard = dynamic(() => import('@/components/results/RecommendationCard'), { ssr: false });
const KPICards           = dynamic(() => import('@/components/results/KPICards'), { ssr: false });
const DailyEnergyChart   = dynamic(() => import('@/components/charts/DailyEnergyChart'), { ssr: false });
const SocChart           = dynamic(() => import('@/components/charts/SocChart'), { ssr: false });
const ScenarioComparison = dynamic(() => import('@/components/results/ScenarioComparison'), { ssr: false });
const ExplanationPanel   = dynamic(() => import('@/components/results/ExplanationPanel'), { ssr: false });
const SensitivityTable   = dynamic(() => import('@/components/results/SensitivityTable'), { ssr: false });

export default function HomePage() {
  const result  = useAnalysisStore((s) => s.result);
  const loading = useAnalysisStore((s) => s.loading);
  const error   = useAnalysisStore((s) => s.error);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AnalysisForm />

      {/* Dashboard canvas */}
      <main style={{
        flex: 1,
        padding: '24px 28px',
        overflowY: 'auto',
        minHeight: '100vh',
      }}>

        {/* Error banner */}
        {error && (
          <div style={{
            padding: '11px 16px',
            borderRadius: 'var(--r-md)',
            background: 'var(--red-muted)',
            border: '1px solid rgba(217, 79, 79, 0.25)',
            color: 'var(--red)',
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <Zap size={14} />
            {error}
          </div>
        )}

        {loading && !result && <LoadingSkeleton />}
        {!result && !loading && !error && <EmptyState />}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1280 }}>
            <RecommendationCard />
            <KPICards />

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
              <DailyEnergyChart />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <SocChart />
                <ScenarioComparison />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ExplanationPanel />
              <SensitivityTable />
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '82vh',
      textAlign: 'center',
      padding: 40,
      gap: 24,
    }}>
      {/* Icon cluster */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 20,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-amber)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <Zap size={28} color="var(--amber)" />
        </div>
        <Sun size={16} color="var(--amber)"
          style={{ position: 'absolute', top: -6, right: -6, opacity: 0.6 }} />
        <Battery size={16} color="var(--teal)"
          style={{ position: 'absolute', bottom: -6, left: -6, opacity: 0.6 }} />
      </div>

      <div>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 22, fontWeight: 700,
          color: 'var(--text-loud)',
          letterSpacing: '-0.025em',
          marginBottom: 8,
        }}>
          Configure your building
        </h2>
        <p style={{
          fontSize: 14,
          color: 'var(--text-quiet)',
          maxWidth: 380,
          lineHeight: 1.65,
        }}>
          Select a building preset, adjust system parameters in the panel,
          then click <strong style={{ color: 'var(--amber)' }}>Run Analysis</strong> for
          AI-powered sizing recommendations with detailed savings projections.
        </p>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px',
        borderRadius: 'var(--r-md)',
        background: 'var(--amber-muted)',
        border: '1px solid var(--amber-border)',
        color: 'var(--amber)',
        fontSize: 12, fontWeight: 600,
      }}>
        <ArrowRight size={13} />
        Start with a building type on the left
      </div>
    </div>
  );
}

/* ─── Loading Skeleton ─── */

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1280 }}>
      <div className="card" style={{ padding: '22px 24px' }}>
        <div className="skeleton" style={{ width: 160, height: 12, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: 280, height: 22, marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[100, 140, 120].map((w, i) => (
            <div key={i} className="skeleton" style={{ width: w, height: 28, borderRadius: 14 }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card" style={{ padding: '14px 12px' }}>
            <div className="skeleton" style={{ width: 80, height: 10, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: 70, height: 22 }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="skeleton" style={{ width: 160, height: 12, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 280 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="skeleton" style={{ height: 180 }} />
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div className="skeleton" style={{ height: 180 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
