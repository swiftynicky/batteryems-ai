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
  Square,
} from 'lucide-react';

/* ─── Fallback presets when backend is offline ─── */
const FALLBACK_PRESETS = [
  { id: 'apartment_society', name: '100-Unit Apartment Society', description: '100 residential units in Kochi with shared rooftop.', monthly_kwh: 12000, roof_area_sqm: 450, location: 'Kochi', suggested_max_solar_kw: 50, suggested_max_battery_kwh: 40 },
  { id: 'office_building', name: 'Commercial Office', description: 'Medium office building with weekday-heavy load.', monthly_kwh: 8000, roof_area_sqm: 300, location: 'Kochi', suggested_max_solar_kw: 40, suggested_max_battery_kwh: 30 },
  { id: 'hospital', name: 'Hospital / Critical Load', description: 'Hospital with 24/7 base load and reliability needs.', monthly_kwh: 25000, roof_area_sqm: 600, location: 'Kochi', suggested_max_solar_kw: 80, suggested_max_battery_kwh: 60 },
  { id: 'school', name: 'School / College Campus', description: 'Educational campus with daytime-dominant demand.', monthly_kwh: 5000, roof_area_sqm: 350, location: 'Kochi', suggested_max_solar_kw: 30, suggested_max_battery_kwh: 20 },
];

