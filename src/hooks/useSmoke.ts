import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as smokeApi from '@/lib/smoke-api';
import type { ZoneRequest } from '@/types/smoke';
// import type { AiAnalysisResult } from '@/app/api/ai-analysis/route'; // AI 분석 기능 (비활성화)

export const useLatestSensor = (macAddress: string) =>
  useQuery({
    queryKey: ['sensor', 'latest', macAddress],
    queryFn: () => smokeApi.getLatestSensorData(macAddress),
    refetchInterval: 5000,
    enabled: !!macAddress,
    retry: false,
  });

export const useSensorHistory = (macAddress: string) =>
  useQuery({
    queryKey: ['sensor', 'history', macAddress],
    queryFn: () => smokeApi.getSensorHistory(macAddress),
    enabled: !!macAddress,
    retry: false,
  });

export const useZones = () =>
  useQuery({
    queryKey: ['zones'],
    queryFn: smokeApi.getZones,
  });

// AI 분석 기능 (비활성화)
// export const useAiAnalysis = (macAddress: string, demo?: string | null) =>
//   useQuery<AiAnalysisResult>({
//     queryKey: ['ai-analysis', macAddress, demo ?? 'live'],
//     queryFn: async () => {
//       const params = new URLSearchParams({ mac: macAddress });
//       if (demo) params.set('demo', demo);
//       const res = await fetch(`/api/ai-analysis?${params.toString()}`);
//       if (!res.ok) throw new Error('AI 분석 실패');
//       return res.json();
//     },
//     refetchInterval: demo ? false : 30000,
//     enabled: !!macAddress,
//     retry: false,
//   });

export const useCreateZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ZoneRequest) => smokeApi.createZone(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zones'] }),
  });
};
