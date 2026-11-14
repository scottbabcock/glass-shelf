import { backendKv, KvBackend } from './kv';

export const DAY_MS = 86_400_000;
export const TTL = {
    description: 365 * DAY_MS, // descriptions rarely change; kept so pre-loaded ones last
    accent: 3650 * DAY_MS,
    accentMiss: DAY_MS,
};

const CACHE_PREFIX = 'cache:';

interface Entry {
    v: unknown;
    exp: number;
}

function isEntry(value: unknown): value is Entry {
    return typeof value === 'object' && value !== null && typeof (value as Entry).exp === 'number' && 'v' in value;
}

export interface Cache {
    get<T>(key: string): Promise<T | null>;
    put<T>(key: string, value: T, ttlMs: number): Promise<void>;
    clear(): Promise<void>;
}

export function createCache(kv: KvBackend, now: () => number = Date.now): Cache {
    return {
        async get<T>(key: string): Promise<T | null> {
            const entry = await kv.get(CACHE_PREFIX + key);
            if (!isEntry(entry) || entry.exp <= now()) return null;
            return entry.v as T;
        },
        async put<T>(key: string, value: T, ttlMs: number): Promise<void> {
            await kv.set(CACHE_PREFIX + key, { v: value, exp: now() + ttlMs });
        },
        async clear(): Promise<void> {
            await kv.deletePrefix(CACHE_PREFIX);
        },
    };
}

export const cache = createCache(backendKv);
