'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DeviceStore {
  devices: string[];
  addDevice: (macAddress: string) => void;
  removeDevice: (macAddress: string) => void;
}

export const useDeviceStore = create<DeviceStore>()(
  persist(
    (set) => ({
      devices: [],
      addDevice: (macAddress) =>
        set((state) => ({
          devices: state.devices.includes(macAddress)
            ? state.devices
            : [...state.devices, macAddress],
        })),
      removeDevice: (macAddress) =>
        set((state) => ({
          devices: state.devices.filter((d) => d !== macAddress),
        })),
    }),
    { name: 'smoke-devices' }
  )
);
