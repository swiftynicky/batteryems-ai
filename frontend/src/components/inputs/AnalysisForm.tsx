'use client';

import { useEffect } from 'react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import {
  Sun,
  Battery,
  Zap,
  Building2,
  MapPin,
  Gauge,
  IndianRupee,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function AnalysisForm() {
  const {
    presets,
    presetsLoaded,
    presetId,
    monthlyKwh,
    location,
    tariffType,
    flatRate,
    feedInRate,
    maxSolarKw,
    maxBatteryKwh,
    solarCapex,
    batteryCapex,
    loading,
    loadPresets,
    selectPreset,
    setField,
    analyze,
  } = useAnalysisStore();

  useEffect(() => {
    if (!presetsLoaded) loadPresets();
  }, [presetsLoaded, loadPresets]);

  const selectedPreset = presets.find((p) => p.id === presetId);

  return (
    <aside
      style={{
        width: '360px',
        minWidth: '360px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        padding: '24px 20px',
        borderRight: '1px solid var(--border-subtle)',
        background: 'rgba(11, 17, 32, 0.95)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--solar-amber), var(--battery-teal))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={20} color="#0B1120" strokeWidth={2.5} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, var(--solar-amber), var(--battery-teal))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              BatteryEMS AI
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-2px' }}>
              Solar + Battery Planning Advisor
            </p>
          </div>
        </div>
      </div>

      {/* Building Preset */}
      <Section icon={<Building2 size={15} />} title="Building Profile">
        <label style={labelStyle}>Building Type</label>
        <select
          className="input-field"
          value={presetId}
          onChange={(e) => selectPreset(e.target.value)}
        >
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {selectedPreset && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
            {selectedPreset.description}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
          <div>
            <label style={labelStyle}>Monthly Load (kWh)</label>
            <input
              type="number"
              className="input-field"
              value={monthlyKwh}
              onChange={(e) => setField('monthlyKwh', Number(e.target.value))}
            />
          </div>
          <div>
            <label style={labelStyle}>
              <MapPin size={11} style={{ display: 'inline', marginRight: '3px' }} />
              Location
            </label>
            <input
              type="text"
              className="input-field"
              value={location}
              onChange={(e) => setField('location', e.target.value)}
            />
          </div>
        </div>
      </Section>

      {/* Tariff */}
      <Section icon={<IndianRupee size={15} />} title="Electricity Tariff">
        <label style={labelStyle}>Tariff Type</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['flat', 'tou'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setField('tariffType', t)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: `1px solid ${tariffType === t ? 'var(--solar-amber)' : 'var(--border-subtle)'}`,
                background: tariffType === t ? 'var(--solar-amber-glow)' : 'transparent',
                color: tariffType === t ? 'var(--solar-amber)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              {t === 'flat' ? 'Flat Rate' : 'Time-of-Use'}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
          <div>
            <label style={labelStyle}>Grid Rate (₹/kWh)</label>
            <input
              type="number"
              step="0.5"
              className="input-field"
              value={flatRate}
              onChange={(e) => setField('flatRate', Number(e.target.value))}
            />
          </div>
          <div>
            <label style={labelStyle}>Feed-in (₹/kWh)</label>
            <input
              type="number"
              step="0.5"
              className="input-field"
              value={feedInRate}
              onChange={(e) => setField('feedInRate', Number(e.target.value))}
            />
          </div>
        </div>
      </Section>

      {/* System Constraints */}
      <Section icon={<Gauge size={15} />} title="System Sizing">
        <SliderField
          icon={<Sun size={14} color="var(--solar-amber)" />}
          label="Max Solar Capacity"
          value={maxSolarKw}
          min={0}
          max={100}
          unit="kW"
          color="var(--solar-amber)"
          onChange={(v) => setField('maxSolarKw', v)}
        />
        <SliderField
          icon={<Battery size={14} color="var(--battery-teal)" />}
          label="Max Battery Capacity"
          value={maxBatteryKwh}
          min={0}
          max={100}
          unit="kWh"
          color="var(--battery-teal)"
          onChange={(v) => setField('maxBatteryKwh', v)}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
          <div>
            <label style={labelStyle}>Solar CapEx (₹/kW)</label>
            <input
              type="number"
              className="input-field"
              value={solarCapex}
              onChange={(e) => setField('solarCapex', Number(e.target.value))}
            />
          </div>
          <div>
            <label style={labelStyle}>Battery CapEx (₹/kWh)</label>
            <input
              type="number"
              className="input-field"
              value={batteryCapex}
              onChange={(e) => setField('batteryCapex', Number(e.target.value))}
            />
          </div>
        </div>
      </Section>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Analyze Button */}
      <button
        id="analyze-button"
        onClick={analyze}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          border: 'none',
          background: loading
            ? 'rgba(245, 158, 11, 0.3)'
            : 'linear-gradient(135deg, var(--solar-amber), #D97706)',
          color: loading ? 'var(--solar-amber)' : '#0B1120',
          fontSize: '15px',
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(245, 158, 11, 0.3)',
          letterSpacing: '0.02em',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            Analyzing…
          </>
        ) : (
          <>
            Run Analysis
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </aside>
  );
}

// ─── Sub-components ───

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: '14px',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        background: 'rgba(30, 41, 59, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function SliderField({
  icon,
  label,
  value,
  min,
  max,
  unit,
  color,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '5px' }}>
          {icon}
          {label}
        </label>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={max <= 20 ? 1 : 5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${
            ((value - min) / (max - min)) * 100
          }%, rgba(71, 85, 105, 0.4) ${((value - min) / (max - min)) * 100}%, rgba(71, 85, 105, 0.4) 100%)`,
        }}
      />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--text-muted)',
  marginBottom: '4px',
  display: 'block',
};
