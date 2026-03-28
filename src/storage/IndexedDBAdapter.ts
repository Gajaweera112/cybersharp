import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CybersharpDB extends DBSchema {
  saves: {
    key: number;
    value: {
      slot: number;
      data: unknown;
      timestamp: number;
      version: string;
    };
  };
  settings: {
    key: string;
    value: unknown;
  };
  cache: {
    key: string;
    value: {
      data: unknown;
      timestamp: number;
      expiresAt?: number;
    };
  };
}

export class IndexedDBAdapter {
  private dbName = 'cybersharp-prime';
  private version = 1;
  private db: IDBPDatabase<CybersharpDB> | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<CybersharpDB>(this.dbName, this.version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('saves')) {
          db.createObjectStore('saves', { keyPath: 'slot' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache');
        }
      },
    });
  }

  async saveSave(slot: number, data: unknown): Promise<void> {
    await this.ensureInitialized();
    await this.db!.put('saves', {
      slot,
      data,
      timestamp: Date.now(),
      version: '1.0.0',
    });
  }

  async loadSave(slot: number): Promise<unknown | null> {
    await this.ensureInitialized();
    const save = await this.db!.get('saves', slot);
    return save?.data ?? null;
  }

  async deleteSave(slot: number): Promise<void> {
    await this.ensureInitialized();
    await this.db!.delete('saves', slot);
  }

  async listSaves(): Promise<Array<{ slot: number; timestamp: number; version: string }>> {
    await this.ensureInitialized();
    const saves = await this.db!.getAll('saves');
    return saves.map(save => ({
      slot: save.slot,
      timestamp: save.timestamp,
      version: save.version,
    }));
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    await this.ensureInitialized();
    await this.db!.put('settings', value, key);
  }

  async getSetting(key: string): Promise<unknown | null> {
    await this.ensureInitialized();
    const value = await this.db!.get('settings', key);
    return value ?? null;
  }

  async setCache(key: string, data: unknown, ttl?: number): Promise<void> {
    await this.ensureInitialized();
    await this.db!.put('cache', {
      data,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
    }, key);
  }

  async getCache(key: string): Promise<unknown | null> {
    await this.ensureInitialized();
    const cache = await this.db!.get('cache', key);

    if (!cache) return null;

    if (cache.expiresAt && cache.expiresAt < Date.now()) {
      await this.db!.delete('cache', key);
      return null;
    }

    return cache.data;
  }

  async clearCache(): Promise<void> {
    await this.ensureInitialized();
    await this.db!.clear('cache');
  }

  async clearAll(): Promise<void> {
    await this.ensureInitialized();
    await this.db!.clear('saves');
    await this.db!.clear('settings');
    await this.db!.clear('cache');
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }
}

export const storageAdapter = new IndexedDBAdapter();