export default function AnalysisForm() {
  const {
    presets,
    presetsLoaded,
    presetId,
    monthlyKwh,
    roofArea,
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

  /* Use API presets if available, else fallback */
  const availablePresets = presets.length > 0 ? presets : FALLBACK_PRESETS;
  const selectedPreset = availablePresets.find((p) => p.id === presetId);

  /* Apply fallback preset on first render if API failed */
  useEffect(() => {
    if (presetsLoaded && presets.length === 0 && FALLBACK_PRESETS.length > 0) {
      const fb = FALLBACK_PRESETS[0];
      setField('presetId', fb.id);
      setField('monthlyKwh', fb.monthly_kwh);
      setField('roofArea', fb.roof_area_sqm);
      setField('location', fb.location);
      setField('maxSolarKw', fb.suggested_max_solar_kw);
      setField('maxBatteryKwh', fb.suggested_max_battery_kwh);
    }
  }, [presetsLoaded, presets.length, setField]);

  const handlePresetChange = (id: string) => {
    /* Try store presets first, fall back to local */
    const fromStore = presets.find((p) => p.id === id);
    if (fromStore) {
      selectPreset(id);
    } else {
      const fb = FALLBACK_PRESETS.find((p) => p.id === id);
      if (fb) {
        setField('presetId', fb.id);
        setField('monthlyKwh', fb.monthly_kwh);
        setField('roofArea', fb.roof_area_sqm);
        setField('location', fb.location);
        setField('maxSolarKw', fb.suggested_max_solar_kw);
        setField('maxBatteryKwh', fb.suggested_max_battery_kwh);
      }
    }
  };

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minWidth: 'var(--sidebar-w)',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border-1)',
      background: 'var(--bg-raised)',
      zIndex: 10,
    }}>

      {/* ── Wordmark ── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--amber) 0%, var(--teal) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Zap size={17} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 15, fontWeight: 700,
              color: 'var(--text-loud)',
              letterSpacing: '-0.02em',
            }}>
              BatteryEMS AI
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-silent)', marginTop: 1 }}>
              Solar + Battery Planning Advisor
            </div>
          </div>
        </div>

        {/* Amber rule */}
        <div style={{
          height: 1, marginTop: 16,
          background: 'linear-gradient(90deg, var(--amber-border), transparent)',
        }} />
      </div>

      {/* ── Sections ── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>

        {/* Building Profile */}
        <SideSection icon={<Building2 size={13} />} title="Building Profile">
          <FieldLabel>Building Type</FieldLabel>
          <select
            className="input-field"
            value={presetId}
            onChange={(e) => handlePresetChange(e.target.value)}
          >
            {availablePresets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {selectedPreset && (
            <div style={{
              fontSize: 11, color: 'var(--text-quiet)',
              lineHeight: 1.5, marginTop: 2,
              padding: '6px 8px',
              background: 'var(--bg-overlay)',
              borderRadius: 'var(--r-sm)',
              borderLeft: '2px solid var(--amber-border)',
            }}>
              {selectedPreset.description}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            <div>
              <FieldLabel>Monthly Load (kWh)</FieldLabel>
              <input
                type="number"
                className="input-field"
                value={monthlyKwh}
                onChange={(e) => setField('monthlyKwh', Number(e.target.value))}
              />
            </div>
            <div>
              <FieldLabel>
                <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />
                Location
              </FieldLabel>
              <input
                type="text"
                className="input-field"
                value={location}
                onChange={(e) => setField('location', e.target.value)}
              />
            </div>
          </div>

          <div>
            <FieldLabel>
              <Square size={10} style={{ display: 'inline', marginRight: 3 }} />
              Roof Area (m²)
            </FieldLabel>
            <input
              type="number"
              className="input-field"
              value={roofArea}
              onChange={(e) => setField('roofArea', Number(e.target.value))}
            />
          </div>
        </SideSection>

        {/* Electricity Tariff */}
        <SideSection icon={<IndianRupee size={13} />} title="Electricity Tariff">
          <FieldLabel>Tariff Type</FieldLabel>
          <div className="pill-toggle">
            {(['flat', 'tou'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setField('tariffType', t)}
                className={tariffType === t ? 'active' : ''}
              >
                {t === 'flat' ? 'Flat Rate' : 'Time-of-Use'}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
            <div>
              <FieldLabel>Grid Rate (₹/kWh)</FieldLabel>
              <input
                type="number"
                step="0.5"
                className="input-field"
                value={flatRate}
                onChange={(e) => setField('flatRate', Number(e.target.value))}
              />
            </div>
            <div>
              <FieldLabel>Feed-In (₹/kWh)</FieldLabel>
              <input
                type="number"
                step="0.5"
                className="input-field"
                value={feedInRate}
                onChange={(e) => setField('feedInRate', Number(e.target.value))}
              />
            </div>
          </div>
        </SideSection>

        {/* System Sizing */}
        <SideSection icon={<Gauge size={13} />} title="System Sizing">
          <SliderRow
            icon={<Sun size={12} />}
            label="Max Solar Capacity"
            value={maxSolarKw}
            min={0} max={100}
            unit="kW"
            accentVar="--amber"
            onChange={(v) => setField('maxSolarKw', v)}
          />
          <SliderRow
            icon={<Battery size={12} />}
            label="Max Battery Capacity"
            value={maxBatteryKwh}
            min={0} max={100}
            unit="kWh"
            accentVar="--teal"
            onChange={(v) => setField('maxBatteryKwh', v)}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
            <div>
              <FieldLabel>Solar CapEx (₹/kW)</FieldLabel>
              <input
                type="number"
                className="input-field"
                value={solarCapex}
                onChange={(e) => setField('solarCapex', Number(e.target.value))}
              />
            </div>
            <div>
              <FieldLabel>Battery CapEx (₹/kWh)</FieldLabel>
              <input
                type="number"
                className="input-field"
                value={batteryCapex}
                onChange={(e) => setField('batteryCapex', Number(e.target.value))}
              />
            </div>
          </div>
        </SideSection>

      </div>

      {/* ── Footer Run Button ── */}
      <div style={{ padding: '0 20px 20px' }}>
        <button
          id="analyze-button"
          className="run-btn"
          onClick={analyze}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              Run Analysis
              <ArrowRight size={15} />
            </>
          )}
        </button>

      </div>
    </aside>
  );
}

// ─── Sub-components ───

function SideSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border-1)',
      background: 'var(--bg-input)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        color: 'var(--text-silent)',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block',
      fontSize: 11,
      fontWeight: 500,
      color: 'var(--text-quiet)',
      marginBottom: 4,
    }}>
      {children}
    </label>
  );
}

function SliderRow({
  icon,
  label,
  value,
  min,
  max,
  unit,
  accentVar,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  accentVar: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const accentColor = `var(${accentVar})`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: accentColor }}>
          {icon}
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-quiet)' }}>{label}</span>
        </div>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: accentColor,
          fontFamily: "'Space Grotesk', sans-serif",
          fontVariantNumeric: 'tabular-nums',
        }}>
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
          background: `linear-gradient(to right, ${accentColor} ${pct}%, var(--bg-overlay) ${pct}%)`,
        }}
      />
    </div>
  );
}
