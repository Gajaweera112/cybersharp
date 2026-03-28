import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GraphicsSettings {
  bloom: boolean;
  chromatic: boolean;
  scanlines: boolean;
  rainQuality: 'low' | 'medium' | 'high';
}

interface SettingsState {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  fov: number;
  graphics: GraphicsSettings;

  setMasterVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSFXVolume: (volume: number) => void;
  setMouseSensitivity: (sensitivity: number) => void;
  setFOV: (fov: number) => void;
  setGraphicsSettings: (settings: Partial<GraphicsSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  masterVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  mouseSensitivity: 0.002,
  fov: Math.PI / 3,
  graphics: {
    bloom: true,
    chromatic: true,
    scanlines: true,
    rainQuality: 'high' as const,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(1, volume)) }),

      setMusicVolume: (volume) => set({ musicVolume: Math.max(0, Math.min(1, volume)) }),

      setSFXVolume: (volume) => set({ sfxVolume: Math.max(0, Math.min(1, volume)) }),

      setMouseSensitivity: (sensitivity) => set({ mouseSensitivity: sensitivity }),

      setFOV: (fov) => set({ fov }),

      setGraphicsSettings: (settings) => set((state) => ({
        graphics: { ...state.graphics, ...settings },
      })),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'cybersharp-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
