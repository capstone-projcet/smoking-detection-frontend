export interface SmokeEventResponse {
  id: number;
  macAddress: string;
  pm25: number;
  gas: number;
  temperature: number;
  humidity: number;
  detectedAt: string;
}

export interface Zone {
  id: number;
  buildingName: string;
  floor: number;
  description: string | null;
  created_at: string;
  updatedAt: string;
}

export interface ZoneRequest {
  buildingName: string;
  floor: number;
  description?: string;
}

export type AlertLevel = 'normal' | 'warning' | 'danger';

export function getPm25Level(value: number): AlertLevel {
  if (value >= 75) return 'danger';
  if (value >= 35) return 'warning';
  return 'normal';
}

export function getGasLevel(value: number): AlertLevel {
  if (value >= 300) return 'danger';
  if (value >= 100) return 'warning';
  return 'normal';
}

export function getOverallLevel(event: SmokeEventResponse): AlertLevel {
  const levels = [getPm25Level(event.pm25), getGasLevel(event.gas)];
  if (levels.includes('danger')) return 'danger';
  if (levels.includes('warning')) return 'warning';
  return 'normal';
}
