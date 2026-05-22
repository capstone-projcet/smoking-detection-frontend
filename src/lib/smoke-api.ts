import api from './api';
import type { SmokeEventResponse, Zone, ZoneRequest } from '@/types/smoke';

export const getLatestSensorData = (macAddress: string) =>
  api.get<SmokeEventResponse>(`/api/v1/smoke-events/latest/${macAddress}`).then((r) => r.data);

export const getSensorHistory = (macAddress: string) =>
  api.get<SmokeEventResponse[]>(`/api/v1/smoke-events/history/${macAddress}`).then((r) => r.data);

export const getZones = () =>
  api.get<Zone[]>('/api/v1/zones').then((r) => r.data);

export const createZone = (data: ZoneRequest) =>
  api.post<Zone>('/api/v1/zones', data).then((r) => r.data);
