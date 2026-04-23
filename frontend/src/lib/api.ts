// ─── API Client for BatteryEMS AI ───

import type { PresetsResponse, AnalyzeRequest, AnalyzeResponse } from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchPresets(): Promise<PresetsResponse> {
  const res = await fetch(`${API_BASE}/api/presets`);
  if (!res.ok) throw new Error('Failed to fetch presets');
  return res.json();
}

export async function runAnalysis(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`Analysis failed: ${text}`);
  }
  return res.json();
}
