import { useSyncExternalStore } from 'react';
import { backendKv, KvBackend } from './kv';
import { LOG_PREFIX } from '../constants';

/**
 * State the library remembers between sessions. Glass Shelf has no settings: everything else is a fixed design
 * choice (see library/design.ts). These two are choices made inside the library itself.
 */
export interface Prefs {
    librarySort: LibrarySortMode; // cycled with the sort button in the category bar
    collectionCustomArt: Record<string, CollectionCustomArtEntry>; // per-collection choices from Customize Art
}

export type LibrarySortMode = 'recent' | 'alpha' | 'playtime' | 'size';
export type CollectionArtFit = 'cover' | 'contain' | 'fill' | 'center';
export type CollectionArtMode = 'fan' | 'custom' | 'icon';

export interface CollectionCustomArtEntry {
    mode?: CollectionArtMode;
    url?: string;
    fit?: CollectionArtFit;
    hasCustomFit?: boolean;
    icon?: string;
}

export const PREFS_KEY = 'prefs';
export const LOCAL_STORAGE_KEY = 'glass_shelf_prefs';

export const DEFAULTS: Prefs = {
    librarySort: 'recent',
    collectionCustomArt: {},
};

const SORT_MODES: readonly LibrarySortMode[] = ['recent', 'alpha', 'playtime', 'size'];

export function parsePrefs(raw: Partial<Prefs> | null | undefined): Prefs {
    const art = raw?.collectionCustomArt;
    return {
        librarySort: SORT_MODES.includes(raw?.librarySort as LibrarySortMode) ? (raw!.librarySort as LibrarySortMode) : DEFAULTS.librarySort,
        collectionCustomArt:
            typeof art === 'object' && art !== null && !Array.isArray(art) ? art : DEFAULTS.collectionCustomArt,
    };
}

export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear?(): void;
}

const memoryStorage = new Map<string, string>();

export const defaultStorage: StorageLike = {
    getItem: (key) => {
        try {
            if (typeof localStorage !== 'undefined') {
                const val = localStorage.getItem(key);
                if (val !== null) return val;
            }
        } catch {}
        return memoryStorage.get(key) ?? null;
    },
    setItem: (key, value) => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        } catch {}
        memoryStorage.set(key, value);
    },
    removeItem: (key) => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        } catch {}
        memoryStorage.delete(key);
    },
    clear: () => {
        try {
            if (typeof localStorage !== 'undefined') localStorage.clear();
        } catch {}
        memoryStorage.clear();
    },
};

function readLocal(storage: StorageLike): Partial<Prefs> | null {
    try {
        const raw = storage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') return parsed;
        }
    } catch {
        // storage not available or parse failed
    }
    return null;
}

function writeLocal(value: Prefs, storage: StorageLike): void {
    try {
        storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
    } catch {
        // ignore
    }
}

/**
 * The backend (Decky's KV file) is the source of truth; localStorage mirrors it so the library renders with the
 * remembered state immediately, before the backend answers.
 */
export function createPrefsStore(kv: KvBackend, storage: StorageLike | null | false = defaultStorage) {
    const cached = storage ? readLocal(storage) : null;
    let current: Prefs = cached ? parsePrefs(cached) : { ...DEFAULTS };
    const listeners = new Set<() => void>();
    const emit = () => listeners.forEach((listener) => listener());

    const persist = async (next: Prefs) => {
        current = next;
        if (storage) writeLocal(current, storage);
        emit();
        try {
            await Promise.race([
                kv.set(PREFS_KEY, current),
                new Promise((_, reject) => setTimeout(() => reject(new Error('kv.set timeout')), 1000)),
            ]);
        } catch (error) {
            console.warn(`${LOG_PREFIX} Failed to persist prefs to backend`, error);
        }
    };

    const updateArt = (idOrName: string | string[], change: (map: Prefs['collectionCustomArt'], key: string) => void) => {
        const map = { ...current.collectionCustomArt };
        for (const key of Array.isArray(idOrName) ? idOrName : [idOrName]) {
            if (key) change(map, key);
        }
        return persist({ ...current, collectionCustomArt: map });
    };

    return {
        async load(retries = 5, delayMs = 250): Promise<void> {
            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    let raw = await kv.get(PREFS_KEY);
                    if (typeof raw === 'string') {
                        try {
                            raw = JSON.parse(raw);
                        } catch {}
                    }
                    if (raw && typeof raw === 'object') {
                        current = parsePrefs(raw as Partial<Prefs>);
                        if (storage) writeLocal(current, storage);
                    } else if (raw === null && cached) {
                        // Backend has nothing yet but the local mirror does: seed the backend from it.
                        await kv.set(PREFS_KEY, current).catch(() => undefined);
                        return;
                    } else {
                        current = cached ? parsePrefs(cached) : { ...DEFAULTS };
                    }
                    emit();
                    return;
                } catch (error) {
                    if (attempt === retries - 1) {
                        console.warn(`${LOG_PREFIX} Could not load prefs after ${retries} attempts; using cached/default values`, error);
                    } else {
                        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
                    }
                }
            }
        },
        get: (): Prefs => current,
        setLibrarySort: (librarySort: LibrarySortMode) => persist({ ...current, librarySort }),
        setCollectionCustomArt: (idOrName: string | string[], entry: CollectionCustomArtEntry) =>
            updateArt(idOrName, (map, key) => {
                map[key] = entry;
            }),
        removeCollectionCustomArt: (idOrName: string | string[]) =>
            updateArt(idOrName, (map, key) => {
                delete map[key];
            }),
        subscribe(listener: () => void): () => void {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}

export const prefs = createPrefsStore(backendKv);

export function usePrefs(): Prefs {
    return useSyncExternalStore(prefs.subscribe, prefs.get, prefs.get);
}
