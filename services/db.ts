
import { ShipConfig, ShipModel } from '../types';
import { SHIP_MODELS } from '../constants';

const DB_NAME = 'QuasarProDB';
const STORE_NAME = 'ships';
const DB_VERSION = 1;

export class ShipDatabase {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                this.seedDefaults().then(resolve);
            };

            request.onerror = () => reject(request.error);
        });
    }

    private async seedDefaults(): Promise<void> {
        const ships = await this.getShips();
        if (ships.length === 0) {
            const defaults = Object.values(SHIP_MODELS).map(config => ({
                ...config,
                id: `default_${config.model}`,
                name: config.model.charAt(0) + config.model.slice(1).toLowerCase(),
                isCustom: false
            }));
            for (const ship of defaults) {
                await this.saveShip(ship);
            }
        }
    }

    async getShips(): Promise<ShipConfig[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject('DB not initialized');
            const transaction = this.db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveShip(ship: ShipConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject('DB not initialized');
            const transaction = this.db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(ship);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async deleteShip(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject('DB not initialized');
            const transaction = this.db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const shipDb = new ShipDatabase();
