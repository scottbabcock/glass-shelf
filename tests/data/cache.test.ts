import { describe, expect, it } from 'vitest';
import { createCache, DAY_MS } from '../../src/data/cache';
import { memoryKv } from '../../src/data/kv';

describe('cache', () => {
    it('returns values until they expire', async () => {
        let now = 1_000;
        const cache = createCache(memoryKv(), () => now);
        await cache.put('k', { a: 1 }, DAY_MS);
        expect(await cache.get('k')).toEqual({ a: 1 });
        now += DAY_MS;
        expect(await cache.get('k')).toBeNull();
    });
    it('ignores corrupt entries', async () => {
        const kv = memoryKv();
        await kv.set('cache:k', 'garbage');
        expect(await createCache(kv).get('k')).toBeNull();
    });
    it('clear removes cached data but keeps other keys', async () => {
        const kv = memoryKv();
        const cache = createCache(kv);
        await cache.put('k', 1, DAY_MS);
        await kv.set('settings', { a: 1 });
        await cache.clear();
        expect(await cache.get('k')).toBeNull();
        expect(await kv.get('settings')).toEqual({ a: 1 });
    });
});
