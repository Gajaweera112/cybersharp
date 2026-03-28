import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PlayerStats } from '../engine/rpg/RPGSystem';
import { storageAdapter } from '../storage/IndexedDBAdapter';

interface GameState {
  playerStats: PlayerStats;
  currentSaveSlot: number;
  playtime: number;
  activeQuests: string[];
  completedQuests: string[];
  inventory: string[];

  setPlayerStats: (stats: PlayerStats) => void;
  setCurrentSaveSlot: (slot: number) => void;
  addPlaytime: (seconds: number) => void;
  addActiveQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  addInventoryItem: (itemId: string) => void;
  removeInventoryItem: (itemId: string) => void;
  resetGameState: () => void;
}

const initialPlayerStats: PlayerStats = {
  level: 1,
  experience: 0,
  experienceToNext: 1000,
  attributes: {
    body: 5,
    reflexes: 5,
    technicalAbility: 5,
    intelligence: 5,
    cool: 5,
  },
  maxHealth: 100,
  currentHealth: 100,
  maxStamina: 100,
  currentStamina: 100,
  money: 1000,
  streetCred: 0,
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      playerStats: initialPlayerStats,
      currentSaveSlot: 1,
      playtime: 0,
      activeQuests: [],
      completedQuests: [],
      inventory: [],

      setPlayerStats: (stats) => set({ playerStats: stats }),

      setCurrentSaveSlot: (slot) => set({ currentSaveSlot: slot }),

      addPlaytime: (seconds) => set((state) => ({
        playtime: state.playtime + seconds
      })),

      addActiveQuest: (questId) => set((state) => ({
        activeQuests: [...state.activeQuests, questId],
      })),

      completeQuest: (questId) => set((state) => ({
        activeQuests: state.activeQuests.filter(id => id !== questId),
        completedQuests: [...state.completedQuests, questId],
      })),

      addInventoryItem: (itemId) => set((state) => ({
        inventory: [...state.inventory, itemId],
      })),

      removeInventoryItem: (itemId) => set((state) => ({
        inventory: state.inventory.filter(id => id !== itemId),
      })),

      resetGameState: () => set({
        playerStats: initialPlayerStats,
        playtime: 0,
        activeQuests: [],
        completedQuests: [],
        inventory: [],
      }),
    }),
    {
      name: 'cybersharp-game-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export async function initializeGameStorage() {
  await storageAdapter.initialize();
  console.log('Game storage initialized');
}
