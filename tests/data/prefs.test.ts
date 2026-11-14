import { beforeEach, describe, expect, it } from 'vitest';
import { memoryKv } from '../../src/data/kv';
import { createPrefsStore, defaultStorage, parsePrefs } from '../../src/data/prefs';

describe('prefs', () => {
    beforeEach(() => {
        defaultStorage.clear?.();
    });

    it('starts with defaults and persists the sort choice', async () => {
        const kv = memoryKv();
        const store = createPrefsStore(kv);
        await store.load();
        expect(store.get()).toEqual({ librarySort: 'recent', collectionCustomArt: {} });

        await store.setLibrarySort('alpha');
        expect(store.get().librarySort).toBe('alpha');
        const reloaded = createPrefsStore(kv, null);
        await reloaded.load();
        expect(reloaded.get().librarySort).toBe('alpha');
    });

    it('falls back to defaults on corrupt data', () => {
        expect(parsePrefs({ librarySort: 'sideways' as never, collectionCustomArt: [] as never })).toEqual({
            librarySort: 'recent',
            collectionCustomArt: {},
        });
        expect(parsePrefs(null)).toEqual({ librarySort: 'recent', collectionCustomArt: {} });
    });

    it('ignores settings left over from older versions', () => {
        expect(parsePrefs({ librarySort: 'size', libraryGridColumns: 5 } as never)).toEqual({
            librarySort: 'size',
            collectionCustomArt: {},
        });
    });

    it('retries when the backend is temporarily unavailable at startup', async () => {
        let attempts = 0;
        const flapper = {
            async get() {
                attempts++;
                if (attempts < 3) throw new Error('backend not ready');
                return { librarySort: 'playtime' };
            },
            async set() {},
            async delete() {},
            async deletePrefix() {
                return 0;
            },
        };
        const store = createPrefsStore(flapper, null);
        await store.load(5, 5);
        expect(attempts).toBe(3);
        expect(store.get().librarySort).toBe('playtime');
    });

    it('restores from the local mirror before the backend answers', async () => {
        const kv = memoryKv();
        await createPrefsStore(kv).setLibrarySort('size');
        expect(createPrefsStore(kv).get().librarySort).toBe('size');
    });

    it('saves and removes custom collection art under each key', async () => {
        const kv = memoryKv();
        const store = createPrefsStore(kv);
        const entry = { mode: 'custom' as const, url: 'https://example.com/art.png', fit: 'contain' as const };
        await store.setCollectionCustomArt(['col1', 'RPG'], entry);
        expect(store.get().collectionCustomArt).toEqual({ col1: entry, RPG: entry });

        const reloaded = createPrefsStore(kv, null);
        await reloaded.load();
        expect(reloaded.get().collectionCustomArt.col1).toEqual(entry);

        await store.removeCollectionCustomArt(['col1', 'RPG']);
        expect(store.get().collectionCustomArt).toEqual({});
    });
});
