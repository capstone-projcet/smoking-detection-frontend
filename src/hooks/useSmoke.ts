import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as smokeApi from '@/lib/smoke-api';
import type { ZoneRequest } from '@/types/smoke';

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

export const useCreateZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ZoneRequest) => smokeApi.createZone(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zones'] }),
  });
};
