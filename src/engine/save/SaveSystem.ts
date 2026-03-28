import { PlayerStats } from '../rpg/RPGSystem';
import { storageAdapter } from '../../storage/IndexedDBAdapter';

export class SaveSystem {
  private currentSaveSlot: number = 1;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await storageAdapter.initialize();
    console.log('Save system initialized with local storage');
  }

  async saveGame(saveData: SaveData): Promise<boolean> {
    try {
      await storageAdapter.saveSave(this.currentSaveSlot, saveData);

      localStorage.setItem(`cybersharp-save-${this.currentSaveSlot}`, JSON.stringify(saveData));

      console.log(`Game saved to slot ${this.currentSaveSlot}`);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  async loadGame(slot: number = 1): Promise<SaveData | null> {
    this.currentSaveSlot = slot;

    try {
      const data = await storageAdapter.loadSave(slot);

      if (data) {
        return data as SaveData;
      }

      const localSave = localStorage.getItem(`cybersharp-save-${slot}`);
      if (localSave) {
        return JSON.parse(localSave) as SaveData;
      }

      return null;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  async deleteSave(slot: number): Promise<boolean> {
    try {
      await storageAdapter.deleteSave(slot);
      localStorage.removeItem(`cybersharp-save-${slot}`);
      console.log(`Save slot ${slot} deleted`);
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  async listSaves(): Promise<SaveSlotInfo[]> {
    const slots: SaveSlotInfo[] = [];

    try {
      const savedSlots = await storageAdapter.listSaves();

      for (const saved of savedSlots) {
        const data = await storageAdapter.loadSave(saved.slot);
        if (data) {
          const saveData = data as SaveData;
          slots.push({
            slot: saved.slot,
            timestamp: saved.timestamp,
            playerLevel: saveData.playerStats.level,
            playtime: saveData.playtime,
            location: 'Night City',
          });
        }
      }

      for (let i = 1; i <= 3; i++) {
        if (slots.find(s => s.slot === i)) continue;

        const localSave = localStorage.getItem(`cybersharp-save-${i}`);
        if (localSave) {
          try {
            const data = JSON.parse(localSave) as SaveData;
            slots.push({
              slot: i,
              timestamp: data.timestamp,
              playerLevel: data.playerStats.level,
              playtime: data.playtime,
              location: 'Night City',
            });
          } catch (error) {
            console.error(`Failed to parse save slot ${i}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to list saves:', error);
    }

    return slots.sort((a, b) => a.slot - b.slot);
  }

  setCurrentSlot(slot: number) {
    this.currentSaveSlot = slot;
  }

  getCurrentSlot(): number {
    return this.currentSaveSlot;
  }
}

export interface SaveData {
  version: string;
  timestamp: number;
  playtime: number;
  playerStats: PlayerStats;
  playerPosition: [number, number, number];
  activeQuests: string[];
  completedQuests: string[];
  inventory: string[];
  settings: GameSettings;
}

export interface SaveSlotInfo {
  slot: number;
  timestamp: number;
  playerLevel: number;
  playtime: number;
  location: string;
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  fov: number;
  graphics: {
    bloom: boolean;
    chromatic: boolean;
    scanlines: boolean;
    rainQuality: 'low' | 'medium' | 'high';
  };
}
