import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Occurrence } from '../types';

export const OFFLINE_DB_NAME = 'educontrol_idb';
export const OFFLINE_DB_VERSION = 1;

export const STORES = {
    CACHE: 'cache',
    SYNC_QUEUE: 'sync_queue'
} as const;

export type SyncOperation = 'POST' | 'PUT' | 'DELETE';
export type SyncFeature = 'occurrence' | 'frequence' | 'comunicado' | 'student';

export interface SyncPayload {
    id: string; // Unique ID for the queue item
    feature: SyncFeature;
    operation: SyncOperation;
    data: any;
    timestamp: number;
}

interface EduControlDB extends DBSchema {
    [STORES.CACHE]: {
        key: string;
        value: any;
    };
    [STORES.SYNC_QUEUE]: {
        key: string;
        value: SyncPayload;
        indexes: { 'by-timestamp': number };
    };
}

class OfflineService {
    private dbPromise: Promise<IDBPDatabase<EduControlDB>>;

    constructor() {
        this.dbPromise = this.initDB();
    }

    private async initDB() {
        return openDB<EduControlDB>(OFFLINE_DB_NAME, OFFLINE_DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORES.CACHE)) {
                    db.createObjectStore(STORES.CACHE);
                }
                if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                    const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
                    syncStore.createIndex('by-timestamp', 'timestamp');
                }
            },
            blocked() {
                console.warn('Database is blocked by an older version. Please reload the page.');
            },
            blocking() {
                console.warn('Database connection is blocking a newer version. Reloading...');
                window.location.reload();
            },
            terminated() {
                console.error('Database connection was abnormally terminated.');
            }
        });
    }

    // --- Cache Methods ---

    async setCache(key: string, data: any): Promise<void> {
        const db = await this.dbPromise;
        await db.put(STORES.CACHE, data, key);
    }

    async getCache<T>(key: string): Promise<T | null> {
        const db = await this.dbPromise;
        const data = await db.get(STORES.CACHE, key);
        return data as T || null;
    }

    async clearCache(): Promise<void> {
        const db = await this.dbPromise;
        await db.clear(STORES.CACHE);
    }

    // --- Sync Queue Methods ---

    async addToSyncQueue(payload: Omit<SyncPayload, 'id' | 'timestamp'>): Promise<string> {
        const db = await this.dbPromise;
        const id = crypto.randomUUID();
        const item: SyncPayload = {
            ...payload,
            id,
            timestamp: Date.now()
        };
        await db.put(STORES.SYNC_QUEUE, item);
        return id; // Return local ID so calling functions can use it optimistically
    }

    async getSyncQueue(): Promise<SyncPayload[]> {
        const db = await this.dbPromise;
        return await db.getAllFromIndex(STORES.SYNC_QUEUE, 'by-timestamp');
    }

    async removeFromSyncQueue(id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete(STORES.SYNC_QUEUE, id);
    }

    async clearSyncQueue(): Promise<void> {
        const db = await this.dbPromise;
        await db.clear(STORES.SYNC_QUEUE);
    }

    // Helper to check network status safely
    isOnline(): boolean {
        return navigator.onLine;
    }
}

export const offlineService = new OfflineService();
