'use client';

import { create } from 'zustand';
import type {
  AnalyzeResponse,
  BuildingPreset,
  PresetsResponse,
} from '@/types/api';
import { fetchPresets, runAnalysis } from '@/lib/api';

interface AnalysisState {
  // Presets
  presets: BuildingPreset[];
  presetsLoaded: boolean;
  defaultTariff: { flat_rate: number; feed_in_rate: number };
  defaultCosts: { solar_capex: number; battery_capex: number };

  // Input state
  presetId: string;
  monthlyKwh: number;
  roofArea: number;
  location: string;
  tariffType: 'flat' | 'tou';
  flatRate: number;
  feedInRate: number;
  maxSolarKw: number;
  maxBatteryKwh: number;
  solarCapex: number;
  batteryCapex: number;

  // Response state
  result: AnalyzeResponse | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadPresets: () => Promise<void>;
  selectPreset: (presetId: string) => void;
  setField: (field: string, value: number | string) => void;
  analyze: () => Promise<void>;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  // Presets
  presets: [],
  presetsLoaded: false,
  defaultTariff: { flat_rate: 7.0, feed_in_rate: 2.5 },
  defaultCosts: { solar_capex: 34000, battery_capex: 9000 },

  // Input defaults
  presetId: 'apartment_society',
  monthlyKwh: 12000,
  roofArea: 450,
  location: 'Kochi',
  tariffType: 'flat',
  flatRate: 7.0,
  feedInRate: 2.5,
  maxSolarKw: 50,
  maxBatteryKwh: 40,
  solarCapex: 34000,
  batteryCapex: 9000,

  // Response
  result: null,
  loading: false,
  error: null,

  loadPresets: async () => {
    try {
      const data: PresetsResponse = await fetchPresets();
      const first = data.building_presets[0];
      set({
        presets: data.building_presets,
        presetsLoaded: true,
        defaultTariff: {
          flat_rate: data.defaults.tariff.flat_rate_inr_per_kwh,
          feed_in_rate: data.defaults.tariff.feed_in_rate_inr_per_kwh,
        },
        defaultCosts: {
          solar_capex: data.defaults.costs.solar_capex_inr_per_kw,
          battery_capex: data.defaults.costs.battery_capex_inr_per_kwh,
        },
        flatRate: data.defaults.tariff.flat_rate_inr_per_kwh,
        feedInRate: data.defaults.tariff.feed_in_rate_inr_per_kwh,
        solarCapex: data.defaults.costs.solar_capex_inr_per_kw,
        batteryCapex: data.defaults.costs.battery_capex_inr_per_kwh,
        // Select first preset
        presetId: first?.id ?? '',
        monthlyKwh: first?.monthly_kwh ?? 12000,
        roofArea: first?.roof_area_sqm ?? 450,
        location: first?.location ?? 'Kochi',
        maxSolarKw: first?.suggested_max_solar_kw ?? 50,
        maxBatteryKwh: first?.suggested_max_battery_kwh ?? 40,
      });
    } catch {
      console.error('Failed to load presets');
    }
  },

  selectPreset: (presetId: string) => {
    const preset = get().presets.find((p) => p.id === presetId);
    if (!preset) return;
    set({
      presetId: preset.id,
      monthlyKwh: preset.monthly_kwh,
      roofArea: preset.roof_area_sqm,
      location: preset.location,
      maxSolarKw: preset.suggested_max_solar_kw,
      maxBatteryKwh: preset.suggested_max_battery_kwh,
    });
  },

  setField: (field: string, value: number | string) => {
    set({ [field]: value } as Partial<AnalysisState>);
  },

  analyze: async () => {
    const s = get();
    set({ loading: true, error: null });

    // Build candidate arrays
    const solarStep = Math.max(10, Math.round(s.maxSolarKw / 5));
    const batteryStep = Math.max(10, Math.round(s.maxBatteryKwh / 4));
    const candidateSolar = [0];
    for (let v = solarStep; v <= s.maxSolarKw; v += solarStep) candidateSolar.push(v);
    if (!candidateSolar.includes(s.maxSolarKw)) candidateSolar.push(s.maxSolarKw);

    const candidateBattery = [0];
    for (let v = batteryStep; v <= s.maxBatteryKwh; v += batteryStep) candidateBattery.push(v);
    if (!candidateBattery.includes(s.maxBatteryKwh)) candidateBattery.push(s.maxBatteryKwh);

    try {
      const result = await runAnalysis({
        building: {
          preset_id: s.presetId,
          monthly_kwh: s.monthlyKwh,
          roof_area_sqm: s.roofArea,
          location: s.location,
          load_source: 'synthetic',
        },
        tariff: {
          type: s.tariffType,
          flat_rate_inr_per_kwh: s.flatRate,
          tou: null,
          feed_in_rate_inr_per_kwh: s.feedInRate,
        },
        system_constraints: {
          max_solar_kw: s.maxSolarKw,
          max_battery_kwh: s.maxBatteryKwh,
          solar_capex_inr_per_kw: s.solarCapex,
          battery_capex_inr_per_kwh: s.batteryCapex,
        },
        analysis: {
          candidate_solar_kw: candidateSolar,
          candidate_battery_kwh: candidateBattery,
          objective: 'balanced',
          scheduler_mode: 'rule_based',
          representative_day_type: 'summer_weekday',
        },
      });
      set({ result, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Analysis failed',
        loading: false,
      });
    }
  },
}));
