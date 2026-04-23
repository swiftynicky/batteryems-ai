// ─── Formatting Helpers for BatteryEMS AI ───

/** Indian number formatting: 413498 → "4,13,498" */
export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}

/** Round to N decimal places with % suffix */
export function formatPct(value: number, decimals = 1): string {
  return value.toFixed(decimals) + '%';
}

/** kWh formatting with auto MWh conversion */
export function formatKwh(value: number): string {
  if (value >= 1000) return (value / 1000).toFixed(1) + ' MWh';
  return value.toFixed(0) + ' kWh';
}

/** Format years with 1 decimal */
export function formatYears(value: number): string {
  return value.toFixed(1) + ' yrs';
}

/** Format kW values */
export function formatKw(value: number): string {
  return value.toFixed(1) + ' kW';
}
